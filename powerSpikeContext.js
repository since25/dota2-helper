const { extractAbilityDamage, valueAtLevel } = require('./damageExtractor');

const KEY_LEVELS = [3, 5, 6, 7, 12, 18];

function abilityLevelForHeroLevel(heroLevel, isUltimate, maxAbilityLevel) {
  if (isUltimate) {
    if (heroLevel >= 18) return Math.min(3, maxAbilityLevel);
    if (heroLevel >= 12) return Math.min(2, maxAbilityLevel);
    if (heroLevel >= 6) return Math.min(1, maxAbilityLevel);
    return 0;
  }

  if (heroLevel >= 7) return Math.min(4, maxAbilityLevel);
  if (heroLevel >= 5) return Math.min(3, maxAbilityLevel);
  if (heroLevel >= 3) return Math.min(2, maxAbilityLevel);
  return Math.min(1, maxAbilityLevel);
}

function getExtractedAbility(ability) {
  return extractAbilityDamage({
    dname: ability.name,
    dmg_type: ability.damageType,
    behavior: ability.behavior,
    attrib: ability.rawAttributes || ability.attributes?.map((attr) => ({
      key: attr.key,
      header: attr.label,
      value: attr.value
    })),
    mc: ability.manaCost,
    cd: ability.cooldown
  });
}

function chooseDamageSkillLevels(heroDetails, heroLevel) {
  const candidates = (heroDetails.abilities || [])
    .map((ability, order) => {
      const extracted = getExtractedAbility(ability);
      const maxAbilityLevel = extracted.damageByAbilityLevel.length;
      if (!maxAbilityLevel) return null;

      return {
        ability,
        extracted,
        order,
        maxLevel: abilityLevelForHeroLevel(heroLevel, ability.isUltimate, maxAbilityLevel)
      };
    })
    .filter((candidate) => candidate && candidate.maxLevel > 0);

  const chosenLevels = new Map();
  const pointsAvailable = heroLevel;

  for (let point = 0; point < pointsAvailable; point += 1) {
    let best = null;

    for (const candidate of candidates) {
      const currentLevel = chosenLevels.get(candidate.ability.name) || 0;
      if (currentLevel >= candidate.maxLevel) continue;

      const currentDamage = valueAtLevel(candidate.extracted.damageByAbilityLevel, currentLevel) || 0;
      const nextDamage = valueAtLevel(candidate.extracted.damageByAbilityLevel, currentLevel + 1) || 0;
      const marginalDamage = nextDamage - currentDamage;
      if (marginalDamage <= 0) continue;

      if (
        !best
        || marginalDamage > best.marginalDamage
        || (marginalDamage === best.marginalDamage && candidate.order < best.order)
      ) {
        best = { ...candidate, marginalDamage };
      }
    }

    if (!best) break;
    chosenLevels.set(best.ability.name, (chosenLevels.get(best.ability.name) || 0) + 1);
  }

  return candidates.map((candidate) => ({
    ...candidate,
    abilityLevel: chosenLevels.get(candidate.ability.name) || 0
  }));
}

function estimateAfterDefaultResistance(damageByType) {
  const magical = damageByType.Magical || 0;
  const physical = damageByType.Physical || 0;
  const pure = damageByType.Pure || 0;
  const other = Object.entries(damageByType)
    .filter(([type]) => !['Magical', 'Physical', 'Pure'].includes(type))
    .reduce((sum, [, value]) => sum + value, 0);

  return Math.round((magical * 0.75 + physical + pure + other) * 100) / 100;
}

function buildSpikeForLevel(heroDetails, heroLevel) {
  const skills = [];
  const damageByType = {};
  const caveats = [];
  let rawDamage = 0;
  let manaCost = 0;
  let cooldownGate = 0;

  for (const { extracted, abilityLevel } of chooseDamageSkillLevels(heroDetails, heroLevel)) {
    if (!abilityLevel) continue;

    const damage = valueAtLevel(extracted.damageByAbilityLevel, abilityLevel);
    if (!damage) continue;

    const mana = valueAtLevel(extracted.manaCostByAbilityLevel, abilityLevel) || 0;
    const cooldown = valueAtLevel(extracted.cooldownByAbilityLevel, abilityLevel) || 0;
    const damageType = extracted.damageType || 'Unknown';

    rawDamage += damage;
    manaCost += mana;
    cooldownGate = Math.max(cooldownGate, cooldown);
    damageByType[damageType] = (damageByType[damageType] || 0) + damage;

    for (const caveat of extracted.caveats) {
      if (!caveats.includes(caveat)) caveats.push(caveat);
    }

    skills.push({
      name: extracted.name,
      abilityLevel,
      damage,
      damageType,
      manaCost: mana,
      cooldown,
      caveats: extracted.caveats
    });
  }

  return {
    hero: heroDetails.name,
    level: heroLevel,
    label: `${heroLevel}级关键爆发窗口`,
    rawDamage,
    damageByType,
    estimatedAfterDefaultResistance: estimateAfterDefaultResistance(damageByType),
    manaCost,
    cooldownGate,
    skills,
    caveats
  };
}

function buildHeroPowerSpikes(heroDetails) {
  if (!heroDetails) return [];
  return KEY_LEVELS
    .map((level) => buildSpikeForLevel(heroDetails, level))
    .filter((spike) => spike.skills.length > 0);
}

module.exports = {
  KEY_LEVELS,
  buildHeroPowerSpikes,
  estimateAfterDefaultResistance
};
