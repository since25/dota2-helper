const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDamageProfile } = require('../damageCalculator');
const {
  buildLevelSixTrialRequest,
  compareTotals,
  evaluateExpected,
  summarize
} = require('../scripts/damage-level6-trial');

test('buildLevelSixTrialRequest uses level 6 skill framework and three attacks', async () => {
  const profile = await getHeroDamageProfile('Sand King');
  const request = buildLevelSixTrialRequest(profile);

  assert.equal(request.hero, 'Sand King');
  assert.equal(request.heroLevel, 6);
  assert.ok(request.skillPlan.some((entry) => entry.abilityName === 'Epicenter' && entry.abilityLevel === 1));
  assert.ok(request.skillPlan.some((entry) => entry.role === 'highest_basic' && entry.abilityLevel === 3));
  assert.ok(request.selectedComponents.some((entry) => entry.sourceType === 'basic_attack' && entry.attackCount === 3));
});

test('evaluateExpected independently totals a level 6 trial request', async () => {
  const profile = await getHeroDamageProfile('Queen of Pain');
  const request = buildLevelSixTrialRequest(profile);
  const expected = evaluateExpected(profile, request);

  assert.equal(expected.raw > 0, true);
  assert.equal(expected.adjusted > 0, true);
  assert.equal(Object.keys(expected.byType).length > 0, true);
});

test('compareTotals and summarize classify pass rates', () => {
  const comparison = compareTotals(
    { totals: { raw: 100, adjusted: 75 } },
    { raw: 100, adjusted: 75 },
    0.01
  );
  assert.equal(comparison.pass, true);
  assert.deepEqual(summarize([{ pass: true }, { pass: false }]), {
    total: 2,
    passCount: 1,
    failCount: 1,
    passRate: 0.5
  });
});
