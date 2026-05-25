const test = require('node:test');
const assert = require('node:assert/strict');

const { compareEngineResult, compareEngineResults } = require('../scripts/compare-engine-result');

test('compareEngineResult passes when observed damage is within tolerance', () => {
  const result = compareEngineResult({
    fixture: {
      id: 'case1',
      expectedLocalModel: { totals: { adjusted: 100 } }
    },
    engineResult: {
      id: 'case1',
      engine: { observedDamage: 100.4 }
    },
    tolerance: { absolute: 1, percent: 0.02 }
  });

  assert.equal(result.pass, true);
  assert.equal(result.delta, 0.4);
});

test('compareEngineResult fails when observed damage exceeds tolerance', () => {
  const result = compareEngineResult({
    fixture: {
      id: 'case1',
      expectedLocalModel: { totals: { adjusted: 100 } }
    },
    engineResult: {
      id: 'case1',
      engine: { observedDamage: 110 }
    },
    tolerance: { absolute: 1, percent: 0.02 }
  });

  assert.equal(result.pass, false);
  assert.equal(result.delta, 10);
});

test('compareEngineResult passes attack-sequence samples within attack damage roll range', () => {
  const result = compareEngineResult({
    fixture: {
      id: 'slardar_bash',
      expectedLocalModel: {
        totals: { adjusted: 421 },
        combatStats: {
          attackDamage: { min: 65, max: 73 }
        },
        components: [{
          kind: 'attack_sequence',
          damageType: 'Physical',
          attackCount: 4,
          procDamage: 145
        }]
      }
    },
    engineResult: {
      id: 'slardar_bash',
      engine: {
        observedDamage: 415,
        targetArmor: 0,
        attackCount: 4
      }
    }
  });

  assert.equal(result.pass, true);
  assert.deepEqual(result.expectedRange, { min: 405, max: 437 });
});

test('compareEngineResult passes basic attack-window samples within attack damage roll range', () => {
  const result = compareEngineResult({
    fixture: {
      id: 'pa_shadow',
      expectedLocalModel: {
        totals: { adjusted: 184.38 },
        combatStats: {
          attackDamage: { min: 119, max: 121, average: 120 }
        },
        components: [{
          kind: 'basic_attack',
          damageType: 'Physical',
          raw: 295,
          attackCount: 1
        }]
      }
    },
    engineResult: {
      id: 'pa_shadow',
      engine: {
        observedDamage: 185,
        targetArmor: 10
      }
    }
  });

  assert.equal(result.pass, true);
  assert.deepEqual(result.expectedRange, { min: 183, max: 185 });
});

test('compareEngineResult keeps fixed sequence damage while ranging attack-window rolls', () => {
  const result = compareEngineResult({
    fixture: {
      id: 'pa_sequence',
      expectedLocalModel: {
        totals: { adjusted: 168.75 },
        combatStats: {
          attackDamage: { min: 109, max: 111, average: 110 }
        },
        components: [
          {
            kind: 'instant_fixed',
            damageType: 'Magical',
            adjusted: 100
          },
          {
            kind: 'basic_attack',
            damageType: 'Physical',
            raw: 110,
            adjusted: 68.75,
            attackCount: 1
          }
        ]
      }
    },
    engineResult: {
      id: 'pa_sequence',
      engine: {
        observedDamage: 170,
        targetArmor: 10
      }
    }
  });

  assert.equal(result.pass, true);
  assert.deepEqual(result.expectedRange, { min: 168, max: 170 });
});

test('compareEngineResult reports magic resistance unit drift when engine exposes target resistance', () => {
  const result = compareEngineResult({
    fixture: {
      id: 'magic_resistance_probe',
      target: { magicResistancePercent: 50 },
      expectedLocalModel: { totals: { adjusted: 200 } }
    },
    engineResult: {
      id: 'magic_resistance_probe',
      engine: {
        observedDamage: 200,
        targetMagicResistance: 0.5
      }
    }
  });

  assert.equal(result.pass, true);
  assert.equal(result.magicResistanceCheck.pass, false);
  assert.equal(result.magicResistanceCheck.expected, 50);
  assert.equal(result.magicResistanceCheck.observed, 0.5);
});

test('compareEngineResults summarizes batch fixture comparisons', () => {
  const report = compareEngineResults({
    fixture: {
      id: 'batch1',
      fixtures: [
        {
          id: 'case1',
          expectedLocalModel: { totals: { adjusted: 100 } }
        },
        {
          id: 'case2',
          expectedLocalModel: { totals: { adjusted: 50 } }
        }
      ]
    },
    engineResults: [
      { id: 'case1', engine: { observedDamage: 100 } },
      { id: 'case2', engine: { observedDamage: 60 } }
    ],
    tolerance: { absolute: 1, percent: 0.01 }
  });

  assert.equal(report.id, 'batch1');
  assert.equal(report.total, 2);
  assert.equal(report.passed, 1);
  assert.equal(report.failed, 1);
  assert.deepEqual(report.missingResultIds, []);
  assert.equal(report.results[1].pass, false);
});
