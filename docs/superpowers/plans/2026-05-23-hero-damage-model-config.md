# Hero Damage Model Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a curated per-hero damage model layer so hero mechanics are explicitly configured while patch numbers still come from local Dota data.

**Architecture:** Create a focused `damageModels` registry with schema validation, resolver, and coverage reporting. Integrate the resolver into the existing calculator API first, then expand power spike and prompt context after the first ten representative hero configs pass tests.

**Tech Stack:** CommonJS modules, Node built-in test runner, `dotaconstants`, `dota2-datawrapper`, existing Express API and vanilla JS calculator page.

---

### Task 1: Model Schema And Registry

**Files:**
- Create: `damageModels/schema.js`
- Create: `damageModels/registry.js`
- Create: `damageModels/heroes/slardar.js`
- Test: `test/damageModelSchema.test.js`

- [ ] **Step 1: Write the failing schema and registry tests**

Create `test/damageModelSchema.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MODEL_STATUSES,
  MODEL_TYPES,
  validateHeroDamageModel
} = require('../damageModels/schema');
const { getHeroDamageModel } = require('../damageModels/registry');

test('validateHeroDamageModel accepts Slardar attack sequence model', () => {
  const model = {
    hero: 'Slardar',
    abilities: {
      'Bash of the Deep': {
        status: 'implemented',
        model: 'attack_sequence',
        procDamageKey: 'bonus_damage',
        attackCountKey: 'attack_count',
        formula: 'attackCount * attackDamage + procDamage',
        defaultIncluded: true
      }
    }
  };

  assert.equal(MODEL_STATUSES.includes('implemented'), true);
  assert.equal(MODEL_TYPES.includes('attack_sequence'), true);
  assert.deepEqual(validateHeroDamageModel(model), model);
});

test('validateHeroDamageModel rejects implemented attack sequence without procDamageKey', () => {
  assert.throws(
    () => validateHeroDamageModel({
      hero: 'Slardar',
      abilities: {
        'Bash of the Deep': {
          status: 'implemented',
          model: 'attack_sequence',
          attackCountKey: 'attack_count'
        }
      }
    }),
    /Bash of the Deep.*procDamageKey/
  );
});

test('registry resolves Slardar model by canonical hero name', () => {
  const model = getHeroDamageModel('Slardar');

  assert.equal(model.hero, 'Slardar');
  assert.equal(model.abilities['Bash of the Deep'].model, 'attack_sequence');
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- test/damageModelSchema.test.js
```

Expected: fail because `damageModels/schema.js` and `damageModels/registry.js` do not exist.

- [ ] **Step 3: Add `damageModels/schema.js`**

Create `damageModels/schema.js`:

```js
const MODEL_STATUSES = ['implemented', 'reference_only', 'ignored', 'unsupported', 'inferred'];
const MODEL_TYPES = [
  'instant_fixed',
  'sustained_dps',
  'multi_wave',
  'attack_sequence',
  'attack_modifier',
  'chance_based',
  'conditional',
  'state_scaling',
  'debuff_reference'
];

const REQUIRED_BY_TYPE = {
  instant_fixed: ['damageKey'],
  sustained_dps: ['damagePerSecondKey', 'durationKey'],
  multi_wave: ['damagePerWaveKey', 'waveCountKey'],
  attack_sequence: ['procDamageKey', 'attackCountKey'],
  attack_modifier: ['bonusDamageKey'],
  chance_based: ['chanceKey', 'multiplierKey'],
  conditional: ['condition'],
  state_scaling: ['requiredInputs'],
  debuff_reference: ['valueKey', 'affects']
};

function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function validateAbilityEntry(hero, abilityName, entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`${hero}.${abilityName} must be an object`);
  }
  if (!MODEL_STATUSES.includes(entry.status)) {
    throw new Error(`${hero}.${abilityName} has unsupported status: ${entry.status}`);
  }
  if (entry.status === 'ignored') return entry;
  if (!MODEL_TYPES.includes(entry.model)) {
    throw new Error(`${hero}.${abilityName} has unsupported model: ${entry.model}`);
  }
  if (entry.status === 'unsupported') {
    assertString(entry.reason, `${hero}.${abilityName}.reason`);
    return entry;
  }
  for (const key of REQUIRED_BY_TYPE[entry.model] || []) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === '') {
      throw new Error(`${hero}.${abilityName} missing ${key}`);
    }
  }
  return entry;
}

function validateHeroDamageModel(model) {
  if (!model || typeof model !== 'object') {
    throw new Error('Hero damage model must be an object');
  }
  assertString(model.hero, 'hero');
  if (!model.abilities || typeof model.abilities !== 'object') {
    throw new Error(`${model.hero}.abilities must be an object`);
  }
  for (const [abilityName, entry] of Object.entries(model.abilities)) {
    assertString(abilityName, `${model.hero}.abilityName`);
    validateAbilityEntry(model.hero, abilityName, entry);
  }
  return model;
}

module.exports = {
  MODEL_STATUSES,
  MODEL_TYPES,
  REQUIRED_BY_TYPE,
  validateHeroDamageModel
};
```

