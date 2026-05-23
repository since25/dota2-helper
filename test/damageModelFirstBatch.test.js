const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDetails } = require('../dotaDataContext');
const { getHeroDamageModel } = require('../damageModels/registry');
const { getSemanticDefinition } = require('../damageModels/semantics');
const { resolveHeroDamageModel } = require('../damageModels/resolver');

const FIRST_BATCH = [
  'Slardar',
  'Sand King',
  'Queen of Pain',
  'Lion',
  'Lina',
  'Axe',
  'Shadow Fiend',
  'Phantom Assassin',
  'Faceless Void',
  'Venomancer'
];

const EXPECTED_SEMANTICS = {
  Slardar: {
    'Guardian Sprint': 'mobility.move_speed.percent',
    'Slithereen Crush': 'damage.instant',
    'Bash of the Deep': 'damage.attack_sequence_proc',
    'Seaborn Sentinel': 'modifier.attack_damage.percent',
    'Corrosive Haze': 'modifier.armor_reduction.flat'
  },
  'Sand King': {
    Burrowstrike: 'damage.instant',
    'Sand Storm': 'damage.sustained_dps',
    Stinger: 'damage.attack_bonus',
    'Caustic Finale': 'damage.death_trigger',
    Epicenter: 'damage.wave'
  },
  'Queen of Pain': {
    'Shadow Strike': 'damage.tick',
    Blink: 'mobility.cast_range.units',
    'Scream Of Pain': 'damage.instant',
    Succubus: 'defense.lifesteal.percent',
    'Sonic Wave': 'damage.instant'
  },
  Lion: {
    'Earth Spike': 'damage.instant',
    Hex: 'control.hex.seconds',
    'Mana Drain': 'resource.mana_drain_per_second',
    'To Hell and Back': 'modifier.spell_amplification.percent',
    'Finger of Death': 'damage.instant'
  },
  Lina: {
    'Dragon Slave': 'damage.instant',
    'Light Strike Array': 'damage.instant',
    'Fiery Soul': 'modifier.attack_speed.flat',
    'Flame Cloak': 'modifier.spell_amplification.percent',
    'Slow Burn': 'damage.source_damage_percent',
    'Laguna Blade': 'damage.instant'
  },
  Axe: {
    "Berserker's Call": 'control.taunt.seconds',
    'Battle Hunger': 'damage.sustained_dps',
    'Counter Helix': 'damage.instant',
    'Culling Blade': 'damage.instant',
    'One Man Army': 'modifier.attribute_conversion.percent'
  },
  'Shadow Fiend': {
    Shadowraze: 'damage.instant',
    'Feast of Souls': 'modifier.attack_speed.flat',
    'Presence of the Dark Lord': 'modifier.armor_reduction.flat',
    'Requiem of Souls': 'damage.instant',
    Necromastery: 'modifier.attack_damage.flat'
  },
  'Phantom Assassin': {
    'Stifling Dagger': 'damage.attack_bonus',
    'Phantom Strike': 'modifier.attack_speed.flat',
    Blur: 'mobility.move_speed.percent',
    'Fan of Knives': 'damage.percent_max_health',
    Immaterial: 'defense.evasion.percent',
    'Coup de Grace': 'modifier.crit.multiplier'
  },
  'Faceless Void': {
    'Time Walk': 'mobility.dash_range.units',
    'Time Dilation': 'damage.stack_scaling',
    'Time Lock': 'damage.attack_bonus',
    'Reverse Time Walk': 'window.buff_duration.seconds',
    'Distortion Field': 'modifier.projectile_speed_slow.percent',
    Chronosphere: 'control.stun.seconds'
  },
  Venomancer: {
    'Venomous Gale': 'damage.tick',
    Snakebite: 'damage.tick',
    'Plague Ward': 'summon.attack_damage',
    'Poison Sting': 'damage.sustained_dps',
    'Noxious Plague': 'damage.instant'
  }
};

const STACK_GROUP_BY_TYPE = {
  'modifier.armor_reduction.flat': 'armor_reduction',
  'modifier.attack_damage.flat': 'attack_damage',
  'modifier.attack_damage.percent': 'attack_damage',
  'modifier.attack_speed.flat': 'attack_speed',
  'modifier.crit.multiplier': 'critical_strike',
  'modifier.spell_amplification.percent': 'spell_amplification',
  'modifier.damage_amp.percent': 'damage_amplification',
  'modifier.attribute_conversion.percent': 'attribute_conversion',
  'modifier.projectile_speed_slow.percent': 'projectile_speed_slow',
  'defense.evasion.percent': 'evasion'
};

