const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyDamageAmp,
  applyMagicResistance,
  expectedCritMultiplier,
  physicalMultiplier,
  resolveCritMultiplier
} = require('../combat/rules');

test('physicalMultiplier matches Dota armor approximation for positive zero and negative armor', () => {
  assert.equal(physicalMultiplier(0), 1);
  assert.equal(Number(physicalMultiplier(10).toFixed(6)), 0.625);
  assert.equal(Number(physicalMultiplier(-10).toFixed(6)), 1.375);
});

test('applyMagicResistance multiplies incoming damage multipliers', () => {
  const result = applyMagicResistance(1000, [
    { source: 'base', resistancePercent: 25 },
    { source: 'cloak', resistancePercent: 20 },
    { source: 'debuff', resistancePercent: -30 }
  ]);

  assert.equal(result.adjusted, 780);
  assert.deepEqual(result.stages.map((stage) => stage.source), ['base', 'cloak', 'debuff']);
});

test('applyDamageAmp applies spell amp then generic damage amp as visible stages', () => {
  const result = applyDamageAmp(100, {
    spellAmpPercent: 20,
    damageAmpPercent: 10,
    damageType: 'Magical'
  });

  assert.equal(result.adjusted, 132);
  assert.deepEqual(result.stages.map((stage) => stage.source), ['spell_amp', 'damage_amp']);
});

test('resolveCritMultiplier chooses forced crit source deterministically', () => {
  const crits = [
    { source: 'greater_crit', multiplierPercent: 225, chancePercent: 30 },
    { source: 'hero', multiplierPercent: 450, chancePercent: 15 }
  ];

  assert.deepEqual(resolveCritMultiplier(crits, { forceCritSource: 'hero' }), {
    source: 'hero',
    multiplier: 4.5,
    mode: 'forced'
  });
});

test('expectedCritMultiplier computes independent expected value without random simulation', () => {
  const crits = [{ source: 'greater_crit', multiplierPercent: 225, chancePercent: 30 }];
  assert.equal(expectedCritMultiplier(crits), 1.375);
});
