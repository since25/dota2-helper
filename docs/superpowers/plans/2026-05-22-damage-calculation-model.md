# Damage Calculation Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad hoc single-field damage extraction with a component-based damage model that separates fixed instant damage from theoretical sustained/multi-wave totals and conditional references.

**Architecture:** Add a focused component model in `damageExtractor.js`, then update `powerSpikeContext.js` to aggregate fixed instant damage separately from situational references. Keep compatibility aliases during migration so existing prompt and tests can move incrementally.

**Tech Stack:** Node.js CommonJS modules, `node:test`, local `dotaconstants` fixtures.

---

### Task 1: Component Extraction API

**Files:**
- Modify: `damageExtractor.js`
- Test: `test/damageExtractor.test.js`

- [ ] **Step 1: Write failing tests for component output**

Add tests that call `extractAbilityDamage()` and assert the new `components` array:

```js
test('extractAbilityDamage exposes instant fixed Burrowstrike component', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_burrowstrike'));

  assert.equal(damage.abilityName, 'Burrowstrike');
  assert.deepEqual(damage.components.map((component) => ({
    kind: component.kind,
    growthKind: component.growthKind,
    valuesByAbilityLevel: component.valuesByAbilityLevel,
    countInFixedInstantTotal: component.countInFixedInstantTotal
  })), [{
    kind: 'instant_fixed',
    growthKind: 'non_growth',
    valuesByAbilityLevel: [80, 150, 220, 290],
    countInFixedInstantTotal: true
  }]);
});

test('extractAbilityDamage exposes Sand Storm sustained total metadata', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_sand_storm'));
  const component = damage.components.find((entry) => entry.kind === 'sustained');

  assert.ok(component);
  assert.deepEqual(component.valuesByAbilityLevel, [30, 50, 70, 90]);
  assert.deepEqual(component.metadata.durationByAbilityLevel, [16, 20, 24, 28]);
  assert.equal(component.formula.type, 'duration_times_dps');
  assert.equal(component.countInFixedInstantTotal, false);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/damageExtractor.test.js
```

Expected: the new tests fail because `components`, `abilityName`, and sustained metadata are not implemented yet.

- [ ] **Step 3: Implement component extraction**

Update `damageExtractor.js` to:

```js
function extractAbilityDamage(ability) {
  const components = buildDamageComponents(ability);
  const primaryComponent = components[0] || null;
  const levelCount = primaryComponent?.valuesByAbilityLevel.length || (Array.isArray(ability.mc) ? ability.mc.length : 1);

  return {
    abilityName: ability.dname || ability.name || '',
    name: ability.dname || ability.name || '',
    damageType: ability.dmg_type || 'Unknown',
    behavior: ability.behavior || '',
    components,
    damageKind: primaryComponent?.kind || 'none',
    countsAsFixedBurst: Boolean(primaryComponent?.countInFixedInstantTotal),
    damageLabel: primaryComponent?.label || '',
    damageByAbilityLevel: primaryComponent?.valuesByAbilityLevel || [],
    manaCostByAbilityLevel: normalizeNumericArray(ability.mc, levelCount),
    cooldownByAbilityLevel: normalizeNumericArray(ability.cd, levelCount),
    caveats: detectCaveatsFromComponents(ability, components)
  };
}
```

`buildDamageComponents()` should read `ability.dmg`, semantic damage attrs, and metadata attrs, then classify components into `instant_fixed`, `sustained`, `multi_wave`, `conditional`, `attack_modifier`, `scaling`, `growth`, or `unknown`.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/damageExtractor.test.js
```

Expected: all damage extractor tests pass.

### Task 2: Sustained And Multi-Wave Formula Totals

**Files:**
- Modify: `damageExtractor.js`
- Test: `test/damageExtractor.test.js`

- [ ] **Step 1: Write failing tests for theoretical totals**

Add:

```js
test('extractAbilityDamage calculates Sand Storm theoretical totals', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_sand_storm'));
  const component = damage.components.find((entry) => entry.kind === 'sustained');

  assert.deepEqual(component.theoreticalTotalByAbilityLevel, [480, 1000, 1680, 2520]);
  assert.equal(component.totalFormula, 'duration * damagePerSecond');
});

