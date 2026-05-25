# Combat Semantic Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inherited payment-gated calculator with a local Dota combat semantic engine, item/hero assertion adapters, attack-window calculation, and a local-only Dota 2 Lua verification harness.

**Architecture:** First remove Stripe/Redis subscription plumbing so the app is a clean local-data calculator and AI helper. Then add pure `combat/` modules for stats, rules, damage events, and attack windows, feed them from reviewed semantic assertions, and expose the richer model through the existing calculator endpoints. The Lua verifier lives under `tools/dota-addon/` and produces local development artifacts only.

**Tech Stack:** Node.js CommonJS modules, Express 5, built-in `node:test`, vanilla browser JavaScript, `dotaconstants`, `dota2-datawrapper`, Dota 2 Workshop Tools Lua/VScript for local manual verification.

---

## File Structure

Create:

- `combat/rules.js`: pure armor, magic resistance, amplification, and crit helper functions.
- `combat/stats.js`: pure hero attribute, attack damage, attack speed, and item stat application functions.
- `combat/damageEvents.js`: pure damage event construction and staged adjustment functions.
- `combat/attackWindow.js`: pure attack-count and duration-window calculation.
- `combat/semanticTypes.js`: calculation-facing semantic type constants and validation helpers.
- `combat/semanticAssertions.js`: generic assertion helpers and confidence handling.
- `combat/itemEffectAdapter.js`: item model to combat assertion conversion.
- `combat/heroEffectAdapter.js`: hero damage profile component to combat assertion conversion.
- `docs/combat-rules/armor.md`: local armor rule note.
- `docs/combat-rules/magic-resistance.md`: local magic resistance rule note.
- `docs/combat-rules/crit.md`: local crit rule note.
- `scripts/export-engine-fixture.js`: export one local calculator scenario to a Dota engine fixture.
- `scripts/compare-engine-result.js`: compare a local fixture against a copied Lua engine result.
- `tools/dota-addon/README.md`: local setup and manual workflow.
- `tools/dota-addon/scripts/vscripts/addon_game_mode.lua`: addon entrypoint and fixture runner skeleton.
- `tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua`: Lua fixture runner logic.
- `tools/dota-addon/generated/.gitkeep`: keep generated folder present while ignoring generated outputs.
- `test/combatRules.test.js`
- `test/combatStats.test.js`
- `test/combatSemanticAssertions.test.js`
- `test/combatAttackWindow.test.js`
- `test/engineFixtureExport.test.js`
- `test/engineResultCompare.test.js`

Modify:

- `server.js`: remove payment/subscription/rate-limit routes and wire calculator to combat engine internals.
- `script.js`: remove subscription token, checkout, portal, recovery, and subscription status code.
- `index.html`: remove subscription UI elements.
- `style.css`: remove subscription and checkout styles.
- `package.json`: remove Stripe/Redis dependencies; add local verification scripts.
- `package-lock.json`: regenerate after dependency/script changes.
- `README.md`: replace Stripe/Redis setup with local combat and engine verification setup.
- `damageCalculator.js`: delegate rules/stats/item modifiers to `combat/` modules.
- `calculatorWorkbench.js`: expose attack-window controls and combat assertion metadata.
- `damage-calculator.js`: render combat stats, attack windows, staged damage events, and assertion warnings.
- `test/serverSecurity.test.js`: keep static asset and formatter tests; remove payment/subscription-specific tests.
- `test/dataViewerPages.test.js`: remove subscription UI expectations.
- `test/damageCalculator.test.js`: add attack-window integration cases.
- `.gitignore`: ignore generated Dota engine fixtures and local verification outputs.

Delete:

- `appConfig.js`
- `test/appConfig.test.js`

Those two files were temporary config-hardening work from the prior warning audit. This plan supersedes them by removing Stripe/Redis entirely.

---

### Task 1: Remove Payment, Subscription, Redis, and Rate-Limit Legacy

**Files:**
- Delete: `appConfig.js`
- Delete: `test/appConfig.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `server.js`
- Modify: `script.js`
- Modify: `index.html`
- Modify: `style.css`
- Modify: `README.md`
- Modify: `test/serverSecurity.test.js`
- Modify: `test/dataViewerPages.test.js`

- [ ] **Step 1: Write failing server cleanup tests**

Replace the subscription-specific tests in `test/serverSecurity.test.js` with tests that assert payment routes are gone and `/api/get-tips` no longer depends on Redis.

```js
test('payment and subscription routes are not mounted in this fork', async () => {
  const app = createApp({ redis: null, stripe: null });

  await withServer(app, async (baseUrl) => {
    for (const [method, path] of [
      ['POST', '/api/create-checkout-session'],
      ['POST', '/api/create-portal-session'],
      ['POST', '/api/webhook'],
      ['POST', '/api/recover-token'],
      ['GET', '/api/checkout-success?session_id=cs_test'],
      ['GET', '/api/subscription-status']
    ]) {
      const response = await fetch(`${baseUrl}${path}`, { method });
      assert.equal(response.status, 404, `${method} ${path} must be removed`);
    }
  });
});

test('get-tips runs without subscription storage or rate limiting', async () => {
  const calls = [];
  const fakeAxios = {
    async post(url, payload, options) {
      calls.push({ url, payload, options });
      return { data: { choices: [{ message: { content: '测试建议' } }] } };
    }
  };
  const fakeConfig = {
    provider: 'test',
    model: 'test-model',
    baseUrl: 'https://ai.example.test/v1',
    chatCompletionsUrl: 'https://ai.example.test/v1/chat/completions',
    apiKey: '',
    includeReasoningEffort: false
  };
  const fakeDataProvider = {
    async buildMatchContext() {
      return {
        teams: {
          myTeam: ['A', 'B', 'C', 'D', 'E'].map((hero) => ({ hero })),
          opponentTeam: ['F', 'G', 'H', 'I', 'J'].map((hero) => ({ hero }))
        }
      };
    },
    buildGroundedChinesePrompt() {
      return '固定提示';
    }
  };
  const app = createApp({
    axiosInstance: fakeAxios,
    aiConfig: fakeConfig,
    dataProvider: fakeDataProvider
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/get-tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        myTeam: [
          { role: 'Safe Lane', hero: 'A' },
          { role: 'Midlane', hero: 'B' },
          { role: 'Offlane', hero: 'C' },
          { role: 'Support', hero: 'D' },
          { role: 'Hard Support', hero: 'E' }
        ],
        opponentTeam: [
          { role: 'Safe Lane', hero: 'F' },
          { role: 'Midlane', hero: 'G' },
          { role: 'Offlane', hero: 'H' },
          { role: 'Support', hero: 'I' },
          { role: 'Hard Support', hero: 'J' }
        ]
      })
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.tips, '测试建议');
    assert.equal(Object.hasOwn(data, 'remaining'), false);
    assert.equal(Object.hasOwn(data, 'isPro'), false);
    assert.equal(calls.length, 1);
  });
});
```

- [ ] **Step 2: Run server cleanup tests and verify they fail**

Run:

```bash
node --test test/serverSecurity.test.js
```

Expected: FAIL because the payment/subscription routes are still mounted and `get-tips` still returns rate-limit subscription fields.

- [ ] **Step 3: Remove payment and Redis imports, app locals, middleware, and routes from `server.js`**

Remove these runtime imports and constants:

```js
const { Redis } = require('@upstash/redis');
const Stripe = require('stripe');
const crypto = require('crypto');
const { buildRedisConfig, buildRuntimeWarnings, buildStripeConfig } = require('./appConfig');
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const FREE_TIER_LIMIT = 3;
const stripeConfig = buildStripeConfig();
const redisConfig = buildRedisConfig();
const stripe = stripeConfig.enabled ? new Stripe(stripeConfig.secretKey) : null;
const redis = redisConfig ? new Redis({ url: redisConfig.url, token: redisConfig.token }) : null;
```

Remove `app.locals.redis`, `app.locals.stripe`, and `app.use('/api/webhook', express.raw(...))` from `createApp`.

Delete the whole `rateLimitMiddleware` function and every route from `// --- Stripe Endpoints ---` through `/api/recover-token`.

