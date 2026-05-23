const { extractAbilityDamage } = require('../damageExtractor');
const { getHeroDamageModel } = require('./registry');
const { LEGACY_MODIFIER_SEMANTIC_TYPES } = require('./schema');
const { getSemanticDefinition, routeSemanticToContext } = require('./semantics');

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(String(value).replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNumericArray(value, expectedLength = null) {
  const values = Array.isArray(value) ? value : [value];
  const numbers = values.map(toNumber).filter((item) => item !== null);
  if (!numbers.length) return [];
  if (expectedLength && numbers.length === 1) return Array(expectedLength).fill(numbers[0]);
  return numbers;
}

function expandValues(values, expectedLength) {
  if (!expectedLength || values.length === expectedLength) return values;
  if (values.length === 1) return Array(expectedLength).fill(values[0]);
  return values;
}

function roundDamage(value) {
  return Math.round(value * 100) / 100;
}

function multiplyLevelArrays(left, right) {
  if (!left.length || !right.length) return [];
  const length = Math.max(left.length, right.length);
  const expandedLeft = expandValues(left, length);
  const expandedRight = expandValues(right, length);
  return expandedLeft.map((value, index) => roundDamage(value * expandedRight[index]));
}

function attrByKey(ability, key) {
  return (ability.rawAttributes || []).find((attr) => attr.key === key);
}

function valuesForKey(ability, key, expectedLength = null) {
  if (key === 'dmg') return normalizeNumericArray(ability.damage, expectedLength);
  const attr = attrByKey(ability, key);
  return attr ? normalizeNumericArray(attr.value, expectedLength) : [];
}

function resourceLevels(ability, expectedLength) {
  return {
    manaCostByAbilityLevel: normalizeNumericArray(ability.manaCost, expectedLength),
    cooldownByAbilityLevel: normalizeNumericArray(ability.cooldown, expectedLength)
  };
}

function semanticTypeForEntry(entry) {
  if (entry.semanticType) return entry.semanticType;
  if (entry.modifierType && LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType]) {
    return LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType];
  }
  const defaults = {
    instant_fixed: 'damage.instant',
    sustained_dps: 'damage.sustained_dps',
    multi_wave: 'damage.wave',
    attack_sequence: 'damage.attack_sequence_proc',
    attack_modifier: 'damage.attack_bonus',
    initial_plus_dot: 'damage.sustained_dps',
    initial_plus_ticks: 'damage.tick',
    repeated_trigger: 'damage.instant',
    summon_attack: 'summon.attack_damage',
    percent_health_dot: 'damage.percent_max_health',
    attribute_scaling: 'damage.attribute_scaling',
    conditional_instant: 'damage.instant'
  };
  return defaults[entry.model] || '';
}

function semanticTypeForFallbackComponent(component) {
  const defaults = {
    instant_fixed: 'damage.instant',
    sustained: 'damage.sustained_dps',
    multi_wave: 'damage.wave',
    attack_sequence: 'damage.attack_sequence_proc',
    attack_modifier: 'damage.attack_bonus',
    conditional: 'damage.death_trigger',
    target_state: 'damage.percent_missing_health',
    stat_scaling: 'damage.attribute_scaling'
  };
  return defaults[component.kind] || '';
}

function normalizeAffects(affects) {
  if (!affects) return [];
  return Array.isArray(affects) ? affects.filter(Boolean) : [affects].filter(Boolean);
}

function normalizeConditionInputs(conditionInputs) {
  if (!conditionInputs) return [];
  return Array.isArray(conditionInputs)
    ? conditionInputs.filter(Boolean)
    : [conditionInputs].filter(Boolean);
}

function buildSemanticMetadata(entry, countInFixedInstantTotal) {
  const semanticType = semanticTypeForEntry(entry);
  if (!semanticType) return null;
  const definition = getSemanticDefinition(semanticType);
  return {
    type: semanticType,
    category: definition.category,
    unit: definition.unit,
    label: definition.label,
    contextRoute: routeSemanticToContext(semanticType, { defaultIncluded: countInFixedInstantTotal }),
    affects: normalizeAffects(entry.affects),
    stackGroup: entry.stackGroup || '',
    sign: entry.sign || '',
    conditionInputs: normalizeConditionInputs(entry.conditionInputs)
  };
}