- [ ] **Step 4: Add Slardar model**

Create `damageModels/heroes/slardar.js`:

```js
module.exports = {
  hero: 'Slardar',
  abilities: {
    'Guardian Sprint': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'bonus_speed',
      affects: 'positioning',
      reason: 'Movement speed can enable attacks but is not direct damage.'
    },
    'Slithereen Crush': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'crush_damage',
      defaultIncluded: true
    },
    'Bash of the Deep': {
      status: 'implemented',
      model: 'attack_sequence',
      procDamageKey: 'bonus_damage',
      attackCountKey: 'attack_count',
      formula: 'attackCount * attackDamage + procDamage',
      defaultIncluded: true
    },
    'Seaborn Sentinel': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'river_damage_pct',
      affects: 'attack_damage',
      reason: 'Requires puddle, trail, or river state; v1 exposes it as a reference modifier.'
    },
    'Corrosive Haze': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'armor_reduction',
      affects: 'physical_damage',
      reason: 'Armor reduction affects follow-up physical damage; v1 does not chain debuffs into totals.'
    }
  }
};
```

- [ ] **Step 5: Add `damageModels/registry.js`**

Create `damageModels/registry.js`:

```js
const slardar = require('./heroes/slardar');
const { validateHeroDamageModel } = require('./schema');

const HERO_MODELS = [
  validateHeroDamageModel(slardar)
];

const MODEL_BY_HERO = new Map(HERO_MODELS.map((model) => [model.hero, model]));

function getHeroDamageModel(heroName) {
  return MODEL_BY_HERO.get(heroName) || null;
}

function listHeroDamageModels() {
  return [...HERO_MODELS];
}

module.exports = {
  getHeroDamageModel,
  listHeroDamageModels
};
```

- [ ] **Step 6: Verify schema tests pass**

Run:

```bash
npm test -- test/damageModelSchema.test.js
```

Expected: all tests pass.

### Task 2: Coverage Report

**Files:**
- Create: `damageModels/coverage.js`
- Create: `scripts/damage-coverage.js`
- Modify: `package.json`
- Test: `test/damageModelCoverage.test.js`

- [ ] **Step 1: Write failing coverage tests**

Create `test/damageModelCoverage.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildDamageModelCoverage } = require('../damageModels/coverage');

test('buildDamageModelCoverage reports modeled and missing heroes', async () => {
  const report = await buildDamageModelCoverage();

  assert.equal(report.totalHeroes >= 127, true);
  assert.equal(report.modeledHeroes >= 1, true);
  assert.ok(report.missingHeroModels.includes('Anti-Mage'));
  assert.ok(report.heroReports.some((entry) => entry.hero === 'Slardar'));
});

test('buildDamageModelCoverage reports missing ability entries for partial models', async () => {
  const report = await buildDamageModelCoverage();
  const slardar = report.heroReports.find((entry) => entry.hero === 'Slardar');

  assert.equal(slardar.hero, 'Slardar');
  assert.equal(slardar.implementedAbilities >= 2, true);
  assert.equal(Array.isArray(report.missingAbilityEntries), true);
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- test/damageModelCoverage.test.js
```

Expected: fail because `damageModels/coverage.js` does not exist.

- [ ] **Step 3: Implement `damageModels/coverage.js`**

Create `damageModels/coverage.js`:

