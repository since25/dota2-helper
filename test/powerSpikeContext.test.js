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

  if (level3) {
    assert.ok(level3.skills.reduce((sum, skill) => sum + skill.abilityLevel, 0) <= 3);
    assert.ok(level3.skills.filter((skill) => skill.abilityLevel === 2).length <= 1);
  }
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
  assert.equal(level6.rawDamage, 90);
  assert.ok(level6.situationalSkills.some((skill) => skill.name === 'Static Storm'));
});

test('buildHeroPowerSpikes counts Sand King level 5 direct burst without sustained or conditional damage', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Sand King'));
  const level5 = spikes.find((spike) => spike.level === 5);

  assert.ok(level5);
  assert.equal(level5.rawDamage, 220);
  assert.equal(level5.damageByType.Magical, 220);
  assert.equal(level5.estimatedAfterDefaultResistance, 165);
  assert.deepEqual(level5.skills.map((skill) => skill.name), ['Burrowstrike']);
  assert.ok(level5.situationalSkills.some((skill) => skill.name === 'Sand Storm'));
  assert.ok(level5.situationalSkills.some((skill) => skill.name === 'Stinger'));
  assert.ok(level5.situationalSkills.some((skill) => skill.name === 'Caustic Finale'));
});

test('buildHeroPowerSpikes separates Sand King fixed instant and theoretical sustained damage', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Sand King'));
  const level5 = spikes.find((spike) => spike.level === 5);

  assert.equal(level5.fixedInstantDamage.raw, 220);
  assert.equal(level5.fixedInstantDamage.afterDefaultResistance, 165);
  assert.deepEqual(level5.fixedInstantDamage.skills.map((skill) => skill.name), ['Burrowstrike']);

  const sandStorm = level5.situationalDamageRefs.find((skill) => skill.name === 'Sand Storm');
  assert.equal(sandStorm.kind, 'sustained');
  assert.equal(sandStorm.theoreticalTotal, 1680);
  assert.equal(sandStorm.totalFormula, 'duration * damagePerSecond');
  assert.equal(sandStorm.semantic.type, 'damage.sustained_dps');
  assert.equal(sandStorm.semantic.contextRoute, 'situational_damage');
});

test('buildHeroPowerSpikes exposes Epicenter as multi-wave theoretical damage', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Sand King'));
  const level6 = spikes.find((spike) => spike.level === 6);
  const epicenter = level6.situationalDamageRefs.find((skill) => skill.name === 'Epicenter');

  assert.equal(epicenter.kind, 'multi_wave');
  assert.equal(epicenter.theoreticalTotal, 720);
  assert.equal(epicenter.totalFormula, 'waveCount * damagePerWave');
});

test('buildHeroPowerSpikes exposes curated model metadata for situational damage', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Slardar'));
  const level5 = spikes.find((spike) => spike.level === 5);
  const bash = level5.situationalDamageRefs.find((skill) => skill.name === 'Bash of the Deep');

  assert.ok(bash);
  assert.equal(bash.modelSource, 'curated');
  assert.equal(bash.status, 'implemented');
  assert.equal(bash.model, 'attack_sequence');
  assert.ok(bash.caveats.some((text) => text.includes('按攻击次数触发')));
});

test('buildHeroPowerSpikes separates Slardar modifier references from damage references', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Slardar'));
  const level6 = spikes.find((spike) => spike.level === 6);

  assert.ok(!level6.situationalDamageRefs.some((skill) => skill.name === 'Guardian Sprint'));
  assert.ok(!level6.situationalDamageRefs.some((skill) => skill.name === 'Seaborn Sentinel'));
  assert.ok(!level6.situationalDamageRefs.some((skill) => skill.name === 'Corrosive Haze'));
  assert.ok(!level6.situationalDamageRefs.some((skill) => skill.damageType === 'Unknown'));

  const armorReduction = level6.modifierRefs.find((modifier) => modifier.name === 'Corrosive Haze');
  assert.equal(armorReduction.modifierType, 'armor_reduction');
  assert.equal(armorReduction.value, -10);
  assert.equal(armorReduction.affects, 'physical_damage');
  assert.equal(armorReduction.semantic.type, 'modifier.armor_reduction.flat');
  assert.equal(armorReduction.semantic.contextRoute, 'modifier_reference');
});
