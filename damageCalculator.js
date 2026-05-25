const { getHeroDetails } = require('./dotaDataContext');
const { extractAbilityDamage, valueAtLevel } = require('./damageExtractor');
const { resolveHeroDamageModel } = require('./damageModels/resolver');
const { localizeHeroName, localizeTerm } = require('./dotaLocalization');
const { listItemModels, getItemModel } = require('./itemModels/registry');
const { calculateAttackWindow } = require('./combat/attackWindow');
const { adjustDamageEvent } = require('./combat/damageEvents');
const { adaptItemModelToAssertions } = require('./combat/itemEffectAdapter');
const {
  applyStatAssertions,
  attackDamageAtLevel: combatAttackDamageAtLevel,
  heroAttributesAtLevel: combatHeroAttributesAtLevel
} = require('./combat/stats');

function roundDamage(value) {
  return Math.round(value * 100) / 100;
}

function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}

function adjustDamageByType(raw, damageType, {
  enemyArmor = 0,
  enemyMagicResistancePercent = 25,
  damageAmpPercent = 0,
  spellAmpPercent = 0
} = {}) {
  const spellAmpMultiplier = damageType === 'Magical' ? 1 + spellAmpPercent / 100 : 1;
  const damageAmpMultiplier = 1 + damageAmpPercent / 100;
  const amplifiedRaw = raw * spellAmpMultiplier * damageAmpMultiplier;
  if (damageType === 'Magical') {
    return roundDamage(amplifiedRaw * (1 - enemyMagicResistancePercent / 100));
  }
  if (damageType === 'Physical') {
    return roundDamage(amplifiedRaw * physicalMultiplier(enemyArmor));
  }
  return roundDamage(amplifiedRaw);
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

function isSelectableAbilityComponent(component) {
  return !['reference_only', 'unsupported'].includes(component.status);
}

function selectedAbilityLevel(selection, ability, component, heroLevel) {
  const maxAbilityLevel = component.valuesByAbilityLevel.length;
  const legalMax = abilityLevelForHeroLevel(heroLevel, ability.isUltimate, maxAbilityLevel);
  const selectedLevel = selection.abilityLevel ?? (legalMax || 1);
  const requested = Number(selectedLevel);

  if (!isSelectableAbilityComponent(component)) {
    throw new Error(`${ability.name} component ${component.id} is ${component.status} and cannot be calculated.`);
  }
  if (legalMax <= 0) {
    throw new Error(`${ability.name} is not legal at hero level ${heroLevel}.`);
  }
  if (Number.isFinite(requested) && !Number.isInteger(requested)) {
    throw new Error(`${ability.name} level ${selectedLevel} is not a valid integer ability level at hero level ${heroLevel}; max legal level is ${legalMax}.`);
  }
  if (!Number.isFinite(requested) || requested < 1 || requested > legalMax) {
    throw new Error(`${ability.name} level ${requested} is not legal at hero level ${heroLevel}; max legal level is ${legalMax}.`);
  }

  return requested;
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
      semantic: component.semantic,
      metadata: component.metadata,
      source: component.source || ability.modelSource || 'inferred',
      status: component.status || ability.status || 'inferred',
      model: component.model || ability.model || component.kind,
      reason: component.reason || ability.reason || '',
      caveats: component.caveats || extracted?.caveats || []
    }))
  };
}

function itemComponentId(itemKey, index, effect) {
  return `${itemKey}:${effect.type}:${effect.key || effect.abilityName || index}`;
}

function itemDamageType(effect) {
  const text = `${effect.description || ''} ${effect.label || ''}`.toLowerCase();
  if (text.includes('physical')) return 'Physical';
  if (text.includes('pure')) return 'Pure';
  return 'Magical';
}

function itemKind(effect) {
  if (effect.type === 'damage.sustained_dps' || effect.type === 'damage.damage_over_time') return 'sustained';
  if (effect.type === 'damage.attack_proc') return 'attack_proc';
  if (effect.type === 'damage.attribute_scaling') return 'attribute_scaling';
  if (effect.type.startsWith('modifier.')) return 'modifier';
  if (effect.type.startsWith('upgrade.')) return 'upgrade';
  return 'instant_fixed';
}

function isCalculatorItemEffect(effect) {
  return effect.type.startsWith('damage.')
    || effect.type.startsWith('modifier.')
    || effect.type.startsWith('upgrade.');
}

