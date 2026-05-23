const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDamageProfile } = require('../damageCalculator');
const { getHeroDamageModel } = require('../damageModels/registry');

const REVIEWED_BATCH_HEROES = [
  'Jakiro',
  'Viper',
  'Phoenix',
  'Leshrac',
  'Death Prophet',
  'Witch Doctor',
  'Ancient Apparition',
  'Venomancer'
];

test('batch sustained heroes are reviewed manual models', () => {
  for (const hero of REVIEWED_BATCH_HEROES) {
    const model = getHeroDamageModel(hero);
    assert.equal(model?.source, 'manual', `${hero} should be manual`);
    assert.equal(model?.review?.status, 'reviewed', `${hero} should be reviewed`);
  }
});

test('Jakiro reviewed model preserves sustained and tick metadata', async () => {
  const profile = await getHeroDamageProfile('Jakiro');
  const dualBreath = profile.abilities.find((ability) => ability.name === 'Dual Breath');
  const liquidFire = profile.abilities.find((ability) => ability.name === 'Liquid Fire');
  const macropyre = profile.abilities.find((ability) => ability.name === 'Macropyre');

  assert.equal(dualBreath.components[0].kind, 'sustained');
  assert.deepEqual(dualBreath.components[0].metadata.durationByAbilityLevel, [5, 5, 5, 5]);
  assert.equal(liquidFire.components[0].kind, 'sustained');
  assert.deepEqual(liquidFire.components[0].metadata.tickIntervalByAbilityLevel, [0.5, 0.5, 0.5, 0.5]);
  assert.equal(macropyre.components[0].kind, 'sustained');
});

test('first sustained batch exposes duration-controlled damage profiles', async () => {
  const expectations = [
    ['Viper', 'Viper Strike', [420, 660, 900]],
    ['Phoenix', 'Supernova', [360, 540, 720]],
    ['Leshrac', 'Diabolic Edict', [400, 720, 1040, 1360]],
    ['Death Prophet', 'Spirit Siphon', [150, 300, 450, 600]],
    ['Witch Doctor', 'Death Ward', [480, 720, 960]],
    ['Ancient Apparition', 'Ice Vortex', [60, 160, 300, 480]],
    ['Venomancer', 'Snakebite', [280, 360, 440, 520]]
  ];

  for (const [hero, abilityName, theoreticalTotal] of expectations) {
    const profile = await getHeroDamageProfile(hero);
    const ability = profile.abilities.find((entry) => entry.name === abilityName);
    assert.ok(ability, `${hero} ${abilityName} should be present`);
    assert.equal(ability.modelSource, 'curated', `${hero} ${abilityName} should come from curated model`);
    assert.deepEqual(ability.components[0].theoreticalTotalByAbilityLevel, theoreticalTotal);
  }
});

test('composite sustained batch uses correct instant, dot, and tick formulas', async () => {
  const expectations = [
    ['Ogre Magi', 'Ignite', 'sustained', [100, 180, 280, 400]],
    ['Pudge', 'Rot', 'sustained', []],
    ['Oracle', 'Purifying Flames', 'instant_fixed', []],
    ['Silencer', 'Arcane Curse', 'initial_plus_dot', [116, 184, 252, 320]],
    ['Venomancer', 'Venomous Gale', 'initial_plus_ticks', [75, 250, 425, 600]],
    ['Venomancer', 'Snakebite', 'initial_plus_ticks', [280, 360, 440, 520]],
    ['Wraith King', 'Wraithfire Blast', 'initial_plus_dot', [120, 180, 240, 300]],
    ['Warlock', 'Shadow Word', 'sustained', [150, 250, 350, 450]]
  ];

  for (const [hero, abilityName, kind, theoreticalTotal] of expectations) {
    const profile = await getHeroDamageProfile(hero);
    const ability = profile.abilities.find((entry) => entry.name === abilityName);
    assert.ok(ability, `${hero} ${abilityName} should be present`);
    const component = ability.components[0];
    assert.equal(component.kind, kind, `${hero} ${abilityName} kind`);
    assert.deepEqual(component.theoreticalTotalByAbilityLevel, theoreticalTotal, `${hero} ${abilityName} total`);
  }

  const oracle = await getHeroDamageProfile('Oracle');
  const purifyingFlames = oracle.abilities.find((entry) => entry.name === 'Purifying Flames').components[0];
  assert.equal(purifyingFlames.label, 'damage');
  assert.deepEqual(purifyingFlames.valuesByAbilityLevel, [90, 180, 270, 360]);
  assert.equal(purifyingFlames.metadata.healPerSecondKey, undefined);

  const venomancer = await getHeroDamageProfile('Venomancer');
  const plague = venomancer.abilities.find((entry) => entry.name === 'Noxious Plague');
  assert.equal(plague.components[0].kind, 'instant_fixed');
  assert.equal(plague.components[1].kind, 'percent_health_dot');
  assert.equal(plague.components[1].metadata.healthInput, 'target_max_health');
  assert.deepEqual(plague.components[1].theoreticalTotalByAbilityLevel, []);
});

test('Ogre Magi Fire Shield is shard-gated trigger damage, not default fixed burst', async () => {
  const profile = await getHeroDamageProfile('Ogre Magi');
  const fireShield = profile.abilities.find((entry) => entry.name === 'Fire Shield');

  assert.ok(fireShield);
  assert.equal(fireShield.components[0].kind, 'repeated_trigger');
  assert.equal(fireShield.components[0].countInFixedInstantTotal, false);
  assert.deepEqual(fireShield.components[0].valuesByAbilityLevel, [160]);
  assert.equal(fireShield.components[0].metadata.triggerCountInput, 'fireball_count');
  assert.deepEqual(fireShield.components[0].semantic.conditionInputs, ['has_aghanims_shard', 'fireball_count']);
});

test('Aghanim unlocked abilities are gated out of default fixed burst', async () => {
  const expectations = [
    ['Techies', 'Minefield Sign', 'repeated_trigger', ['has_aghanims_scepter', 'movement_trigger_count']],
    ['Tusk', 'Ice Shards', 'conditional_instant', ['has_aghanims_shard']],
    ['Tusk', 'Walrus Kick', 'conditional_instant', ['has_aghanims_scepter']],
    ['Earth Spirit', 'Enchant Remnant', 'conditional_instant', ['has_aghanims_shard']],
    ['Hoodwink', "Hunter's Boomerang", 'conditional_instant', ['has_aghanims_scepter']],
    ['Keeper of the Light', 'Will-O-Wisp', 'conditional_instant', ['has_aghanims_scepter']],
    ['Kunkka', 'Tidal Wave', 'conditional_instant', ['has_aghanims_shard']],
    ['Magnus', 'Horn Toss', 'conditional_instant', ['has_aghanims_shard']],
    ['Tinker', 'Warp Flare', 'conditional_instant', ['has_aghanims_shard']]
  ];

  for (const [hero, abilityName, kind, conditionInputs] of expectations) {
    const profile = await getHeroDamageProfile(hero);
    const ability = profile.abilities.find((entry) => entry.name === abilityName);

    assert.ok(ability, `${hero}.${abilityName} should be exposed`);
    assert.equal(ability.components[0].kind, kind, `${hero}.${abilityName} kind`);
    assert.equal(ability.components[0].countInFixedInstantTotal, false, `${hero}.${abilityName} default fixed burst`);
    assert.deepEqual(
      ability.components[0].semantic.conditionInputs,
      conditionInputs,
      `${hero}.${abilityName} condition inputs`
    );
  }
});
