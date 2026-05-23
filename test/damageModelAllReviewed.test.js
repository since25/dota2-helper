const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDamageModelCoverage } = require('../damageModels/coverage');

test('all canonical heroes are represented by reviewed manual damage models', async () => {
  const coverage = await buildDamageModelCoverage();

  assert.equal(coverage.modeledHeroes, coverage.totalHeroes);
  assert.equal(coverage.manualReviewedHeroes, coverage.totalHeroes);
  assert.equal(coverage.autoOnlyHeroes, 0);
  assert.deepEqual(
    coverage.heroReports
      .filter((hero) => hero.reviewStatus !== 'reviewed')
      .map((hero) => hero.hero),
    []
  );
});
