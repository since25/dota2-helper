# Full Hero Skill Extraction Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first maintainable data-maintenance milestone for hero skill extraction: reviewed model status, honest coverage gates, richer audit pages, naming fixes, and reviewed Batch 1 sustained/tick heroes.

**Architecture:** Keep `autoModels` as a candidate generator, but add explicit manual review status to model files and reporting. Extend coverage/audit exports to show manual-vs-auto status and raw provider fields, then convert the Batch 1 sustained/tick heroes into reviewed manual model files.

**Tech Stack:** CommonJS modules, Node built-in test runner, Express API, `dotaconstants`, existing `damageModels` resolver, existing audit page export script.

---

## File Structure

- Modify `damageModels/schema.js`: add `review.status` validation and exported review status constants.
- Modify `damageModels/registry.js`: separate manual models, auto candidate models, and model source metadata.
- Modify `damageModels/coverage.js`: report manual reviewed/candidate/auto-only counts honestly.
- Modify `scripts/semantic-audit.js`: expose raw numeric fields and model source metadata for audit pages.
- Modify `scripts/export-damage-audit-pages.js`: include raw provider fields, manual model, auto candidate model, diff, and unreferenced numeric fields.
- Modify `heroAliases.js` or `dotaDataContext.js`: fix Outworld Destroyer/Ringmaster API name compatibility after tracing current canonical/provider mismatch.
- Create or modify Batch 1 model files:
  - `damageModels/heroes/jakiro.js`
  - `damageModels/heroes/viper.js`
  - `damageModels/heroes/phoenix.js`
  - `damageModels/heroes/leshrac.js`
  - `damageModels/heroes/death_prophet.js`
  - `damageModels/heroes/witch_doctor.js`
  - `damageModels/heroes/ancient_apparition.js`
  - keep existing `damageModels/heroes/venomancer.js`, update review metadata if needed.
- Add tests:
  - `test/damageModelReviewStatus.test.js`
  - `test/damageAuditPages.test.js`
  - `test/damageModelBatchSustained.test.js`
  - targeted additions to `test/damageModelCoverage.test.js`, `test/semanticAudit.test.js`, and `test/damageCalculator.test.js`.
- Update docs:
  - `README.md`
  - `docs/dota2-hero-model-audit-workflow.md`

---

### Task 1: Add Manual Review Status To Model Schema

**Files:**
- Modify: `damageModels/schema.js`
- Modify: existing manual hero files under `damageModels/heroes/`
- Test: `test/damageModelReviewStatus.test.js`

- [ ] **Step 1: Write failing review status tests**

Create `test/damageModelReviewStatus.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/damageModelReviewStatus.test.js
```

Expected: fail because `MODEL_REVIEW_STATUSES` and `review` validation do not exist, and current manual files lack `review`.

- [ ] **Step 3: Implement review status validation**

Modify `damageModels/schema.js`:

```js
const MODEL_REVIEW_STATUSES = ['candidate', 'in_review', 'reviewed', 'needs_patch_update'];

function validateReviewMetadata(model) {
  if (!model.review) return model;
  if (!MODEL_REVIEW_STATUSES.includes(model.review.status)) {
    throw new Error(`${model.hero}.review.status has unsupported status: ${model.review.status}`);
  }
  if (model.review.updatedAt !== undefined) {
    assertString(model.review.updatedAt, `${model.hero}.review.updatedAt`);
  }
  if (model.review.reviewer !== undefined) {
    assertString(model.review.reviewer, `${model.hero}.review.reviewer`);
  }
  if (model.review.notes !== undefined && !Array.isArray(model.review.notes)) {
    throw new Error(`${model.hero}.review.notes must be an array`);
  }
  return model;
}
```

Call `validateReviewMetadata(model)` inside `validateHeroDamageModel` after the `hero` string check and export `MODEL_REVIEW_STATUSES`.

- [ ] **Step 4: Add review metadata to current manual files**

For each existing manual hero file in `damageModels/heroes/`, add:

```js
review: {
  status: 'reviewed',
  reviewer: 'local',
  updatedAt: '2026-05-23',
  notes: ['Initial manually curated model from damage model maintenance work.']
},
```

Keep ability entries unchanged.

- [ ] **Step 5: Verify tests pass**

Run:

```bash
npm test -- test/damageModelReviewStatus.test.js test/damageModelSchema.test.js
```

Expected: all tests pass.

---

### Task 2: Make Coverage Report Honest About Manual vs Auto

**Files:**
- Modify: `damageModels/registry.js`
- Modify: `damageModels/coverage.js`
- Modify: `scripts/damage-coverage.js` if text output needs fields
- Test: `test/damageModelCoverage.test.js`

- [ ] **Step 1: Add failing coverage assertions**

Modify `test/damageModelCoverage.test.js` with:

```js
test('buildDamageModelCoverage separates reviewed manual models from auto-only models', async () => {
  const report = await buildDamageModelCoverage();

  assert.equal(report.totalHeroes, 126);
  assert.ok(report.manualReviewedHeroes >= 10);
  assert.ok(report.autoOnlyHeroes > 0);
  assert.equal(report.manualReviewedHeroes + report.manualCandidateHeroes + report.autoOnlyHeroes, report.totalHeroes);
  assert.ok(report.heroReports.some((entry) => entry.hero === 'Jakiro' && entry.modelSource === 'auto'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/damageModelCoverage.test.js
```

Expected: fail because these report fields do not exist.

- [ ] **Step 3: Preserve model source in registry**

Modify `damageModels/registry.js` so manual models keep their file source and auto models are marked explicitly:

```js
function withSource(model, source) {
  return { ...model, source };
}

const MANUAL_HERO_MODELS = [
  axe,
  facelessVoid,
  lina,
  lion,
  phantomAssassin,
  queenOfPain,
  sandKing,
  shadowFiend,
  slardar,
  venomancer
].map((model) => validateHeroDamageModel(withSource(model, model.source || 'manual')));

const AUTO_HERO_MODELS = buildAutoHeroModels(MANUAL_HERO_NAMES)
  .map((model) => validateHeroDamageModel(withSource(model, 'auto')));
```

Keep `getHeroDamageModel` and `listHeroDamageModels` unchanged.

- [ ] **Step 4: Add coverage counters**

Modify `damageModels/coverage.js` totals:

```js
const totals = {
  totalAbilities: 0,
  curatedAbilities: 0,
  semanticCompleteAbilities: 0,
  implementedAbilities: 0,
  referenceOnlyAbilities: 0,
  ignoredAbilities: 0,
  unsupportedAbilities: 0,
  inferredAbilities: 0,
  manualReviewedHeroes: 0,
  manualCandidateHeroes: 0,
  autoOnlyHeroes: 0,
  reviewedAbilities: 0,
  candidateAbilities: 0
};
```

For each hero model:

```js
const modelSource = model?.source || 'manual';
const reviewStatus = model?.review?.status || (modelSource === 'auto' ? 'candidate' : 'candidate');
if (modelSource === 'auto') totals.autoOnlyHeroes += 1;
else if (reviewStatus === 'reviewed') totals.manualReviewedHeroes += 1;
else totals.manualCandidateHeroes += 1;
counts.modelSource = modelSource;
counts.reviewStatus = reviewStatus;
```

For each ability entry:

```js
if (reviewStatus === 'reviewed' && modelSource !== 'auto') {
  counts.reviewedAbilities += 1;
  totals.reviewedAbilities += 1;
} else {
  counts.candidateAbilities += 1;
  totals.candidateAbilities += 1;
}
```

- [ ] **Step 5: Verify coverage test passes**

Run:

```bash
npm test -- test/damageModelCoverage.test.js
npm run damage:coverage
```

Expected: tests pass and JSON shows manual reviewed vs auto-only counts.

---

### Task 3: Fix Outworld Destroyer And Ringmaster Damage API Compatibility

**Files:**
- Inspect/modify: `heroAliases.js`, `dotaDataContext.js`, `damageModels/autoModels.js`, `dataProviders/dotaconstants.js` if present
- Test: `test/damageCalculator.test.js`

- [ ] **Step 1: Add failing API/profile tests**

Modify `test/damageCalculator.test.js`:

```js
test('getHeroDamageProfile resolves Outworld Destroyer and Ringmaster from hero list names', async () => {
  const outworld = await getHeroDamageProfile('Outworld Destroyer');
  const ringmaster = await getHeroDamageProfile('Ringmaster');

  assert.equal(outworld.hero, 'Outworld Destroyer');
  assert.equal(Array.isArray(outworld.abilities), true);
  assert.equal(ringmaster.hero, 'Ringmaster');
  assert.equal(Array.isArray(ringmaster.abilities), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/damageCalculator.test.js
```