function buildFallbackSemanticMetadata(component) {
  const semanticType = semanticTypeForFallbackComponent(component);
  if (!semanticType) return null;
  const definition = getSemanticDefinition(semanticType);
  return {
    type: semanticType,
    category: definition.category,
    unit: definition.unit,
    label: definition.label,
    contextRoute: routeSemanticToContext(semanticType, { defaultIncluded: component.countInFixedInstantTotal }),
    affects: [],
    stackGroup: '',
    sign: '',
    conditionInputs: []
  };
}

function baseComponent(ability, entry, valuesByAbilityLevel, overrides = {}) {
  const countInFixedInstantTotal = Boolean(entry.defaultIncluded && entry.model === 'instant_fixed');
  return {
    kind: overrides.kind || entry.model,
    model: entry.model,
    status: entry.status,
    source: 'curated',
    growthKind: entry.growthKind || 'non_growth',
    damageType: overrides.damageType !== undefined ? overrides.damageType : (ability.damageType || 'Unknown'),
    label: overrides.label || entry.damageKey || entry.procDamageKey || entry.damagePerSecondKey || entry.damagePerWaveKey || entry.bonusDamageKey || entry.valueKey || entry.model,
    sourceKey: overrides.sourceKey || entry.damageKey || entry.procDamageKey || entry.damagePerSecondKey || entry.damagePerWaveKey || entry.bonusDamageKey || entry.valueKey || entry.model,
    valuesByAbilityLevel,
    theoreticalTotalByAbilityLevel: overrides.theoreticalTotalByAbilityLevel || [],
    countInFixedInstantTotal,
    formula: overrides.formula || { type: 'single_value' },
    totalFormula: overrides.totalFormula || entry.formula || '',
    semantic: overrides.semantic || buildSemanticMetadata(entry, countInFixedInstantTotal),
    metadata: overrides.metadata || {},
    caveats: overrides.caveats || (entry.reason ? [entry.reason] : [])
  };
}

function inferModifierType(valueKey, affects) {
  const text = `${valueKey || ''} ${affects || ''}`.toLowerCase();
  if (/armor.*reduction|reduction.*armor|presence_armor/.test(text)) return 'armor_reduction';
  if (/spell_amp|spell_amplification/.test(text)) return 'spell_amplification_pct';
  if (/attack_speed/.test(text)) return 'attack_speed';
  if (/abilitycastrange|cast_range|\brange\b/.test(text)) return 'positioning_range';
  if (/move_speed|movespeed|movement_speed|bonus_speed/.test(text)) return 'move_speed_pct';
  if (/attack_damage|damage_per_soul/.test(text)) return 'attack_damage';
  if (/positioning/.test(text)) return 'positioning';
  if (/survivability|evasion/.test(text)) return 'survivability';
  if (/disable_window|duration/.test(text)) return 'disable_window';
  return '';
}

function isDamageReference(entry) {
  if (entry.isDamageReference !== undefined) return Boolean(entry.isDamageReference);
  if (entry.model === 'debuff_reference') return false;
  return ['chance_based', 'conditional', 'state_scaling'].includes(entry.model);
}

