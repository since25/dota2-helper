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

function findDamageAttribute(ability) {
  const attrs = ability.attrib || [];
  return attrs.find((attr) => DAMAGE_KEYS.has(attr.key) && !isTargetStateScalingDamage(attr))
    || attrs.find((attr) => /damage/i.test(attr.key || '') && !isNonOutputDamageMetric(attr) && !isTargetStateScalingDamage(attr));
}

function isNonOutputDamageMetric(attr) {
  const key = attr?.key || '';
  const header = attr?.header || '';
  const label = `${key} ${header}`;
  return /threshold|trigger|incoming|outgoing|taken|received|required|reduction|reflect|per_kill|reset|interval|cooldown|shared/i.test(label)
    || /(^|_)bonus_.*damage($|_)|(^|_)damage_.*bonus($|_)/i.test(key)
    || isStatScalingDamageMetric(attr);
}

function isTargetStateScalingDamage(attr) {
  const key = attr?.key || '';
  const header = attr?.header || '';
  return /per.*mana|mana.*missing|missing.*mana|per.*health|health.*missing|missing.*health/i.test(`${key} ${header}`);
}

function isStatScalingDamageMetric(attr) {
  const key = attr?.key || '';
  const header = attr?.header || '';
  const label = `${key} ${header}`;
  return /damage/i.test(label)
    && /strength|agility|intelligence|attribute|per_?str\b|per_?agi\b|per_?int\b|per.*str\b|per.*agi\b|per.*int\b/i.test(label);
}

function detectCaveats(ability, damageAttr) {
  const caveats = [];
  const attrs = ability.attrib || [];

  if (attrs.some(isStatScalingDamageMetric)) {
    caveats.push('包含属性系数伤害，当前只计算固定基础伤害。');
  }
  if (attrs.some(isTargetStateScalingDamage)) {
    caveats.push('包含目标状态相关伤害，当前不计入固定爆发。');
  }
  const damageHeader = damageAttr?.header || '';
  const damageKey = damageAttr?.key || '';
  if (/per second|per tick|每秒/i.test(damageHeader) || /duration|per_second|per_tick/i.test(damageKey)) {
    caveats.push('包含持续伤害，当前按每跳/每秒数值记录，不默认计算全额命中。');
  }
  if (attrs.some((attr) => /per_kill|stack|charge/i.test(attr.key || ''))) {
    caveats.push('包含叠层或击杀成长，当前不估算额外成长伤害。');
  }

  return caveats;
}

function extractAbilityDamage(ability) {
  const damageAttr = findDamageAttribute(ability);
  const damageByAbilityLevel = damageAttr ? normalizeNumericArray(damageAttr.value) : [];
  const levelCount = damageByAbilityLevel.length || (Array.isArray(ability.mc) ? ability.mc.length : 1);

  return {
    name: ability.dname || ability.name || '',
    damageType: ability.dmg_type || 'Unknown',
    behavior: ability.behavior || '',
    damageLabel: damageAttr?.header || damageAttr?.key || '',
    damageByAbilityLevel,
    manaCostByAbilityLevel: normalizeNumericArray(ability.mc, levelCount),
    cooldownByAbilityLevel: normalizeNumericArray(ability.cd, levelCount),
    caveats: detectCaveats(ability, damageAttr)
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