```js
const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { getDotaConstants } = require('../dotaDataContext');
const { getHeroDamageModel, listHeroDamageModels } = require('./registry');

function visibleAbilityNames(heroAbilities, abilities) {
  return (heroAbilities.abilities || [])
    .map((name) => abilities[name])
    .filter((ability) => ability && ability.dname && ability.desc)
    .map((ability) => ability.dname);
}

async function buildDamageModelCoverage() {
  const { heroes, hero_abilities, abilities } = await getDotaConstants();
  const modeled = listHeroDamageModels();
  const missingHeroModels = [];
  const missingAbilityEntries = [];
  const heroReports = [];
  let totalAbilities = 0;
  let implementedAbilities = 0;
  let referenceOnlyAbilities = 0;
  let ignoredAbilities = 0;
  let unsupportedAbilities = 0;
  let inferredAbilities = 0;

  for (const heroName of CANONICAL_HERO_NAMES) {
    const hero = Object.values(heroes).find((entry) => entry.localized_name === heroName);
    const abilityNames = hero ? visibleAbilityNames(hero_abilities[hero.name] || {}, abilities) : [];
    const model = getHeroDamageModel(heroName);
    const counts = {
      hero: heroName,
      totalAbilities: abilityNames.length,
      implementedAbilities: 0,
      referenceOnlyAbilities: 0,
      ignoredAbilities: 0,
      unsupportedAbilities: 0,
      inferredAbilities: 0,
      missingAbilityEntries: []
    };

    totalAbilities += abilityNames.length;

    if (!model) {
      missingHeroModels.push(heroName);
      counts.inferredAbilities = abilityNames.length;
      inferredAbilities += abilityNames.length;
      heroReports.push(counts);
      continue;
    }

    for (const abilityName of abilityNames) {
      const entry = model.abilities[abilityName];
      if (!entry) {
        const missing = { hero: heroName, ability: abilityName };
        missingAbilityEntries.push(missing);
        counts.missingAbilityEntries.push(missing);
        counts.inferredAbilities += 1;
        inferredAbilities += 1;
        continue;
      }
      if (entry.status === 'implemented') {
        counts.implementedAbilities += 1;
        implementedAbilities += 1;
      } else if (entry.status === 'reference_only') {
        counts.referenceOnlyAbilities += 1;
        referenceOnlyAbilities += 1;
      } else if (entry.status === 'ignored') {
        counts.ignoredAbilities += 1;
        ignoredAbilities += 1;
      } else if (entry.status === 'unsupported') {
        counts.unsupportedAbilities += 1;
        unsupportedAbilities += 1;
      }
    }

    heroReports.push(counts);
  }

  return {
    totalHeroes: CANONICAL_HERO_NAMES.length,
    modeledHeroes: modeled.length,
    totalAbilities,
    implementedAbilities,
    referenceOnlyAbilities,
    ignoredAbilities,
    unsupportedAbilities,
    inferredAbilities,
    missingHeroModels,
    missingAbilityEntries,
    heroReports
  };
}

module.exports = {
  buildDamageModelCoverage
};
```

- [ ] **Step 4: Add CLI script and npm command**

Create `scripts/damage-coverage.js`:

```js
#!/usr/bin/env node

const { buildDamageModelCoverage } = require('../damageModels/coverage');

buildDamageModelCoverage()
  .then((report) => {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Modify `package.json` scripts:

```json
"damage:coverage": "node scripts/damage-coverage.js"
```

- [ ] **Step 5: Verify coverage tests and command**

Run:

```bash
npm test -- test/damageModelCoverage.test.js
npm run damage:coverage
```

Expected: tests pass and the command prints JSON with `totalHeroes`, `modeledHeroes`, and `missingHeroModels`.

### Task 3: Curated Resolver Integration

**Files:**
- Create: `damageModels/resolver.js`
- Modify: `damageCalculator.js`
- Test: `test/damageModelResolver.test.js`
- Test: `test/damageCalculator.test.js`

- [ ] **Step 1: Write failing resolver tests**

Create `test/damageModelResolver.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDetails } = require('../dotaDataContext');
const { resolveHeroDamageModel } = require('../damageModels/resolver');