Change the `get-tips` route signature:

```js
app.post('/api/get-tips', async (req, res) => {
```

Remove the successful-response increment block and return only tips:

```js
res.json({ tips });
```

- [ ] **Step 4: Remove payment and subscription frontend code**

In `script.js`, delete functions and calls related to:

```js
checkSubscriptionStatus
handleCheckoutSuccess
updateSubscriptionUi
startCheckout
openBillingPortal
recoverSubscription
subscriptionToken
localStorage subscription token
```

In `index.html`, remove subscription bar markup and any buttons for upgrade, portal, and recovery.

In `style.css`, remove selectors:

```css
.subscription-bar
.checkout-btn
```

Keep unrelated layout and calculator styles.

- [ ] **Step 5: Remove dependencies and temporary config helper**

Run:

```bash
npm uninstall @upstash/redis stripe
```

Delete:

```bash
rm appConfig.js test/appConfig.test.js
```

If `rm` is not used by the execution environment, delete both files through the normal file edit tool.

- [ ] **Step 6: Update README payment section**

Replace the Stripe/Upstash section with:

```markdown
### 支付与限流

本 fork 已移除上游遗留的 Stripe 会员支付、Upstash Redis 订阅 token 和免费次数限流逻辑。当前服务只需要本地 Dota 数据、AI 端点配置和 Node 运行环境。

服务器部署不需要 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`STRIPE_PRICE_ID`、`KV_REST_API_URL`、`KV_REST_API_TOKEN`、`UPSTASH_REDIS_REST_URL` 或 `UPSTASH_REDIS_REST_TOKEN`。
```

- [ ] **Step 7: Update data viewer UI test**

In `test/dataViewerPages.test.js`, remove the assertion that looks for:

```js
data.error || data.message || 'No active subscription found for this email.'
```

Replace it with an assertion that no subscription recovery text remains in `script.js`:

```js
test('main script no longer contains subscription recovery flow', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  assert.equal(js.includes('/api/recover-token'), false);
  assert.equal(js.includes('/api/create-checkout-session'), false);
  assert.equal(js.includes('/api/subscription-status'), false);
});
```

- [ ] **Step 8: Run cleanup verification**

Run:

```bash
npm test
```

Expected: PASS, with no Stripe or Redis runtime warnings.

- [ ] **Step 9: Commit cleanup**

```bash
git add package.json package-lock.json server.js script.js index.html style.css README.md test/serverSecurity.test.js test/dataViewerPages.test.js
git add -u appConfig.js test/appConfig.test.js
git commit -m "refactor: remove subscription payment legacy"
```

---

### Task 2: Add Pure Combat Rules and Stats Modules

**Files:**
- Create: `combat/rules.js`
- Create: `combat/stats.js`
- Test: `test/combatRules.test.js`
- Test: `test/combatStats.test.js`
- Modify: `package.json` only if test scripts need no change; otherwise leave unchanged.

- [ ] **Step 1: Write failing combat rules tests**

Create `test/combatRules.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyDamageAmp,
  applyMagicResistance,
  expectedCritMultiplier,
  physicalMultiplier,
  resolveCritMultiplier
} = require('../combat/rules');

test('physicalMultiplier matches Dota armor approximation for positive zero and negative armor', () => {
  assert.equal(physicalMultiplier(0), 1);
  assert.equal(Number(physicalMultiplier(10).toFixed(6)), 0.625);
  assert.equal(Number(physicalMultiplier(-10).toFixed(6)), 1.375);
});

test('applyMagicResistance multiplies incoming damage multipliers', () => {
  const result = applyMagicResistance(1000, [
    { source: 'base', resistancePercent: 25 },
    { source: 'cloak', resistancePercent: 20 },
    { source: 'debuff', resistancePercent: -30 }
  ]);

  assert.equal(result.adjusted, 780);
  assert.deepEqual(result.stages.map((stage) => stage.source), ['base', 'cloak', 'debuff']);
});

test('applyDamageAmp applies spell amp then generic damage amp as visible stages', () => {
  const result = applyDamageAmp(100, {
    spellAmpPercent: 20,
    damageAmpPercent: 10,
    damageType: 'Magical'
  });

  assert.equal(result.adjusted, 132);
  assert.deepEqual(result.stages.map((stage) => stage.source), ['spell_amp', 'damage_amp']);
});

test('resolveCritMultiplier chooses forced crit source deterministically', () => {
  const crits = [
    { source: 'greater_crit', multiplierPercent: 225, chancePercent: 30 },
    { source: 'hero', multiplierPercent: 450, chancePercent: 15 }
  ];

  assert.deepEqual(resolveCritMultiplier(crits, { forceCritSource: 'hero' }), {
    source: 'hero',
    multiplier: 4.5,
    mode: 'forced'
  });
});

test('expectedCritMultiplier computes independent expected value without random simulation', () => {
  const crits = [{ source: 'greater_crit', multiplierPercent: 225, chancePercent: 30 }];
  assert.equal(expectedCritMultiplier(crits), 1.375);
});
```

- [ ] **Step 2: Run combat rules tests and verify they fail**

Run:

```bash
node --test test/combatRules.test.js
```

Expected: FAIL with `Cannot find module '../combat/rules'`.

- [ ] **Step 3: Implement `combat/rules.js`**

Create `combat/rules.js`:

```js
function round(value) {
  return Math.round(value * 100) / 100;
}

function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}

function applyMagicResistance(raw, resistances = []) {
  let multiplier = 1;
  const stages = [];
  for (const entry of resistances) {
    const resistancePercent = Number(entry.resistancePercent || 0);
    const stageMultiplier = 1 - resistancePercent / 100;
    multiplier *= stageMultiplier;
    stages.push({
      source: entry.source || 'magic_resistance',
      resistancePercent,
      multiplier: stageMultiplier
    });
  }
  return {
    adjusted: round(raw * multiplier),
    multiplier,
    stages
  };
}

function applyDamageAmp(raw, {
  spellAmpPercent = 0,
  damageAmpPercent = 0,
  damageType = 'Unknown'
} = {}) {
  let adjusted = raw;
  const stages = [];

  if (damageType === 'Magical' && spellAmpPercent) {
    const multiplier = 1 + Number(spellAmpPercent) / 100;
    adjusted *= multiplier;
    stages.push({ source: 'spell_amp', percent: Number(spellAmpPercent), multiplier });
  }

  if (damageAmpPercent) {
    const multiplier = 1 + Number(damageAmpPercent) / 100;
    adjusted *= multiplier;
    stages.push({ source: 'damage_amp', percent: Number(damageAmpPercent), multiplier });
  }

  return { adjusted: round(adjusted), stages };
}

function resolveCritMultiplier(crits = [], options = {}) {
  if (options.forceCritSource) {
    const forced = crits.find((crit) => crit.source === options.forceCritSource);
    if (forced) {
      return {
        source: forced.source,
        multiplier: Number(forced.multiplierPercent || 100) / 100,
        mode: 'forced'
      };
    }
  }

  return { source: null, multiplier: 1, mode: 'none' };
}

function expectedCritMultiplier(crits = []) {
  return round(crits.reduce((expected, crit) => {
    const chance = Number(crit.chancePercent || 0) / 100;
    const multiplier = Number(crit.multiplierPercent || 100) / 100;
    return expected + chance * (multiplier - 1);
  }, 1));
}

module.exports = {
  applyDamageAmp,
  applyMagicResistance,
  expectedCritMultiplier,
  physicalMultiplier,
  resolveCritMultiplier,
  round
};
```

