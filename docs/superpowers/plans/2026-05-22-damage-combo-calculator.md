# Damage Combo Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone local-data damage combo calculator for one hero, hero level, selected skills/items, and manually entered enemy armor and magic resistance.

**Architecture:** Add a pure calculation module for hero damage components and resistance math, expose it through two Express API routes, and build a standalone vanilla JS frontend page. The calculator reuses the component-based damage adapter and does not call the LLM or subscription middleware.

**Tech Stack:** Node.js CommonJS, Express, vanilla HTML/CSS/JS, `node:test`, Playwright browser smoke verification.

---

### Task 1: Damage Calculator Core

**Files:**
- Create: `damageCalculator.js`
- Test: `test/damageCalculator.test.js`

- [ ] **Step 1: Write failing tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  adjustDamageByType,
  calculateDamageCombo,
  physicalMultiplier
} = require('../damageCalculator');

test('physicalMultiplier applies Dota armor approximation', () => {
  assert.equal(physicalMultiplier(0), 1);
  assert.equal(Math.round(physicalMultiplier(10) * 10000) / 10000, 0.625);
});

test('adjustDamageByType applies manual resistance inputs', () => {
  assert.equal(adjustDamageByType(100, 'Magical', { enemyMagicResistancePercent: 25, enemyArmor: 0 }), 75);
  assert.equal(adjustDamageByType(100, 'Pure', { enemyMagicResistancePercent: 25, enemyArmor: 0 }), 100);
  assert.equal(adjustDamageByType(100, 'Physical', { enemyMagicResistancePercent: 25, enemyArmor: 0 }), 100);
});

test('calculateDamageCombo totals Sand King Burrowstrike and Sand Storm theoretical damage', async () => {
  const result = await calculateDamageCombo({
    hero: 'Sand King',
    heroLevel: 5,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 3,
        valueMode: 'base'
      },
      {
        sourceType: 'ability',
        abilityName: 'Sand Storm',
        componentId: 'Sand Storm:sustained:sand_storm_damage',
        abilityLevel: 3,
        valueMode: 'theoretical'
      }
    ]
  });

  assert.equal(result.totals.raw, 1900);
  assert.equal(result.totals.adjusted, 1425);
  assert.equal(result.components.find((entry) => entry.name === 'Burrowstrike').raw, 220);
  assert.equal(result.components.find((entry) => entry.name === 'Sand Storm').raw, 1680);
});
```

- [ ] **Step 2: Run test to verify RED**

Run `npm test -- test/damageCalculator.test.js`.

- [ ] **Step 3: Implement core**

Create `damageCalculator.js` with exported functions:

- `physicalMultiplier(armor)`
- `adjustDamageByType(raw, damageType, params)`
- `getHeroDamageProfile(heroName)`
- `calculateDamageCombo(request)`

- [ ] **Step 4: Run test to verify GREEN**

Run `npm test -- test/damageCalculator.test.js`.

### Task 2: Damage API Routes

**Files:**
- Modify: `server.js`
- Test: `test/damageApi.test.js`

- [ ] **Step 1: Write API tests**

Use `node:test` with exported app or direct helper functions if server export is not practical. Test that `getHeroDamageProfile('Sand King')` contains Sand Storm theoretical totals and `calculateDamageCombo()` handles the sample request.

- [ ] **Step 2: Add routes**

Add:

- `GET /api/damage/heroes/:hero`
- `POST /api/damage/calculate`

These routes must not use `rateLimitMiddleware`.

- [ ] **Step 3: Run route/core tests**

Run `npm test -- test/damageCalculator.test.js test/damageApi.test.js`.

### Task 3: Standalone Frontend

**Files:**
- Create: `damage-calculator.html`
- Create: `damage-calculator.js`
- Create: `damage-calculator.css`

- [ ] **Step 1: Build page shell**

Create a Chinese standalone calculator page with:

- hero selector
- hero level input
- enemy armor input
- enemy magic resistance input
- ability component table
- item component table
- summary panel

- [ ] **Step 2: Implement frontend script**

`damage-calculator.js` should:

- load heroes from `/api/heroes`
- fetch profile from `/api/damage/heroes/:hero`
- render ability components
- allow selecting components and value mode
- post to `/api/damage/calculate`
- render totals and component details

- [ ] **Step 3: Add minimal styling**

Use dense dashboard-like styling and avoid changing the main page design.

### Task 4: Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- test/damageCalculator.test.js test/damageExtractor.test.js test/powerSpikeContext.test.js test/dotaDataContext.test.js
```

- [ ] **Step 2: Run full tests**

Run:

```bash
npm test
```

- [ ] **Step 3: Run syntax checks**

Run:

```bash
node --check damageCalculator.js
node --check server.js
node --check damage-calculator.js
```

- [ ] **Step 4: Browser smoke check**

Start the local service and open `/damage-calculator.html`. Verify Sand King level 5 with Burrowstrike level 3 and Sand Storm theoretical mode shows raw `1900` and adjusted `1425` with armor `0` and magic resistance `25`.
