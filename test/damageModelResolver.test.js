const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDetails } = require('../dotaDataContext');
const { resolveHeroDamageModel } = require('../damageModels/resolver');

function resolveFixtureHero(abilities, modelAbilities) {
  const registryPath = require.resolve('../damageModels/registry');
  const resolverPath = require.resolve('../damageModels/resolver');
  const registry = require(registryPath);
  const originalGetHeroDamageModel = registry.getHeroDamageModel;
  delete require.cache[resolverPath];
  registry.getHeroDamageModel = () => ({
    hero: 'Primitive Fixture',
    abilities: modelAbilities
  });
  try {
    return require('../damageModels/resolver').resolveHeroDamageModel({
      name: 'Primitive Fixture',
      abilities
    });
  } finally {
    registry.getHeroDamageModel = originalGetHeroDamageModel;
    delete require.cache[resolverPath];
    require('../damageModels/resolver');
  }
}

function fixtureAbility(name, rawAttributes, damageType = 'Magical') {
  return {
    name,
    displayName: name,
    damageType,
    damage: [],
    manaCost: [],
    cooldown: [],
    rawAttributes: Object.entries(rawAttributes).map(([key, value]) => ({ key, value }))
  };
}

test('resolveHeroDamageModel returns curated Slardar Bash component', async () => {
  const details = await getHeroDetails('Slardar');
  const resolved = resolveHeroDamageModel(details);
  const bash = resolved.abilities.find((ability) => ability.name === 'Bash of the Deep');
  const component = bash.components.find((entry) => entry.kind === 'attack_sequence');

  assert.equal(bash.modelSource, 'curated');
  assert.equal(component.status, 'implemented');
  assert.equal(component.model, 'attack_sequence');
  assert.deepEqual(component.valuesByAbilityLevel, [35, 90, 145, 200]);
  assert.deepEqual(component.metadata.attackCountByAbilityLevel, [3, 3, 3, 3]);
});

test('resolveHeroDamageModel supports semantic primitive components', () => {
  const resolved = resolveFixtureHero([
    fixtureAbility('Initial Dot', {
      initial_damage: [50, 100],
      dps: [10, 20],
      duration: [3, 4]
    }),
    fixtureAbility('Initial Ticks', {
      initial_damage: [40],
      tick_damage: [12],
      tick_interval: [0.5],
      duration: [2]
    }),
    fixtureAbility('Repeated Trigger', {
      damage: [30, 60]
    }),
    fixtureAbility('Summon Attack', {
      attack_damage: [25, 50]
    }, 'Physical'),
    fixtureAbility('Percent Dot', {
      percent_damage: [1.5, 2],
      duration: [4, 5]
    }),
    fixtureAbility('Attribute Scaling', {
      base_damage: [20, 40],
      int_multiplier: [1.2, 1.8]
    }),
    fixtureAbility('Conditional Instant', {
      damage: [80, 160]
    })
  ], {
    'Initial Dot': {
      status: 'implemented',
      model: 'initial_plus_dot',
      initialDamageKey: 'initial_damage',
      damagePerSecondKey: 'dps',
      durationKey: 'duration',
      semanticType: 'damage.instant'
    },
    'Initial Ticks': {
      status: 'implemented',
      model: 'initial_plus_ticks',
      initialDamageKey: 'initial_damage',
      tickDamageKey: 'tick_damage',
      tickIntervalKey: 'tick_interval',
      durationKey: 'duration',
      semanticType: 'damage.tick'
    },
    'Repeated Trigger': {
      status: 'implemented',
      model: 'repeated_trigger',
      damageKey: 'damage',
      triggerCountInput: 'hit_count',
      semanticType: 'damage.instant'
    },
    'Summon Attack': {
      status: 'implemented',
      model: 'summon_attack',
      attackDamageKey: 'attack_damage',
      attackCountInput: 'ward_attack_count',
      semanticType: 'summon.attack_damage'
    },
    'Percent Dot': {
      status: 'implemented',
      model: 'percent_health_dot',
      percentDamageKey: 'percent_damage',
      durationKey: 'duration',
      healthInput: 'target_max_health',
      semanticType: 'damage.percent_max_health'
    },
    'Attribute Scaling': {
      status: 'implemented',
      model: 'attribute_scaling',
      baseDamageKey: 'base_damage',
      attributeMultiplierKey: 'int_multiplier',
      attributeInput: 'caster_intelligence',
      semanticType: 'damage.attribute_scaling'
    },
    'Conditional Instant': {
      status: 'implemented',
      model: 'conditional_instant',
      damageKey: 'damage',
      conditionInputs: ['target_is_stunned'],
      semanticType: 'damage.instant'
    }
  });

  const components = Object.fromEntries(resolved.abilities.map((ability) => [
    ability.name,
    ability.components[0]
  ]));

  assert.deepEqual(components['Initial Dot'].theoreticalTotalByAbilityLevel, [80, 180]);
  assert.deepEqual(components['Initial Ticks'].theoreticalTotalByAbilityLevel, [88]);
  assert.equal(components['Repeated Trigger'].metadata.triggerCountInput, 'hit_count');
  assert.equal(components['Summon Attack'].metadata.attackCountInput, 'ward_attack_count');
  assert.deepEqual(components['Summon Attack'].valuesByAbilityLevel, [25, 50]);
  assert.equal(components['Percent Dot'].metadata.healthInput, 'target_max_health');
  assert.deepEqual(components['Percent Dot'].theoreticalTotalByAbilityLevel, []);
  assert.deepEqual(components['Attribute Scaling'].valuesByAbilityLevel, [20, 40]);
  assert.deepEqual(components['Attribute Scaling'].metadata.attributeMultiplierByAbilityLevel, [1.2, 1.8]);
  assert.equal(components['Conditional Instant'].countInFixedInstantTotal, false);
  assert.deepEqual(components['Conditional Instant'].semantic.conditionInputs, ['target_is_stunned']);
});