Expected: fail with `Unknown hero: Outworld Destroyer` and/or `Unknown hero: Ringmaster`.

- [ ] **Step 3: Trace canonical-to-provider name mapping**

Run:

```bash
node - <<'NODE'
const { heroes, hero_abilities } = require('dotaconstants');
for (const hero of Object.values(heroes)) {
  if (/outworld|obsidian|ringmaster/i.test(`${hero.localized_name} ${hero.name}`)) {
    console.log(hero);
    console.log(hero_abilities[hero.name]);
  }
}
NODE
```

Expected: identify the provider hero names and whether abilities exist.

- [ ] **Step 4: Implement mapping fix**

If provider uses a legacy localized name for Outworld Destroyer, add an alias in `heroAliases.js` so `normalizeHeroName('Outworld Destroyer')` resolves to the provider-backed canonical. If provider has no Ringmaster data, keep `Ringmaster` in API output only if `getHeroDetails('Ringmaster')` can return a profile with an empty ability list and explicit `dataMissing` metadata.

The minimal acceptable behavior for this task is:

```js
{
  hero: 'Ringmaster',
  displayName: 'Ringmaster',
  abilities: [],
  dataMissing: true,
  reason: 'Provider does not include visible ability data for Ringmaster.'
}
```

Do not let `getHeroDamageProfile` throw for heroes returned by `/api/heroes`.

- [ ] **Step 5: Verify tests and export**

Run:

```bash
npm test -- test/damageCalculator.test.js
npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest --strict
```

Expected: test passes. Strict export should pass if both heroes now produce valid pages; if Ringmaster source data is genuinely absent, strict export may still fail only if the implementation chooses to keep missing data as an error. The preferred outcome is valid empty profile with explicit missing-data reason.

---

### Task 4: Enhance Audit Page Data For Manual Review

**Files:**
- Modify: `scripts/export-damage-audit-pages.js`
- Modify: `scripts/semantic-audit.js`
- Test: `test/damageAuditPages.test.js`

- [ ] **Step 1: Add failing HTML assertions for raw fields and candidate model**

Modify `test/damageAuditPages.test.js`:

```js
test('renderHeroHtml shows raw fields, manual model, auto candidate, and unreferenced fields', () => {
  const html = renderHeroHtml({
    hero: 'Jakiro',
    displayName: '杰奇洛（Jakiro）',
    review: { status: 'reviewed' },
    rawAbilities: [{
      name: 'Liquid Fire',
      fields: [
        { key: 'damage', header: 'BURN DAMAGE:', value: ['15', '25', '35', '45'] },
        { key: 'tick_rate', header: 'TICK RATE:', value: '0.5' }
      ]
    }],
    audit: {
      autoCandidate: {
        abilities: {
          'Liquid Fire': { model: 'sustained_dps', damagePerSecondKey: 'damage' }
        }
      },
      unreferencedRawNumericFields: [
        { ability: 'Liquid Fire', key: 'radius', value: '300' }
      ],
      suspiciousMappings: []
    },
    abilities: [{
      name: 'Liquid Fire',
      displayName: '液态火（Liquid Fire）',
      components: []
    }]
  }, { generatedAt: '2026-05-23T00:00:00.000Z' });

  assert.match(html, /原始字段/);
  assert.match(html, /BURN DAMAGE/);
  assert.match(html, /自动候选/);
  assert.match(html, /未引用数值字段/);
  assert.match(html, /radius/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/damageAuditPages.test.js
```

Expected: fail because these sections are not rendered.

- [ ] **Step 3: Add raw field and audit sections to HTML**

In `scripts/export-damage-audit-pages.js`, add helpers:

```js
function renderRawFields(rawAbilities = []) {
  if (!rawAbilities.length) return '';
  return `<section class="panel"><h2>原始字段</h2>${rawAbilities.map((ability) => `
    <h3>${escapeHtml(ability.name)}</h3>
    <table><tbody>${(ability.fields || []).map((field) => `
      <tr><td><code>${escapeHtml(field.key)}</code></td><td>${escapeHtml(field.header || '')}</td><td>${escapeHtml(formatValue(field.value))}</td></tr>
    `).join('')}</tbody></table>
  `).join('')}</section>`;
}

function renderAuditMetadata(audit = {}) {
  return `<section class="panel"><h2>审核辅助</h2>
    <h3>自动候选</h3><pre>${escapeHtml(JSON.stringify(audit.autoCandidate || {}, null, 2))}</pre>
    <h3>未引用数值字段</h3><pre>${escapeHtml(JSON.stringify(audit.unreferencedRawNumericFields || [], null, 2))}</pre>
    <h3>可疑映射</h3><pre>${escapeHtml(JSON.stringify(audit.suspiciousMappings || [], null, 2))}</pre>
  </section>`;
}
```

Call these helpers inside `renderHeroHtml` before ability sections.

- [ ] **Step 4: Attach audit metadata during export**

During `exportHero`, fetch or build:

```js
const auditReport = await buildSemanticAudit({ hero: profile.hero });
profile.audit = {
  autoCandidate: buildAutoHeroModel(profile.hero),
  unreferencedRawNumericFields: auditReport.rawNumericFieldsNotReferenced,
  suspiciousMappings: auditReport.suspiciousMappings
};
profile.rawAbilities = buildRawAbilityFields(profile.hero);
```

Import `buildSemanticAudit` from `scripts/semantic-audit.js` and `buildAutoHeroModel` from `damageModels/autoModels.js`. Add a local helper that uses `getDotaConstants()` to read raw visible ability attributes.

- [ ] **Step 5: Verify export output**

Run:

```bash
npm test -- test/damageAuditPages.test.js
npm run damage:audit-pages -- --heroes Jakiro --out audit-runs/damage-heroes-jakiro-review
```

Expected: generated `jakiro.html` contains 原始字段, 自动候选, 未引用数值字段, and 可疑映射 sections.

---

### Task 5: Add Batch 1 Reviewed Sustained/Tick Hero Models

**Files:**
- Create/modify Batch 1 model files under `damageModels/heroes/`
- Modify: `damageModels/registry.js`
- Test: `test/damageModelBatchSustained.test.js`

- [ ] **Step 1: Add failing Batch 1 tests**

Create `test/damageModelBatchSustained.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDamageModel } = require('../damageModels/registry');
const { getHeroDetails } = require('../dotaDataContext');
const { resolveHeroDamageModel } = require('../damageModels/resolver');

const BATCH_1_HEROES = [
  'Jakiro',
  'Viper',
  'Venomancer',
  'Phoenix',
  'Leshrac',
  'Death Prophet',
  'Witch Doctor',
  'Ancient Apparition'
];

test('Batch 1 heroes are manual reviewed models', () => {
  for (const hero of BATCH_1_HEROES) {
    const model = getHeroDamageModel(hero);
    assert.equal(model.source, 'manual', `${hero} must be manual`);
    assert.equal(model.review?.status, 'reviewed', `${hero} must be reviewed`);
  }
});

test('Jakiro reviewed model keeps Liquid Fire as sustained and Liquid Frost metadata', async () => {
  const resolved = resolveHeroDamageModel(await getHeroDetails('Jakiro'));
  const liquidFire = resolved.abilities.find((ability) => ability.name === 'Liquid Fire').components[0];
  const liquidFrost = resolved.abilities.find((ability) => ability.name === 'Liquid Frost').components[0];

  assert.equal(liquidFire.kind, 'sustained');
  assert.deepEqual(liquidFire.metadata.durationByAbilityLevel, [5, 5, 5, 5]);
  assert.deepEqual(liquidFire.metadata.tickIntervalByAbilityLevel, [0.5, 0.5, 0.5, 0.5]);
  assert.equal(liquidFrost.kind, 'instant_fixed');
  assert.deepEqual(liquidFrost.metadata.durationByAbilityLevel, [5, 5, 5, 5]);
});

test('Batch 1 sustained components expose duration metadata when provider has duration', async () => {
  for (const hero of BATCH_1_HEROES) {
    const resolved = resolveHeroDamageModel(await getHeroDetails(hero));
    const sustained = resolved.abilities.flatMap((ability) => ability.components)
      .filter((component) => component.kind === 'sustained');
    assert.ok(sustained.length > 0, `${hero} must expose at least one sustained component`);
    assert.ok(
      sustained.some((component) => component.metadata?.durationByAbilityLevel?.length > 0),
      `${hero} must expose duration metadata`
    );
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/damageModelBatchSustained.test.js
```

