const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const {
  AUDIT_BATCHES,
  buildSemanticAudit,
  findSuspiciousMappings
} = require('../scripts/semantic-audit');

test('buildSemanticAudit reports coverage totals and Slardar semantic completion', async () => {
  const report = await buildSemanticAudit({ hero: 'Slardar' });

  assert.equal(report.scope.hero, 'Slardar');
  assert.equal(report.totals.modeledHeroCount, 1);
  assert.equal(report.totals.modeledAbilityCount >= 5, true);
  assert.equal(report.totals.modelEntriesMissingSemanticType, 0);
  assert.equal(Array.isArray(report.rawNumericFieldsNotReferenced), true);

  const slardar = report.heroReports.find((entry) => entry.hero === 'Slardar');
  assert.ok(slardar);
  assert.equal(slardar.modelEntriesMissingSemanticType.length, 0);
  assert.ok(slardar.rawNumericFieldsNotReferenced.some((field) => field.ability === 'Slithereen Crush'));
});

test('buildSemanticAudit reports every visible ability as modeled', async () => {
  const report = await buildSemanticAudit({ all: true });

  assert.equal(report.scope.all, true);
  assert.equal(report.totals.totalHeroCount, report.totals.modeledHeroCount);
  assert.equal(report.totals.unmodeledVisibleAbilityCount, 0);
  assert.equal(report.totals.suspiciousMappingCount, 0);
  assert.deepEqual(report.unmodeledVisibleAbilities, []);
  assert.deepEqual(report.suspiciousMappings, []);
});

test('findSuspiciousMappings flags percent values routed as flat damage', () => {
  const suspicious = findSuspiciousMappings([{
    hero: 'Test Hero',
    ability: 'Odd Strike',
    key: 'bonus_damage_pct',
    value: '12%',
    semanticType: 'damage.instant',
    semanticUnit: 'flat',
    contextRoute: 'fixed_damage'
  }]);

  assert.deepEqual(suspicious, [{
    hero: 'Test Hero',
    ability: 'Odd Strike',
    key: 'bonus_damage_pct',
    reason: 'percent-like field is routed as flat damage',
    semanticType: 'damage.instant',
    contextRoute: 'fixed_damage'
  }]);
});

test('semantic audit CLI emits machine-readable JSON', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/semantic-audit.js', '--hero', 'Slardar', '--json'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  const report = JSON.parse(output);

  assert.equal(report.scope.hero, 'Slardar');
  assert.equal(report.totals.modeledHeroCount, 1);
});

test('semantic audit exposes mechanism-first batch groups', async () => {
  const report = await buildSemanticAudit({ all: true });

  assert.equal(AUDIT_BATCHES.length, 8);
  assert.deepEqual(AUDIT_BATCHES.map((batch) => batch.id), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  assert.equal(report.auditBatches.length, 8);
  assert.ok(report.auditBatches[0].description.includes('direct-damage'));
  assert.ok(report.auditBatches[2].description.includes('bashes'));
});

test('hero audit workflow document covers checklist and batch groups', () => {
  const workflowPath = path.join(process.cwd(), 'docs/dota2-hero-model-audit-workflow.md');
  const content = fs.readFileSync(workflowPath, 'utf8');

  assert.ok(content.includes('## Per-Hero Review Checklist'));
  assert.ok(content.includes('Confirm visible abilities from provider data'));
  assert.ok(content.includes('Batch A'));
  assert.ok(content.includes('Batch H'));
  assert.ok(content.includes('Run semantic audit'));
});