- [ ] **Step 4: Run combat rules tests and verify they pass**

Run:

```bash
node --test test/combatRules.test.js
```

Expected: PASS.

- [ ] **Step 5: Write failing combat stats tests**

Create `test/combatStats.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyStatAssertions,
  attackDamageAtLevel,
  attacksPerSecond,
  heroAttributesAtLevel
} = require('../combat/stats');

const strengthHero = {
  primaryAttribute: 'str',
  baseStrength: 25,
  strengthGain: 3,
  baseAgility: 18,
  agilityGain: 2,
  baseIntelligence: 16,
  intelligenceGain: 1.5,
  baseAttackMin: 30,
  baseAttackMax: 36,
  attackRate: 1.7
};

test('heroAttributesAtLevel derives level-scaled attributes', () => {
  assert.deepEqual(heroAttributesAtLevel(strengthHero, 6), {
    strength: 40,
    agility: 28,
    intelligence: 23.5
  });
});

test('attackDamageAtLevel uses primary attribute and flat attack items', () => {
  const attrs = heroAttributesAtLevel(strengthHero, 6);
  const attack = attackDamageAtLevel(strengthHero, attrs, [
    { semanticType: 'stat.attack_damage.flat', values: [18], sourceKey: 'broadsword' }
  ]);

  assert.deepEqual(attack, {
    min: 88,
    max: 94,
    average: 91,
    flatBonus: 18
  });
});

test('applyStatAssertions applies attribute items before attack damage', () => {
  const result = applyStatAssertions(strengthHero, 6, [
    { semanticType: 'stat.attribute.flat', attribute: 'strength', values: [10], sourceKey: 'belt_of_strength' },
    { semanticType: 'stat.attack_damage.flat', values: [18], sourceKey: 'broadsword' }
  ]);

  assert.equal(result.attributes.strength, 50);
  assert.equal(result.attackDamage.average, 101);
});

test('attacksPerSecond includes agility and flat attack speed bonuses', () => {
  const result = attacksPerSecond(strengthHero, { agility: 28 }, [
    { semanticType: 'stat.attack_speed.flat', values: [25], sourceKey: 'gloves' }
  ]);

  assert.equal(result.attackSpeed, 153);
  assert.equal(Number(result.attacksPerSecond.toFixed(4)), 0.9);
});
```

- [ ] **Step 6: Run combat stats tests and verify they fail**

Run:

```bash
node --test test/combatStats.test.js
```

Expected: FAIL with `Cannot find module '../combat/stats'`.

- [ ] **Step 7: Implement `combat/stats.js`**

Create `combat/stats.js`:

```js
const { round } = require('./rules');

function firstNumber(assertion) {
  const values = assertion.values || [];
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function heroAttributesAtLevel(stats, heroLevel) {
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  return {
    strength: round(Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained),
    agility: round(Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained),
    intelligence: round(Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained)
  };
}

function primaryAttributeDamage(stats, attributes) {
  if (stats.primaryAttribute === 'all') {
    return (attributes.strength + attributes.agility + attributes.intelligence) * 0.7;
  }
  return {
    str: attributes.strength,
    agi: attributes.agility,
    int: attributes.intelligence
  }[stats.primaryAttribute] || 0;
}

function attackDamageAtLevel(stats, attributes, assertions = []) {
  const flatBonus = assertions
    .filter((assertion) => assertion.semanticType === 'stat.attack_damage.flat')
    .reduce((sum, assertion) => sum + firstNumber(assertion), 0);
  const primaryDamage = primaryAttributeDamage(stats, attributes);
  const min = round(Number(stats.baseAttackMin || 0) + primaryDamage + flatBonus);
  const max = round(Number(stats.baseAttackMax || 0) + primaryDamage + flatBonus);
  return { min, max, average: round((min + max) / 2), flatBonus };
}

function applyAttributeAssertions(attributes, assertions = []) {
  const next = { ...attributes };
  for (const assertion of assertions) {
    if (assertion.semanticType !== 'stat.attribute.flat') continue;
    const amount = firstNumber(assertion);
    if (assertion.attribute === 'strength') next.strength = round(next.strength + amount);
    if (assertion.attribute === 'agility') next.agility = round(next.agility + amount);
    if (assertion.attribute === 'intelligence') next.intelligence = round(next.intelligence + amount);
    if (assertion.attribute === 'all') {
      next.strength = round(next.strength + amount);
      next.agility = round(next.agility + amount);
      next.intelligence = round(next.intelligence + amount);
    }
  }
  return next;
}

function attacksPerSecond(stats, attributes, assertions = []) {
  const attackSpeedBonus = assertions
    .filter((assertion) => assertion.semanticType === 'stat.attack_speed.flat')
    .reduce((sum, assertion) => sum + firstNumber(assertion), 0);
  const attackSpeed = round(100 + Number(attributes.agility || 0) + attackSpeedBonus);
  const attackRate = Number(stats.attackRate || 1.7);
  return {
    attackSpeed,
    attackRate,
    attacksPerSecond: attackRate > 0 ? attackSpeed / 100 / attackRate : 0
  };
}

function applyStatAssertions(stats, heroLevel, assertions = []) {
  const baseAttributes = heroAttributesAtLevel(stats, heroLevel);
  const attributes = applyAttributeAssertions(baseAttributes, assertions);
  return {
    attributes,
    attackDamage: attackDamageAtLevel(stats, attributes, assertions),
    attackSpeed: attacksPerSecond(stats, attributes, assertions)
  };
}

module.exports = {
  applyStatAssertions,
  attackDamageAtLevel,
  attacksPerSecond,
  heroAttributesAtLevel
};
```

- [ ] **Step 8: Run stats and rules tests**

Run:

```bash
node --test test/combatRules.test.js test/combatStats.test.js
```

Expected: PASS.

- [ ] **Step 9: Commit combat foundation**

```bash
git add combat/rules.js combat/stats.js test/combatRules.test.js test/combatStats.test.js
git commit -m "feat: add combat rules foundation"
```

---

### Task 3: Add Calculation-Facing Semantic Assertions

**Files:**
- Create: `combat/semanticTypes.js`
- Create: `combat/semanticAssertions.js`
- Create: `combat/itemEffectAdapter.js`
- Create: `combat/heroEffectAdapter.js`
- Test: `test/combatSemanticAssertions.test.js`
- Modify: `itemModels/schema.js`
- Modify: `scripts/item-model-audit.js`

- [ ] **Step 1: Write failing semantic assertion tests**