test('resolveHeroDamageModel keeps Slardar non-damage modifiers out of Unknown damage', async () => {
  const details = await getHeroDetails('Slardar');
  const resolved = resolveHeroDamageModel(details);
  const sprint = resolved.abilities.find((ability) => ability.name === 'Guardian Sprint').components[0];
  const sentinel = resolved.abilities.find((ability) => ability.name === 'Seaborn Sentinel').components[0];
  const haze = resolved.abilities.find((ability) => ability.name === 'Corrosive Haze').components[0];

  assert.equal(sprint.damageType, '');
  assert.equal(sprint.metadata.isDamageReference, false);
  assert.equal(sprint.metadata.modifierType, 'move_speed_pct');
  assert.equal(sprint.semantic.type, 'mobility.move_speed.percent');
  assert.equal(sprint.semantic.contextRoute, 'modifier_reference');

  assert.equal(sentinel.damageType, '');
  assert.equal(sentinel.metadata.isDamageReference, false);
  assert.equal(sentinel.metadata.modifierType, 'attack_damage_pct');
  assert.deepEqual(sentinel.valuesByAbilityLevel, [11.4]);
  assert.equal(sentinel.semantic.type, 'modifier.attack_damage.percent');
  assert.equal(sentinel.semantic.contextRoute, 'modifier_reference');

  assert.equal(haze.damageType, '');
  assert.equal(haze.metadata.isDamageReference, false);
  assert.equal(haze.metadata.modifierType, 'armor_reduction');
  assert.deepEqual(haze.valuesByAbilityLevel, [-10, -15, -20]);
  assert.equal(haze.semantic.type, 'modifier.armor_reduction.flat');
  assert.deepEqual(haze.semantic.affects, ['physical_damage']);
});

test('resolveHeroDamageModel does not treat positioning range references as move speed percent', async () => {
  const details = await getHeroDetails('Queen of Pain');
  const resolved = resolveHeroDamageModel(details);
  const blink = resolved.abilities.find((ability) => ability.name === 'Blink').components[0];

  assert.equal(blink.damageType, '');
  assert.equal(blink.metadata.isDamageReference, false);
  assert.equal(blink.metadata.modifierType, 'positioning_range');
  assert.equal(blink.semantic.type, 'mobility.cast_range.units');
  assert.equal(blink.semantic.label, '施法距离');
  assert.deepEqual(blink.valuesByAbilityLevel, [1075, 1150, 1225, 1300]);
});