test('extractAbilityDamage calculates Epicenter pulse totals', async () => {
  const damage = extractAbilityDamage(await getAbility('sandking_epicenter'));
  const component = damage.components.find((entry) => entry.kind === 'multi_wave');

  assert.ok(component);
  assert.deepEqual(component.valuesByAbilityLevel, [60, 70, 80]);
  assert.deepEqual(component.metadata.waveCountByAbilityLevel, [12, 16, 20]);
  assert.deepEqual(component.theoreticalTotalByAbilityLevel, [720, 1120, 1600]);
  assert.equal(component.totalFormula, 'waveCount * damagePerWave');
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/damageExtractor.test.js
```

Expected: tests fail because theoretical totals are missing.

- [ ] **Step 3: Implement formula helpers**

Add helpers in `damageExtractor.js`:

```js
function multiplyLevelArrays(left, right) {
  const length = Math.max(left.length, right.length);
  const expandedLeft = expandValues(left, length);
  const expandedRight = expandValues(right, length);
  return expandedLeft.map((value, index) => roundDamage(value * expandedRight[index]));
}

function roundDamage(value) {
  return Math.round(value * 100) / 100;
}
```

Use duration metadata for sustained damage and pulse/wave count metadata for multi-wave damage.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/damageExtractor.test.js
```

Expected: all damage extractor tests pass.

### Task 3: Power Spike Aggregation

**Files:**
- Modify: `powerSpikeContext.js`
- Test: `test/powerSpikeContext.test.js`

- [ ] **Step 1: Write failing tests for new power spike shape**

Add:

```js
test('buildHeroPowerSpikes separates Sand King fixed instant and theoretical sustained damage', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Sand King'));
  const level5 = spikes.find((spike) => spike.level === 5);

  assert.equal(level5.fixedInstantDamage.raw, 220);
  assert.equal(level5.fixedInstantDamage.afterDefaultResistance, 165);
  assert.deepEqual(level5.fixedInstantDamage.skills.map((skill) => skill.name), ['Burrowstrike']);

  const sandStorm = level5.situationalDamageRefs.find((skill) => skill.name === 'Sand Storm');
  assert.equal(sandStorm.kind, 'sustained');
  assert.equal(sandStorm.theoreticalTotal, 1680);
  assert.equal(sandStorm.totalFormula, 'duration * damagePerSecond');
});

test('buildHeroPowerSpikes exposes Epicenter as multi-wave theoretical damage', async () => {
  const spikes = buildHeroPowerSpikes(await getHeroDetails('Sand King'));
  const level6 = spikes.find((spike) => spike.level === 6);
  const epicenter = level6.situationalDamageRefs.find((skill) => skill.name === 'Epicenter');

  assert.equal(epicenter.kind, 'multi_wave');
  assert.equal(epicenter.theoreticalTotal, 720);
  assert.equal(epicenter.totalFormula, 'waveCount * damagePerWave');
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/powerSpikeContext.test.js
```

Expected: tests fail because `fixedInstantDamage` and `situationalDamageRefs` are not fully implemented.

- [ ] **Step 3: Implement aggregation**

Update `powerSpikeContext.js` so each spike returns:

```js
{
  fixedInstantDamage: {
    raw,
    byType,
    afterDefaultResistance,
    skills
  },
  situationalDamageRefs,
  rawDamage: raw,
  damageByType: byType,
  estimatedAfterDefaultResistance: afterDefaultResistance
}
```

The old fields remain compatibility aliases only.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/powerSpikeContext.test.js
```

Expected: all power spike tests pass.

### Task 4: Prompt Contract Update

**Files:**
- Modify: `dotaDataContext.js`
- Test: `test/dotaDataContext.test.js`

- [ ] **Step 1: Write failing prompt tests**

Add:

```js
test('buildGroundedChinesePrompt distinguishes fixed instant and theoretical damage', async () => {
  const context = await buildMatchContext({
    myTeam: [
      { hero: 'Sand King', role: 'Offlane' },
      { hero: 'Crystal Maiden', role: 'Support' },
      { hero: 'Drow Ranger', role: 'Safe Lane' },
      { hero: 'Puck', role: 'Midlane' },
      { hero: 'Lion', role: 'Hard Support' }
    ],
    opponentTeam: [
      { hero: 'Axe', role: 'Offlane' },
      { hero: 'Queen of Pain', role: 'Midlane' },
      { hero: 'Juggernaut', role: 'Safe Lane' },
      { hero: 'Disruptor', role: 'Support' },
      { hero: 'Jakiro', role: 'Hard Support' }
    ]
  });
  const prompt = buildGroundedChinesePrompt(context);

  assert.match(prompt, /固定瞬时伤害/);
  assert.match(prompt, /理论持续\/多波总伤害/);
  assert.match(prompt, /不能把它们说成完整斩杀线/);
});
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- test/dotaDataContext.test.js
```

Expected: prompt wording test fails until formatting uses the new fields.

- [ ] **Step 3: Update formatting**

Update `formatSpikeForPrompt()` to render:

```text
固定瞬时伤害 ...
理论持续/多波总伤害 ...
条件/普攻/成长伤害参考 ...
```

Use `fixedInstantDamage` and `situationalDamageRefs` as the source of truth.

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- test/dotaDataContext.test.js
```

Expected: prompt tests pass.

### Task 5: Final Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- test/damageExtractor.test.js test/powerSpikeContext.test.js test/dotaDataContext.test.js
```

Expected: all targeted tests pass.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run syntax checks**

Run:

```bash
node --check damageExtractor.js
node --check powerSpikeContext.js
node --check dotaDataContext.js
```

Expected: no syntax errors.

- [ ] **Step 4: Inspect Sand King level 5 output**

Run:

```bash
node - <<'NODE'
const { getHeroDetails } = require('./dotaDataContext');
const { buildHeroPowerSpikes } = require('./powerSpikeContext');
(async () => {
  const level5 = buildHeroPowerSpikes(await getHeroDetails('Sand King')).find((spike) => spike.level === 5);
  console.log(JSON.stringify(level5, null, 2));
})();
NODE
```

Expected: fixed instant damage is `220`, Sand Storm theoretical total is visible separately, and old mixed value `112.9` is absent.
