const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDamageProfile } = require('../damageCalculator');
const { getHeroDamageModel } = require('../damageModels/registry');

const SECOND_BATCH = [
  'Bane',
  'Batrider',
  'Crystal Maiden',
  'Earthshaker',
  'Lich',
  'Tidehunter',
  'Tinker',
  'Vengeful Spirit',
  'Zeus'
];

async function componentFor(hero, abilityName, label) {
  const profile = await getHeroDamageProfile(hero);
  const ability = profile.abilities.find((entry) => entry.name === abilityName);
  assert.ok(ability, `${hero}.${abilityName} should resolve`);
  const component = ability.components.find((entry) => entry.label === label);
  assert.ok(component, `${hero}.${abilityName}.${label} should resolve`);
  return component;
}

test('second batch hero models are manually reviewed', () => {
  for (const hero of SECOND_BATCH) {
    const model = getHeroDamageModel(hero);

    assert.equal(model?.hero, hero);
    assert.equal(model.review?.status, 'reviewed', `${hero} should be reviewed`);
  }
});

test('second batch sustained and multi-source abilities use the correct source fields', async () => {
  const enfeeble = await componentFor('Bane', 'Enfeeble', 'enfeeble_tick_damage');
  assert.equal(enfeeble.kind, 'sustained');
  assert.deepEqual(enfeeble.valuesByAbilityLevel, [12, 18, 24, 30]);
  assert.deepEqual(enfeeble.theoreticalTotalByAbilityLevel, [108, 162, 216, 270]);

  const flamebreakImpact = await componentFor('Batrider', 'Flamebreak', 'damage_impact');
  assert.equal(flamebreakImpact.kind, 'instant_fixed');
  assert.deepEqual(flamebreakImpact.valuesByAbilityLevel, [25, 50, 75, 100]);

  const flamebreakBurn = await componentFor('Batrider', 'Flamebreak', 'damage_per_second');
  assert.equal(flamebreakBurn.kind, 'sustained');
  assert.deepEqual(flamebreakBurn.theoreticalTotalByAbilityLevel, [50, 90, 140, 200]);

  const freezingField = await componentFor('Crystal Maiden', 'Freezing Field', 'damage');
  assert.equal(freezingField.kind, 'state_scaling');
  assert.deepEqual(freezingField.metadata.requiredInputs, ['active_duration', 'hit_count']);

  const echoInitial = await componentFor('Earthshaker', 'Echo Slam', 'echo_slam_initial_damage');
  assert.equal(echoInitial.kind, 'instant_fixed');
  assert.deepEqual(echoInitial.valuesByAbilityLevel, [100, 140, 180]);

  const echoPerUnit = await componentFor('Earthshaker', 'Echo Slam', 'echo_slam_echo_damage');
  assert.equal(echoPerUnit.kind, 'state_scaling');
  assert.deepEqual(echoPerUnit.valuesByAbilityLevel, [70, 90, 110]);
  assert.deepEqual(echoPerUnit.metadata.requiredInputs, ['nearby_unit_count']);

  const march = await componentFor('Tinker', 'March of the Machines', 'damage');
  assert.equal(march.kind, 'repeated_trigger');
  assert.equal(march.metadata.triggerCountInput, 'machine_hit_count');
});

test('second batch fixed burst fields keep known values', async () => {
  const frostBlastBase = await componentFor('Lich', 'Frost Blast', 'damage');
  assert.deepEqual(frostBlastBase.valuesByAbilityLevel, [40, 80, 120, 160]);

  const frostBlastArea = await componentFor('Lich', 'Frost Blast', 'aoe_damage');
  assert.deepEqual(frostBlastArea.valuesByAbilityLevel, [80, 120, 160, 200]);

  const chainFrost = await componentFor('Lich', 'Chain Frost', 'damage');
  assert.deepEqual(chainFrost.valuesByAbilityLevel, [250, 400, 550]);

  const ravage = await componentFor('Tidehunter', 'Ravage', 'dmg');
  assert.deepEqual(ravage.valuesByAbilityLevel, [275, 375, 475]);

  const magicMissile = await componentFor('Vengeful Spirit', 'Magic Missile', 'magic_missile_damage');
  assert.deepEqual(magicMissile.valuesByAbilityLevel, [85, 170, 255, 340]);

  const thundergodsWrath = await componentFor('Zeus', "Thundergod's Wrath", 'damage');
  assert.deepEqual(thundergodsWrath.valuesByAbilityLevel, [300, 475, 650]);
});

test('count-based multi-hit abilities preserve runtime hit-count inputs', async () => {
  const sandKing = await getHeroDamageProfile('Sand King');
  const epicenter = sandKing.abilities.find((entry) => entry.name === 'Epicenter').components[0];
  assert.equal(epicenter.kind, 'multi_wave');
  assert.deepEqual(epicenter.metadata.waveCountByAbilityLevel, [12, 16, 20]);

  const pulverize = await componentFor('Primal Beast', 'Pulverize', 'damage');
  assert.equal(pulverize.kind, 'repeated_trigger');
  assert.equal(pulverize.metadata.triggerCountInput, 'pulse_count');

  const swashbuckle = await componentFor('Pangolier', 'Swashbuckle', 'damage');
  assert.equal(swashbuckle.kind, 'repeated_trigger');
  assert.equal(swashbuckle.metadata.triggerCountInput, 'strike_count');

  const wards = await componentFor('Shadow Shaman', 'Mass Serpent Ward', 'ward_damage_tooltip');
  assert.equal(wards.kind, 'summon_attack');
  assert.equal(wards.metadata.attackCountInput, 'ward_attack_count');

  const kissesImpact = await componentFor('Snapfire', 'Mortimer Kisses', 'damage_per_impact');
  assert.equal(kissesImpact.kind, 'repeated_trigger');
  assert.equal(kissesImpact.metadata.triggerCountInput, 'kiss_impact_count');

  const kissesBurn = await componentFor('Snapfire', 'Mortimer Kisses', 'burn_damage');
  assert.equal(kissesBurn.kind, 'sustained');
  assert.deepEqual(kissesBurn.metadata.durationByAbilityLevel, [3.5, 3.5, 3.5]);

  const cask = await componentFor('Witch Doctor', 'Paralyzing Cask', 'base_damage');
  assert.equal(cask.kind, 'repeated_trigger');
  assert.equal(cask.metadata.triggerCountInput, 'bounce_count');
  assert.deepEqual(cask.metadata.bounceBonusDamageByAbilityLevel, [20, 20, 20, 20]);
});
