const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MODEL_REVIEW_STATUSES,
  validateHeroDamageModel
} = require('../damageModels/schema');
const { listHeroDamageModels } = require('../damageModels/registry');

test('validateHeroDamageModel accepts reviewed metadata', () => {
  const model = validateHeroDamageModel({
    hero: 'Jakiro',
    review: {
      status: 'reviewed',
      reviewer: 'local',
      updatedAt: '2026-05-23',
      notes: ['Liquid Fire is sustained damage.']
    },
    abilities: {
      'Liquid Fire': {
        status: 'implemented',
        model: 'sustained_dps',
        damagePerSecondKey: 'damage',
        durationKey: 'abilityduration',
        semanticType: 'damage.sustained_dps'
      }
    }
  });

  assert.equal(MODEL_REVIEW_STATUSES.includes('reviewed'), true);
  assert.equal(model.review.status, 'reviewed');
});

test('validateHeroDamageModel rejects unknown review status', () => {
  assert.throws(
    () => validateHeroDamageModel({
      hero: 'Jakiro',
      review: { status: 'done' },
      abilities: {}
    }),
    /Jakiro\.review\.status/
  );
});

test('manual model files declare review metadata', () => {
  const manualModels = listHeroDamageModels().filter((model) => model.source !== 'auto');

  assert.ok(manualModels.length > 0);
  for (const model of manualModels) {
    assert.ok(model.review?.status, `${model.hero} must declare review.status`);
  }
});
