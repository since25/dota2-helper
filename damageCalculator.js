const { getHeroDetails } = require('./dotaDataContext');
const { extractAbilityDamage, valueAtLevel } = require('./damageExtractor');
const { resolveHeroDamageModel } = require('./damageModels/resolver');
const { localizeHeroName, localizeTerm } = require('./dotaLocalization');

function roundDamage(value) {
  return Math.round(value * 100) / 100;
}

function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}

function adjustDamageByType(raw, damageType, { enemyArmor = 0, enemyMagicResistancePercent = 25 } = {}) {
  if (damageType === 'Magical') {
    return roundDamage(raw * (1 - enemyMagicResistancePercent / 100));
  }
  if (damageType === 'Physical') {
    return roundDamage(raw * physicalMultiplier(enemyArmor));
  }
  return roundDamage(raw);
}

function componentId(abilityName, component) {
  return `${abilityName}:${component.kind}:${component.sourceKey}`;
}

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

function extractFromAbility(ability) {
  return extractAbilityDamage({
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
}

function buildAbilityDamageEntry(ability) {
  const extracted = ability.components ? null : extractFromAbility(ability);
  const components = ability.components || extracted.components;
  return {
    name: ability.name,
    displayName: ability.displayName || localizeTerm(ability.name, true),
    isUltimate: ability.isUltimate,
    modelSource: ability.modelSource || 'inferred',
    status: ability.status || 'inferred',
    model: ability.model || 'inferred',
    reason: ability.reason || '',
    manaCostByAbilityLevel: ability.manaCostByAbilityLevel || extracted.manaCostByAbilityLevel,
    cooldownByAbilityLevel: ability.cooldownByAbilityLevel || extracted.cooldownByAbilityLevel,
    components: components.map((component) => ({
      id: componentId(ability.name, component),
      kind: component.kind,
      growthKind: component.growthKind,
      damageType: component.damageType || extracted?.damageType || 'Unknown',
      label: component.label,
      valuesByAbilityLevel: component.valuesByAbilityLevel,
      theoreticalTotalByAbilityLevel: component.theoreticalTotalByAbilityLevel,
      totalFormula: component.totalFormula,
      countInFixedInstantTotal: component.countInFixedInstantTotal,
      formula: component.formula,
      metadata: component.metadata,
      source: component.source || ability.modelSource || 'inferred',
      status: component.status || ability.status || 'inferred',
      model: component.model || ability.model || component.kind,
      reason: component.reason || ability.reason || '',
      caveats: component.caveats || extracted?.caveats || []
    }))
  };
}

async function getHeroDamageProfile(heroName) {
  const details = await getHeroDetails(heroName);
  if (!details) {
    throw new Error(`Unknown hero: ${heroName}`);
  }

  return {
    hero: details.name,
    displayName: localizeHeroName(details.name, true),
    levels: {
      selectedDefault: 1,
      max: 30
    },
    stats: details.stats,
    abilities: resolveHeroDamageModel(details).abilities
      .map(buildAbilityDamageEntry)
      .filter((ability) => ability.components.length > 0),
    items: []
  };
}

function findSelectedComponent(profile, selection) {
  const ability = profile.abilities.find((entry) => entry.name === selection.abilityName);
  if (!ability) return null;
  const component = ability.components.find((entry) => entry.id === selection.componentId);
  if (!component) return null;
  return { ability, component };
}

function numericInput(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function boundedDuration(value, limit) {
  const duration = numericInput(value);
  if (duration === null) return null;
  const nonNegative = Math.max(0, duration);
  return limit === null ? nonNegative : Math.min(nonNegative, limit);
}

function attackDamageAtLevel(stats, heroLevel) {
  if (!stats) return 0;
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  const strength = Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained;
  const agility = Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained;
  const intelligence = Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained;
  const primaryDamage = stats.primaryAttribute === 'all'
    ? (strength + agility + intelligence) * 0.7
    : { str: strength, agi: agility, int: intelligence }[stats.primaryAttribute] || 0;
  const attackMin = Math.round(Number(stats.baseAttackMin || 0) + primaryDamage);
  const attackMax = Math.round(Number(stats.baseAttackMax || 0) + primaryDamage);
  return roundDamage((attackMin + attackMax) / 2);
}

function resolveAttackSequenceDamage(component, abilityLevel, selection, profile, heroLevel) {
  const procDamage = valueAtLevel(component.valuesByAbilityLevel || [], abilityLevel) || 0;
  const defaultAttackCount = valueAtLevel(component.metadata?.attackCountByAbilityLevel || [], abilityLevel) || 0;
  const attackCount = numericInput(selection.attackCount) ?? defaultAttackCount;
  const attackDamage = numericInput(selection.attackDamage) ?? attackDamageAtLevel(profile.stats, heroLevel);

  return {
    raw: roundDamage(attackCount * attackDamage + procDamage),
    formula: component.totalFormula || 'attackCount * attackDamage + procDamage',
    attackCount,
    attackDamage,
    procDamage,
    activeDurationSeconds: null,
    durationLimitSeconds: null
  };
}

function resolveAttackModifierDamage(component, abilityLevel, selection, profile, heroLevel) {
  const baseDamage = valueAtLevel(component.valuesByAbilityLevel || [], abilityLevel) || 0;
  const attackFactorPct = valueAtLevel(component.metadata?.attackFactorPctByAbilityLevel || [], abilityLevel);

  if (selection.valueMode === 'theoretical' && attackFactorPct !== null) {
    const attackDamage = numericInput(selection.attackDamage) ?? attackDamageAtLevel(profile.stats, heroLevel);
    return {
      raw: roundDamage(baseDamage + attackDamage * (attackFactorPct / 100)),
      formula: component.totalFormula || 'baseDamage + attackDamage * attackFactorPct',
      attackCount: null,
      attackDamage,
      procDamage: baseDamage,
      attackFactorPct,
      activeDurationSeconds: null,
      durationLimitSeconds: null
    };
  }

  return {
    raw: baseDamage,
    formula: component.formula?.type || 'attack_modifier',
    attackCount: null,
    attackDamage: null,
    procDamage: baseDamage,
    attackFactorPct,
    activeDurationSeconds: null,
    durationLimitSeconds: null
  };
}

function resolveComponentDamage(component, abilityLevel, selection, profile, heroLevel) {
  const baseValue = valueAtLevel(component.valuesByAbilityLevel || [], abilityLevel) || 0;

  if (component.kind === 'attack_sequence' && selection.valueMode === 'theoretical') {
    return resolveAttackSequenceDamage(component, abilityLevel, selection, profile, heroLevel);
  }

  if (component.kind === 'attack_modifier') {
    return resolveAttackModifierDamage(component, abilityLevel, selection, profile, heroLevel);
  }

  if (selection.valueMode === 'theoretical') {
    const durationLimit = valueAtLevel(component.metadata?.durationByAbilityLevel || [], abilityLevel);
    const activeDurationSeconds = component.kind === 'sustained'
      ? boundedDuration(selection.activeDurationSeconds, durationLimit)
      : null;

    if (activeDurationSeconds !== null) {
      return {
        raw: roundDamage(baseValue * activeDurationSeconds),
        formula: 'activeDurationSeconds * damagePerSecond',
        activeDurationSeconds,
        durationLimitSeconds: durationLimit
      };
    }

    const theoretical = valueAtLevel(component.theoreticalTotalByAbilityLevel || [], abilityLevel);
    if (theoretical !== null) {
      return {
        raw: theoretical,
        formula: component.totalFormula || 'theoretical_total',
        activeDurationSeconds: null,
        durationLimitSeconds: durationLimit
      };
    }
  }

  return {
    raw: baseValue,
    formula: component.formula?.type || 'single_value',
    activeDurationSeconds: null,
    durationLimitSeconds: null,
      attackCount: null,
      attackDamage: null,
      procDamage: null,
      attackFactorPct: null
  };
}

function addTypeTotal(byType, damageType, raw, adjusted) {
  const key = damageType || 'Unknown';
  if (!byType[key]) byType[key] = { raw: 0, adjusted: 0 };
  byType[key].raw = roundDamage(byType[key].raw + raw);
  byType[key].adjusted = roundDamage(byType[key].adjusted + adjusted);
}

async function calculateDamageCombo(request) {
  const profile = await getHeroDamageProfile(request.hero);
  const params = {
    enemyArmor: Number(request.enemyArmor ?? 0),
    enemyMagicResistancePercent: Number(request.enemyMagicResistancePercent ?? 25)
  };
  const components = [];
  const warnings = [];
  const byType = {};

  for (const selection of request.selectedComponents || []) {
    const match = findSelectedComponent(profile, selection);
    if (!match) {
      warnings.push(`未找到组件: ${selection.componentId}`);
      continue;
    }

    const { ability, component } = match;
    const maxAbilityLevel = component.valuesByAbilityLevel.length;
    const legalMax = abilityLevelForHeroLevel(Number(request.heroLevel || 1), ability.isUltimate, maxAbilityLevel);
    const abilityLevel = Math.max(1, Math.min(Number(selection.abilityLevel || legalMax || 1), maxAbilityLevel));
    const damage = resolveComponentDamage(component, abilityLevel, selection, profile, Number(request.heroLevel || 1));
    const raw = roundDamage(damage.raw);
    const adjusted = adjustDamageByType(raw, component.damageType, params);
    addTypeTotal(byType, component.damageType, raw, adjusted);

    components.push({
      name: ability.name,
      displayName: ability.displayName,
      kind: component.kind,
      growthKind: component.growthKind,
      damageType: component.damageType,
      raw,
      adjusted,
      abilityLevel,
      formula: damage.formula,
      activeDurationSeconds: damage.activeDurationSeconds,
      durationLimitSeconds: damage.durationLimitSeconds,
      attackCount: damage.attackCount,
      attackDamage: damage.attackDamage,
      procDamage: damage.procDamage,
      attackFactorPct: damage.attackFactorPct,
      caveats: component.caveats || []
    });
  }

  const raw = roundDamage(Object.values(byType).reduce((sum, entry) => sum + entry.raw, 0));
  const adjusted = roundDamage(Object.values(byType).reduce((sum, entry) => sum + entry.adjusted, 0));

  return {
    hero: profile.hero,
    heroLevel: Number(request.heroLevel || 1),
    enemyArmor: params.enemyArmor,
    enemyMagicResistancePercent: params.enemyMagicResistancePercent,
    totals: {
      raw,
      adjusted,
      byType
    },
    components,
    warnings
  };
}

module.exports = {
  adjustDamageByType,
  calculateDamageCombo,
  getHeroDamageProfile,
  physicalMultiplier
};