function buildImplementedComponent(ability, entry) {
  if (entry.model === 'instant_fixed') {
    const values = valuesForKey(ability, entry.damageKey);
    const duration = entry.durationKey ? valuesForKey(ability, entry.durationKey, values.length) : [];
    const tickInterval = entry.tickIntervalKey ? valuesForKey(ability, entry.tickIntervalKey, values.length) : [];
    const metadata = {};
    if (duration.length) metadata.durationByAbilityLevel = duration;
    if (tickInterval.length) metadata.tickIntervalByAbilityLevel = tickInterval;
    return baseComponent(ability, entry, values, {
      kind: 'instant_fixed',
      formula: { type: 'single_value' },
      metadata
    });
  }

  if (entry.model === 'sustained_dps') {
    const values = valuesForKey(ability, entry.damagePerSecondKey);
    const duration = valuesForKey(ability, entry.durationKey, values.length);
    const tickInterval = entry.tickIntervalKey ? valuesForKey(ability, entry.tickIntervalKey, values.length) : [];
    const metadata = { durationByAbilityLevel: duration };
    if (tickInterval.length) metadata.tickIntervalByAbilityLevel = tickInterval;
    if (entry.condition) metadata.condition = entry.condition;
    return baseComponent(ability, entry, values, {
      kind: 'sustained',
      sourceKey: entry.damagePerSecondKey,
      label: entry.damagePerSecondKey,
      theoreticalTotalByAbilityLevel: multiplyLevelArrays(values, duration),
      totalFormula: 'duration * damagePerSecond',
      formula: { type: 'duration_times_dps' },
      metadata,
      caveats: ['包含持续伤害，理论总量依赖目标站位和完整命中。']
    });
  }

  if (entry.model === 'initial_plus_dot') {
    const initialDamage = valuesForKey(ability, entry.initialDamageKey);
    const dps = valuesForKey(ability, entry.damagePerSecondKey, initialDamage.length);
    const duration = valuesForKey(ability, entry.durationKey, Math.max(initialDamage.length, dps.length));
    const length = Math.max(initialDamage.length, dps.length, duration.length);
    const expandedInitial = expandValues(initialDamage, length);
    const dotTotal = multiplyLevelArrays(dps, duration);
    const expandedDotTotal = expandValues(dotTotal, length);
    const theoreticalTotal = expandedInitial.map((value, index) => roundDamage(value + (expandedDotTotal[index] || 0)));
    return baseComponent(ability, entry, initialDamage, {
      kind: 'initial_plus_dot',
      sourceKey: entry.initialDamageKey,
      label: entry.initialDamageKey,
      theoreticalTotalByAbilityLevel: theoreticalTotal,
      totalFormula: entry.formula || 'initialDamage + damagePerSecond * duration',
      formula: { type: 'initial_plus_duration_times_dps' },
      metadata: {
        damagePerSecondKey: entry.damagePerSecondKey,
        damagePerSecondByAbilityLevel: dps,
        durationByAbilityLevel: duration
      },
      caveats: ['包含瞬时伤害和持续伤害，理论总量依赖完整作用时间。']
    });
  }

  if (entry.model === 'initial_plus_ticks') {
    const initialDamage = valuesForKey(ability, entry.initialDamageKey);
    const tickDamage = valuesForKey(ability, entry.tickDamageKey, initialDamage.length);
    const tickInterval = valuesForKey(ability, entry.tickIntervalKey, Math.max(initialDamage.length, tickDamage.length));
    const duration = valuesForKey(ability, entry.durationKey, Math.max(initialDamage.length, tickDamage.length, tickInterval.length));
    const length = Math.max(initialDamage.length, tickDamage.length, tickInterval.length, duration.length);
    const expandedInitial = expandValues(initialDamage, length);
    const expandedTickDamage = expandValues(tickDamage, length);
    const expandedTickInterval = expandValues(tickInterval, length);
    const expandedDuration = expandValues(duration, length);
    const theoreticalTotal = expandedInitial.map((value, index) => {
      const interval = expandedTickInterval[index] || 0;
      const ticks = interval > 0 ? Math.floor((expandedDuration[index] || 0) / interval) : 0;
      return roundDamage(value + ticks * (expandedTickDamage[index] || 0));
    });
    return baseComponent(ability, entry, initialDamage, {
      kind: 'initial_plus_ticks',
      sourceKey: entry.initialDamageKey,
      label: entry.initialDamageKey,
      theoreticalTotalByAbilityLevel: theoreticalTotal,
      totalFormula: entry.formula || 'initialDamage + tickDamage * floor(duration / tickInterval)',
      formula: { type: 'initial_plus_tick_count_times_tick_damage' },
      metadata: {
        tickDamageKey: entry.tickDamageKey,
        tickDamageByAbilityLevel: tickDamage,
        tickIntervalByAbilityLevel: tickInterval,
        durationByAbilityLevel: duration
      },
      caveats: ['包含瞬时伤害和跳数伤害，理论总量依赖实际作用时间和跳数。']
    });
  }

  if (entry.model === 'repeated_trigger') {
    const values = valuesForKey(ability, entry.damageKey);
    const bonusDamage = entry.bonusDamageKey ? valuesForKey(ability, entry.bonusDamageKey, values.length) : [];
    const metadata = { triggerCountInput: entry.triggerCountInput };
    if (bonusDamage.length) {
      metadata.bonusDamageKey = entry.bonusDamageKey;
      metadata.bounceBonusDamageByAbilityLevel = bonusDamage;
    }
    return baseComponent(ability, entry, values, {
      kind: 'repeated_trigger',
      sourceKey: entry.damageKey,
      label: entry.damageKey,
      formula: { type: 'runtime_trigger_count_times_damage' },
      totalFormula: entry.formula || 'triggerCount * damage',
      metadata,
      caveats: ['需要输入实际触发次数，不能默认按满额命中计算。']
    });
  }

  if (entry.model === 'summon_attack') {
    const values = valuesForKey(ability, entry.attackDamageKey);
    return baseComponent(ability, entry, values, {
      kind: 'summon_attack',
      sourceKey: entry.attackDamageKey,
      label: entry.attackDamageKey,
      formula: { type: 'runtime_summon_attack_count_times_damage' },
      totalFormula: entry.formula || 'attackCount * summonAttackDamage',
      metadata: { attackCountInput: entry.attackCountInput },
      caveats: ['召唤物、守卫或代理单位伤害需要输入攻击次数。']
    });
  }

  if (entry.model === 'percent_health_dot') {
    const values = valuesForKey(ability, entry.percentDamageKey);
    const duration = valuesForKey(ability, entry.durationKey, values.length);
    return baseComponent(ability, entry, values, {
      kind: 'percent_health_dot',
      sourceKey: entry.percentDamageKey,
      label: entry.percentDamageKey,
      formula: { type: 'runtime_health_percent_times_duration' },
      totalFormula: entry.formula || 'healthInput * percentDamage * duration',
      metadata: {
        healthInput: entry.healthInput,
        durationByAbilityLevel: duration
      },
      caveats: ['百分比生命持续伤害需要目标生命输入，不能生成固定理论总量。']
    });
  }

  if (entry.model === 'attribute_scaling') {
    const values = valuesForKey(ability, entry.baseDamageKey);
    const multiplier = valuesForKey(ability, entry.attributeMultiplierKey, values.length);
    return baseComponent(ability, entry, values, {
      kind: 'attribute_scaling',
      sourceKey: entry.baseDamageKey,
      label: entry.baseDamageKey,
      formula: { type: 'base_plus_attribute_times_multiplier' },
      totalFormula: entry.formula || 'baseDamage + attributeInput * attributeMultiplier',
      metadata: {
        attributeInput: entry.attributeInput,
        attributeMultiplierKey: entry.attributeMultiplierKey,
        attributeMultiplierByAbilityLevel: multiplier
      },
      caveats: ['属性缩放伤害需要施法者属性输入，不能生成固定理论总量。']
    });
  }

  if (entry.model === 'conditional_instant') {
    const values = valuesForKey(ability, entry.damageKey);
    return baseComponent(ability, entry, values, {
      kind: 'conditional_instant',
      sourceKey: entry.damageKey,
      label: entry.damageKey,
      formula: { type: 'single_value_with_condition' },
      metadata: { conditionInputs: normalizeConditionInputs(entry.conditionInputs) },
      caveats: ['条件伤害默认不进入固定瞬时总量，需满足条件后再计算。']
    });
  }

  if (entry.model === 'multi_wave') {
    const values = valuesForKey(ability, entry.damagePerWaveKey);
    const waveCount = valuesForKey(ability, entry.waveCountKey, values.length);
    return baseComponent(ability, entry, values, {
      kind: 'multi_wave',
      sourceKey: entry.damagePerWaveKey,
      label: entry.damagePerWaveKey,
      theoreticalTotalByAbilityLevel: multiplyLevelArrays(values, waveCount),
      totalFormula: 'waveCount * damagePerWave',
      formula: { type: 'wave_count_times_damage_per_wave' },
      metadata: { waveCountByAbilityLevel: waveCount },
      caveats: ['包含多波伤害，理论总量依赖目标站位和完整命中。']
    });
  }

  if (entry.model === 'attack_sequence') {
    const values = valuesForKey(ability, entry.procDamageKey);
    const attackCount = valuesForKey(ability, entry.attackCountKey, values.length);
    return baseComponent(ability, entry, values, {
      sourceKey: entry.procDamageKey,
      label: entry.procDamageKey,
      formula: { type: 'attack_count_sequence' },
      totalFormula: entry.formula || 'attackCount * attackDamage + procDamage',
      metadata: { attackCountByAbilityLevel: attackCount },
      caveats: ['包含按攻击次数触发的被动伤害，需要结合普攻次数与英雄攻击力计算。']
    });
  }

  if (entry.model === 'attack_modifier') {
    const values = valuesForKey(ability, entry.bonusDamageKey);
    const attackFactorKey = entry.attackFactorKey || entry.attackFactorTooltipKey;
    const attackFactorPct = attackFactorKey ? valuesForKey(ability, attackFactorKey, values.length) : [];
    const procChancePct = entry.procChanceKey ? valuesForKey(ability, entry.procChanceKey, values.length) : [];
    return baseComponent(ability, entry, values, {
      sourceKey: entry.bonusDamageKey,
      label: entry.bonusDamageKey,
      formula: { type: attackFactorPct.length ? 'attack_factor_plus_bonus' : 'attack_modifier' },
      totalFormula: attackFactorPct.length
        ? entry.formula || 'baseDamage + attackDamage * attackFactorPct'
        : entry.formula || '',
      metadata: {
        defaultAttackCount: entry.defaultAttackCount || 1,
        attackFactorPctByAbilityLevel: attackFactorPct,
        procChancePctByAbilityLevel: procChancePct
      },
      caveats: [
        entry.reason || '包含普攻或攻击触发伤害，需要结合普攻次数、触发概率或英雄攻击力计算。'
      ]
    });
  }

  return null;
}