test('resolveHeroDamageModel returns curated Slardar Bash component', async () => {
  const details = await getHeroDetails('Slardar');
  const resolved = resolveHeroDamageModel(details);
  const bash = resolved.abilities.find((ability) => ability.name === 'Bash of the Deep');
  const component = bash.components.find((entry) => entry.kind === 'attack_sequence');

  assert.equal(bash.modelSource, 'curated');
  assert.equal(component.status, 'implemented');
  assert.equal(component.model, 'attack_sequence');
  assert.deepEqual(component.valuesByAbilityLevel, [35, 90, 145, 200]);
  assert.deepEqual(component.metadata.attackCountByAbilityLevel, [3, 3, 3, 3]);
});
```

- [ ] **Step 2: Run resolver test and verify it fails**

Run:

```bash
npm test -- test/damageModelResolver.test.js
```

Expected: fail because `damageModels/resolver.js` does not exist.

- [ ] **Step 3: Implement resolver**

Create `damageModels/resolver.js`:

```js
const { extractAbilityDamage, valueAtLevel } = require('../damageExtractor');
const { getHeroDamageModel } = require('./registry');

function normalizeNumericArray(value, expectedLength = null) {
  const values = Array.isArray(value) ? value : [value];
  const numbers = values.map((item) => Number(String(item).replace('%', '').trim())).filter(Number.isFinite);
  if (expectedLength && numbers.length === 1) return Array(expectedLength).fill(numbers[0]);
  return numbers;
}

function attrByKey(ability, key) {
  return (ability.rawAttributes || []).find((attr) => attr.key === key);
}

function valuesForKey(ability, key) {
  if (key === 'dmg') return normalizeNumericArray(ability.damage);
  const attr = attrByKey(ability, key);
  return attr ? normalizeNumericArray(attr.value) : [];
}

function buildCuratedComponent(ability, entry) {
  if (entry.status !== 'implemented') return null;
  if (entry.model === 'instant_fixed') {
    return {
      kind: 'instant_fixed',
      model: entry.model,
      status: entry.status,
      source: 'curated',
      growthKind: 'non_growth',
      damageType: ability.damageType || 'Unknown',
      label: entry.damageKey,
      sourceKey: entry.damageKey,
      valuesByAbilityLevel: valuesForKey(ability, entry.damageKey),
      theoreticalTotalByAbilityLevel: [],
      countInFixedInstantTotal: Boolean(entry.defaultIncluded),
      formula: { type: 'single_value' },
      totalFormula: '',
      metadata: {},
      caveats: []
    };
  }
  if (entry.model === 'attack_sequence') {
    const valuesByAbilityLevel = valuesForKey(ability, entry.procDamageKey);
    return {
      kind: 'attack_sequence',
      model: entry.model,
      status: entry.status,
      source: 'curated',
      growthKind: 'non_growth',
      damageType: ability.damageType || 'Unknown',
      label: entry.procDamageKey,
      sourceKey: entry.procDamageKey,
      valuesByAbilityLevel,
      theoreticalTotalByAbilityLevel: [],
      countInFixedInstantTotal: false,
      formula: { type: 'attack_count_sequence' },
      totalFormula: entry.formula,
      metadata: {
        attackCountByAbilityLevel: normalizeNumericArray(attrByKey(ability, entry.attackCountKey)?.value, valuesByAbilityLevel.length)
      },
      caveats: ['包含按攻击次数触发的被动伤害，需要结合普攻次数与英雄攻击力计算。']
    };
  }
  return null;
}

function buildReferenceAbility(ability, entry) {
  return {
    name: ability.name,
    displayName: ability.displayName,
    isUltimate: ability.isUltimate,
    modelSource: 'curated',
    status: entry.status,
    model: entry.model,
    reason: entry.reason || '',
    components: []
  };
}

function buildFallbackAbility(ability) {
  const extracted = extractAbilityDamage({
    dname: ability.name,
    dmg_type: ability.damageType,
    behavior: ability.behavior,
    desc: ability.description,
    dmg: ability.damage,
    attrib: ability.rawAttributes,
    mc: ability.manaCost,
    cd: ability.cooldown
  });

  return {
    name: ability.name,
    displayName: ability.displayName,
    isUltimate: ability.isUltimate,
    modelSource: 'inferred',
    status: 'inferred',
    components: extracted.components.map((component) => ({
      ...component,
      source: 'inferred',
      status: 'inferred',
      model: component.kind,
      damageType: extracted.damageType,
      caveats: extracted.caveats
    }))
  };
}