Create `test/combatSemanticAssertions.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { adaptItemModelToAssertions } = require('../combat/itemEffectAdapter');
const { validateCombatAssertion } = require('../combat/semanticAssertions');

test('Broadsword-like attack damage item becomes stat attack damage assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'broadsword',
    name: 'Broadsword',
    effects: [{
      type: 'modifier.attack_damage.flat',
      label: '攻击力加成',
      key: 'bonus_damage',
      values: [15],
      source: 'attribute'
    }]
  });

  assert.deepEqual(assertions[0], {
    source: 'item',
    sourceKey: 'broadsword',
    fieldKey: 'bonus_damage',
    semanticType: 'stat.attack_damage.flat',
    target: 'self',
    timing: 'always',
    values: [15],
    confidence: 'candidate',
    references: []
  });
});

test('Shadow Blade-like item exposes invisibility break bonus damage assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'invis_sword',
    name: 'Shadow Blade',
    effects: [{
      type: 'damage.attack_proc',
      label: '攻击或概率触发伤害',
      key: 'windwalk_bonus_damage',
      values: [175],
      source: 'attribute',
      description: 'Bonus damage when attacking out of invisibility.'
    }]
  });

  assert.equal(assertions[0].semanticType, 'attack.event.bonus_damage');
  assert.equal(assertions[0].timing, 'next_attack');
  assert.equal(assertions[0].condition, 'condition.invisibility_break');
  assert.equal(assertions[0].damageType, 'Physical');
});

test('Daedalus-like item exposes crit assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'greater_crit',
    name: 'Daedalus',
    effects: [{
      type: 'modifier.crit',
      label: '暴击',
      key: 'crit_multiplier',
      values: [225],
      chancePercent: 30,
      source: 'attribute'
    }]
  });

  assert.equal(assertions[0].semanticType, 'attack.event.crit');
  assert.equal(assertions[0].multiplierPercent, 225);
  assert.equal(assertions[0].chancePercent, 30);
});

test('validateCombatAssertion rejects unknown semantic type', () => {
  assert.throws(
    () => validateCombatAssertion({ semanticType: 'unknown.type', source: 'item', sourceKey: 'x' }),
    /unsupported semanticType/
  );
});
```

- [ ] **Step 2: Run semantic tests and verify they fail**

Run:

```bash
node --test test/combatSemanticAssertions.test.js
```

Expected: FAIL with missing combat semantic modules.

- [ ] **Step 3: Implement semantic type registry**

Create `combat/semanticTypes.js`:

```js
const COMBAT_SEMANTIC_TYPES = new Set([
  'stat.attribute.flat',
  'stat.attack_damage.flat',
  'stat.attack_speed.flat',
  'stat.armor.flat',
  'stat.magic_resistance.percent',
  'attack.event.base_damage',
  'attack.event.bonus_damage',
  'attack.event.proc_damage',
  'attack.event.crit',
  'damage.instant',
  'damage.sustained_dps',
  'damage.percent_health',
  'modifier.armor.flat',
  'modifier.magic_resistance.multiplier',
  'modifier.damage_amp.percent',
  'modifier.spell_amp.percent',
  'window.duration.seconds',
  'condition.invisibility_break',
  'condition.active_item',
  'raw.reference'
]);

function isCombatSemanticType(type) {
  return COMBAT_SEMANTIC_TYPES.has(type);
}

module.exports = {
  COMBAT_SEMANTIC_TYPES,
  isCombatSemanticType
};
```

- [ ] **Step 4: Implement assertion validation helper**

Create `combat/semanticAssertions.js`:

```js
const { isCombatSemanticType } = require('./semanticTypes');

const CONFIDENCE_LEVELS = new Set(['auto', 'candidate', 'reviewed', 'engine_verified']);

function validateCombatAssertion(assertion) {
  if (!assertion || typeof assertion !== 'object') {
    throw new Error('Combat assertion must be an object');
  }
  if (!isCombatSemanticType(assertion.semanticType)) {
    throw new Error(`unsupported semanticType: ${assertion.semanticType}`);
  }
  if (!assertion.source || !assertion.sourceKey) {
    throw new Error('Combat assertion requires source and sourceKey');
  }
  if (assertion.confidence && !CONFIDENCE_LEVELS.has(assertion.confidence)) {
    throw new Error(`unsupported confidence: ${assertion.confidence}`);
  }
  return assertion;
}

function combatAssertion(fields) {
  return validateCombatAssertion({
    confidence: 'candidate',
    references: [],
    ...fields
  });
}

module.exports = {
  CONFIDENCE_LEVELS,
  combatAssertion,
  validateCombatAssertion
};
```

- [ ] **Step 5: Implement item adapter**

Create `combat/itemEffectAdapter.js`:

```js
const { combatAssertion } = require('./semanticAssertions');

function firstNumeric(values) {
  return (values || []).map(Number).filter(Number.isFinite);
}

function isShadowBreakEffect(model, effect) {
  const text = `${model.key} ${effect.key || ''} ${effect.description || ''}`.toLowerCase();
  return text.includes('invis_sword') || text.includes('silver_edge') || text.includes('windwalk') || text.includes('invisibility');
}

function adaptItemEffect(model, effect) {
  const values = firstNumeric(effect.values);
  if (effect.type === 'modifier.attack_damage.flat') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'stat.attack_damage.flat',
      target: 'self',
      timing: 'always',
      values
    });
  }
  if (effect.type === 'modifier.attack_speed.flat') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'stat.attack_speed.flat',
      target: 'self',
      timing: 'always',
      values
    });
  }
  if (effect.type === 'stat.attribute') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'stat.attribute.flat',
      attribute: effect.attribute || 'all',
      target: 'self',
      timing: 'always',
      values
    });
  }
  if (effect.type === 'damage.attack_proc' && isShadowBreakEffect(model, effect)) {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'attack.event.bonus_damage',
      target: 'enemy',
      timing: 'next_attack',
      condition: 'condition.invisibility_break',
      values,
      damageType: 'Physical',
      participatesInCrit: false,
      affectedByArmor: true,
      affectedBySpellAmp: false,
      stackingGroup: 'invisibility_break_damage'
    });
  }
  if (effect.type === 'modifier.crit') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'attack.event.crit',
      target: 'self',
      timing: 'attack',
      values,
      multiplierPercent: values[0] || 100,
      chancePercent: Number(effect.chancePercent || effect.chance || 0)
    });
  }
  if (effect.type === 'modifier.armor.flat') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'modifier.armor.flat',
      target: 'enemy',
      timing: 'debuff',
      values
    });
  }
  if (effect.type === 'damage.instant') {
    return combatAssertion({
      source: 'item',
      sourceKey: model.key,
      fieldKey: effect.key || '',
      semanticType: 'damage.instant',
      target: 'enemy',
      timing: 'active_item',
      values,
      damageType: 'Magical'
    });
  }
  return combatAssertion({
    source: 'item',
    sourceKey: model.key,
    fieldKey: effect.key || '',
    semanticType: 'raw.reference',
    target: 'unknown',
    timing: 'reference',
    values
  });
}

function adaptItemModelToAssertions(model) {
  return (model.effects || []).map((effect) => adaptItemEffect(model, effect));
}

module.exports = {
  adaptItemModelToAssertions
};
```

- [ ] **Step 6: Implement hero adapter skeleton**

Create `combat/heroEffectAdapter.js`:

