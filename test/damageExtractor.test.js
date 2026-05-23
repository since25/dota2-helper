const test = require('node:test');
const assert = require('node:assert/strict');

const { extractAbilityDamage } = require('../damageExtractor');

async function getAbility(name) {
  const dc = await import('dotaconstants');
  return dc.abilities[name];
}

test('extractAbilityDamage reads fixed magical damage, cooldown, and mana cost', async () => {
  const damage = extractAbilityDamage(await getAbility('queenofpain_scream_of_pain'));

  assert.equal(damage.name, 'Scream Of Pain');
  assert.equal(damage.damageType, 'Magical');
  assert.deepEqual(damage.damageByAbilityLevel, [90, 175, 260, 345]);
  assert.deepEqual(damage.manaCostByAbilityLevel, [120, 120, 120, 120]);
  assert.deepEqual(damage.cooldownByAbilityLevel, [7.5, 7, 6.5, 6]);
  assert.deepEqual(damage.caveats, []);
});

test('extractAbilityDamage reads pure ultimate damage arrays', async () => {
  const damage = extractAbilityDamage(await getAbility('queenofpain_sonic_wave'));

  assert.equal(damage.name, 'Sonic Wave');
  assert.equal(damage.damageType, 'Pure');
  assert.deepEqual(damage.damageByAbilityLevel, [325, 475, 625]);
  assert.deepEqual(damage.manaCostByAbilityLevel, [250, 400, 550]);
  assert.deepEqual(damage.cooldownByAbilityLevel, [110, 95, 80]);
});

test('extractAbilityDamage marks stat-scaling damage caveats', async () => {
  const damage = extractAbilityDamage(await getAbility('centaur_double_edge'));

  assert.equal(damage.name, 'Double Edge');
  assert.deepEqual(damage.damageByAbilityLevel, [120, 180, 240, 300]);
  assert.ok(damage.caveats.some((text) => text.includes('属性系数')));
});

test('extractAbilityDamage marks duration damage caveats', async () => {
  const damage = extractAbilityDamage(await getAbility('jakiro_macropyre'));

  assert.equal(damage.name, 'Macropyre');
  assert.deepEqual(damage.damageByAbilityLevel, [100, 150, 200]);
  assert.ok(damage.caveats.some((text) => text.includes('持续伤害')));
});

test('extractAbilityDamage does not treat target-state scaling as fixed burst', async () => {
  const damage = extractAbilityDamage(await getAbility('antimage_mana_void'));

  assert.equal(damage.name, 'Mana Void');
  assert.equal(damage.countsAsFixedBurst, false);
  assert.ok(damage.components.some((component) => component.kind === 'target_state'));
  assert.ok(damage.caveats.some((text) => text.includes('目标状态')));
});

test('extractAbilityDamage does not treat Disruptor trigger threshold as damage', async () => {
  const damage = extractAbilityDamage(await getAbility('disruptor_electromagnetic_repulsion'));

  assert.equal(damage.name, 'Electromagnetic Repulsion');
  assert.deepEqual(damage.damageByAbilityLevel, []);
  assert.ok(damage.caveats.some((text) => text.includes('属性系数')));
});

test('extractAbilityDamage reads Sand King Burrowstrike direct damage from ability dmg field', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_burrowstrike'));

  assert.equal(damage.abilityName, 'Burrowstrike');
  assert.equal(damage.name, 'Burrowstrike');
  assert.deepEqual(damage.damageByAbilityLevel, [80, 150, 220, 290]);
  assert.equal(damage.countsAsFixedBurst, true);
  assert.deepEqual(damage.components.map((component) => ({
    kind: component.kind,
    growthKind: component.growthKind,
    valuesByAbilityLevel: component.valuesByAbilityLevel,
    countInFixedInstantTotal: component.countInFixedInstantTotal
  })), [{
    kind: 'instant_fixed',
    growthKind: 'non_growth',
    valuesByAbilityLevel: [80, 150, 220, 290],
    countInFixedInstantTotal: true
  }]);
});

