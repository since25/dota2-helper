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
  assert.deepEqual(damage.damageByAbilityLevel, []);
  assert.ok(damage.caveats.some((text) => text.includes('目标状态')));
});

test('extractAbilityDamage does not treat Disruptor trigger threshold as damage', async () => {
  const damage = extractAbilityDamage(await getAbility('disruptor_electromagnetic_repulsion'));

  assert.equal(damage.name, 'Electromagnetic Repulsion');
  assert.deepEqual(damage.damageByAbilityLevel, []);
  assert.ok(damage.caveats.some((text) => text.includes('属性系数')));
});
