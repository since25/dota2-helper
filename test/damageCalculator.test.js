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

test('getHeroDamageProfile resolves Outworld Destroyer and Ringmaster from hero list names', async () => {
  const outworld = await getHeroDamageProfile('Outworld Destroyer');
  const ringmaster = await getHeroDamageProfile('Ringmaster');

  assert.equal(outworld.hero, 'Outworld Destroyer');
  assert.ok(outworld.abilities.length > 0);
  assert.equal(ringmaster.hero, 'Ringmaster');
  assert.ok(ringmaster.abilities.length > 0);
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

test('calculateDamageCombo supports basic attacks and runtime-dependent damage primitives', async () => {
  const basic = await calculateDamageCombo({
    hero: 'Queen of Pain',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'basic_attack',
        attackCount: 3,
        valueMode: 'theoretical'
      }
    ]
  });
  assert.equal(basic.components[0].kind, 'basic_attack');
  assert.equal(basic.components[0].attackCount, 3);
  assert.equal(basic.totals.raw > 0, true);

  const snapfire = await getHeroDamageProfile('Snapfire');
  const kisses = snapfire.abilities.find((ability) => ability.name === 'Mortimer Kisses');
  const impact = kisses.components.find((component) => component.kind === 'repeated_trigger');
  const repeated = await calculateDamageCombo({
    hero: 'Snapfire',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Mortimer Kisses',
        componentId: impact.id,
        abilityLevel: 1,
        valueMode: 'theoretical',
        triggerCount: 2
      }
    ]
  });
  assert.equal(repeated.components[0].raw, 360);

  const venomancer = await getHeroDamageProfile('Venomancer');
  const plague = venomancer.abilities.find((ability) => ability.name === 'Noxious Plague');
  const percentDot = plague.components.find((component) => component.kind === 'percent_health_dot');
  const percent = await calculateDamageCombo({
    hero: 'Venomancer',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Noxious Plague',
        componentId: percentDot.id,
        abilityLevel: 1,
        valueMode: 'theoretical',
        targetMaxHealth: 1000
      }
    ]
  });
  assert.equal(percent.components[0].raw, 80);

  const skywrath = await getHeroDamageProfile('Skywrath Mage');
  const bolt = skywrath.abilities.find((ability) => ability.name === 'Arcane Bolt').components[0];
  const attribute = await calculateDamageCombo({
    hero: 'Skywrath Mage',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Arcane Bolt',
        componentId: bolt.id,
        abilityLevel: 3,
        valueMode: 'theoretical',
        casterIntelligence: 50
      }
    ]
  });
  assert.equal(attribute.components[0].raw, 195);
});

test('calculateDamageCombo treats illusion summon attack values as attack-damage percent', async () => {
  const profile = await getHeroDamageProfile('Terrorblade');
  const image = profile.abilities.find((ability) => ability.name === 'Conjure Image');
  const component = image.components.find((entry) => entry.kind === 'summon_attack');
  const result = await calculateDamageCombo({
    hero: 'Terrorblade',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Conjure Image',
        componentId: component.id,
        abilityLevel: 1,
        valueMode: 'theoretical',
        attackCount: 3,
        attackDamage: 72
      }
    ]
  });

  assert.equal(result.components[0].raw, 54);
});

test('calculateDamageCombo totals Lich Frost Blast base and area damage on primary target', async () => {
  const profile = await getHeroDamageProfile('Lich');
  const frostBlast = profile.abilities.find((ability) => ability.name === 'Frost Blast');
  const selectedComponents = frostBlast.components.map((component) => ({
    sourceType: 'ability',
    abilityName: 'Frost Blast',
    componentId: component.id,
    abilityLevel: 2,
    valueMode: 'base'
  }));

  const result = await calculateDamageCombo({
    hero: 'Lich',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents
  });

  assert.equal(result.totals.raw, 200);
  assert.equal(result.totals.adjusted, 150);
  assert.deepEqual(result.components.map((entry) => entry.raw), [80, 120]);
});

test('getHeroDamageProfile exposes item damage and upgrade components', async () => {
  const profile = await getHeroDamageProfile('Lich');
  const dagon = profile.items.find((item) => item.key === 'dagon');
  const shard = profile.items.find((item) => item.key === 'aghanims_shard');

  assert.ok(dagon.components.some((component) => component.semanticType === 'damage.instant'));
  assert.ok(shard.components.some((component) => component.semanticType === 'upgrade.aghanims_shard'));
});