test('extractAbilityDamage classifies Sand King non-burst damage separately', async () => {
  const sandStorm = extractAbilityDamage(await getAbility('sandking_sand_storm'));
  const causticFinale = extractAbilityDamage(await getAbility('sandking_caustic_finale'));
  const epicenter = extractAbilityDamage(await getAbility('sandking_epicenter'));

  assert.deepEqual(sandStorm.damageByAbilityLevel, [30, 50, 70, 90]);
  assert.equal(sandStorm.countsAsFixedBurst, false);
  assert.ok(sandStorm.caveats.some((text) => text.includes('持续伤害')));
  assert.deepEqual(sandStorm.components.find((component) => component.kind === 'sustained').metadata.durationByAbilityLevel, [16, 20, 24, 28]);
  assert.equal(sandStorm.components.find((component) => component.kind === 'sustained').formula.type, 'duration_times_dps');

  assert.deepEqual(causticFinale.damageByAbilityLevel, [17]);
  assert.equal(causticFinale.countsAsFixedBurst, false);
  assert.ok(causticFinale.caveats.some((text) => text.includes('条件触发')));

  assert.deepEqual(epicenter.damageByAbilityLevel, [60, 70, 80]);
  assert.equal(epicenter.countsAsFixedBurst, false);
  assert.ok(epicenter.components.some((component) => component.kind === 'multi_wave'));
  assert.ok(epicenter.caveats.some((text) => text.includes('多波伤害')));
});

test('extractAbilityDamage calculates Sand Storm theoretical totals', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_sand_storm'));
  const component = damage.components.find((entry) => entry.kind === 'sustained');

  assert.ok(component);
  assert.deepEqual(component.theoreticalTotalByAbilityLevel, [480, 1000, 1680, 2520]);
  assert.equal(component.totalFormula, 'duration * damagePerSecond');
});

test('extractAbilityDamage tolerates sustained labels without duration metadata', () => {
  const damage = extractAbilityDamage({
    dname: 'Immolation',
    dmg_type: 'Magical',
    attrib: [
      { key: 'damage_per_second', header: 'DAMAGE PER SECOND:', value: ['10', '20', '30', '40'] }
    ]
  });
  const component = damage.components.find((entry) => entry.kind === 'sustained');

  assert.ok(component);
  assert.deepEqual(component.valuesByAbilityLevel, [10, 20, 30, 40]);
  assert.deepEqual(component.theoreticalTotalByAbilityLevel, []);
  assert.equal(component.totalFormula, '');
});

test('extractAbilityDamage calculates Epicenter pulse totals', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_epicenter'));
  const component = damage.components.find((entry) => entry.kind === 'multi_wave');

  assert.ok(component);
  assert.deepEqual(component.valuesByAbilityLevel, [60, 70, 80]);
  assert.deepEqual(component.metadata.waveCountByAbilityLevel, [12, 16, 20]);
  assert.deepEqual(component.theoreticalTotalByAbilityLevel, [720, 1120, 1600]);
  assert.equal(component.totalFormula, 'waveCount * damagePerWave');
});

test('extractAbilityDamage identifies fixed attack-count passive procs', async () => {
  const damage = extractAbilityDamage(await getAbility('slardar_bash'));
  const component = damage.components.find((entry) => entry.kind === 'attack_sequence');

  assert.equal(damage.name, 'Bash of the Deep');
  assert.ok(component);
  assert.deepEqual(component.valuesByAbilityLevel, [35, 90, 145, 200]);
  assert.deepEqual(component.metadata.attackCountByAbilityLevel, [3, 3, 3, 3]);
  assert.equal(component.totalFormula, 'attackCount * attackDamage + procDamage');
  assert.equal(component.countInFixedInstantTotal, false);
  assert.ok(damage.caveats.some((text) => text.includes('攻击次数')));
});
