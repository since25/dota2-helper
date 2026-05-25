const { combatAssertion } = require('./semanticAssertions');

function adaptHeroComponentToAssertion(heroName, abilityName, component) {
  if (component.kind === 'attack_modifier') {
    return combatAssertion({
      source: 'hero',
      sourceKey: heroName,
      fieldKey: component.id,
      abilityName,
      semanticType: 'attack.event.bonus_damage',
      target: 'enemy',
      timing: 'attack',
      values: component.valuesByAbilityLevel || [],
      damageType: component.damageType || 'Physical',
      confidence: component.status === 'implemented' ? 'candidate' : 'auto'
    });
  }
  return combatAssertion({
    source: 'hero',
    sourceKey: heroName,
    fieldKey: component.id,
    abilityName,
    semanticType: component.damageType === 'Unknown' ? 'raw.reference' : 'damage.instant',
    target: 'enemy',
    timing: 'ability',
    values: component.valuesByAbilityLevel || [],
    damageType: component.damageType,
    confidence: component.status === 'implemented' ? 'candidate' : 'auto'
  });
}

function adaptHeroProfileToAssertions(profile) {
  return (profile.abilities || []).flatMap((ability) => (
    (ability.components || []).map((component) => adaptHeroComponentToAssertion(profile.hero, ability.name, component))
  ));
}

module.exports = {
  adaptHeroComponentToAssertion,
  adaptHeroProfileToAssertions
};
