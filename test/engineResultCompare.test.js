const test = require('node:test');
const assert = require('node:assert/strict');

const { compareEngineResult } = require('../scripts/compare-engine-result');

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
