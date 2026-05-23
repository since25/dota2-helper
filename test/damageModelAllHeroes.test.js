const test = require('node:test');
const assert = require('node:assert/strict');

const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { getHeroDamageModel, listHeroDamageModels } = require('../damageModels/registry');
const { buildAutoHeroModel } = require('../damageModels/autoModels');

test('registry exposes a damage model for every canonical hero', () => {
  const models = listHeroDamageModels();

  assert.equal(models.length, CANONICAL_HERO_NAMES.length);

  for (const hero of CANONICAL_HERO_NAMES) {
    assert.equal(getHeroDamageModel(hero)?.hero, hero, `${hero} must have a damage model`);
  }
});

test('reviewed Anti-Mage model keeps mana and mobility mechanics explicit', () => {
  const model = getHeroDamageModel('Anti-Mage');

  assert.equal(model.source, 'manual');
  assert.equal(model.review.status, 'reviewed');
  assert.equal(model.abilities['Mana Break'].semanticType, 'damage.mana_burn');
  assert.deepEqual(model.abilities['Mana Break'].conditionInputs, ['target_current_mana', 'attack_count']);

  assert.equal(model.abilities.Blink.semanticType, 'mobility.cast_range.units');
  assert.equal(model.abilities.Blink.affects, 'positioning');

  assert.equal(model.abilities['Mana Void'].semanticType, 'damage.percent_missing_mana');
  assert.deepEqual(model.abilities['Mana Void'].conditionInputs, ['target_missing_mana']);
});

test('auto builder remains available for future patch bootstrapping', () => {
  const model = buildAutoHeroModel('Anti-Mage');

  assert.equal(model.source, 'auto');
  assert.equal(model.abilities['Mana Break'].semanticType, 'damage.mana_burn');
  assert.deepEqual(model.abilities['Mana Break'].conditionInputs, ['target_current_mana', 'attack_count']);
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

test('attack, crit, proc, illusion, and summon models require explicit combat-window inputs', () => {
  const expectations = [
    ['Sniper', 'Headshot', 'attack_modifier', ['attack_count', 'proc_mode', 'hero_attack_damage']],
    ['Riki', 'Blink Strike', 'attack_modifier', ['attack_count', 'hero_attack_damage']],
    ['Ursa', 'Fury Swipes', 'state_scaling', ['attack_count', 'stack_count', 'hero_attack_damage']],
    ['Troll Warlord', "Berserker's Rage", 'conditional_instant', ['attack_count', 'proc_mode']],
    ['Terrorblade', 'Conjure Image', 'summon_attack', ['illusion_attack_count', 'hero_attack_damage']],
    ['Phantom Lancer', 'Juxtapose', 'summon_attack', ['illusion_attack_count', 'hero_attack_damage']],
    ['Warlock', 'Chaotic Offering', 'summon_attack', ['summon_attack_count']],
    ['Wraith King', 'Bone Guard', 'summon_attack', ['summon_attack_count']]
  ];

  for (const [hero, abilityName, modelType, inputs] of expectations) {
    const ability = getHeroDamageModel(hero).abilities[abilityName];
    assert.equal(ability.model, modelType, `${hero}.${abilityName} model`);
    for (const input of inputs) {
      assert.ok(
        ability.conditionInputs?.includes(input),
        `${hero}.${abilityName} should include ${input}`
      );
    }
    if (['attack_modifier', 'conditional_instant'].includes(modelType)) {
      assert.notEqual(ability.defaultIncluded, true, `${hero}.${abilityName} should not be fixed-total included`);
    }
  }

  const paCrit = getHeroDamageModel('Phantom Assassin').abilities['Coup de Grace'];
  assert.equal(paCrit.model, 'chance_based');
  assert.deepEqual(paCrit.conditionInputs, ['attack_count', 'crit_mode', 'hero_attack_damage']);
  assert.notEqual(paCrit.defaultIncluded, true);
});

test('percent, attribute, resource, and movement-scaling heroes expose runtime inputs', () => {
  const od = getHeroDamageModel('Outworld Destroyer');
  assert.equal(od.abilities['Arcane Orb'].semanticType, 'damage.percent_max_mana');
  assert.deepEqual(od.abilities['Arcane Orb'].conditionInputs, ['caster_current_mana', 'attack_count']);
  assert.equal(od.abilities["Sanity's Eclipse"].semanticType, 'damage.attribute_scaling');
  assert.deepEqual(od.abilities["Sanity's Eclipse"].conditionInputs, ['caster_current_mana', 'target_current_mana']);

  const skywrath = getHeroDamageModel('Skywrath Mage');
  assert.equal(skywrath.abilities['Arcane Bolt'].model, 'attribute_scaling');
  assert.equal(skywrath.abilities['Arcane Bolt'].attributeInput, 'caster_intelligence');

  const pudge = getHeroDamageModel('Pudge');
  assert.equal(pudge.abilities.Dismember.model, 'sustained_dps');
  assert.deepEqual(pudge.abilities.Dismember.conditionInputs, ['caster_strength', 'active_duration']);

  const phoenix = getHeroDamageModel('Phoenix');
  assert.equal(phoenix.abilities['Sun Ray'].extraComponents[0].model, 'percent_health_dot');
  assert.equal(phoenix.abilities['Sun Ray'].extraComponents[0].healthInput, 'target_max_health');

  const zeus = getHeroDamageModel('Zeus');
  assert.equal(zeus.abilities['Static Field'].semanticType, 'damage.percent_current_health');
  assert.deepEqual(zeus.abilities['Static Field'].conditionInputs, ['enemy_current_health', 'spell_hit_count']);

  const techies = getHeroDamageModel('Techies');
  assert.equal(techies.abilities['M.A.D.'].semanticType, 'damage.percent_max_mana');
  assert.deepEqual(techies.abilities['M.A.D.'].conditionInputs, ['target_max_mana']);

  const spiritBreaker = getHeroDamageModel('Spirit Breaker');
  assert.equal(spiritBreaker.abilities['Greater Bash'].semanticType, 'damage.move_speed_scaling');
  assert.deepEqual(spiritBreaker.abilities['Greater Bash'].conditionInputs, ['move_speed', 'attack_count', 'proc_mode']);
});