function buildReferenceComponent(ability, entry) {
  const valueKey = entry.valueKey || entry.damageKey || entry.condition || entry.model;
  const values = entry.valueKey ? valuesForKey(ability, entry.valueKey) : [];
  const damageReference = isDamageReference(entry);
  const modifierType = entry.modifierType || (!damageReference ? inferModifierType(valueKey, entry.affects) : '');
  return baseComponent(ability, entry, values, {
    damageType: damageReference ? (entry.damageType || ability.damageType || 'Unknown') : '',
    sourceKey: valueKey,
    label: valueKey,
    formula: { type: entry.model },
    metadata: {
      isDamageReference: damageReference,
      modifierType,
      affects: entry.affects || '',
      condition: entry.condition || '',
      requiredInputs: entry.requiredInputs || [],
      chanceByAbilityLevel: entry.chanceKey ? valuesForKey(ability, entry.chanceKey, values.length) : [],
      multiplierByAbilityLevel: entry.multiplierKey ? valuesForKey(ability, entry.multiplierKey, values.length) : []
    },
    caveats: [entry.reason || entry.condition || '该技能在当前模型中仅作为参考。']
  });
}

function buildFallbackAbility(ability) {
  const extracted = extractAbilityDamage({
    dname: ability.name,
    dmg_type: ability.damageType,
    behavior: ability.behavior,
    desc: ability.description,
    dmg: ability.damage,
    attrib: ability.rawAttributes || ability.attributes?.map((attr) => ({
      key: attr.key,
      header: attr.label,
      value: attr.value
    })),
    mc: ability.manaCost,
    cd: ability.cooldown
  });

  return {
    name: ability.name,
    displayName: ability.displayName || ability.name,
    isUltimate: ability.isUltimate,
    modelSource: 'inferred',
    status: 'inferred',
    model: 'inferred',
    manaCostByAbilityLevel: extracted.manaCostByAbilityLevel,
    cooldownByAbilityLevel: extracted.cooldownByAbilityLevel,
    components: extracted.components.map((component) => ({
      ...component,
      source: 'inferred',
      status: 'inferred',
      model: component.kind,
      damageType: extracted.damageType,
      semantic: buildFallbackSemanticMetadata(component),
      caveats: extracted.caveats
    }))
  };
}

