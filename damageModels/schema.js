const { getSemanticDefinition } = require('./semantics');

const MODEL_STATUSES = ['implemented', 'reference_only', 'ignored', 'unsupported', 'inferred'];
const MODEL_REVIEW_STATUSES = ['candidate', 'in_review', 'reviewed', 'needs_patch_update'];
const MODEL_TYPES = [
  'instant_fixed',
  'sustained_dps',
  'multi_wave',
  'attack_sequence',
  'attack_modifier',
  'chance_based',
  'conditional',
  'conditional_instant',
  'initial_plus_dot',
  'initial_plus_ticks',
  'percent_health_dot',
  'repeated_trigger',
  'state_scaling',
  'summon_attack',
  'attribute_scaling',
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
  conditional_instant: ['damageKey', 'conditionInputs'],
  initial_plus_dot: ['initialDamageKey', 'damagePerSecondKey', 'durationKey'],
  initial_plus_ticks: ['initialDamageKey', 'tickDamageKey', 'tickIntervalKey', 'durationKey'],
  percent_health_dot: ['percentDamageKey', 'durationKey', 'healthInput'],
  repeated_trigger: ['damageKey', 'triggerCountInput'],
  state_scaling: ['requiredInputs'],
  summon_attack: ['attackDamageKey', 'attackCountInput'],
  attribute_scaling: ['baseDamageKey', 'attributeMultiplierKey', 'attributeInput'],
  debuff_reference: ['valueKey', 'affects']
};

const LEGACY_MODIFIER_SEMANTIC_TYPES = {
  armor_reduction: 'modifier.armor_reduction.flat',
  attack_damage: 'modifier.attack_damage.flat',
  attack_damage_pct: 'modifier.attack_damage.percent',
  attack_speed: 'modifier.attack_speed.flat',
  disable_window: 'window.debuff_duration.seconds',
  damage_amplification_pct: 'modifier.damage_amplification.percent',
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
  if (entry.extraComponents !== undefined) {
    if (!Array.isArray(entry.extraComponents)) {
      throw new Error(`${hero}.${abilityName}.extraComponents must be an array`);
    }
    for (const [index, component] of entry.extraComponents.entries()) {
      validateAbilityEntry(hero, `${abilityName}.extraComponents[${index}]`, component);
    }
  }
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
  validateReviewMetadata(model);
  if (!model.abilities || typeof model.abilities !== 'object') {
    throw new Error(`${model.hero}.abilities must be an object`);
  }
  for (const [abilityName, entry] of Object.entries(model.abilities)) {
    assertString(abilityName, `${model.hero}.abilityName`);
    validateAbilityEntry(model.hero, abilityName, entry);
  }
  return model;
}

function validateReviewMetadata(model) {
  if (!model.review) return model;
  if (!MODEL_REVIEW_STATUSES.includes(model.review.status)) {
    throw new Error(`${model.hero}.review.status has unsupported status: ${model.review.status}`);
  }
  if (model.review.updatedAt !== undefined) {
    assertString(model.review.updatedAt, `${model.hero}.review.updatedAt`);
  }
  if (model.review.reviewer !== undefined) {
    assertString(model.review.reviewer, `${model.hero}.review.reviewer`);
  }
  if (model.review.notes !== undefined && !Array.isArray(model.review.notes)) {
    throw new Error(`${model.hero}.review.notes must be an array`);
  }
  return model;
}

module.exports = {
  LEGACY_MODIFIER_SEMANTIC_TYPES,
  MODEL_REVIEW_STATUSES,
  MODEL_STATUSES,
  MODEL_TYPES,
  REQUIRED_BY_TYPE,
  validateHeroDamageModel
};
