# Stage C Datawrapper Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an experimental `dota2-datawrapper` provider path, compare it against the current `dotaconstants` provider, and decide whether it is ready to become the default data source.

**Architecture:** Keep `dotaconstants` as the default provider and fallback. Add a probe first so the runtime shape of `dota2-datawrapper` is captured before wiring it into request handling. Then add an experimental provider, a structured comparison harness, and a same-lineup LLM trial artifact.

**Tech Stack:** Node.js CommonJS, dynamic `import()` for ESM packages when needed, built-in `node:test`, existing provider boundary under `dataProviders/`, existing prompt/context modules.

---

### File Structure

- Create `scripts/probe-datawrapper.mjs`: isolated runtime probe for `dota2-datawrapper`.
- Create `scripts/compare-data-providers.js`: structured diff runner for `dotaconstants` and `datawrapper`.
- Create `dataProviders/datawrapperProvider.js`: experimental provider implementing the current provider contract.
- Modify `dataProviders/index.js`: register the experimental provider behind `DOTA_DATA_PROVIDER=datawrapper`.
- Modify `dataProviders/dotaconstantsProvider.js`: add missing contract methods such as `getProviderMetadata()` and `getItemDetails()`.
- Modify `dotaDataContext.js`: export reusable normalization helpers needed by both providers.
- Create `test/providerContract.test.js`: shared provider contract tests.
- Create `test/datawrapperProbe.test.js`: probe output and unsupported-environment behavior tests.
- Create `test/providerComparison.test.js`: validates comparison classifications.
- Save runtime artifacts under `test-runs/`: probe JSON, comparison Markdown/JSON, and LLM request/response pairs.

### Task 1: Complete the Existing Provider Contract

**Files:**
- Modify: `dataProviders/dotaconstantsProvider.js`
- Modify: `dotaDataContext.js`
- Modify: `test/dataProvider.test.js`

- [ ] **Step 1: Write the failing contract test**

Add these assertions to `test/dataProvider.test.js` inside `getActiveDataProvider returns the dotaconstants provider contract`:

```js
const metadata = await provider.getProviderMetadata();
const item = await provider.getItemDetails('ultimate_scepter');

assert.equal(metadata.name, 'dotaconstants');
assert.equal(metadata.defaultProvider, true);
assert.match(metadata.packageVersion, /^\d+\.\d+\.\d+|unknown$/);
assert.equal(item.name, "Aghanim's Scepter");
assert.equal(item.cost, 4200);
assert.ok(item.attributes.some((attr) => attr.key === 'bonus_all_stats'));
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- test/dataProvider.test.js
```

Expected: FAIL because `getProviderMetadata` and `getItemDetails` are not defined on the provider.

- [ ] **Step 3: Export item and metadata helpers**

In `dotaDataContext.js`, export the existing `buildItemSummary` helper and a new metadata helper:

```js
function getDotaconstantsMetadata() {
  return {
    name: 'dotaconstants',
    packageVersion: DOTACONSTANTS_VERSION,
    defaultProvider: true
  };
}

module.exports = {
  ROLE_ITEMS,
  buildGroundedChinesePrompt,
  buildItemSummary,
  buildMatchContext,
  getDotaconstantsMetadata,
  getDotaConstants,
  getHeroDetails,
  normalizeTeam
};
```

- [ ] **Step 4: Implement provider methods**

Update `dataProviders/dotaconstantsProvider.js`:

```js
const {
  buildGroundedChinesePrompt,
  buildItemSummary,
  buildMatchContext,
  getDotaconstantsMetadata,
  getDotaConstants,
  getHeroDetails
} = require('../dotaDataContext');
const { getHeroLocalizationList, normalizeHeroName } = require('../heroAliases');

async function getItemDetails(itemKeyOrName) {
  const { items } = await getDotaConstants();
  const normalized = String(itemKeyOrName || '').trim().toLowerCase();
  const entry = Object.entries(items).find(([key, item]) =>
    key.toLowerCase() === normalized
    || item?.dname?.toLowerCase() === normalized
  );
  return entry ? buildItemSummary(entry[0], entry[1]) : null;
}

const dotaconstantsProvider = {
  name: 'dotaconstants',
  buildGroundedChinesePrompt,
  buildMatchContext,
  getDotaConstants,
  getHeroDetails,
  getHeroIndex: getHeroLocalizationList,
  getItemDetails,
  getProviderMetadata: getDotaconstantsMetadata,
  normalizeHeroName
};

module.exports = dotaconstantsProvider;
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/dataProvider.test.js
```