function resolveHeroDamageModel(heroDetails) {
  const model = getHeroDamageModel(heroDetails.name);
  return {
    hero: heroDetails.name,
    abilities: (heroDetails.abilities || []).map((ability) => {
      const entry = model?.abilities?.[ability.name];
      if (!entry) return buildFallbackAbility(ability);
      const component = buildCuratedComponent(ability, entry);
      if (!component) return buildReferenceAbility(ability, entry);
      return {
        name: ability.name,
        displayName: ability.displayName,
        isUltimate: ability.isUltimate,
        modelSource: 'curated',
        status: entry.status,
        model: entry.model,
        components: [component],
        manaCostByAbilityLevel: normalizeNumericArray(ability.manaCost, component.valuesByAbilityLevel.length),
        cooldownByAbilityLevel: normalizeNumericArray(ability.cooldown, component.valuesByAbilityLevel.length)
      };
    })
  };
}

module.exports = {
  resolveHeroDamageModel,
  valueAtLevel
};
```

- [ ] **Step 4: Integrate resolver into `damageCalculator.js`**

Modify `getHeroDamageProfile(heroName)` so it calls `resolveHeroDamageModel(details)` and maps resolved ability entries into the current API shape. Preserve existing fallback behavior for heroes without curated models.

- [ ] **Step 5: Verify resolver and calculator tests**

Run:

```bash
npm test -- test/damageModelResolver.test.js test/damageCalculator.test.js
```

Expected: all tests pass, including the existing Slardar `352` attack-sequence expectation.

### Task 4: First Ten Hero Configs

**Files:**
- Create: `damageModels/heroes/sand_king.js`
- Create: `damageModels/heroes/queen_of_pain.js`
- Create: `damageModels/heroes/lion.js`
- Create: `damageModels/heroes/lina.js`
- Create: `damageModels/heroes/axe.js`
- Create: `damageModels/heroes/shadow_fiend.js`
- Create: `damageModels/heroes/phantom_assassin.js`
- Create: `damageModels/heroes/faceless_void.js`
- Create: `damageModels/heroes/venomancer.js`
- Modify: `damageModels/registry.js`
- Test: `test/damageModelFirstBatch.test.js`

- [ ] **Step 1: Write first-batch coverage test**

Create `test/damageModelFirstBatch.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { getHeroDamageModel } = require('../damageModels/registry');

const FIRST_BATCH = [
  'Slardar',
  'Sand King',
  'Queen of Pain',
  'Lion',
  'Lina',
  'Axe',
  'Shadow Fiend',
  'Phantom Assassin',
  'Faceless Void',
  'Venomancer'
];

test('first batch hero models are registered', () => {
  for (const hero of FIRST_BATCH) {
    assert.equal(getHeroDamageModel(hero)?.hero, hero);
  }
});

test('first batch models contain at least one implemented ability', () => {
  for (const hero of FIRST_BATCH) {
    const model = getHeroDamageModel(hero);
    const implemented = Object.values(model.abilities).filter((entry) => entry.status === 'implemented');
    assert.equal(implemented.length > 0, true, `${hero} must have an implemented damage model`);
  }
});
```

- [ ] **Step 2: Run first-batch test and verify it fails**

Run:

```bash
npm test -- test/damageModelFirstBatch.test.js
```

Expected: fail because only Slardar is registered.

- [ ] **Step 3: Add hero files**

Create each hero file with the exact English ability names exposed by `dotaconstants`. Use `implemented` where the existing calculator can compute the mechanic, `reference_only` for debuffs and enabling effects, and `unsupported` with a reason when a mechanic matters but is not modeled.

For Sand King, create `damageModels/heroes/sand_king.js`:

```js
module.exports = {
  hero: 'Sand King',
  abilities: {
    Burrowstrike: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'dmg',
      defaultIncluded: true
    },
    'Sand Storm': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'sand_storm_damage',
      durationKey: 'duration',
      defaultActiveDuration: 'full'
    },
    Stinger: {
      status: 'implemented',
      model: 'attack_modifier',
      bonusDamageKey: 'damage',
      defaultAttackCount: 1
    },
    'Caustic Finale': {
      status: 'reference_only',
      model: 'conditional',
      condition: 'Target must die during debuff to explode.',
      reason: 'Conditional death explosion is shown as reference in v1.'
    },
    Epicenter: {
      status: 'implemented',
      model: 'multi_wave',
      damagePerWaveKey: 'epicenter_damage',
      waveCountKey: 'pulses'
    }
  }
};
```

- [ ] **Step 4: Register all first-batch models**

Modify `damageModels/registry.js` to import all ten hero modules and include them in `HERO_MODELS`.

- [ ] **Step 5: Verify first-batch tests and coverage**

Run:

```bash
npm test -- test/damageModelFirstBatch.test.js
npm run damage:coverage
```

Expected: first-batch test passes and coverage reports `modeledHeroes: 10`.

### Task 5: Calculator Status Groups

**Files:**
- Modify: `damage-calculator.html`
- Modify: `damage-calculator.js`
- Modify: `damage-calculator.css`

- [ ] **Step 1: Add status fields to rendered rows**

In `damage-calculator.js`, include `component.status` and `component.source` in row text. Rows with `status === 'reference_only'` or `status === 'unsupported'` should have disabled checkboxes and visible reason text.

- [ ] **Step 2: Add CSS status styling**

In `damage-calculator.css`, add classes:

```css
.damage-table tr[data-status="implemented"] {
  background: rgba(76, 175, 80, 0.04);
}