```js
const { combatAssertion } = require('./semanticAssertions');

function adaptHeroComponentToAssertion(heroName, abilityName, component) {
  if (component.kind === 'attack_modifier') {
    return combatAssertion({
      source: 'hero',
      sourceKey: heroName,
      fieldKey: component.id,
      abilityName,
      semanticType: 'attack.event.bonus_damage',
      target: 'enemy',
      timing: 'attack',
      values: component.valuesByAbilityLevel || [],
      damageType: component.damageType || 'Physical',
      confidence: component.status === 'implemented' ? 'candidate' : 'auto'
    });
  }
  return combatAssertion({
    source: 'hero',
    sourceKey: heroName,
    fieldKey: component.id,
    abilityName,
    semanticType: component.damageType === 'Unknown' ? 'raw.reference' : 'damage.instant',
    target: 'enemy',
    timing: 'ability',
    values: component.valuesByAbilityLevel || [],
    damageType: component.damageType,
    confidence: component.status === 'implemented' ? 'candidate' : 'auto'
  });
}

function adaptHeroProfileToAssertions(profile) {
  return (profile.abilities || []).flatMap((ability) => (
    (ability.components || []).map((component) => adaptHeroComponentToAssertion(profile.hero, ability.name, component))
  ));
}

module.exports = {
  adaptHeroComponentToAssertion,
  adaptHeroProfileToAssertions
};
```

- [ ] **Step 7: Run semantic tests**

Run:

```bash
node --test test/combatSemanticAssertions.test.js
```

Expected: PASS.

- [ ] **Step 8: Add assertion metadata to item audit page**

In `scripts/item-model-audit.js`, require the adapter:

```js
const { adaptItemModelToAssertions } = require('../combat/itemEffectAdapter');
```

When rendering each item, include a compact assertion list:

```js
const assertions = adaptItemModelToAssertions(item);
const assertionRows = assertions.map((assertion) => (
  `<tr><td>${escapeHtml(assertion.sourceKey)}</td><td>${escapeHtml(assertion.semanticType)}</td><td>${escapeHtml(assertion.confidence)}</td></tr>`
)).join('');
```

Add a table headed `Combat Assertions` after the existing effect table.

- [ ] **Step 9: Run audit and semantic test set**

Run:

```bash
node --test test/combatSemanticAssertions.test.js test/itemModelAudit.test.js test/itemModelRegistry.test.js
```

Expected: PASS.

- [ ] **Step 10: Commit semantic assertions**

```bash
git add combat/semanticTypes.js combat/semanticAssertions.js combat/itemEffectAdapter.js combat/heroEffectAdapter.js scripts/item-model-audit.js test/combatSemanticAssertions.test.js test/itemModelAudit.test.js
git commit -m "feat: add combat semantic assertions"
```

---

### Task 4: Integrate Combat Engine into Damage Calculator Backend

**Files:**
- Create: `combat/damageEvents.js`
- Create: `combat/attackWindow.js`
- Modify: `damageCalculator.js`
- Modify: `calculatorWorkbench.js`
- Test: `test/combatAttackWindow.test.js`
- Test: `test/damageCalculator.test.js`

- [ ] **Step 1: Write failing attack window tests**

Create `test/combatAttackWindow.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateAttackWindow } = require('../combat/attackWindow');

test('calculateAttackWindow supports explicit attack count with flat attack damage item', () => {
  const result = calculateAttackWindow({
    attackDamage: { average: 100 },
    attackSpeed: { attacksPerSecond: 1 },
    assertions: [
      { semanticType: 'attack.event.bonus_damage', values: [175], timing: 'next_attack', condition: 'condition.invisibility_break', damageType: 'Physical' }
    ],
    mode: 'attack_count',
    attackCount: 1,
    forceInvisibilityBreak: true
  });

  assert.equal(result.raw, 275);
  assert.deepEqual(result.events.map((event) => event.type), ['attack']);
  assert.deepEqual(result.events[0].components.map((component) => component.semanticType), [
    'attack.event.base_damage',
    'attack.event.bonus_damage'
  ]);
});

test('calculateAttackWindow derives attack count from duration and attack speed', () => {
  const result = calculateAttackWindow({
    attackDamage: { average: 80 },
    attackSpeed: { attacksPerSecond: 2.2 },
    assertions: [],
    mode: 'duration',
    durationSeconds: 3
  });

  assert.equal(result.attackCount, 6);
  assert.equal(result.raw, 480);
});

test('calculateAttackWindow can force a deterministic crit source', () => {
  const result = calculateAttackWindow({
    attackDamage: { average: 100 },
    attackSpeed: { attacksPerSecond: 1 },
    assertions: [
      { semanticType: 'attack.event.crit', sourceKey: 'greater_crit', multiplierPercent: 225, chancePercent: 30 }
    ],
    mode: 'attack_count',
    attackCount: 1,
    forceCritSource: 'greater_crit'
  });

  assert.equal(result.raw, 225);
  assert.equal(result.events[0].crit.source, 'greater_crit');
});
```

- [ ] **Step 2: Run attack window tests and verify they fail**

Run:

```bash
node --test test/combatAttackWindow.test.js
```

Expected: FAIL with `Cannot find module '../combat/attackWindow'`.

- [ ] **Step 3: Implement `combat/damageEvents.js`**

Create `combat/damageEvents.js`:

```js
const { applyDamageAmp, applyMagicResistance, physicalMultiplier, round } = require('./rules');

function adjustDamageEvent(event, params = {}) {
  const amp = applyDamageAmp(event.raw, {
    damageType: event.damageType,
    spellAmpPercent: params.spellAmpPercent || 0,
    damageAmpPercent: params.damageAmpPercent || 0
  });

  if (event.damageType === 'Physical') {
    const armor = Number(params.enemyArmor || 0);
    return {
      ...event,
      adjusted: round(amp.adjusted * physicalMultiplier(armor)),
      stages: [...(event.stages || []), ...amp.stages, { source: 'armor', armor }]
    };
  }

  if (event.damageType === 'Magical') {
    const magic = applyMagicResistance(amp.adjusted, params.magicResistances || [
      { source: 'target_base', resistancePercent: Number(params.enemyMagicResistancePercent ?? 25) }
    ]);
    return {
      ...event,
      adjusted: magic.adjusted,
      stages: [...(event.stages || []), ...amp.stages, ...magic.stages]
    };
  }

  return {
    ...event,
    adjusted: amp.adjusted,
    stages: [...(event.stages || []), ...amp.stages]
  };
}

module.exports = {
  adjustDamageEvent
};
```

- [ ] **Step 4: Implement `combat/attackWindow.js`**

Create `combat/attackWindow.js`:

```js
const { resolveCritMultiplier, round } = require('./rules');

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstValue(assertion) {
  return numeric((assertion.values || [])[0], 0);
}

function selectedAttackCount(input) {
  if (input.mode === 'duration') {
    return Math.floor(numeric(input.durationSeconds, 0) * numeric(input.attackSpeed?.attacksPerSecond, 0));
  }
  return Math.max(0, Math.floor(numeric(input.attackCount, 1)));
}

function calculateAttackWindow(input) {
  const attackCount = selectedAttackCount(input);
  const baseDamage = numeric(input.attackDamage?.average, 0);
  const crits = (input.assertions || []).filter((assertion) => assertion.semanticType === 'attack.event.crit');
  const crit = resolveCritMultiplier(crits, { forceCritSource: input.forceCritSource });
  const breakBonuses = (input.assertions || []).filter((assertion) => (
    assertion.semanticType === 'attack.event.bonus_damage'
    && assertion.condition === 'condition.invisibility_break'
    && input.forceInvisibilityBreak
  ));

  const events = [];
  for (let index = 0; index < attackCount; index += 1) {
    const components = [{
      semanticType: 'attack.event.base_damage',
      raw: round(baseDamage * crit.multiplier)
    }];
    if (index === 0) {
      for (const assertion of breakBonuses) {
        components.push({
          semanticType: assertion.semanticType,
          sourceKey: assertion.sourceKey,
          raw: firstValue(assertion)
        });
      }
    }
    const raw = round(components.reduce((sum, component) => sum + component.raw, 0));
    events.push({
      type: 'attack',
      damageType: 'Physical',
      raw,
      components,
      crit
    });
  }

  return {
    mode: input.mode || 'attack_count',
    attackCount,
    raw: round(events.reduce((sum, event) => sum + event.raw, 0)),
    events
  };
}

module.exports = {
  calculateAttackWindow
};
```