function buildCuratedAbility(ability, entry, modelSource = 'curated') {
  if (entry.status === 'ignored') {
    return {
      name: ability.name,
      displayName: ability.displayName || ability.name,
      isUltimate: ability.isUltimate,
      modelSource,
      status: entry.status,
      model: entry.model || 'ignored',
      reason: entry.reason || '',
      ...resourceLevels(ability, 1),
      components: []
    };
  }

  const component = entry.status === 'implemented'
    ? buildImplementedComponent(ability, entry)
    : buildReferenceComponent(ability, entry);
  const extraComponents = (entry.extraComponents || [])
    .map((extraEntry) => (extraEntry.status === 'implemented'
      ? buildImplementedComponent(ability, extraEntry)
      : buildReferenceComponent(ability, extraEntry)))
    .filter(Boolean);
  const components = [component, ...extraComponents].filter(Boolean);
  const levelCount = Math.max(1, ...components.map((item) => item.valuesByAbilityLevel?.length || 1));

  return {
    name: ability.name,
    displayName: ability.displayName || ability.name,
    isUltimate: ability.isUltimate,
    modelSource,
    status: entry.status,
    model: entry.model,
    reason: entry.reason || '',
    ...resourceLevels(ability, levelCount),
    components
  };
}

function resolveHeroDamageModel(heroDetails) {
  const model = getHeroDamageModel(heroDetails.name);
  const modelSource = model?.source === 'auto' ? 'auto' : 'curated';

  return {
    hero: heroDetails.name,
    modelSource: model ? 'curated' : 'inferred',
    abilities: (heroDetails.abilities || []).map((ability) => {
      const entry = model?.abilities?.[ability.name];
      if (!entry) return buildFallbackAbility(ability);
      return buildCuratedAbility(ability, entry, modelSource);
    })
  };
}

module.exports = {
  resolveHeroDamageModel,
  valuesForKey
};