Expected: PASS.

### Task 2: Add a Datawrapper Probe Script

**Files:**
- Create: `scripts/probe-datawrapper.mjs`
- Create: `test/datawrapperProbe.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing probe test**

Create `test/datawrapperProbe.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

test('datawrapper probe emits machine-readable JSON', () => {
  const result = spawnSync(process.execPath, ['scripts/probe-datawrapper.mjs', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.packageName, 'dota2-datawrapper');
  assert.ok(['available', 'missing'].includes(payload.status));
  assert.ok(Array.isArray(payload.findings));
  assert.ok(payload.samples);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- test/datawrapperProbe.test.js
```

Expected: FAIL because `scripts/probe-datawrapper.mjs` does not exist.

- [ ] **Step 3: Implement the probe script**

Create `scripts/probe-datawrapper.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const startedAt = performance.now();

async function tryImportPackage(packageName) {
  try {
    const mod = await import(packageName);
    return { ok: true, mod };
  } catch (error) {
    return { ok: false, error };
  }
}

function inspectModule(mod) {
  const keys = Object.keys(mod || {}).sort();
  const defaultKeys = mod?.default && typeof mod.default === 'object'
    ? Object.keys(mod.default).sort()
    : [];
  return { keys, defaultKeys };
}

function writeOutput(payload) {
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  process.stdout.write(`# dota2-datawrapper probe\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`);
}

const result = await tryImportPackage('dota2-datawrapper');
const payload = {
  packageName: 'dota2-datawrapper',
  status: result.ok ? 'available' : 'missing',
  durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
  findings: [],
  samples: {
    module: null,
    hero: null,
    item: null,
    ability: null,
    patch: null
  }
};

if (!result.ok) {
  payload.findings.push({
    level: 'blocking',
    message: result.error.message
  });
  writeOutput(payload);
  process.exit(0);
}

payload.samples.module = inspectModule(result.mod);
payload.findings.push({
  level: 'info',
  message: 'Package imported successfully. Use module keys to design the experimental provider.'
});

const artifactPath = path.join(process.cwd(), 'test-runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-datawrapper-probe.json`);
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`);
payload.artifactPath = artifactPath;

writeOutput(payload);
```

- [ ] **Step 4: Add an npm script**

In `package.json`, add:

```json
"data:probe": "node scripts/probe-datawrapper.mjs"
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/datawrapperProbe.test.js
npm run data:probe -- --json
```

Expected: both commands exit 0. The probe may report `status: "missing"` until the package is installed.

### Task 3: Install and Inspect `dota2-datawrapper`

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Artifact: `test-runs/*-datawrapper-probe.json`

- [ ] **Step 1: Install the package**

Run:

```bash
npm install dota2-datawrapper
```

Expected: `package.json` and `package-lock.json` update.

- [ ] **Step 2: Run the probe**

Run:

```bash
npm run data:probe -- --json
```

Expected: JSON with `status: "available"` and module/default export keys.

- [ ] **Step 3: Inspect package docs and runtime shape**

Run:

```bash
npm view dota2-datawrapper version description
npm view dota2-datawrapper exports main module types
```

Expected: output identifies package entrypoints. Save important findings in the final task summary and in the probe artifact.

- [ ] **Step 4: Verify baseline tests still pass**

Run:

```bash
npm test
```

Expected: PASS. If installing the package changes lockfile resolution only, no behavior should change.

### Task 4: Add the Experimental Provider Skeleton

**Files:**
- Create: `dataProviders/datawrapperProvider.js`
- Modify: `dataProviders/index.js`
- Modify: `test/dataProvider.test.js`

- [ ] **Step 1: Write the failing selection test**

Replace the current `datawrapper` rejection test in `test/dataProvider.test.js` with:

```js
test('getActiveDataProvider returns the experimental datawrapper provider', () => {
  const provider = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'datawrapper' });

  assert.equal(provider.name, 'datawrapper');
  assert.equal(typeof provider.getProviderMetadata, 'function');
  assert.equal(typeof provider.buildMatchContext, 'function');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- test/dataProvider.test.js
```

Expected: FAIL because `DOTA_DATA_PROVIDER=datawrapper` still throws.

- [ ] **Step 3: Implement skeleton provider**

Create `dataProviders/datawrapperProvider.js`:

```js
const dotaconstantsProvider = require('./dotaconstantsProvider');

async function getProviderMetadata() {
  return {
    name: 'datawrapper',
    packageVersion: 'unknown',
    experimental: true,
    fallbackShapeProvider: 'dotaconstants'
  };
}

async function buildMatchContext(myTeam, opponentTeam) {
  const context = await dotaconstantsProvider.buildMatchContext(myTeam, opponentTeam);
  context.dataSource = {
    ...context.dataSource,
    provider: 'datawrapper',
    experimental: true,
    notes: 'Experimental datawrapper provider skeleton is active; normalized context still falls back to dotaconstants shape until datawrapper mapping is implemented.'
  };
  return context;
}

const datawrapperProvider = {
  name: 'datawrapper',
  buildGroundedChinesePrompt: dotaconstantsProvider.buildGroundedChinesePrompt,
  buildMatchContext,
  getHeroDetails: dotaconstantsProvider.getHeroDetails,
  getHeroIndex: dotaconstantsProvider.getHeroIndex,
  getItemDetails: dotaconstantsProvider.getItemDetails,
  getProviderMetadata,
  normalizeHeroName: dotaconstantsProvider.normalizeHeroName
};

module.exports = datawrapperProvider;
```

- [ ] **Step 4: Register provider**

Update `dataProviders/index.js`:

```js
const dotaconstantsProvider = require('./dotaconstantsProvider');
const datawrapperProvider = require('./datawrapperProvider');

function getConfiguredProviderName(env = process.env) {
  return String(env.DOTA_DATA_PROVIDER || 'dotaconstants').trim().toLowerCase();
}

function getActiveDataProvider(env = process.env) {
  const providerName = getConfiguredProviderName(env);
  if (providerName === 'dotaconstants') {
    return dotaconstantsProvider;
  }
  if (providerName === 'datawrapper') {
    return datawrapperProvider;
  }
  throw new Error(`Unsupported DOTA_DATA_PROVIDER: ${providerName}`);
}

module.exports = {
  getActiveDataProvider,
  getConfiguredProviderName
};
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/dataProvider.test.js
node --check dataProviders/datawrapperProvider.js dataProviders/index.js
```

Expected: PASS.

### Task 5: Add Provider Contract Tests

**Files:**
- Create: `test/providerContract.test.js`

- [ ] **Step 1: Write shared contract tests**

Create `test/providerContract.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { getActiveDataProvider } = require('../dataProviders');

const lineup = {
  myTeam: [
    { role: 'Safe Lane', hero: 'Rubick' },
    { role: 'Midlane', hero: 'Crystal Maiden' },
    { role: 'Offlane', hero: 'Axe' },
    { role: 'Support', hero: 'Lion' },
    { role: 'Hard Support', hero: 'Witch Doctor' }
  ],
  opponentTeam: [
    { role: 'Safe Lane', hero: 'Juggernaut' },
    { role: 'Midlane', hero: 'Queen of Pain' },
    { role: 'Offlane', hero: 'Mars' },
    { role: 'Support', hero: 'Shadow Shaman' },
    { role: 'Hard Support', hero: 'Lich' }
  ]
};

for (const providerName of ['dotaconstants', 'datawrapper']) {
  test(`${providerName} provider builds canonical match context`, async () => {
    const provider = getActiveDataProvider({ DOTA_DATA_PROVIDER: providerName });
    const context = await provider.buildMatchContext(lineup.myTeam, lineup.opponentTeam);
    const prompt = provider.buildGroundedChinesePrompt(context);

    assert.equal(context.dataSource.provider, providerName);
    assert.equal(context.player.hero, 'Rubick');
    assert.ok(context.playerHero.stats.derived.level1.maxHealth > 500);
    assert.ok(context.playerHero.abilities.some((ability) => ability.name === 'Fade Bolt'));
    assert.equal(context.upgradeItems.scepter.cost, 4200);
    assert.equal(context.upgradeItems.shard.cost, 1400);
    assert.match(prompt, /版本与数据源/);
    assert.doesNotMatch(prompt, /玩家英雄 Facets/);
  });
}
```

- [ ] **Step 2: Run contract tests**

Run:

```bash
npm test -- test/providerContract.test.js
```

Expected: PASS while datawrapper skeleton still uses fallback normalized shape.

### Task 6: Build the Comparison Harness

**Files:**
- Create: `scripts/compare-data-providers.js`
- Create: `test/providerComparison.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing comparison test**

Create `test/providerComparison.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/providerComparison.test.js
```

Expected: FAIL because `scripts/compare-data-providers.js` does not exist.

- [ ] **Step 3: Implement comparison harness**

Create `scripts/compare-data-providers.js`:

```js
const fs = require('fs');
const path = require('path');
const { getActiveDataProvider } = require('../dataProviders');

function classify(dotaconstantsValue, datawrapperValue) {
  const leftMissing = dotaconstantsValue === undefined || dotaconstantsValue === null;
  const rightMissing = datawrapperValue === undefined || datawrapperValue === null;
  if (leftMissing && rightMissing) return 'missing_both';
  if (leftMissing) return 'datawrapper_richer';
  if (rightMissing) return 'dotaconstants_only';
  if (JSON.stringify(dotaconstantsValue) === JSON.stringify(datawrapperValue)) return 'same';
  return 'conflict';
}

async function compareProviders() {
  const dotaconstants = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'dotaconstants' });
  const datawrapper = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'datawrapper' });
  const fixtures = [
    { type: 'hero', name: 'Rubick' },
    { type: 'hero', name: 'Drow Ranger' },
    { type: 'hero', name: 'Queen of Pain' },
    { type: 'item', name: "Aghanim's Scepter", key: 'ultimate_scepter' },
    { type: 'item', name: "Aghanim's Shard", key: 'aghanims_shard' },
    { type: 'item', name: 'Battle Fury', key: 'bfury' }
  ];
  const differences = [];

  for (const fixture of fixtures) {
    const dotaconstantsValue = fixture.type === 'hero'
      ? await dotaconstants.getHeroDetails(fixture.name)
      : await dotaconstants.getItemDetails(fixture.key);
    const datawrapperValue = fixture.type === 'hero'
      ? await datawrapper.getHeroDetails(fixture.name)
      : await datawrapper.getItemDetails(fixture.key);

    differences.push({
      fixture: fixture.name,
      type: fixture.type,
      classification: classify(dotaconstantsValue, datawrapperValue),
      dotaconstantsSummary: dotaconstantsValue ? Object.keys(dotaconstantsValue).sort() : null,
      datawrapperSummary: datawrapperValue ? Object.keys(datawrapperValue).sort() : null
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    fixtures,
    differences
  };
}

async function main() {
  const report = await compareProviders();
  const outPath = path.join(process.cwd(), 'test-runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-provider-comparison.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...report, artifactPath: outPath }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  classify,
  compareProviders
};
```

- [ ] **Step 4: Add npm script**

In `package.json`, add:

```json
"data:compare": "node scripts/compare-data-providers.js"
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/providerComparison.test.js
npm run data:compare
```

Expected: PASS and comparison artifact saved in `test-runs/`.

### Task 7: Replace Skeleton Mapping With Real Datawrapper Calls

**Files:**
- Modify: `dataProviders/datawrapperProvider.js`
- Modify: `scripts/probe-datawrapper.mjs`
- Modify: `test/providerContract.test.js`
- Modify: `test/providerComparison.test.js`

- [ ] **Step 1: Read probe artifact**

Run:

```bash
npm run data:probe -- --json
```

Expected: output with available module methods. Use the method names from this artifact for the next step.

- [ ] **Step 2: Add failing assertion for datawrapper diagnostics**

In `test/providerContract.test.js`, for the `datawrapper` provider case add:

```js
if (providerName === 'datawrapper') {
  assert.notEqual(context.dataSource.fallbackShapeProvider, 'dotaconstants');
  assert.ok(context.dataSource.packageVersion);
}
```

Run:

```bash
npm test -- test/providerContract.test.js
```

Expected: FAIL while datawrapper is still a skeleton.

- [ ] **Step 3: Implement real adapter methods**

Update `dataProviders/datawrapperProvider.js` to:

```js
let datawrapperModule = null;

async function loadDatawrapper() {
  if (!datawrapperModule) {
    datawrapperModule = await import('dota2-datawrapper');
  }
  return datawrapperModule;
}
```

Then map the runtime methods discovered by `scripts/probe-datawrapper.mjs` into:

```js
async function getProviderMetadata()
async function getHeroDetails(canonicalHeroName)
async function getItemDetails(itemKeyOrName)
async function buildMatchContext(myTeam, opponentTeam)
```

The normalized return fields must match the current `dotaconstants` context shape used in `test/providerContract.test.js`.

- [ ] **Step 4: Keep fallback explicit**

If a datawrapper method is missing, throw:

```js
throw new Error('datawrapper provider cannot build hero details: missing runtime method <methodName>');
```

Do not silently call dotaconstants in the real adapter unless the context explicitly marks that field as fallback data.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/providerContract.test.js test/providerComparison.test.js
npm run data:compare
```

Expected: PASS. The comparison artifact should classify real differences instead of all fields being `same`.

### Task 8: Same-Lineup Prompt Trial Artifacts

**Files:**
- Create: `scripts/run-provider-prompt-trial.js`
- Modify: `package.json`
- Artifact: `test-runs/*-provider-prompt-trial.json`

- [ ] **Step 1: Create prompt trial runner**

Create `scripts/run-provider-prompt-trial.js`:

```js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { callAiChat } = require('../aiClient');
const { getActiveDataProvider } = require('../dataProviders');

const lineup = {
  myTeam: [
    { role: 'Safe Lane', hero: 'Rubick' },
    { role: 'Midlane', hero: 'Crystal Maiden' },
    { role: 'Offlane', hero: 'Axe' },
    { role: 'Support', hero: 'Lion' },
    { role: 'Hard Support', hero: 'Witch Doctor' }
  ],
  opponentTeam: [
    { role: 'Safe Lane', hero: 'Juggernaut' },
    { role: 'Midlane', hero: 'Queen of Pain' },
    { role: 'Offlane', hero: 'Mars' },
    { role: 'Support', hero: 'Shadow Shaman' },
    { role: 'Hard Support', hero: 'Lich' }
  ]
};

async function runForProvider(providerName) {
  const provider = getActiveDataProvider({ ...process.env, DOTA_DATA_PROVIDER: providerName });
  const context = await provider.buildMatchContext(lineup.myTeam, lineup.opponentTeam);
  const prompt = provider.buildGroundedChinesePrompt(context);
  const response = await callAiChat([
    { role: 'system', content: 'You are a Dota 2 coaching assistant.' },
    { role: 'user', content: prompt }
  ]);

  return {
    provider: providerName,
    context,
    request: {
      messages: [
        { role: 'system', content: 'You are a Dota 2 coaching assistant.' },
        { role: 'user', content: prompt }
      ]
    },
    response
  };
}

async function main() {
  const providers = process.argv.slice(2);
  const selectedProviders = providers.length ? providers : ['dotaconstants', 'datawrapper'];
  const results = [];
  for (const providerName of selectedProviders) {
    results.push(await runForProvider(providerName));
  }
  const outPath = path.join(process.cwd(), 'test-runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-provider-prompt-trial.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), lineup, results }, null, 2)}\n`);
  console.log(outPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Add npm script**

In `package.json`, add:

```json
"data:prompt-trial": "node scripts/run-provider-prompt-trial.js"
```

- [ ] **Step 3: Verify with dotaconstants only first**

Run:

```bash
npm run data:prompt-trial -- dotaconstants
```

Expected: one JSON artifact saved in `test-runs/`.

- [ ] **Step 4: Verify both providers**

Run:

```bash
npm run data:prompt-trial
```

Expected: one JSON artifact containing request and response for both providers.

### Task 9: Final Stage C Recommendation

**Files:**
- Create: `test-runs/YYYY-MM-DD-stage-c-recommendation.md`

- [ ] **Step 1: Review artifacts**

Open the latest:

```bash
ls -t test-runs/*datawrapper-probe.json test-runs/*provider-comparison.json test-runs/*provider-prompt-trial.json | head
```

- [ ] **Step 2: Write recommendation**

Create a Markdown report with:

```md
# Stage C Provider Recommendation

## Verdict

Keep dotaconstants as default / Switch default to datawrapper.

## Evidence

- Probe artifact:
- Comparison artifact:
- Prompt trial artifact:

## Blocking Gaps

- None / listed gaps.

## Next Step

- Exact next implementation step.
```

- [ ] **Step 3: Final verification**

Run:

```bash
npm test
node --check dataProviders/index.js dataProviders/dotaconstantsProvider.js dataProviders/datawrapperProvider.js scripts/compare-data-providers.js scripts/run-provider-prompt-trial.js
```

Expected: all tests and syntax checks pass.

### Self-Review Notes

- Spec coverage: C2.1 probe, C2.2 experimental provider, C2.3 comparison harness, C2.4 prompt trial, and C2.5 default switch recommendation are all covered.
- Scope: this plan does not rewrite frontend, force JSON LLM output, or remove `dotaconstants`.
- Risk: Task 7 intentionally depends on probe findings because `dota2-datawrapper` runtime exports must be discovered from the actual installed package before writing a correct adapter.