- [ ] **Step 5: Run attack window tests**

Run:

```bash
node --test test/combatAttackWindow.test.js
```

Expected: PASS.

- [ ] **Step 6: Add backend integration test for item attack damage**

Append to `test/damageCalculator.test.js`:

```js
test('calculateDamageCombo basic attack uses combat stat item assertions', async () => {
  const result = await calculateDamageCombo({
    hero: 'Phantom Assassin',
    heroLevel: 6,
    enemyArmor: 0,
    enemyMagicResistancePercent: 25,
    selectedComponents: [
      {
        sourceType: 'item',
        itemKey: 'broadsword',
        componentId: 'broadsword:modifier.attack_damage.flat:bonus_damage',
        valueMode: 'theoretical'
      },
      {
        sourceType: 'basic_attack',
        attackCount: 1
      }
    ]
  });

  const attack = result.components.find((entry) => entry.kind === 'basic_attack');
  assert.ok(attack.attackDamage > 0);
  assert.equal(result.combatStats.attackDamage.flatBonus >= 15, true);
});
```

- [ ] **Step 7: Run integration test and verify it fails**

Run:

```bash
node --test test/damageCalculator.test.js
```

Expected: FAIL because `calculateDamageCombo` does not yet return `combatStats` and does not use item assertions for basic attack stats.

- [ ] **Step 8: Integrate combat assertions into `damageCalculator.js`**

Add imports:

```js
const { calculateAttackWindow } = require('./combat/attackWindow');
const { adjustDamageEvent } = require('./combat/damageEvents');
const { adaptItemModelToAssertions } = require('./combat/itemEffectAdapter');
const { applyStatAssertions } = require('./combat/stats');
```

Add helper:

```js
function selectedItemAssertions(selections) {
  return (selections || [])
    .filter((selection) => selection.sourceType === 'item')
    .flatMap((selection) => {
      const model = getItemModel(selection.itemKey);
      return model ? adaptItemModelToAssertions(model) : [];
    });
}
```

Inside `calculateDamageCombo`, after `profile`:

```js
const combatAssertions = selectedItemAssertions(request.selectedComponents || []);
const combatStats = applyStatAssertions(profile.stats, Number(request.heroLevel || 1), combatAssertions);
```

In the `basic_attack` branch, replace `resolveBasicAttackDamage` usage with:

```js
const window = calculateAttackWindow({
  attackDamage: combatStats.attackDamage,
  attackSpeed: combatStats.attackSpeed,
  assertions: combatAssertions,
  mode: selection.attackWindowMode || 'attack_count',
  attackCount: selection.attackCount,
  durationSeconds: selection.durationSeconds,
  forceInvisibilityBreak: selection.forceInvisibilityBreak,
  forceCritSource: selection.forceCritSource
});
const raw = window.raw;
const adjustedEvent = adjustDamageEvent({ type: 'attack_window', damageType: 'Physical', raw }, params);
const adjusted = adjustedEvent.adjusted;
```

Add to final response:

```js
combatStats,
combatEvents: components.filter((component) => component.kind === 'basic_attack'),
semanticAssertions: combatAssertions
```

Keep existing fields so current UI remains compatible.

- [ ] **Step 9: Expose combat assertions in workbench**

In `calculatorWorkbench.js`, include `combatAssertions` on each item card by calling `adaptItemModelToAssertions(getItemModel(item.key))`, or by adding assertion data in `damageCalculator.getHeroDamageProfile()`.

The item card shape should include:

```js
combatAssertions: assertions.map((assertion) => ({
  semanticType: assertion.semanticType,
  confidence: assertion.confidence,
  sourceKey: assertion.sourceKey,
  condition: assertion.condition
}))
```

- [ ] **Step 10: Run backend test set**

Run:

```bash
node --test test/combatAttackWindow.test.js test/damageCalculator.test.js test/calculatorWorkbench.test.js
```

Expected: PASS.

- [ ] **Step 11: Commit backend integration**

```bash
git add combat/damageEvents.js combat/attackWindow.js damageCalculator.js calculatorWorkbench.js test/combatAttackWindow.test.js test/damageCalculator.test.js test/calculatorWorkbench.test.js
git commit -m "feat: model combat attack windows"
```

---

### Task 5: Update Calculator UI for Combat Stats and Attack Windows

**Files:**
- Modify: `damage-calculator.html`
- Modify: `damage-calculator.js`
- Modify: `damage-calculator.css`
- Test: `test/damageCalculatorLayout.test.js`
- Test: `test/dataViewerPages.test.js`

- [ ] **Step 1: Write failing layout test**

Add to `test/damageCalculatorLayout.test.js`:

```js
test('damage calculator exposes attack window and combat breakdown containers', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'damage-calculator.html'), 'utf8');

  assert.match(html, /id="attackWindowMode"/);
  assert.match(html, /id="attackWindowValue"/);
  assert.match(html, /id="combatStatsBreakdown"/);
  assert.match(html, /id="combatEventBreakdown"/);
  assert.match(html, /id="semanticAssertionBreakdown"/);
});
```

- [ ] **Step 2: Run layout test and verify it fails**

Run:

```bash
node --test test/damageCalculatorLayout.test.js
```

Expected: FAIL because the new containers do not exist.

- [ ] **Step 3: Add attack-window controls to `damage-calculator.html`**

Add controls near the existing hero and target controls:

```html
<label>普攻窗口
  <select id="attackWindowMode">
    <option value="attack_count">按攻击次数</option>
    <option value="duration">按持续时间</option>
  </select>
</label>
<label>窗口数值
  <input id="attackWindowValue" type="number" min="0" step="0.1" value="1">
</label>
```

Add result containers near the existing breakdown:

```html
<section class="calculator-panel">
  <h2>战斗属性</h2>
  <div id="combatStatsBreakdown"></div>
</section>
<section class="calculator-panel">
  <h2>伤害事件</h2>
  <div id="combatEventBreakdown"></div>
</section>
<section class="calculator-panel">
  <h2>语义断言</h2>
  <div id="semanticAssertionBreakdown"></div>
</section>
```

- [ ] **Step 4: Update `damage-calculator.js` selected component payload**

Read the new controls at the top:

```js
const attackWindowMode = document.getElementById('attackWindowMode');
const attackWindowValue = document.getElementById('attackWindowValue');
const combatStatsBreakdown = document.getElementById('combatStatsBreakdown');
const combatEventBreakdown = document.getElementById('combatEventBreakdown');
const semanticAssertionBreakdown = document.getElementById('semanticAssertionBreakdown');
```

When building basic attack selections, include:

```js
{
  sourceType: 'basic_attack',
  attackWindowMode: attackWindowMode.value,
  ...(attackWindowMode.value === 'duration'
    ? { durationSeconds: Number(attackWindowValue.value || 0) }
    : { attackCount: Number(attackWindowValue.value || 1) })
}
```

