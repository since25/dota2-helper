const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDetails } = require('../dotaDataContext');
const { buildHeroPowerSpikes } = require('../powerSpikeContext');

test('buildHeroPowerSpikes calculates Queen of Pain level 6 burst with Sonic Wave', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Queen of Pain'));
  const level6 = spikes.find((spike) => spike.level === 6);

  assert.ok(level6);
  assert.ok(level6.skills.some((skill) => skill.name === 'Sonic Wave'));
  assert.equal(level6.damageByType.Pure, 325);
  assert.ok(level6.rawDamage >= 415);
  assert.ok(level6.estimatedAfterDefaultResistance > 0);
});

test('buildHeroPowerSpikes uses legal skill point budgets at level 3', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Drow Ranger'));
  const level3 = spikes.find((spike) => spike.level === 3);

  assert.ok(level3);
  assert.equal(level3.skills.reduce((sum, skill) => sum + skill.abilityLevel, 0), 3);
  assert.ok(!level3.skills.every((skill) => skill.abilityLevel === 2));
});

test('buildHeroPowerSpikes includes Lion Finger of Death at level 6', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Lion'));
  const level6 = spikes.find((spike) => spike.level === 6);

  assert.ok(level6.skills.some((skill) => skill.name === 'Finger of Death'));
  assert.ok(level6.rawDamage >= 600);
  assert.ok(level6.cooldownGate >= 100);
});

test('buildHeroPowerSpikes marks Centaur strength-scaling caveat', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Centaur Warrunner'));
  const caveats = spikes.flatMap((spike) => spike.caveats);

  assert.ok(caveats.some((text) => text.includes('属性系数')));
});

test('buildHeroPowerSpikes marks Jakiro duration damage caveat', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Jakiro'));
  const caveats = spikes.flatMap((spike) => spike.caveats);

  assert.ok(caveats.some((text) => text.includes('持续伤害')));
});

test('buildHeroPowerSpikes does not count Disruptor damage threshold as burst', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Disruptor'));
  const level6 = spikes.find((spike) => spike.level === 6);

  assert.ok(level6);
  assert.ok(!level6.skills.some((skill) => skill.name === 'Electromagnetic Repulsion'));
  assert.equal(level6.damageByType.Unknown, undefined);
  assert.equal(level6.rawDamage, 315);
});
