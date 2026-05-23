const { valueAtLevel } = require('./damageExtractor');
const { resolveHeroDamageModel } = require('./damageModels/resolver');
const { CONTEXT_ROUTES } = require('./damageModels/semantics');

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

function getResolvedAbilities(heroDetails) {
  return resolveHeroDamageModel(heroDetails).abilities;
}

function chooseDamageSkillLevels(heroDetails, heroLevel) {
  const candidates = getResolvedAbilities(heroDetails)
    .flatMap((ability, order) => (ability.components || []).map((component) => ({
      ability,
      component,
      order
    })))
    .map((candidate) => {
      const maxAbilityLevel = candidate.component.valuesByAbilityLevel.length;
      if (!maxAbilityLevel || !candidate.component.countInFixedInstantTotal) return null;

      return {
        ...candidate,
        maxLevel: abilityLevelForHeroLevel(heroLevel, candidate.ability.isUltimate, maxAbilityLevel)
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

      const currentDamage = valueAtLevel(candidate.component.valuesByAbilityLevel, currentLevel) || 0;
      const nextDamage = valueAtLevel(candidate.component.valuesByAbilityLevel, currentLevel + 1) || 0;
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

function collectSituationalSkills(heroDetails, heroLevel) {
  return getResolvedAbilities(heroDetails)
    .flatMap((ability) => (ability.components || [])
      .filter((entry) => !entry.countInFixedInstantTotal)
      .map((component) => {
      const maxAbilityLevel = component?.valuesByAbilityLevel.length || 0;
      if (!maxAbilityLevel) return null;

      const abilityLevel = abilityLevelForHeroLevel(heroLevel, ability.isUltimate, maxAbilityLevel);
      if (!abilityLevel) return null;

      const damage = valueAtLevel(component.valuesByAbilityLevel, abilityLevel);
      if (!damage) return null;
      const theoreticalTotal = valueAtLevel(component.theoreticalTotalByAbilityLevel || [], abilityLevel);

      return {
        name: ability.name,
        displayName: ability.displayName || ability.name,
        abilityLevel,
        damage,
        damageType: component.damageType || (component.metadata?.isDamageReference === false ? '' : 'Unknown'),
        kind: component.kind,
        growthKind: component.growthKind,
        damageKind: component.kind,
        damageLabel: component.label,
        label: component.label,
        theoreticalTotal,
        totalFormula: component.totalFormula,
        semantic: component.semantic,
        metadata: component.metadata,
        modelSource: ability.modelSource || component.source || 'inferred',
        status: component.status || ability.status || 'inferred',
        model: component.model || ability.model || component.kind,
        caveats: component.caveats || []
      };
    }))
    .filter(Boolean);
}

function isModifierReference(skill) {
  if (skill.semantic?.contextRoute) {
    return [
      CONTEXT_ROUTES.MODIFIER_REFERENCE,
      CONTEXT_ROUTES.RESOURCE_REFERENCE
    ].includes(skill.semantic.contextRoute);
  }
  const metadata = skill.metadata || {};
  return metadata.isDamageReference === false
    || Boolean(metadata.modifierType)
    || skill.model === 'debuff_reference';
}

function toModifierReference(skill) {
  const metadata = skill.metadata || {};
  return {
    name: skill.name,
    displayName: skill.displayName,
    abilityLevel: skill.abilityLevel,
    value: skill.damage,
    modifierType: metadata.modifierType || '',
    affects: metadata.affects || '',
    kind: skill.kind,
    growthKind: skill.growthKind,
    label: skill.label,
    totalFormula: skill.totalFormula,
    semantic: skill.semantic,
    metadata,
    modelSource: skill.modelSource,
    status: skill.status,
    model: skill.model,
    caveats: skill.caveats || []
  };
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
  const collectedSituationalSkills = collectSituationalSkills(heroDetails, heroLevel);
  const modifierRefs = collectedSituationalSkills
    .filter(isModifierReference)
    .map(toModifierReference);
  const situationalSkills = collectedSituationalSkills.filter((skill) => !isModifierReference(skill));
  let rawDamage = 0;
  let manaCost = 0;
  let cooldownGate = 0;

  for (const { ability, component, abilityLevel } of chooseDamageSkillLevels(heroDetails, heroLevel)) {
    if (!abilityLevel) continue;

    const damage = valueAtLevel(component.valuesByAbilityLevel, abilityLevel);
    if (!damage) continue;

    const mana = valueAtLevel(ability.manaCostByAbilityLevel || [], abilityLevel) || 0;
    const cooldown = valueAtLevel(ability.cooldownByAbilityLevel || [], abilityLevel) || 0;
    const damageType = component.damageType || 'Unknown';

    rawDamage += damage;
    manaCost += mana;
    cooldownGate = Math.max(cooldownGate, cooldown);
    damageByType[damageType] = (damageByType[damageType] || 0) + damage;

    for (const caveat of component.caveats || []) {
      if (!caveats.includes(caveat)) caveats.push(caveat);
    }

    skills.push({
      name: ability.name,
      displayName: ability.displayName || ability.name,
      abilityLevel,
      damage,
      damageType,
      damageKind: component.kind,
      kind: component.kind,
      semantic: component.semantic,
      modelSource: ability.modelSource || component.source || 'inferred',
      status: component.status || ability.status || 'inferred',
      model: component.model || ability.model || component.kind,
      manaCost: mana,
      cooldown,
      caveats: component.caveats || []
    });
  }

  for (const situationalSkill of collectedSituationalSkills) {
    for (const caveat of situationalSkill.caveats) {
      if (!caveats.includes(caveat)) caveats.push(caveat);
    }
  }

  return {
    hero: heroDetails.name,
    level: heroLevel,
    label: `${heroLevel}级关键爆发窗口`,
    fixedInstantDamage: {
      raw: rawDamage,
      byType: damageByType,
      afterDefaultResistance: estimateAfterDefaultResistance(damageByType),
      skills
    },
    situationalDamageRefs: situationalSkills,
    modifierRefs,
    rawDamage,
    damageByType,
    estimatedAfterDefaultResistance: estimateAfterDefaultResistance(damageByType),
    manaCost,
    cooldownGate,
    skills,
    situationalSkills,
    caveats
  };
}

function buildHeroPowerSpikes(heroDetails) {
  if (!heroDetails) return [];
  return KEY_LEVELS
    .map((level) => buildSpikeForLevel(heroDetails, level))
    .filter((spike) => spike.skills.length > 0 || spike.situationalSkills.length > 0 || spike.modifierRefs.length > 0);
}

module.exports = {
  KEY_LEVELS,
  buildHeroPowerSpikes,
  estimateAfterDefaultResistance
};
