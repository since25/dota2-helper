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
