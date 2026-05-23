const test = require('node:test');
const assert = require('node:assert/strict');

const {
  adjustDamageByType,
  calculateDamageCombo,
  getHeroDamageProfile,
  physicalMultiplier
} = require('../damageCalculator');

test('physicalMultiplier applies Dota armor approximation', () => {
  assert.equal(physicalMultiplier(0), 1);
  assert.equal(Math.round(physicalMultiplier(10) * 10000) / 10000, 0.625);
});

test('adjustDamageByType applies manual resistance inputs', () => {
  assert.equal(adjustDamageByType(100, 'Magical', { enemyMagicResistancePercent: 25, enemyArmor: 0 }), 75);
  assert.equal(adjustDamageByType(100, 'Pure', { enemyMagicResistancePercent: 25, enemyArmor: 0 }), 100);
  assert.equal(adjustDamageByType(100, 'Physical', { enemyMagicResistancePercent: 25, enemyArmor: 0 }), 100);
});

test('getHeroDamageProfile exposes Sand King components and theoretical totals', async () => {
  const profile = await getHeroDamageProfile('Sand King');
  const sandStorm = profile.abilities.find((ability) => ability.name === 'Sand Storm');
  const component = sandStorm.components.find((entry) => entry.kind === 'sustained');

  assert.equal(profile.hero, 'Sand King');
  assert.equal(sandStorm.displayName, '沙尘暴（Sand Storm）');
  assert.deepEqual(component.theoreticalTotalByAbilityLevel, [480, 1000, 1680, 2520]);
  assert.equal(component.totalFormula, 'duration * damagePerSecond');
});

test('getHeroDamageProfile preserves Jakiro Liquid Fire and Frost duration data', async () => {
  const profile = await getHeroDamageProfile('Jakiro');
  const liquidFire = profile.abilities.find((ability) => ability.name === 'Liquid Fire');
  const liquidFrost = profile.abilities.find((ability) => ability.name === 'Liquid Frost');
  const fireComponent = liquidFire.components[0];
  const frostComponent = liquidFrost.components[0];

  assert.equal(fireComponent.kind, 'sustained');
  assert.deepEqual(fireComponent.metadata.durationByAbilityLevel, [5, 5, 5, 5]);
  assert.deepEqual(fireComponent.metadata.tickIntervalByAbilityLevel, [0.5, 0.5, 0.5, 0.5]);
  assert.deepEqual(fireComponent.theoreticalTotalByAbilityLevel, [75, 125, 175, 225]);

  assert.equal(frostComponent.kind, 'instant_fixed');
  assert.deepEqual(frostComponent.metadata.durationByAbilityLevel, [5, 5, 5, 5]);
  assert.deepEqual(frostComponent.metadata.tickIntervalByAbilityLevel, [0.5, 0.5, 0.5, 0.5]);
});

test('calculateDamageCombo totals Sand King Burrowstrike and Sand Storm theoretical damage', async () => {
  const result = await calculateDamageCombo({
    hero: 'Sand King',
    heroLevel: 5,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 3,
        valueMode: 'base'
      },
      {
        sourceType: 'ability',
        abilityName: 'Sand Storm',
        componentId: 'Sand Storm:sustained:sand_storm_damage',
        abilityLevel: 3,
        valueMode: 'theoretical'
      }
    ]
  });

  assert.equal(result.totals.raw, 1900);
  assert.equal(result.totals.adjusted, 1425);
  assert.equal(result.components.find((entry) => entry.name === 'Burrowstrike').raw, 220);
  assert.equal(result.components.find((entry) => entry.name === 'Sand Storm').raw, 1680);
});

test('calculateDamageCombo uses active duration for sustained damage', async () => {
  const result = await calculateDamageCombo({
    hero: 'Sand King',
    heroLevel: 5,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 3,
        valueMode: 'base'
      },
      {
        sourceType: 'ability',
        abilityName: 'Sand Storm',
        componentId: 'Sand Storm:sustained:sand_storm_damage',
        abilityLevel: 3,
        valueMode: 'theoretical',
        activeDurationSeconds: 2
      }
    ]
  });

  const sandStorm = result.components.find((entry) => entry.name === 'Sand Storm');

  assert.equal(result.totals.raw, 360);
  assert.equal(result.totals.adjusted, 270);
  assert.equal(sandStorm.raw, 140);
  assert.equal(sandStorm.activeDurationSeconds, 2);
  assert.equal(sandStorm.formula, 'activeDurationSeconds * damagePerSecond');
});

test('getHeroDamageProfile exposes Chinese ability names from data feed localization', async () => {
  const profile = await getHeroDamageProfile('Slardar');
  const bash = profile.abilities.find((ability) => ability.name === 'Bash of the Deep');

  assert.ok(bash);
  assert.equal(bash.displayName, '深海重击（Bash of the Deep）');
});

test('calculateDamageCombo totals Slardar attack-count passive sequence', async () => {
  const result = await calculateDamageCombo({
    hero: 'Slardar',
    heroLevel: 5,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Bash of the Deep',
        componentId: 'Bash of the Deep:attack_sequence:bonus_damage',
        abilityLevel: 3,
        valueMode: 'theoretical'
      }
    ]
  });

  const bash = result.components.find((entry) => entry.name === 'Bash of the Deep');

  assert.equal(result.totals.raw, 352);
  assert.equal(result.totals.adjusted, 352);
  assert.equal(bash.raw, 352);
  assert.equal(bash.attackCount, 3);
  assert.equal(bash.attackDamage, 69);
  assert.equal(bash.procDamage, 145);
  assert.equal(bash.formula, 'attackCount * attackDamage + procDamage');
});

test('calculateDamageCombo totals Phantom Assassin dagger with attack scaling', async () => {
  const result = await calculateDamageCombo({
    hero: 'Phantom Assassin',
    heroLevel: 5,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Stifling Dagger',
        componentId: 'Stifling Dagger:attack_modifier:base_damage',
        abilityLevel: 3,
        valueMode: 'theoretical'
      }
    ]
  });

  const dagger = result.components.find((entry) => entry.name === 'Stifling Dagger');

  assert.equal(result.totals.raw, 117.6);
  assert.equal(result.totals.adjusted, 117.6);
  assert.equal(dagger.attackDamage, 71);
  assert.equal(dagger.attackFactorPct, 60);
  assert.equal(dagger.formula, 'baseDamage + attackDamage * attackFactorPct');
});