Expected: fail because most Batch 1 heroes are still `auto`.

- [ ] **Step 3: Generate raw field notes for each Batch 1 hero**

Run:

```bash
npm run damage:audit-pages -- --heroes Jakiro,Viper,Venomancer,Phoenix,Leshrac,Death\ Prophet,Witch\ Doctor,Ancient\ Apparition --out audit-runs/batch-1-sustained-review
```

Open `audit-runs/batch-1-sustained-review/index.html` and inspect each hero before writing model files.

- [ ] **Step 4: Create or update manual model files**

For each Batch 1 hero, create a hero file with:

```js
module.exports = {
  hero: '<Hero Name>',
  source: 'manual',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed for sustained/tick/channel/wave damage batch.']
  },
  abilities: {
    '<Ability Name>': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: '<provider_damage_key>',
      durationKey: '<provider_duration_key>',
      tickIntervalKey: '<provider_tick_key_if_present>',
      semanticType: 'damage.sustained_dps',
      defaultIncluded: false,
      reason: 'Sustained damage requires active duration.'
    }
  }
};
```

Use actual provider keys from the audit pages. Do not copy numeric values into files.

- [ ] **Step 5: Register Batch 1 models**

Modify `damageModels/registry.js` imports and `MANUAL_HERO_MODELS` list to include each Batch 1 hero. Keep `venomancer` in the manual list and update its review metadata rather than duplicating it.

- [ ] **Step 6: Verify Batch 1 tests**

Run:

```bash
npm test -- test/damageModelBatchSustained.test.js test/damageCalculator.test.js test/powerSpikeContext.test.js
```

Expected: all pass.

---

### Task 6: Update Docs And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/dota2-hero-model-audit-workflow.md`

- [ ] **Step 1: Update docs with first maintenance stage commands**

Add to `docs/dota2-hero-model-audit-workflow.md`:

Add a `Maintenance Stage 1` section that explains:

- Stage 1 converts sustained/tick/channel heroes from auto candidates to reviewed manual models.
- Required commands are `npm run damage:coverage`, `npm run semantic:audit`, `npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest`, and `npm test`.
- Reviewed hero model files must include `review.status = "reviewed"`.

- [ ] **Step 2: Update README progress**

In `README.md`, change the progress section so Batch 1 is described as the active maintenance batch. Include the meaning of reviewed/candidate/auto-only.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run semantic:audit
npm run damage:coverage
npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest
```

Expected:

- `npm test` passes.
- semantic audit has `Suspicious mappings: 0`.
- coverage includes manual reviewed/candidate/auto-only fields.
- audit page export completes and `audit-runs/damage-heroes-latest/index.html` exists.

- [ ] **Step 4: Restart service**

Run:

```bash
lsof -nP -iTCP:3002 -sTCP:LISTEN
kill <pid>
node server.js
```

For background start in this local environment:

```bash
python3 - <<'PY'
import subprocess
from pathlib import Path
cwd = Path('/Users/wangyichuan/Desktop/wangcodemac/dota2-helper')
log = cwd / '.server-3002.log'
with log.open('ab') as out:
    proc = subprocess.Popen(['node', 'server.js'], cwd=str(cwd), stdout=out, stderr=subprocess.STDOUT, start_new_session=True)
print(proc.pid)
PY
```

Then verify:

```bash
curl -sS 'http://localhost:3002/api/damage/heroes/Jakiro' | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const p=JSON.parse(s);console.log(p.hero,p.abilities.length);})"
```

Expected: prints `Jakiro` and a positive ability count.

---

## Self-Review Notes

- Spec coverage: The plan implements review status, honest auto/manual coverage, enhanced audit pages, Outworld Destroyer/Ringmaster compatibility, and Batch 1 reviewed sustained/tick models.
- Scope: This plan intentionally implements only first maintenance milestone, not all 126 heroes.
- No placeholder tasks: Each task has exact files, test names, commands, and expected behavior.
- Risk control: Auto models remain available during migration, but coverage makes auto-only status visible.
