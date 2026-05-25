const { combatAssertion } = require('./semanticAssertions');

function firstNumeric(values) {
  return (values || []).map(Number).filter(Number.isFinite);
}

function isShadowBreakEffect(model, effect) {
  const text = `${model.key} ${effect.key || ''} ${effect.description || ''}`.toLowerCase();
  return text.includes('invis_sword') || text.includes('silver_edge') || text.includes('windwalk') || text.includes('invisibility');
}

function adaptItemEffect(model, effect) {
  const values = firstNumeric(effect.values);
  if (effect.type === 'modifier.attack_damage.flat') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'stat.attack_damage.flat',
      target: 'self',
      timing: 'always',
      values
    });
  }
  if (effect.type === 'modifier.attack_speed.flat') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'stat.attack_speed.flat',
      target: 'self',
      timing: 'always',
      values
    });
  }
  if (effect.type === 'stat.attribute') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'stat.attribute.flat',
      attribute: effect.attribute || 'all',
      target: 'self',
      timing: 'always',
      values
    });
  }
  if (effect.type === 'damage.attack_proc' && isShadowBreakEffect(model, effect)) {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'attack.event.bonus_damage',
      target: 'enemy',
      timing: 'next_attack',
      condition: 'condition.invisibility_break',
      values,
      damageType: 'Physical',
      participatesInCrit: false,
      affectedByArmor: true,
      affectedBySpellAmp: false,
      stackingGroup: 'invisibility_break_damage'
    });
  }
  if (effect.type === 'modifier.crit') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'attack.event.crit',
      target: 'self',
      timing: 'attack',
      values,
      multiplierPercent: values[0] || 100,
      chancePercent: Number(effect.chancePercent || effect.chance || 0)
    });
  }
  if (effect.type === 'modifier.armor.flat') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'modifier.armor.flat',
      target: 'enemy',
      timing: 'debuff',
      values
    });
  }
  if (effect.type === 'damage.instant') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'damage.instant',
      target: 'enemy',
      timing: 'active_item',
      values,
      damageType: 'Magical'
    });
  }
  return combatAssertion({
    source: 'item',
    sourceKey: model.key,
    fieldKey: effect.key || '',
    semanticType: 'raw.reference',
    target: 'unknown',
    timing: 'reference',
    values
  });
}

function adaptItemModelToAssertions(model) {
  return (model.effects || []).map((effect) => adaptItemEffect(model, effect));
}

module.exports = {
  adaptItemModelToAssertions
};