If the current UI does not have a basic attack checkbox yet, add one default selected pseudo-component near ability rows:

```js
function selectedBasicAttackComponent() {
  return {
    sourceType: 'basic_attack',
    attackWindowMode: attackWindowMode.value,
    ...(attackWindowMode.value === 'duration'
      ? { durationSeconds: Number(attackWindowValue.value || 0) }
      : { attackCount: Number(attackWindowValue.value || 1) })
  };
}
```

Then include it in `selectedComponents()` when the user enables basic attacks.

- [ ] **Step 5: Render combat stats, events, and assertions**

Add render helpers:

```js
function renderCombatStats(stats = {}) {
  const attributes = stats.attributes || {};
  const attackDamage = stats.attackDamage || {};
  const attackSpeed = stats.attackSpeed || {};
  combatStatsBreakdown.innerHTML = [
    ['力量', attributes.strength],
    ['敏捷', attributes.agility],
    ['智力', attributes.intelligence],
    ['攻击均值', attackDamage.average],
    ['攻击力加成', attackDamage.flatBonus],
    ['攻击速度', attackSpeed.attackSpeed],
    ['每秒攻击', attackSpeed.attacksPerSecond]
  ].map(([label, value]) => `<div class="breakdown-row">${escapeHtml(label)}: ${escapeHtml(fmt(value))}</div>`).join('');
}

function renderCombatEvents(events = []) {
  combatEventBreakdown.innerHTML = events.map((event) => (
    `<div class="breakdown-row"><strong>${escapeHtml(event.type || event.kind)}</strong><br>原始 ${fmt(event.raw)} / 抗性后 ${fmt(event.adjusted)}<br>${escapeHtml(JSON.stringify(event.stages || []))}</div>`
  )).join('') || '<div class="breakdown-row">无普攻窗口事件</div>';
}

function renderSemanticAssertions(assertions = []) {
  semanticAssertionBreakdown.innerHTML = assertions.map((assertion) => (
    `<div class="breakdown-row">${escapeHtml(assertion.sourceKey)} · ${escapeHtml(assertion.semanticType)} · ${escapeHtml(assertion.confidence || '')}</div>`
  )).join('') || '<div class="breakdown-row">无已应用断言</div>';
}
```

Call these in `renderResult(result)`:

```js
renderCombatStats(result.combatStats);
renderCombatEvents(result.combatEvents);
renderSemanticAssertions(result.semanticAssertions);
```

- [ ] **Step 6: Add CSS for new panels**

In `damage-calculator.css`, ensure the new panels use existing dense calculator styling:

```css
#combatStatsBreakdown,
#combatEventBreakdown,
#semanticAssertionBreakdown {
  display: grid;
  gap: 8px;
}
```

- [ ] **Step 7: Run frontend layout tests**

Run:

```bash
node --test test/damageCalculatorLayout.test.js test/dataViewerPages.test.js
```

Expected: PASS.

- [ ] **Step 8: Browser smoke test local calculator**

Start server:

```bash
npm start
```

Open:

```text
http://localhost:3002/damage-calculator.html
```

Verify:

- Page loads.
- Hero selector loads.
- Attack window controls are visible.
- Selecting an item updates combat stats or assertion breakdown.
- Calculation returns totals without console errors.

Stop server after verification.

- [ ] **Step 9: Commit UI changes**

```bash
git add damage-calculator.html damage-calculator.js damage-calculator.css test/damageCalculatorLayout.test.js test/dataViewerPages.test.js
git commit -m "feat: expose combat attack windows in calculator"
```

---

### Task 6: Add Local Dota 2 Engine Fixture Export and Compare Scripts

**Files:**
- Create: `scripts/export-engine-fixture.js`
- Create: `scripts/compare-engine-result.js`
- Create: `test/engineFixtureExport.test.js`
- Create: `test/engineResultCompare.test.js`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing fixture export tests**

Create `test/engineFixtureExport.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEngineFixture } = require('../scripts/export-engine-fixture');

test('buildEngineFixture wraps local model result for a Dota engine scenario', async () => {
  const fixture = await buildEngineFixture({
    id: 'pa_level_12_invis_sword_attack',
    hero: 'Phantom Assassin',
    heroLevel: 12,
    items: ['invis_sword'],
    target: {
      hero: 'Axe',
      level: 12,
      armor: 10,
      magicResistancePercent: 25
    },
    scenario: {
      type: 'attack_window',
      attackCount: 1,
      forceInvisibilityBreak: true
    }
  });

  assert.equal(fixture.id, 'pa_level_12_invis_sword_attack');
  assert.equal(fixture.hero, 'Phantom Assassin');
  assert.equal(fixture.expectedLocalModel.hero, 'Phantom Assassin');
  assert.ok(Array.isArray(fixture.expectedLocalModel.components));
});
```

- [ ] **Step 2: Run fixture export test and verify it fails**

Run:

```bash
node --test test/engineFixtureExport.test.js
```

Expected: FAIL with `Cannot find module '../scripts/export-engine-fixture'`.

- [ ] **Step 3: Implement fixture export script**

Create `scripts/export-engine-fixture.js`:

```js
const fs = require('fs');
const path = require('path');
const { calculateDamageCombo } = require('../damageCalculator');
const { getItemModel } = require('../itemDataModel');

function combatRelevantComponentIds(itemKey) {
  const model = getItemModel(itemKey);
  return (model?.effects || [])
    .filter((effect) => [
      'modifier.attack_damage.flat',
      'modifier.attack_speed.flat',
      'modifier.attribute.flat',
      'modifier.crit',
      'damage.attack_proc',
      'damage.instant'
    ].includes(effect.type))
    .map((effect) => `${itemKey}:${effect.type}:${effect.key || effect.abilityName || 'effect'}`);
}

function itemSelections(items) {
  return (items || []).flatMap((itemKey) => {
    const componentIds = combatRelevantComponentIds(itemKey);
    return componentIds.map((componentId) => ({
      sourceType: 'item',
      itemKey,
      componentId,
      valueMode: 'theoretical'
    }));
  });
}

async function buildEngineFixture(input) {
  const expectedLocalModel = await calculateDamageCombo({
    hero: input.hero,
    heroLevel: input.heroLevel,
    enemyArmor: input.target?.armor ?? 0,
    enemyMagicResistancePercent: input.target?.magicResistancePercent ?? 25,
    selectedComponents: [
      ...itemSelections(input.items),
      {
        sourceType: 'basic_attack',
        attackWindowMode: input.scenario?.type === 'attack_window' ? 'attack_count' : 'attack_count',
        attackCount: input.scenario?.attackCount || 1,
        forceInvisibilityBreak: input.scenario?.forceInvisibilityBreak,
        forceCritSource: input.scenario?.forceCritSource
      }
    ]
  });

  return {
    id: input.id,
    hero: input.hero,
    heroLevel: input.heroLevel,
    items: input.items || [],
    target: input.target || {},
    scenario: input.scenario || {},
    expectedLocalModel
  };
}

async function main(argv = process.argv.slice(2)) {
  const inputPath = argv[0];
  const outputPath = argv[1] || path.join('tools', 'dota-addon', 'generated', 'fixture.json');
  if (!inputPath) {
    throw new Error('Usage: node scripts/export-engine-fixture.js <scenario.json> [output.json]');
  }
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const fixture = await buildEngineFixture(input);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(fixture, null, 2));
  console.log(outputPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  buildEngineFixture,
  combatRelevantComponentIds
};
```

