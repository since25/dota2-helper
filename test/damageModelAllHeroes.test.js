const test = require('node:test');
const assert = require('node:assert/strict');

const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { getHeroDamageModel, listHeroDamageModels } = require('../damageModels/registry');

test('registry exposes a damage model for every canonical hero', () => {
  const models = listHeroDamageModels();

  assert.equal(models.length, CANONICAL_HERO_NAMES.length);

  for (const hero of CANONICAL_HERO_NAMES) {
    assert.equal(getHeroDamageModel(hero)?.hero, hero, `${hero} must have a damage model`);
  }
});

test('auto models classify Anti-Mage mana and mobility mechanics', () => {
  const model = getHeroDamageModel('Anti-Mage');

  assert.equal(model.source, 'auto');
  assert.equal(model.abilities['Mana Break'].semanticType, 'damage.mana_burn');
  assert.deepEqual(model.abilities['Mana Break'].conditionInputs, ['target_current_mana', 'attack_count']);

  assert.equal(model.abilities.Blink.semanticType, 'mobility.cast_range.units');
  assert.equal(model.abilities.Blink.affects, 'positioning');

  assert.equal(model.abilities['Mana Void'].semanticType, 'damage.percent_missing_mana');
  assert.deepEqual(model.abilities['Mana Void'].conditionInputs, ['target_missing_mana']);
});

test('auto models classify simple nukes and duration damage for later audit', () => {
  const crystalMaiden = getHeroDamageModel('Crystal Maiden');
  const zeus = getHeroDamageModel('Zeus');
  const jakiro = getHeroDamageModel('Jakiro');

  assert.equal(crystalMaiden.abilities['Crystal Nova'].model, 'instant_fixed');
  assert.equal(crystalMaiden.abilities['Crystal Nova'].damageKey, 'nova_damage');
  assert.equal(crystalMaiden.abilities.Frostbite.model, 'sustained_dps');
  assert.equal(crystalMaiden.abilities.Frostbite.damagePerSecondKey, 'damage_per_second');
  assert.equal(jakiro.abilities.Macropyre.model, 'sustained_dps');
  assert.equal(jakiro.abilities.Macropyre.damagePerSecondKey, 'damage');

  assert.equal(zeus.abilities['Arc Lightning'].model, 'instant_fixed');
  assert.equal(zeus.abilities['Arc Lightning'].damageKey, 'arc_damage');
  assert.equal(zeus.abilities["Thundergod's Wrath"].semanticType, 'damage.instant');
});

test('auto models keep scaling caveats explicit for first-pass audit', () => {
  const centaur = getHeroDamageModel('Centaur Warrunner');
  const primalBeast = getHeroDamageModel('Primal Beast');

  assert.equal(centaur.abilities.Retaliate.semanticType, 'damage.attribute_scaling');
  assert.ok(centaur.abilities.Retaliate.reason.includes('属性系数'));

  assert.equal(primalBeast.abilities.Trample.semanticType, 'damage.source_damage_percent');
  assert.deepEqual(primalBeast.abilities.Trample.conditionInputs, ['source_damage', 'hit_count']);
});
