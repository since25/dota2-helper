const test = require('node:test');
const assert = require('node:assert/strict');
const { compareProviders } = require('../scripts/compare-data-providers');

test('compareProviders classifies core fixture fields', async () => {
  const report = await compareProviders();

  assert.ok(report.generatedAt);
  assert.ok(report.fixtures.some((fixture) => fixture.name === 'Rubick'));
  assert.ok(report.fixtures.some((fixture) => fixture.name === "Aghanim's Scepter"));
  assert.ok(report.differences.every((diff) =>
    ['same', 'datawrapper_richer', 'dotaconstants_only', 'conflict', 'missing_both'].includes(diff.classification)
  ));
});
