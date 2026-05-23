const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDetails } = require('../dotaDataContext');
const { resolveHeroDamageModel } = require('../damageModels/resolver');

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