test('calculateDamageCombo supports item damage and armor modifiers', async () => {
  const result = await calculateDamageCombo({
    hero: 'Lich',
    heroLevel: 6,
    enemyArmor: 10,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'item',
        itemKey: 'desolator',
        componentId: 'desolator:modifier.armor.flat:corruption_armor'
      },
      {
        sourceType: 'item',
        itemKey: 'dagon',
        componentId: 'dagon:damage.instant:damage',
        value: 400
      }
    ]
  });

  assert.equal(result.itemModifiers.enemyArmorDelta, -6);
  assert.equal(result.effectiveEnemyArmor, 4);
  assert.equal(result.components.find((entry) => entry.name === 'dagon').raw, 400);
  assert.equal(result.totals.adjusted, 300);
});

test('calculateDamageCombo supports sustained item damage with duration', async () => {
  const result = await calculateDamageCombo({
    hero: 'Lich',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'item',
        itemKey: 'radiance',
        componentId: 'radiance:damage.sustained_dps:aura_damage',
        value: 60,
        activeDurationSeconds: 2
      }
    ]
  });

  assert.equal(result.components[0].raw, 120);
  assert.equal(result.components[0].adjusted, 90);
});

test('calculateDamageCombo rejects ability levels above the legal hero-level budget', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 1,
      enemyArmor: 0,
      enemyMagicResistancePercent: 0,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 4,
        valueMode: 'base'
      }]
    }),
    /Burrowstrike.*level 4.*hero level 1/
  );
});

test('calculateDamageCombo rejects explicit zero ability levels', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 1,
      enemyArmor: 0,
      enemyMagicResistancePercent: 0,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 0,
        valueMode: 'base'
      }]
    }),
    /Burrowstrike.*level 0.*hero level 1/
  );
});

test('calculateDamageCombo rejects non-numeric ability levels', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 1,
      enemyArmor: 0,
      enemyMagicResistancePercent: 0,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 'abc',
        valueMode: 'base'
      }]
    }),
    /Burrowstrike.*level NaN.*hero level 1/
  );
});

test('calculateDamageCombo rejects fractional numeric ability levels', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 3,
      enemyArmor: 0,
      enemyMagicResistancePercent: 0,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 1.5,
        valueMode: 'base'
      }]
    }),
    /Burrowstrike.*level 1\.5.*integer.*hero level 3/
  );
});

test('calculateDamageCombo rejects fractional string ability levels', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 3,
      enemyArmor: 0,
      enemyMagicResistancePercent: 0,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: '1.5',
        valueMode: 'base'
      }]
    }),
    /Burrowstrike.*level 1\.5.*integer.*hero level 3/
  );
});

test('calculateDamageCombo defaults null ability levels to the legal max', async () => {
  const result = await calculateDamageCombo({
    hero: 'Sand King',
    heroLevel: 5,
    enemyArmor: 0,
    enemyMagicResistancePercent: 0,
    selectedComponents: [{
      sourceType: 'ability',
      abilityName: 'Burrowstrike',
      componentId: 'Burrowstrike:instant_fixed:dmg',
      abilityLevel: null,
      valueMode: 'base'
    }]
  });

  assert.equal(result.components[0].abilityLevel, 3);
  assert.equal(result.components[0].raw, 220);
});

test('calculateDamageCombo rejects abilities unavailable at the hero level', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Lina',
      heroLevel: 5,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Laguna Blade',
        componentId: 'Laguna Blade:instant_fixed:damage',
        abilityLevel: 1,
        valueMode: 'base'
      }]
    }),
    /Laguna Blade.*hero level 5/
  );
});

test('calculateDamageCombo rejects reference-only ability components', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 6,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Caustic Finale',
        componentId: 'Caustic Finale:conditional:caustic_finale_damage_flat',
        abilityLevel: 1,
        valueMode: 'base'
      }]
    }),
    /Caustic Finale.*reference_only/
  );
});

test('calculateDamageCombo rejects unsupported ability components', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Lina',
      heroLevel: 6,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Slow Burn',
        componentId: 'Slow Burn:state_scaling:burn_damage_pct',
        abilityLevel: 1,
        valueMode: 'base'
      }]
    }),
    /Slow Burn.*unsupported/
  );
});