const CONDITION_INPUTS_BY_ABILITY = {
  'Slardar.Bash of the Deep': ['attack_count', 'hero_attack_damage'],
  'Sand King.Stinger': ['attack_count', 'hero_attack_damage'],
  'Sand King.Caustic Finale': ['target_death'],
  'Lina.Slow Burn': ['source_damage', 'burn_duration'],
  'Shadow Fiend.Necromastery': ['current_soul_count'],
  'Phantom Assassin.Stifling Dagger': ['hero_attack_damage'],
  'Phantom Assassin.Fan of Knives': ['enemy_max_health'],
  'Phantom Assassin.Coup de Grace': ['attack_count', 'crit_mode', 'hero_attack_damage'],
  'Faceless Void.Time Dilation': ['cooling_ability_count', 'active_duration'],
  'Faceless Void.Time Lock': ['attack_count', 'proc_chance'],
  'Venomancer.Plague Ward': ['ward_attack_count', 'ward_active_duration']
};

test('first batch hero models are registered', () => {
  for (const hero of FIRST_BATCH) {
    assert.equal(getHeroDamageModel(hero)?.hero, hero);
  }
});

test('first batch models contain at least one implemented ability', () => {
  for (const hero of FIRST_BATCH) {
    const model = getHeroDamageModel(hero);
    const implemented = Object.values(model.abilities).filter((entry) => entry.status === 'implemented');

    assert.equal(implemented.length > 0, true, `${hero} must have an implemented damage model`);
  }
});

test('first batch curated entries declare explicit semantic types', () => {
  for (const hero of FIRST_BATCH) {
    const model = getHeroDamageModel(hero);
    const expected = EXPECTED_SEMANTICS[hero];

    assert.deepEqual(Object.keys(model.abilities).sort(), Object.keys(expected).sort(), `${hero} model entries changed`);

    for (const [abilityName, expectedSemanticType] of Object.entries(expected)) {
      const entry = model.abilities[abilityName];
      const definition = getSemanticDefinition(expectedSemanticType);

      assert.equal(entry.semanticType, expectedSemanticType, `${hero}.${abilityName} must declare semanticType`);

      if (definition.category !== 'direct_damage') {
        assert.ok(entry.affects, `${hero}.${abilityName} must declare affects for ${expectedSemanticType}`);
      }

      if (STACK_GROUP_BY_TYPE[expectedSemanticType]) {
        assert.equal(
          entry.stackGroup,
          STACK_GROUP_BY_TYPE[expectedSemanticType],
          `${hero}.${abilityName} must declare stackGroup`
        );
      }

      const expectedConditionInputs = CONDITION_INPUTS_BY_ABILITY[`${hero}.${abilityName}`];
      if (expectedConditionInputs) {
        assert.deepEqual(
          entry.conditionInputs,
          expectedConditionInputs,
          `${hero}.${abilityName} must declare conditionInputs`
        );
      }
    }
  }
});

test('first batch resolved abilities expose expected semantic metadata', async () => {
  for (const hero of FIRST_BATCH) {
    const resolved = resolveHeroDamageModel(await getHeroDetails(hero));
    const expected = EXPECTED_SEMANTICS[hero];

    for (const [abilityName, expectedSemanticType] of Object.entries(expected)) {
      const resolvedAbilities = resolved.abilities.filter((ability) => ability.name === abilityName);

      assert.ok(resolvedAbilities.length > 0, `${hero}.${abilityName} must resolve from provider data`);

      for (const ability of resolvedAbilities) {
        const component = ability.components[0];
        assert.equal(component?.semantic?.type, expectedSemanticType, `${hero}.${abilityName} resolved semantic`);

        const expectedConditionInputs = CONDITION_INPUTS_BY_ABILITY[`${hero}.${abilityName}`];
        if (expectedConditionInputs) {
          assert.deepEqual(
            component.semantic.conditionInputs,
            expectedConditionInputs,
            `${hero}.${abilityName} resolved conditionInputs`
          );
        }
      }
    }
  }
});
