const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDamageModelCoverage } = require('../damageModels/coverage');
const { CANONICAL_HERO_NAMES } = require('../heroAliases');

test('buildDamageModelCoverage reports modeled and missing heroes', async () => {
  const report = await buildDamageModelCoverage();

  assert.equal(report.totalHeroes, CANONICAL_HERO_NAMES.length);
  assert.equal(report.modeledHeroes, CANONICAL_HERO_NAMES.length);
  assert.deepEqual(report.missingHeroModels, []);
  assert.ok(report.heroReports.some((entry) => entry.hero === 'Slardar'));
});

test('buildDamageModelCoverage reports missing ability entries for partial models', async () => {
  const report = await buildDamageModelCoverage();
  const slardar = report.heroReports.find((entry) => entry.hero === 'Slardar');

  assert.equal(slardar.hero, 'Slardar');
  assert.equal(slardar.implementedAbilities >= 2, true);
  assert.equal(Array.isArray(report.missingAbilityEntries), true);
});

test('buildDamageModelCoverage exposes semantic coverage gates', async () => {
  const report = await buildDamageModelCoverage();

  assert.equal(report.curatedHeroes, report.modeledHeroes);
  assert.equal(report.curatedAbilities, report.totalAbilities);
  assert.equal(report.semanticCompleteAbilities, report.curatedAbilities);
  assert.deepEqual(report.semanticMissingAbilityEntries, []);
  assert.equal(report.inferredAbilities, 0);
  assert.deepEqual(report.inferredFallbackAbilities, []);

  const slowBurn = report.unsupportedAbilityEntries.find((entry) =>
    entry.hero === 'Lina' && entry.ability === 'Slow Burn'
  );

  assert.ok(slowBurn);
  assert.equal(slowBurn.status, 'unsupported');
  assert.equal(slowBurn.semanticType, 'damage.source_damage_percent');
  assert.ok(slowBurn.reason.includes('上游伤害事件'));
});

test('buildDamageModelCoverage reports the all-reviewed manual model set', async () => {
  const report = await buildDamageModelCoverage();

  assert.equal(report.totalHeroes, CANONICAL_HERO_NAMES.length);
  assert.equal(report.manualReviewedHeroes, report.totalHeroes);
  assert.equal(report.autoOnlyHeroes, 0);
  assert.equal(
    report.manualReviewedHeroes + report.manualCandidateHeroes + report.autoOnlyHeroes,
    report.totalHeroes
  );
  assert.ok(report.heroReports.some((entry) =>
    entry.hero === 'Abaddon' && entry.modelSource === 'manual' && entry.reviewStatus === 'reviewed'
  ));
});