test('resolveHeroDamageModel returns curated Sand King duration and wave components', async () => {
  const details = await getHeroDetails('Sand King');
  const resolved = resolveHeroDamageModel(details);
  const sandStorm = resolved.abilities.find((ability) => ability.name === 'Sand Storm');
  const epicenter = resolved.abilities.find((ability) => ability.name === 'Epicenter');

  assert.equal(sandStorm.modelSource, 'curated');
  assert.equal(sandStorm.components[0].kind, 'sustained');
  assert.deepEqual(sandStorm.components[0].metadata.durationByAbilityLevel, [16, 20, 24, 28]);
  assert.deepEqual(sandStorm.components[0].theoreticalTotalByAbilityLevel, [480, 1000, 1680, 2520]);
  assert.equal(sandStorm.components[0].semantic.type, 'damage.sustained_dps');
  assert.equal(sandStorm.components[0].semantic.contextRoute, 'situational_damage');

  assert.equal(epicenter.modelSource, 'curated');
  assert.equal(epicenter.components[0].kind, 'multi_wave');
  assert.deepEqual(epicenter.components[0].metadata.waveCountByAbilityLevel, [12, 16, 20]);
  assert.deepEqual(epicenter.components[0].theoreticalTotalByAbilityLevel, [720, 1120, 1600]);
  assert.equal(epicenter.components[0].semantic.type, 'damage.wave');
});

test('resolveHeroDamageModel exposes attack-scaling metadata for Phantom Assassin dagger', async () => {
  const details = await getHeroDetails('Phantom Assassin');
  const resolved = resolveHeroDamageModel(details);
  const dagger = resolved.abilities.find((ability) => ability.name === 'Stifling Dagger');
  const component = dagger.components.find((entry) => entry.kind === 'attack_modifier');

  assert.equal(dagger.modelSource, 'curated');
  assert.deepEqual(component.valuesByAbilityLevel, [65, 70, 75, 80]);
  assert.deepEqual(component.metadata.attackFactorPctByAbilityLevel, [30, 45, 60, 75]);
  assert.equal(component.totalFormula, 'baseDamage + attackDamage * attackFactorPct');
});

test('resolveHeroDamageModel allows curated damage references to override missing damage type', async () => {
  const details = await getHeroDetails('Phantom Assassin');
  const resolved = resolveHeroDamageModel(details);
  const coup = resolved.abilities.find((ability) => ability.name === 'Coup de Grace');
  const component = coup.components[0];

  assert.equal(component.metadata.isDamageReference, true);
  assert.equal(component.damageType, 'Physical');
  assert.equal(component.semantic.type, 'modifier.crit.multiplier');
  assert.equal(component.semantic.contextRoute, 'modifier_reference');
});

test('resolveHeroDamageModel fixes P0 wrong-damage semantic mappings', async () => {
  const pugna = resolveHeroDamageModel(await getHeroDetails('Pugna'));
  const netherBlast = pugna.abilities.find((ability) => ability.name === 'Nether Blast').components[0];
  assert.equal(netherBlast.sourceKey, 'blast_damage');
  assert.deepEqual(netherBlast.valuesByAbilityLevel, [95, 170, 245, 320]);

  const voidSpirit = resolveHeroDamageModel(await getHeroDetails('Void Spirit'));
  const astralStep = voidSpirit.abilities.find((ability) => ability.name === 'Astral Step').components[0];
  assert.equal(astralStep.sourceKey, 'pop_damage');
  assert.deepEqual(astralStep.valuesByAbilityLevel, [130, 230, 330]);

  const winterWyvern = resolveHeroDamageModel(await getHeroDetails('Winter Wyvern'));
  const arcticBurn = winterWyvern.abilities.find((ability) => ability.name === 'Arctic Burn').components[0];
  assert.equal(arcticBurn.model, 'percent_health_dot');
  assert.equal(arcticBurn.sourceKey, 'percent_damage');
  assert.equal(arcticBurn.metadata.healthInput, 'target_current_health');
  assert.deepEqual(arcticBurn.theoreticalTotalByAbilityLevel, []);

  const pudge = resolveHeroDamageModel(await getHeroDetails('Pudge'));
  const meatShield = pudge.abilities.find((ability) => ability.name === 'Meat Shield').components[0];
  assert.equal(meatShield.semantic.category, 'defensive_modifier');
  assert.equal(meatShield.countInFixedInstantTotal, false);

  const treant = resolveHeroDamageModel(await getHeroDetails('Treant Protector'));
  const livingArmor = treant.abilities.find((ability) => ability.name === 'Living Armor').components[0];
  assert.equal(livingArmor.semantic.category, 'defensive_modifier');
  assert.equal(livingArmor.countInFixedInstantTotal, false);

  const visage = resolveHeroDamageModel(await getHeroDetails('Visage'));
  const cloak = visage.abilities.find((ability) => ability.name === "Gravekeeper's Cloak").components[0];
  assert.equal(cloak.semantic.category, 'defensive_modifier');
  assert.equal(cloak.countInFixedInstantTotal, false);
});
