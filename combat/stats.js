const { round } = require('./rules');

function firstNumber(assertion) {
  const values = assertion.values || [];
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function heroAttributesAtLevel(stats, heroLevel) {
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  return {
    strength: round(Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained),
    agility: round(Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained),
    intelligence: round(Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained)
  };
}

function primaryAttributeDamage(stats, attributes) {
  if (stats.primaryAttribute === 'all') {
    return (attributes.strength + attributes.agility + attributes.intelligence) * 0.7;
  }
  return {
    str: attributes.strength,
    agi: attributes.agility,
    int: attributes.intelligence
  }[stats.primaryAttribute] || 0;
}

function attackDamageAtLevel(stats, attributes, assertions = []) {
  const flatBonus = assertions
    .filter((assertion) => assertion.semanticType === 'stat.attack_damage.flat')
    .reduce((sum, assertion) => sum + firstNumber(assertion), 0);
  const primaryDamage = primaryAttributeDamage(stats, attributes);
  const min = round(Number(stats.baseAttackMin || 0) + primaryDamage + flatBonus);
  const max = round(Number(stats.baseAttackMax || 0) + primaryDamage + flatBonus);
  return { min, max, average: round((min + max) / 2), flatBonus };
}

function applyAttributeAssertions(attributes, assertions = []) {
  const next = { ...attributes };
  for (const assertion of assertions) {
    if (assertion.semanticType !== 'stat.attribute.flat') continue;
    const amount = firstNumber(assertion);
    if (assertion.attribute === 'strength') next.strength = round(next.strength + amount);
    if (assertion.attribute === 'agility') next.agility = round(next.agility + amount);
    if (assertion.attribute === 'intelligence') next.intelligence = round(next.intelligence + amount);
    if (assertion.attribute === 'all') {
      next.strength = round(next.strength + amount);
      next.agility = round(next.agility + amount);
      next.intelligence = round(next.intelligence + amount);
    }
  }
  return next;
}

function attacksPerSecond(stats, attributes, assertions = []) {
  const attackSpeedBonus = assertions
    .filter((assertion) => assertion.semanticType === 'stat.attack_speed.flat')
    .reduce((sum, assertion) => sum + firstNumber(assertion), 0);
  const attackSpeed = round(100 + Number(attributes.agility || 0) + attackSpeedBonus);
  const attackRate = Number(stats.attackRate || 1.7);
  return {
    attackSpeed,
    attackRate,
    attacksPerSecond: attackRate > 0 ? attackSpeed / 100 / attackRate : 0
  };
}

function applyStatAssertions(stats, heroLevel, assertions = []) {
  const baseAttributes = heroAttributesAtLevel(stats, heroLevel);
  const attributes = applyAttributeAssertions(baseAttributes, assertions);
  return {
    attributes,
    attackDamage: attackDamageAtLevel(stats, attributes, assertions),
    attackSpeed: attacksPerSecond(stats, attributes, assertions)
  };
}

module.exports = {
  applyStatAssertions,
  attackDamageAtLevel,
  attacksPerSecond,
  heroAttributesAtLevel
};