- [ ] **Step 4: Write failing compare script tests**

Create `test/engineResultCompare.test.js`:

```js
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
```

- [ ] **Step 5: Implement compare script**

Create `scripts/compare-engine-result.js`:

```js
const fs = require('fs');

function round(value) {
  return Math.round(value * 100) / 100;
}

function compareEngineResult({ fixture, engineResult, tolerance = { absolute: 1, percent: 0.01 } }) {
  if (fixture.id !== engineResult.id) {
    throw new Error(`Fixture id ${fixture.id} does not match engine result id ${engineResult.id}`);
  }
  const expected = Number(fixture.expectedLocalModel?.totals?.adjusted || 0);
  const observed = Number(engineResult.engine?.observedDamage || 0);
  const delta = round(Math.abs(observed - expected));
  const percentDelta = expected === 0 ? (delta === 0 ? 0 : Infinity) : delta / expected;
  const pass = delta <= tolerance.absolute || percentDelta <= tolerance.percent;
  return {
    id: fixture.id,
    expected,
    observed,
    delta,
    percentDelta,
    pass
  };
}

function main(argv = process.argv.slice(2)) {
  const fixturePath = argv[0];
  const resultPath = argv[1];
  if (!fixturePath || !resultPath) {
    throw new Error('Usage: node scripts/compare-engine-result.js <fixture.json> <engine-result.json>');
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const engineResult = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const report = compareEngineResult({ fixture, engineResult });
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  compareEngineResult
};
```

- [ ] **Step 6: Add package scripts and gitignore rules**

In `package.json` scripts:

```json
"engine:fixture": "node scripts/export-engine-fixture.js",
"engine:compare": "node scripts/compare-engine-result.js"
```

In `.gitignore`:

```gitignore
tools/dota-addon/generated/*.json
test-runs/dota-engine-verification/
```

- [ ] **Step 7: Run engine script tests**

Run:

```bash
node --test test/engineFixtureExport.test.js test/engineResultCompare.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit engine fixture tooling**

```bash
git add scripts/export-engine-fixture.js scripts/compare-engine-result.js test/engineFixtureExport.test.js test/engineResultCompare.test.js package.json package-lock.json .gitignore
git commit -m "feat: add local engine verification fixtures"
```

---

### Task 7: Add Dota 2 Lua Addon Skeleton and Documentation

**Files:**
- Create: `tools/dota-addon/README.md`
- Create: `tools/dota-addon/generated/.gitkeep`
- Create: `tools/dota-addon/scripts/vscripts/addon_game_mode.lua`
- Create: `tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua`
- Modify: `README.md`

- [ ] **Step 1: Create addon README**

Create `tools/dota-addon/README.md`:

```markdown
# Dota 2 Engine Verification Addon

This folder is a local-only Dota 2 Workshop Tools verifier for the damage model. It is not required on the remote server and is not loaded by `npm start`.

## Workflow

1. Export a fixture from the Node calculator:

   ```bash
   npm run engine:fixture -- test-runs/dota-engine-verification/scenario.json tools/dota-addon/generated/fixture.json
   ```

2. Copy or sync `tools/dota-addon/` into a local Dota 2 custom game addon while developing the verifier.
3. Launch the addon with Dota 2 Workshop Tools.
4. Run the fixture in Lua and copy the JSON-like result from the console or generated result file.
5. Compare the measured result:

   ```bash
   npm run engine:compare -- tools/dota-addon/generated/fixture.json test-runs/dota-engine-verification/engine-result.json
   ```

## Server Policy

The production server never runs Dota 2, Workshop Tools, or these Lua files. The addon is a development calibration tool only.
```

- [ ] **Step 2: Create Lua addon entrypoint**

Create `tools/dota-addon/scripts/vscripts/addon_game_mode.lua`:

```lua
if DotaHelperFixtureRunner == nil then
  DotaHelperFixtureRunner = require("dota_helper_fixture_runner")
end

function Activate()
  GameRules.DotaHelperFixtureRunner = DotaHelperFixtureRunner()
  GameRules.DotaHelperFixtureRunner:InitGameMode()
end
```

- [ ] **Step 3: Create Lua fixture runner skeleton**

Create `tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua`:

```lua
if DotaHelperFixtureRunner == nil then
  DotaHelperFixtureRunner = class({})
end

function DotaHelperFixtureRunner:InitGameMode()
  print("[dota-helper] fixture runner initialized")
  GameRules:GetGameModeEntity():SetThink("RunSmokeFixture", self, "dota_helper_fixture_smoke", 1.0)
end

function DotaHelperFixtureRunner:RunSmokeFixture()
  print("[dota-helper] smoke fixture ready")
  print('{"id":"smoke","engine":{"observedDamage":0,"modifiers":[]}}')
  return nil
end

return DotaHelperFixtureRunner
```

This first skeleton verifies that the addon can load and print a parseable result. Unit-tested damage scenarios are added after local Workshop Tools probing confirms the exact unit creation and item APIs in the user's environment.

- [ ] **Step 4: Keep generated folder**

Create `tools/dota-addon/generated/.gitkeep` with:

```text
generated fixture json files are ignored; this file keeps the directory in git.
```

- [ ] **Step 5: Update root README with local verifier note**

Add:

```markdown
### 本机 Dota 2 引擎复核器

`tools/dota-addon/` 包含一个本机 Dota 2 Workshop Tools 复核器，用于把计算器 fixture 放进游戏引擎中测量。它只用于开发校准，不随服务器运行，也不要求远端服务器安装 Dota 2。

常用命令：

```bash
npm run engine:fixture -- <scenario.json> tools/dota-addon/generated/fixture.json
npm run engine:compare -- tools/dota-addon/generated/fixture.json <engine-result.json>
```
```

- [ ] **Step 6: Run repository tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit Lua verifier skeleton**

```bash
git add tools/dota-addon/README.md tools/dota-addon/generated/.gitkeep tools/dota-addon/scripts/vscripts/addon_game_mode.lua tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua README.md
git commit -m "feat: add local dota engine verifier skeleton"
```

---

## Final Verification

Run the full local verification suite:

```bash
npm test
npm run calculator:v2-trial
node --test test/combatRules.test.js test/combatStats.test.js test/combatSemanticAssertions.test.js test/combatAttackWindow.test.js test/engineFixtureExport.test.js test/engineResultCompare.test.js
```

Expected:

- `npm test`: all tests pass.
- `npm run calculator:v2-trial`: writes `audit-runs/calculator-v2-trial-latest`.
- Combat and engine fixture tests: all pass.
- No Stripe or Redis startup warnings.
- Server still starts with `npm start`.
- `damage-calculator.html` loads and computes a result.

## Self-Review Checklist

- Spec coverage:
  - Payment cleanup: Task 1.
  - Combat rules: Task 2.
  - Semantic assertions: Task 3.
  - Attack-window calculator: Tasks 4 and 5.
  - Local Lua verifier: Tasks 6 and 7.
  - Server exclusion policy: Tasks 6 and 7 docs plus `.gitignore`.
- Red-flag scan: no task contains unresolved markers or unspecified implementation steps.
- Type consistency:
  - `semanticType` values match between `combat/semanticTypes.js`, adapters, tests, and UI rendering.
  - `calculateAttackWindow` input fields match fixture `scenario` fields.
  - `combatStats`, `combatEvents`, and `semanticAssertions` response names match UI render helpers.
