const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDamageProfile } = require('../damageCalculator');
const { getHeroDamageModel } = require('../damageModels/registry');

test('Abaddon reviewed model counts Mist Coil damage_heal instead of self damage', async () => {
  const model = getHeroDamageModel('Abaddon');
  const profile = await getHeroDamageProfile('Abaddon');
  const mistCoil = profile.abilities.find((ability) => ability.name === 'Mist Coil');
  const component = mistCoil.components.find((entry) => entry.label === 'damage_heal');

  assert.equal(model.review.status, 'reviewed');
  assert.equal(component.kind, 'instant_fixed');
  assert.deepEqual(component.valuesByAbilityLevel, [95, 170, 245, 320]);
  assert.equal(component.countInFixedInstantTotal, true);
  assert.equal(mistCoil.components.some((entry) => entry.label === 'self_damage' && entry.countInFixedInstantTotal), false);
});

test('Abaddon model exposes Curse of Avernus as conditional sustained damage', async () => {
  const profile = await getHeroDamageProfile('Abaddon');
  const curse = profile.abilities.find((ability) => ability.name === 'Curse of Avernus');
  const component = curse.components.find((entry) => entry.label === 'curse_dps');

  assert.equal(component.kind, 'sustained');
  assert.deepEqual(component.valuesByAbilityLevel, [15, 25, 35, 45]);
  assert.deepEqual(component.metadata.durationByAbilityLevel, [2, 2, 2, 2]);
  assert.equal(component.metadata.condition, '需要普攻命中目标后触发。');
});