function buildItemDamageEntry(model) {
  return {
    key: model.key,
    name: model.name,
    displayName: model.name,
    cost: model.cost,
    quality: model.quality,
    components: model.effects
      .map((effect, index) => ({ effect, index }))
      .filter(({ effect }) => isCalculatorItemEffect(effect))
      .map(({ effect, index }) => ({
        id: itemComponentId(model.key, index, effect),
        itemKey: model.key,
        kind: itemKind(effect),
        semanticType: effect.type,
        label: effect.label,
        damageType: effect.type.startsWith('damage.') ? itemDamageType(effect) : 'None',
        values: effect.values || [],
        sourceKey: effect.key || effect.abilityName || effect.source || '',
        source: effect.source || 'item_model',
        description: effect.description || '',
        status: 'implemented'
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
    items: listItemModels()
      .map(buildItemDamageEntry)
      .filter((item) => item.components.length > 0)
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

function firstNumeric(values) {
  if (!Array.isArray(values)) return null;
  for (const value of values) {
    const number = numericInput(value);
    if (number !== null) return number;
  }
  return null;
}

function boundedDuration(value, limit) {
  const duration = numericInput(value);
  if (duration === null) return null;
  const nonNegative = Math.max(0, duration);
  return limit === null ? nonNegative : Math.min(nonNegative, limit);
}

function attackDamageAtLevel(stats, heroLevel) {
  if (!stats) return 0;
  const attributes = combatHeroAttributesAtLevel(stats, heroLevel);
  const attack = combatAttackDamageAtLevel(stats, attributes);
  return roundDamage(attack.average);
}

function resolveAttackSequenceDamage(component, abilityLevel, selection, profile, heroLevel) {
  const procDamage = valueAtLevel(component.valuesByAbilityLevel || [], abilityLevel) || 0;
  const defaultSetupAttackCount = valueAtLevel(component.metadata?.attackCountByAbilityLevel || [], abilityLevel) || 0;
  const setupAttackCount = numericInput(selection.setupAttackCount) ?? defaultSetupAttackCount;
  const attackCount = numericInput(selection.attackCount) ?? (setupAttackCount + 1);
  const attackDamage = numericInput(selection.attackDamage) ?? attackDamageAtLevel(profile.stats, heroLevel);

  return {
    raw: roundDamage(attackCount * attackDamage + procDamage),
    formula: component.totalFormula || '(setupAttackCount + 1) * attackDamage + procDamage',
    attackCount,
    setupAttackCount,
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

function healthInputValue(selection, inputName) {
  const byName = {
    target_max_health: selection.targetMaxHealth,
    target_current_health: selection.targetCurrentHealth,
    enemy_current_health: selection.targetCurrentHealth,
    enemy_max_health: selection.targetMaxHealth
  };
  return numericInput(byName[inputName]) ?? numericInput(selection.healthValue) ?? 0;
}

function attributeInputValue(selection, inputName, profile, heroLevel) {
  const stats = profile.stats || {};
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  const strength = Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained;
  const agility = Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained;
  const intelligence = Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained;
  const byName = {
    caster_strength: selection.casterStrength ?? strength,
    hero_strength: selection.casterStrength ?? strength,
    caster_agility: selection.casterAgility ?? agility,
    hero_agility: selection.casterAgility ?? agility,
    caster_intelligence: selection.casterIntelligence ?? intelligence,
    hero_intelligence: selection.casterIntelligence ?? intelligence,
    hero_attribute: selection.casterAttribute
  };
  return numericInput(byName[inputName]) ?? numericInput(selection.attributeValue) ?? 0;
}

function isRuntimeInputOnlyComponent(component) {
  return ['percent_health_dot', 'percent_health_instant', 'source_damage_percent'].includes(component.kind);
}

function resolveComponentDamage(component, abilityLevel, selection, profile, heroLevel) {
  const baseValue = valueAtLevel(component.valuesByAbilityLevel || [], abilityLevel) || 0;

  if (isRuntimeInputOnlyComponent(component) && selection.valueMode !== 'theoretical') {
    throw new Error(`${component.kind} requires theoretical runtime input mode; base mode would ignore required input values.`);
  }

  if (component.kind === 'attack_sequence' && selection.valueMode === 'theoretical') {
    return resolveAttackSequenceDamage(component, abilityLevel, selection, profile, heroLevel);
  }

  if (component.kind === 'attack_modifier') {
    return resolveAttackModifierDamage(component, abilityLevel, selection, profile, heroLevel);
  }

  if (selection.valueMode === 'theoretical') {
    if (component.kind === 'repeated_trigger') {
      const triggerCount = numericInput(selection.triggerCount) ?? numericInput(selection.attackCount) ?? 1;
      const bonusDamage = valueAtLevel(component.metadata?.bounceBonusDamageByAbilityLevel || [], abilityLevel) || 0;
      return {
        raw: roundDamage(baseValue * triggerCount + bonusDamage * Math.max(0, triggerCount - 1)),
        formula: bonusDamage
          ? 'triggerCount * damage + bonusDamage * (triggerCount - 1)'
          : 'triggerCount * damage',
        triggerCount,
        activeDurationSeconds: null,
        durationLimitSeconds: null
      };
    }

    if (component.kind === 'summon_attack') {
      const attackCount = numericInput(selection.attackCount) ?? numericInput(selection.triggerCount) ?? 1;
      const attackDamage = numericInput(selection.attackDamage);
      const percentProbe = `${component.semantic?.unit || ''} ${component.totalFormula || ''} ${component.label || ''}`;
      const isPercent = /%|percent|illusion/i.test(percentProbe);
      const perAttack = attackDamage !== null && isPercent
        ? attackDamage * (baseValue / 100)
        : baseValue;
      return {
        raw: roundDamage(perAttack * attackCount),
        formula: attackDamage !== null && isPercent
          ? 'attackCount * attackDamage * summonDamagePercent'
          : 'attackCount * summonAttackDamage',
        attackCount,
        attackDamage: attackDamage !== null ? attackDamage : null,
        procDamage: perAttack,
        activeDurationSeconds: null,
        durationLimitSeconds: null
      };
    }

    if (component.kind === 'percent_health_dot') {
      const durationLimit = valueAtLevel(component.metadata?.durationByAbilityLevel || [], abilityLevel);
      const activeDurationSeconds = boundedDuration(selection.activeDurationSeconds, durationLimit) ?? durationLimit ?? 1;
      const healthValue = healthInputValue(selection, component.metadata?.healthInput);
      return {
        raw: roundDamage(healthValue * (baseValue / 100) * activeDurationSeconds),
        formula: 'healthInput * percentDamage * duration',
        targetMaxHealth: healthValue,
        activeDurationSeconds,
        durationLimitSeconds: durationLimit
      };
    }

    if (component.kind === 'percent_health_instant') {
      const healthValue = healthInputValue(selection, component.metadata?.healthInput);
      return {
        raw: roundDamage(healthValue * (baseValue / 100)),
        formula: 'targetMaxHealth * percentDamage',
        targetMaxHealth: healthValue,
        activeDurationSeconds: null,
        durationLimitSeconds: null
      };
    }

    if (component.kind === 'source_damage_percent') {
      const sourceDamage = numericInput(selection.sourceDamage) ?? 0;
      return {
        raw: roundDamage(sourceDamage * (baseValue / 100)),
        formula: 'sourceDamage * percentDamage',
        sourceDamage,
        activeDurationSeconds: null,
        durationLimitSeconds: null
      };
    }

    if (component.kind === 'attribute_scaling') {
      const multiplier = valueAtLevel(component.metadata?.attributeMultiplierByAbilityLevel || [], abilityLevel) || 0;
      const attributeValue = attributeInputValue(selection, component.metadata?.attributeInput, profile, heroLevel);
      return {
        raw: roundDamage(baseValue + attributeValue * multiplier),
        formula: 'baseDamage + attributeInput * attributeMultiplier',
        attributeValue,
        attributeMultiplier: multiplier,
        activeDurationSeconds: null,
        durationLimitSeconds: null
      };
    }

    if (component.kind === 'conditional_instant' && !selection.conditionMet) {
      return {
        raw: 0,
        formula: 'condition_not_met',
        activeDurationSeconds: null,
        durationLimitSeconds: null
      };
    }

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

function resolveBasicAttackDamage(selection, profile, heroLevel) {
  const attackCount = numericInput(selection.attackCount) ?? 1;
  const attackDamage = numericInput(selection.attackDamage) ?? attackDamageAtLevel(profile.stats, heroLevel);
  return {
    raw: roundDamage(attackCount * attackDamage),
    attackCount,
    attackDamage
  };
}

function addTypeTotal(byType, damageType, raw, adjusted) {
  const key = damageType || 'Unknown';
  if (!byType[key]) byType[key] = { raw: 0, adjusted: 0 };
  byType[key].raw = roundDamage(byType[key].raw + raw);
  byType[key].adjusted = roundDamage(byType[key].adjusted + adjusted);
}

function findSelectedItemComponent(selection) {
  const model = getItemModel(selection.itemKey);
  if (!model) return null;
  const entry = buildItemDamageEntry(model);
  const component = entry.components.find((itemComponent) => itemComponent.id === selection.componentId);
  if (!component) return null;
  return { item: entry, component };
}

function resolveItemModifier(component) {
  const value = firstNumeric(component.values) || 0;
  if (component.semanticType === 'modifier.armor.flat') return { enemyArmorDelta: value };
  if (component.semanticType === 'modifier.magic_resistance.percent') return { enemyMagicResistanceDelta: value };
  if (component.semanticType === 'modifier.damage_amp.percent') return { damageAmpPercent: Math.abs(value) };
  if (component.semanticType === 'modifier.spell_amp.percent') return { spellAmpPercent: Math.abs(value) };
  if (component.semanticType === 'modifier.attack_damage.flat') return { attackDamageBonus: value };
  return {};
}

function collectItemModifiers(selections) {
  const modifiers = {
    enemyArmorDelta: 0,
    enemyMagicResistanceDelta: 0,
    damageAmpPercent: 0,
    spellAmpPercent: 0,
    attackDamageBonus: 0,
    applied: []
  };
  for (const selection of selections) {
    if (selection.sourceType !== 'item') continue;
    const match = findSelectedItemComponent(selection);
    if (!match || match.component.kind !== 'modifier') continue;
    const modifier = resolveItemModifier(match.component);
    modifiers.enemyArmorDelta += modifier.enemyArmorDelta || 0;
    modifiers.enemyMagicResistanceDelta += modifier.enemyMagicResistanceDelta || 0;
    modifiers.damageAmpPercent += modifier.damageAmpPercent || 0;
    modifiers.spellAmpPercent += modifier.spellAmpPercent || 0;
    modifiers.attackDamageBonus += modifier.attackDamageBonus || 0;
    modifiers.applied.push({
      itemKey: match.item.key,
      itemName: match.item.name,
      componentId: match.component.id,
      label: match.component.label,
      semanticType: match.component.semanticType,
      value: firstNumeric(match.component.values) || 0
    });
  }
  return modifiers;
}

function selectedItemAssertions(selections) {
  const seen = new Set();
  return (selections || [])
    .filter((selection) => selection.sourceType === 'item')
    .flatMap((selection) => {
      if (seen.has(selection.itemKey)) return [];
      seen.add(selection.itemKey);
      const model = getItemModel(selection.itemKey);
      return model ? adaptItemModelToAssertions(model) : [];
    });
}

function resolveItemDamage(component, selection, profile, heroLevel, modifiers) {
  const value = numericInput(selection.value) ?? firstNumeric(component.values) ?? 0;
  if (component.kind === 'sustained') {
    const duration = numericInput(selection.activeDurationSeconds) ?? 1;
    return {
      raw: roundDamage(value * Math.max(0, duration)),
      formula: 'activeDurationSeconds * itemDamagePerSecond',
      activeDurationSeconds: Math.max(0, duration)
    };
  }
  if (component.kind === 'attack_proc') {
    const triggerCount = numericInput(selection.triggerCount) ?? numericInput(selection.attackCount) ?? 1;
    return {
      raw: roundDamage(value * Math.max(0, triggerCount)),
      formula: 'triggerCount * itemProcDamage',
      triggerCount: Math.max(0, triggerCount)
    };
  }
  if (component.kind === 'attribute_scaling') {
    const attributeValue = numericInput(selection.attributeValue)
      ?? numericInput(selection.casterAttribute)
      ?? attributeInputValue(selection, 'hero_attribute', profile, heroLevel);
    return {
      raw: roundDamage(value * attributeValue),
      formula: 'attributeInput * itemAttributeMultiplier',
      attributeValue,
      attributeMultiplier: value
    };
  }
  if (component.kind === 'modifier' || component.kind === 'upgrade') {
    return {
      raw: 0,
      formula: component.kind === 'modifier' ? 'item_modifier_applied_globally' : 'item_upgrade_condition',
      modifierOnly: true
    };
  }
  return {
    raw: value,
    formula: 'item_single_value'
  };
}

async function calculateDamageCombo(request) {
  const profile = await getHeroDamageProfile(request.hero);
  const combatAssertions = selectedItemAssertions(request.selectedComponents || []);
  const combatStats = applyStatAssertions(profile.stats, Number(request.heroLevel || 1), combatAssertions);
  const itemModifiers = collectItemModifiers(request.selectedComponents || []);
  const params = {
    enemyArmor: Number(request.enemyArmor ?? 0) + itemModifiers.enemyArmorDelta,
    enemyMagicResistancePercent: Number(request.enemyMagicResistancePercent ?? 25) + itemModifiers.enemyMagicResistanceDelta,
    damageAmpPercent: itemModifiers.damageAmpPercent,
    spellAmpPercent: itemModifiers.spellAmpPercent
  };
  const components = [];
  const warnings = [];
  const byType = {};

  for (const selection of request.selectedComponents || []) {
    if (selection.sourceType === 'basic_attack') {
      const window = calculateAttackWindow({
        attackDamage: combatStats.attackDamage,
        attackSpeed: combatStats.attackSpeed,
        assertions: combatAssertions,
        mode: selection.attackWindowMode || 'attack_count',
        attackCount: selection.attackCount,
        durationSeconds: selection.durationSeconds,
        forceInvisibilityBreak: selection.forceInvisibilityBreak,
        forceCritSource: selection.forceCritSource
      });
      const raw = window.raw;
      const adjustedEvent = adjustDamageEvent({ type: 'attack_window', damageType: 'Physical', raw }, params);
      const adjusted = adjustedEvent.adjusted;
      addTypeTotal(byType, 'Physical', raw, adjusted);
      components.push({
        name: 'Basic Attack',
        displayName: '普攻',
        kind: 'basic_attack',
        growthKind: 'attack',
        damageType: 'Physical',
        raw,
        adjusted,
        abilityLevel: 0,
        formula: 'attackCount * attackDamage',
        activeDurationSeconds: null,
        durationLimitSeconds: null,
        attackCount: window.attackCount,
        attackDamage: combatStats.attackDamage.average,
        attackWindow: window,
        combatEvent: adjustedEvent,
        procDamage: null,
        attackFactorPct: null,
        caveats: []
      });
      continue;
    }

    if (selection.sourceType === 'item') {
      const match = findSelectedItemComponent(selection);
      if (!match) {
        warnings.push(`未找到物品组件: ${selection.componentId}`);
        continue;
      }
      const damage = resolveItemDamage(match.component, selection, profile, Number(request.heroLevel || 1), itemModifiers);
      const raw = roundDamage(damage.raw);
      const adjusted = match.component.damageType === 'None'
        ? 0
        : adjustDamageByType(raw, match.component.damageType, params);
      if (match.component.damageType !== 'None') {
        addTypeTotal(byType, match.component.damageType, raw, adjusted);
      }
      components.push({
        name: match.item.key,
        displayName: match.item.name,
        itemKey: match.item.key,
        componentId: match.component.id,
        kind: match.component.kind,
        growthKind: 'item',
        damageType: match.component.damageType,
        raw,
        adjusted,
        abilityLevel: 0,
        formula: damage.formula,
        activeDurationSeconds: damage.activeDurationSeconds ?? null,
        durationLimitSeconds: null,
        triggerCount: damage.triggerCount,
        attributeValue: damage.attributeValue,
        attributeMultiplier: damage.attributeMultiplier,
        semanticType: match.component.semanticType,
        caveats: match.component.kind === 'upgrade'
          ? ['神杖/魔晶本身是条件升级入口，英雄专属技能变化由英雄模型决定。']
          : []
      });
      continue;
    }

    const match = findSelectedComponent(profile, selection);
    if (!match) {
      warnings.push(`未找到组件: ${selection.componentId}`);
      continue;
    }

    const { ability, component } = match;
    const heroLevel = Number(request.heroLevel || 1);
    const abilityLevel = selectedAbilityLevel(selection, ability, component, heroLevel);
    const damage = resolveComponentDamage(component, abilityLevel, selection, profile, heroLevel);
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
      setupAttackCount: damage.setupAttackCount,
      attackDamage: damage.attackDamage,
      procDamage: damage.procDamage,
      attackFactorPct: damage.attackFactorPct,
      triggerCount: damage.triggerCount,
      targetMaxHealth: damage.targetMaxHealth,
      sourceDamage: damage.sourceDamage,
      attributeValue: damage.attributeValue,
      attributeMultiplier: damage.attributeMultiplier,
      caveats: component.caveats || []
    });
  }

  const raw = roundDamage(Object.values(byType).reduce((sum, entry) => sum + entry.raw, 0));
  const adjusted = roundDamage(Object.values(byType).reduce((sum, entry) => sum + entry.adjusted, 0));

  return {
    hero: profile.hero,
    heroLevel: Number(request.heroLevel || 1),
    enemyArmor: Number(request.enemyArmor ?? 0),
    enemyMagicResistancePercent: Number(request.enemyMagicResistancePercent ?? 25),
    effectiveEnemyArmor: params.enemyArmor,
    effectiveEnemyMagicResistancePercent: params.enemyMagicResistancePercent,
    itemModifiers,
    combatStats,
    combatEvents: components.filter((component) => component.kind === 'basic_attack'),
    semanticAssertions: combatAssertions,
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
