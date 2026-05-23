const { getSemanticDefinition } = require('./semantics');

const MODEL_STATUSES = ['implemented', 'reference_only', 'ignored', 'unsupported', 'inferred'];
const MODEL_TYPES = [
  'instant_fixed',
  'sustained_dps',
  'multi_wave',
  'attack_sequence',
  'attack_modifier',
  'chance_based',
  'conditional',
  'state_scaling',
  'debuff_reference'
];

const REQUIRED_BY_TYPE = {
  instant_fixed: ['damageKey'],
  sustained_dps: ['damagePerSecondKey', 'durationKey'],
  multi_wave: ['damagePerWaveKey', 'waveCountKey'],
  attack_sequence: ['procDamageKey', 'attackCountKey'],
  attack_modifier: ['bonusDamageKey'],
  chance_based: ['chanceKey', 'multiplierKey'],
  conditional: ['condition'],
  state_scaling: ['requiredInputs'],
  debuff_reference: ['valueKey', 'affects']
};

const LEGACY_MODIFIER_SEMANTIC_TYPES = {
  armor_reduction: 'modifier.armor_reduction.flat',
  attack_damage: 'modifier.attack_damage.flat',
  attack_damage_pct: 'modifier.attack_damage.percent',
  attack_speed: 'modifier.attack_speed.flat',
  disable_window: 'window.debuff_duration.seconds',
  move_speed_pct: 'mobility.move_speed.percent',
  positioning: 'mobility.dash_range.units',
  positioning_range: 'mobility.cast_range.units',
  spell_amplification_pct: 'modifier.spell_amplification.percent',
  survivability: 'defense.damage_reduction.percent'
};

function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function validateAbilityEntry(hero, abilityName, entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`${hero}.${abilityName} must be an object`);
  }
  if (!MODEL_STATUSES.includes(entry.status)) {
    throw new Error(`${hero}.${abilityName} has unsupported status: ${entry.status}`);
  }
  if (entry.status === 'ignored') return entry;
  if (!MODEL_TYPES.includes(entry.model)) {
    throw new Error(`${hero}.${abilityName} has unsupported model: ${entry.model}`);
  }
  if (entry.status === 'unsupported') {
    assertString(entry.reason, `${hero}.${abilityName}.reason`);
    return entry;
  }
  for (const key of REQUIRED_BY_TYPE[entry.model] || []) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === '') {
      throw new Error(`${hero}.${abilityName} missing ${key}`);
    }
  }
  validateSemanticMetadata(hero, abilityName, entry);
  return entry;
}

function validateSemanticMetadata(hero, abilityName, entry) {
  const semanticType = entry.semanticType || LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType];
  if (semanticType) {
    try {
      getSemanticDefinition(semanticType);
    } catch (error) {
      throw new Error(`${hero}.${abilityName} ${error.message}`);
    }
    return;
  }

  if (entry.status === 'reference_only' && entry.valueKey) {
    throw new Error(`${hero}.${abilityName} missing semanticType`);
  }
}

function validateHeroDamageModel(model) {
  if (!model || typeof model !== 'object') {
    throw new Error('Hero damage model must be an object');
  }
  assertString(model.hero, 'hero');
  if (!model.abilities || typeof model.abilities !== 'object') {
    throw new Error(`${model.hero}.abilities must be an object`);
  }
  for (const [abilityName, entry] of Object.entries(model.abilities)) {
    assertString(abilityName, `${model.hero}.abilityName`);
    validateAbilityEntry(model.hero, abilityName, entry);
  }
  return model;
}

module.exports = {
  LEGACY_MODIFIER_SEMANTIC_TYPES,
  MODEL_STATUSES,
  MODEL_TYPES,
  REQUIRED_BY_TYPE,
  validateHeroDamageModel
};
