const ITEM_MODEL_STATUSES = ['modeled', 'excluded', 'unsupported'];

const ITEM_EFFECT_TYPES = [
  'damage.instant',
  'damage.sustained_dps',
  'damage.damage_over_time',
  'damage.attack_proc',
  'damage.attribute_scaling',
  'modifier.armor.flat',
  'modifier.magic_resistance.percent',
  'modifier.damage_amp.percent',
  'modifier.spell_amp.percent',
  'modifier.attack_speed.flat',
  'modifier.attack_damage.flat',
  'modifier.crit',
  'stat.attribute',
  'stat.health',
  'stat.mana',
  'stat.armor',
  'stat.regen',
  'stat.evasion',
  'stat.range',
  'resource.restore',
  'resource.cooldown',
  'mobility',
  'control',
  'vision',
  'summon',
  'economy',
  'upgrade.aghanims_scepter',
  'upgrade.aghanims_shard',
  'utility.active',
  'utility.passive',
  'condition',
  'raw.reference'
];

function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function validateEffect(itemKey, effect, index) {
  if (!effect || typeof effect !== 'object') {
    throw new Error(`${itemKey}.effects[${index}] must be an object`);
  }
  assertString(effect.type, `${itemKey}.effects[${index}].type`);
  if (!ITEM_EFFECT_TYPES.includes(effect.type)) {
    throw new Error(`${itemKey}.effects[${index}] has unsupported type: ${effect.type}`);
  }
  assertString(effect.label, `${itemKey}.effects[${index}].label`);
  if (effect.source !== undefined) {
    assertString(effect.source, `${itemKey}.effects[${index}].source`);
  }
  return effect;
}

function validateItemModel(model) {
  if (!model || typeof model !== 'object') {
    throw new Error('Item model must be an object');
  }
  assertString(model.key, 'item.key');
  assertString(model.name, `${model.key}.name`);
  if (!ITEM_MODEL_STATUSES.includes(model.status)) {
    throw new Error(`${model.key}.status has unsupported status: ${model.status}`);
  }
  if (!Array.isArray(model.effects)) {
    throw new Error(`${model.key}.effects must be an array`);
  }
  if (model.status === 'modeled' && model.effects.length === 0) {
    throw new Error(`${model.key} must have at least one semantic effect`);
  }
  model.effects.forEach((effect, index) => validateEffect(model.key, effect, index));
  if (model.rawFields !== undefined && !Array.isArray(model.rawFields)) {
    throw new Error(`${model.key}.rawFields must be an array`);
  }
  return model;
}

module.exports = {
  ITEM_EFFECT_TYPES,
  ITEM_MODEL_STATUSES,
  validateItemModel
};