.damage-table tr[data-status="reference_only"] {
  background: rgba(214, 179, 106, 0.05);
}

.damage-table tr[data-status="unsupported"] {
  background: rgba(255, 99, 71, 0.05);
}
```

- [ ] **Step 3: Browser verify**

Run:

```bash
npm start
```

Open `/damage-calculator.html`, select Slardar, and verify:

- `深海重击` is selectable and marked curated.
- `侵蚀雾霭` is visible as reference-only and not included in totals.
- Total still computes Slardar Bash as `352` when selected alone at level 5.

### Task 6: Prompt And Power Spike Integration

**Files:**
- Modify: `powerSpikeContext.js`
- Modify: `dotaDataContext.js`
- Test: `test/powerSpikeContext.test.js`
- Test: `test/dotaDataContext.test.js`

- [ ] **Step 1: Add tests for curated model wording**

In `test/dotaDataContext.test.js`, add a prompt test that builds Slardar context and asserts that the prompt includes `深海重击`, `按攻击次数触发`, and does not describe the ability as missing.

- [ ] **Step 2: Prefer curated resolver in power spikes**

Modify `powerSpikeContext.js` so situational references include `modelSource`, `status`, and `model`. Keep fixed instant totals conservative.

- [ ] **Step 3: Update prompt formatting**

Modify `dotaDataContext.js` so reference-only and unsupported abilities are explicitly described as local model statuses rather than omitted.

- [ ] **Step 4: Verify context tests**

Run:

```bash
npm test -- test/powerSpikeContext.test.js test/dotaDataContext.test.js
```

Expected: tests pass.

### Task 7: Full Verification And Service Restart

**Files:**
- No source files unless verification exposes a defect.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm test
node --check damageModels/schema.js damageModels/registry.js damageModels/resolver.js damageModels/coverage.js scripts/damage-coverage.js damageCalculator.js damageExtractor.js dotaDataContext.js powerSpikeContext.js damage-calculator.js server.js
```

Expected: all tests pass and syntax checks exit `0`.

- [ ] **Step 2: Restart service**

Run:

```bash
lsof -ti tcp:3002 | xargs kill
npm start
```

Expected: server prints `Server listening at http://localhost:3002`.

- [ ] **Step 3: API smoke test**

Run:

```bash
curl -s http://localhost:3002/api/damage/heroes/Slardar
```

Expected: response includes `深海重击（Bash of the Deep）`, `attack_sequence`, and `curated`.

- [ ] **Step 4: Browser smoke test**

Open:

```txt
http://localhost:3002/damage-calculator.html
```

Select Slardar and Sand King. Verify the UI shows curated model status, Chinese skill names, Slardar attack sequence, and Sand King duration control.

---

## Self-Review

Spec coverage:

- Declarative per-hero model schema is covered in Tasks 1 and 3.
- Coverage reporting is covered in Task 2.
- First ten hero models are covered in Task 4.
- Calculator surfacing is covered in Task 5.
- Prompt and power-spike migration is covered in Task 6.
- Full verification and service restart are covered in Task 7.

Placeholder scan:

- The plan contains no placeholder markers or intentionally incomplete task.

Type consistency:

- The plan consistently uses `status`, `model`, `source`, `modelSource`, `valuesByAbilityLevel`, and `metadata.attackCountByAbilityLevel`.
