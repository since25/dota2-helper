const DAMAGE_KEYS = new Set([
  'damage',
  'edge_damage',
  'impact_damage',
  'bolt_damage',
  'strike_damage',
  'damage_per_second'
]);

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const cleaned = String(value).replace('%', '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNumericArray(value, expectedLength = null) {
  const rawValues = Array.isArray(value) ? value : [value];
  const numbers = rawValues.map(toNumber).filter((item) => item !== null);
  if (!numbers.length) return [];
  if (expectedLength && numbers.length === 1) {
    return Array(expectedLength).fill(numbers[0]);
  }
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

function getAttrs(ability) {
  return ability.attrib || [];
}

function findAttr(ability, matcher) {
  return getAttrs(ability).find((attr) => matcher(attr.key || '', attr.header || ''));
}

function getMetadata(ability) {
  const durationAttr = findAttr(ability, (key, header) => /duration/i.test(key) || /^duration/i.test(header));
  const tickIntervalAttr = findAttr(ability, (key, header) => /tick.*rate|tick.*interval|burn_interval/i.test(`${key} ${header}`));
  const waveCountAttr = findAttr(ability, (key, header) => /pulses|pulse_count|wave_count|waves/i.test(`${key} ${header}`));
  const attackCountAttr = findAttr(ability, (key, header) => /attack_count|attack count/i.test(`${key} ${header}`));

  return {
    durationByAbilityLevel: durationAttr ? normalizeNumericArray(durationAttr.value) : [],
    tickIntervalByAbilityLevel: tickIntervalAttr ? normalizeNumericArray(tickIntervalAttr.value) : [],
    waveCountByAbilityLevel: waveCountAttr ? normalizeNumericArray(waveCountAttr.value) : [],
    attackCountByAbilityLevel: attackCountAttr ? normalizeNumericArray(attackCountAttr.value) : []
  };
}

function findDamageAttributes(ability) {
  const attrs = getAttrs(ability);
  const damageAttrs = [];
  const seen = new Set();

  function addAttr(attr) {
    const key = `${attr.key || ''}:${attr.header || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    damageAttrs.push(attr);
  }

  if (ability.dmg !== undefined) {
    addAttr({
      key: 'dmg',
      header: 'DAMAGE:',
      value: ability.dmg,
      source: 'ability.dmg'
    });
  }

  attrs.filter((attr) => isAttackSequenceDamageMetric(ability, attr)).forEach(addAttr);
  attrs.filter((attr) => DAMAGE_KEYS.has(attr.key) && !isNonOutputDamageMetric(attr)).forEach(addAttr);
  attrs.filter((attr) => {
    if (!/damage/i.test(attr.key || '')) return false;
    if (DAMAGE_KEYS.has(attr.key)) return false;
    return !isNonOutputDamageMetric(attr);
  }).forEach(addAttr);

  return damageAttrs;
}

function isNonOutputDamageMetric(attr) {
  const key = attr?.key || '';
  const header = attr?.header || '';
  const label = `${key} ${header}`;
  return /threshold|trigger|incoming|outgoing|taken|received|required|reduction|reflect|per_kill|reset|interval|cooldown|shared|tick_rate/i.test(label)
    || /pct|percent|%/i.test(label)
    || /(^|_)bonus_.*damage($|_)|(^|_)damage_.*bonus($|_)/i.test(key)
    || isStatScalingDamageMetric(attr);
}

function isTargetStateScalingDamage(attr) {
  const key = attr?.key || '';
  const header = attr?.header || '';
  return /per.*mana|mana.*missing|missing.*mana|per.*health|health.*missing|missing.*health|damage.*distance|distance.*damage/i.test(`${key} ${header}`);
}

function hasTargetStateScalingDamage(ability) {
  return (ability.attrib || []).some(isTargetStateScalingDamage);
}

function isStatScalingDamageMetric(attr) {
  const key = attr?.key || '';
  const header = attr?.header || '';
  const label = `${key} ${header}`;
  return /damage/i.test(label)
    && /strength|agility|intelligence|attribute|per_?str\b|per_?agi\b|per_?int\b|per.*str\b|per.*agi\b|per.*int\b/i.test(label);
}

function hasBehavior(ability, pattern) {
  const behavior = Array.isArray(ability.behavior) ? ability.behavior.join(' ') : ability.behavior || '';
  return pattern.test(behavior);
}

function isSustainedDamage(ability, damageAttr) {
  const key = damageAttr?.key || '';
  const header = damageAttr?.header || '';
  const label = `${key} ${header}`;
  const metadata = getMetadata(ability);
  return /per second|per tick|per pulse|每秒|每跳/i.test(label)
    || /duration|per_second|per_tick|pulse/i.test(key)
    || (
      metadata.durationByAbilityLevel.length > 0
      && metadata.tickIntervalByAbilityLevel.length > 0
      && /burn|damage over time/i.test(`${label} ${ability.desc || ''}`)
      && !/impact|bonus/i.test(label)
    );
}

function isConditionalDamage(ability, damageAttr) {
  const key = damageAttr?.key || '';
  const header = damageAttr?.header || '';
  const label = `${key} ${header} ${ability.desc || ''}`;
  return (/caustic/i.test(key) || /on death|when.*\bdie\b|when.*\bdies\b|\bdie\b that|explode|explosion|death|死亡|爆炸|max health/i.test(label))
    && !/^damage$/i.test(key);
}

function isAttackTriggeredDamage(ability, damageAttr) {
  const key = damageAttr?.key || '';
  const header = damageAttr?.header || '';
  const label = `${key} ${header} ${ability.desc || ''}`;
  return /attack_damage|attacks? inject|attacks? deal|attack modifier|普攻|攻击/i.test(label)
    || (hasBehavior(ability, /passive/i) && /bonus damage/i.test(header));
}

function isAttackSequenceDamageMetric(ability, damageAttr) {
  const key = damageAttr?.key || '';
  const header = damageAttr?.header || '';
  const metadata = getMetadata(ability);
  return hasBehavior(ability, /passive/i)
    && metadata.attackCountByAbilityLevel.length > 0
    && /bonus_damage|bonus damage|bash damage/i.test(`${key} ${header}`);
}

function classifyDamage(ability, damageAttr) {
  if (!damageAttr) return 'none';
  if (isAttackSequenceDamageMetric(ability, damageAttr)) return 'attack_sequence';
  if (isMultiWaveDamage(ability, damageAttr)) return 'multi_wave';
  if (isSustainedDamage(ability, damageAttr)) return 'sustained';
  if (isConditionalDamage(ability, damageAttr)) return 'conditional';
  if (isAttackTriggeredDamage(ability, damageAttr)) return 'attack';
  if (isTargetStateScalingDamage(damageAttr) || hasTargetStateScalingDamage(ability)) return 'target_state';
  if (isStatScalingDamageMetric(damageAttr)) return 'stat_scaling';
  return 'fixed_burst';
}

function toPublicDamageKind(kind) {
  return kind === 'fixed_burst' ? 'instant_fixed' : kind === 'attack' ? 'attack_modifier' : kind;
}

function toCompatDamageKind(kind) {
  return kind === 'instant_fixed' ? 'fixed_burst' : kind === 'attack_modifier' ? 'attack' : kind;
}

function classifyGrowthKind(ability, damageAttr, damageKind) {
  if (['conditional', 'scaling', 'target_state', 'growth'].includes(damageKind)) return 'state_growth';
  if ((ability.attrib || []).some((attr) => /per_kill|stack|charge|pct|percent|%|missing|attribute|strength|agility|intelligence/i.test(`${attr.key || ''} ${attr.header || ''}`))) {
    return 'state_growth';
  }
  if (/pct|percent|%|missing|attribute|strength|agility|intelligence/i.test(`${damageAttr?.key || ''} ${damageAttr?.header || ''}`)) {
    return 'state_growth';
  }
  return 'non_growth';
}

function isMultiWaveDamage(ability, damageAttr) {
  const key = damageAttr?.key || '';
  const header = damageAttr?.header || '';
  const metadata = getMetadata(ability);
  return Boolean(metadata.waveCountByAbilityLevel.length)
    && /per pulse|per wave|pulse damage|wave damage|damage per pulse|damage per wave/i.test(`${key} ${header}`);
}

function buildFormula(kind, metadata) {
  if (kind === 'sustained' && metadata.durationByAbilityLevel?.length) {
    return { type: 'duration_times_dps' };
  }
  if (kind === 'multi_wave' && metadata.waveCountByAbilityLevel?.length) {
    return { type: 'wave_count_times_damage_per_wave' };
  }
  if (kind === 'attack_sequence' && metadata.attackCountByAbilityLevel?.length) {
    return { type: 'attack_count_sequence' };
  }
  return { type: 'single_value' };
}

function buildTheoreticalTotals(kind, valuesByAbilityLevel, metadata) {
  if (kind === 'sustained' && metadata.durationByAbilityLevel?.length) {
    return multiplyLevelArrays(valuesByAbilityLevel, metadata.durationByAbilityLevel);
  }
  if (kind === 'multi_wave' && metadata.waveCountByAbilityLevel?.length) {
    return multiplyLevelArrays(valuesByAbilityLevel, metadata.waveCountByAbilityLevel);
  }
  return [];
}

function buildDamageComponents(ability) {
  const metadata = getMetadata(ability);
  return findDamageAttributes(ability)
    .map((damageAttr) => {
      const compatKind = classifyDamage(ability, damageAttr);
      const kind = toPublicDamageKind(compatKind);
      const valuesByAbilityLevel = normalizeNumericArray(damageAttr.value);
      const componentMetadata = {};
      if (metadata.durationByAbilityLevel.length) componentMetadata.durationByAbilityLevel = metadata.durationByAbilityLevel;
      if (metadata.tickIntervalByAbilityLevel.length) componentMetadata.tickIntervalByAbilityLevel = metadata.tickIntervalByAbilityLevel;
      if (metadata.waveCountByAbilityLevel.length) componentMetadata.waveCountByAbilityLevel = metadata.waveCountByAbilityLevel;
      if (metadata.attackCountByAbilityLevel.length) {
        componentMetadata.attackCountByAbilityLevel = expandValues(metadata.attackCountByAbilityLevel, valuesByAbilityLevel.length);
      }

      const theoreticalTotalByAbilityLevel = buildTheoreticalTotals(kind, valuesByAbilityLevel, componentMetadata);
      const totalFormula = kind === 'sustained' && theoreticalTotalByAbilityLevel.length
        ? 'duration * damagePerSecond'
        : kind === 'multi_wave' && theoreticalTotalByAbilityLevel.length
          ? 'waveCount * damagePerWave'
          : kind === 'attack_sequence' && componentMetadata.attackCountByAbilityLevel?.length
            ? 'attackCount * attackDamage + procDamage'
          : '';

      return {
        kind,
        growthKind: classifyGrowthKind(ability, damageAttr, kind),
        label: (damageAttr.header || damageAttr.key || '').replace(/:$/, ''),
        sourceKey: damageAttr.key || '',
        valuesByAbilityLevel,
        countInFixedInstantTotal: kind === 'instant_fixed',
        formula: buildFormula(kind, componentMetadata),
        metadata: componentMetadata,
        theoreticalTotalByAbilityLevel,
        totalFormula,
        notes: []
      };
    })
    .filter((component) => component.valuesByAbilityLevel.length > 0);
}

function detectCaveats(ability, damageAttr, components = []) {
  const caveats = [];
  const attrs = ability.attrib || [];
  const kinds = new Set(components.map((component) => component.kind));

  if (attrs.some(isStatScalingDamageMetric)) {
    caveats.push('包含属性系数伤害，当前只计算固定基础伤害。');
  }
  if (hasTargetStateScalingDamage(ability)) {
    caveats.push('包含目标状态相关伤害，当前不计入固定爆发。');
  }
  if (kinds.has('sustained') || isSustainedDamage(ability, damageAttr)) {
    caveats.push('包含持续伤害，当前按每跳/每秒数值记录，不默认计算全额命中。');
  }
  if (kinds.has('multi_wave')) {
    caveats.push('包含多波伤害，理论总量依赖目标站位和完整命中。');
  }
  if (kinds.has('conditional') || isConditionalDamage(ability, damageAttr)) {
    caveats.push('包含条件触发伤害，当前不计入固定瞬时爆发。');
  }
  if (kinds.has('attack_modifier') || isAttackTriggeredDamage(ability, damageAttr)) {
    caveats.push('包含普攻或攻击触发伤害，当前不计入技能固定瞬时爆发。');
  }
  if (kinds.has('attack_sequence')) {
    caveats.push('包含按攻击次数触发的被动伤害，需要结合普攻次数与英雄攻击力计算。');
  }
  if (attrs.some((attr) => /per_kill|stack|charge/i.test(attr.key || ''))) {
    caveats.push('包含叠层或击杀成长，当前不估算额外成长伤害。');
  }

  return caveats;
}

function extractAbilityDamage(ability) {
  const components = buildDamageComponents(ability);
  const primaryComponent = components[0] || null;
  const damageKind = toCompatDamageKind(primaryComponent?.kind || 'none');
  const countsAsFixedBurst = Boolean(primaryComponent?.countInFixedInstantTotal);
  const damageByAbilityLevel = primaryComponent?.valuesByAbilityLevel || [];
  const levelCount = damageByAbilityLevel.length || (Array.isArray(ability.mc) ? ability.mc.length : 1);

  return {
    abilityName: ability.dname || ability.name || '',
    name: ability.dname || ability.name || '',
    damageType: ability.dmg_type || 'Unknown',
    behavior: ability.behavior || '',
    components,
    damageLabel: primaryComponent?.label || '',
    damageKind,
    countsAsFixedBurst,
    damageByAbilityLevel,
    manaCostByAbilityLevel: normalizeNumericArray(ability.mc, levelCount),
    cooldownByAbilityLevel: normalizeNumericArray(ability.cd, levelCount),
    caveats: detectCaveats(ability, null, components)
  };
}

function valueAtLevel(values, abilityLevel) {
  if (!values.length || abilityLevel <= 0) return null;
  return values[Math.min(abilityLevel, values.length) - 1] ?? null;
}

module.exports = {
  extractAbilityDamage,
  valueAtLevel
};
