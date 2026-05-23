const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MODEL_STATUSES,
  MODEL_TYPES,
  validateHeroDamageModel
} = require('../damageModels/schema');
const { getHeroDamageModel } = require('../damageModels/registry');

test('validateHeroDamageModel accepts Slardar attack sequence model', () => {
  const model = {
    hero: 'Slardar',
    abilities: {
      'Bash of the Deep': {
        status: 'implemented',
        model: 'attack_sequence',
        procDamageKey: 'bonus_damage',
        attackCountKey: 'attack_count',
        formula: 'attackCount * attackDamage + procDamage',
        defaultIncluded: true
      }
    }
  };

  assert.equal(MODEL_STATUSES.includes('implemented'), true);
  assert.equal(MODEL_TYPES.includes('attack_sequence'), true);
  assert.deepEqual(validateHeroDamageModel(model), model);
});

test('validateHeroDamageModel rejects implemented attack sequence without procDamageKey', () => {
  assert.throws(
    () => validateHeroDamageModel({
      hero: 'Slardar',
      abilities: {
        'Bash of the Deep': {
          status: 'implemented',
          model: 'attack_sequence',
          attackCountKey: 'attack_count'
        }
      }
    }),
    /Bash of the Deep.*procDamageKey/
  );
});

test('validateHeroDamageModel rejects reference numeric entries without semantic metadata', () => {
  assert.throws(
    () => validateHeroDamageModel({
      hero: 'Slardar',
      abilities: {
        'Corrosive Haze': {
          status: 'reference_only',
          model: 'debuff_reference',
          valueKey: 'armor_reduction',
          affects: 'physical_damage'
        }
      }
    }),
    /Corrosive Haze.*semanticType/
  );
});

test('validateHeroDamageModel rejects unknown semantic types', () => {
  assert.throws(
    () => validateHeroDamageModel({
      hero: 'Slardar',
      abilities: {
        'Corrosive Haze': {
          status: 'reference_only',
          model: 'debuff_reference',
          valueKey: 'armor_reduction',
          semanticType: 'modifier.not_real',
          affects: 'physical_damage'
        }
      }
    }),
    /Corrosive Haze.*Unknown semantic type: modifier\.not_real/
  );
});

test('validateHeroDamageModel accepts legacy modifierType as semantic compatibility metadata', () => {
  const model = {
    hero: 'Slardar',
    abilities: {
      'Corrosive Haze': {
        status: 'reference_only',
        model: 'debuff_reference',
        valueKey: 'armor_reduction',
        modifierType: 'armor_reduction',
        affects: 'physical_damage'
      }
    }
  };

  assert.equal(validateHeroDamageModel(model), model);
});

test('registry resolves Slardar model by canonical hero name', () => {
  const model = getHeroDamageModel('Slardar');

  assert.equal(model.hero, 'Slardar');
  assert.equal(model.abilities['Bash of the Deep'].model, 'attack_sequence');
});
