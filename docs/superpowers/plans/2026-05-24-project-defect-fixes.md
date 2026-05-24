# Project Defect Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the current audit findings that expose local source files, leak subscription access, allow untrusted AI HTML, accept invalid damage selections, misreport AI health, leave two damage primitives unsupported, and keep package metadata inconsistent.

**Architecture:** First make the server testable without starting a listener, then put narrow security gates at the Express boundary and strict validation inside the damage engine. Move browser output formatting into a small testable formatter module so AI text is escaped before markdown-like formatting is applied. Finish by converting the two unsupported damage primitives into explicit runtime-input models and locking project metadata to the current dependency set.

**Tech Stack:** CommonJS modules, Express 5, Node built-in test runner, browser scripts loaded by plain `<script>` tags, existing Dota damage model registry, `dotaconstants`, Upstash Redis, Stripe.

---

## File Structure

- Modify `server.js`: export `createApp`, keep `startServer`, replace root static serving with an allowlist, harden token recovery, remove token logs, validate AI debug content.
- Create `outputFormatter.js`: browser-safe and Node-testable formatter for AI advice output.
- Modify `index.html`: load `outputFormatter.js` before `script.js`.
- Modify `script.js`: remove inline formatter and delegate to `window.DotaOutputFormatter.formatStructuredOutput`.
- Modify `damageCalculator.js`: reject illegal ability levels and unselectable components, add support for source-damage percent and instant percent-health primitives.
- Modify selected hero model files:
  - `damageModels/heroes/lina.js`
  - `damageModels/heroes/phantom_assassin.js`
- Modify `damageModels/schema.js`: accept the new primitive names used for source-damage percent and instant percent-health components.
- Modify `damage-calculator.js`: expose runtime inputs for target max health and source damage when a component requires them.
- Modify `package.json`: align license with `LICENSE` and pin current dependency versions from `package-lock.json`.
- Add tests:
  - `test/serverSecurity.test.js`
  - `test/outputFormatter.test.js`
  - targeted additions to `test/damageCalculator.test.js`
  - targeted additions to `test/damageModelCoverage.test.js`
  - targeted additions to `test/dataViewerPages.test.js`

---

### Task 1: Make Express App Testable And Stop Serving Repo Files

**Files:**
- Modify: `server.js`
- Test: `test/serverSecurity.test.js`

- [ ] **Step 1: Write failing static boundary tests**

Create `test/serverSecurity.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../server');

async function withServer(app, fn) {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('server only serves public browser assets from the project root', async () => {
  const app = createApp();

  await withServer(app, async (baseUrl) => {
    const allowed = await fetch(`${baseUrl}/index.html`);
    assert.equal(allowed.status, 200);
    assert.match(await allowed.text(), /Dota 2 对局助手/);

    const logo = await fetch(`${baseUrl}/images/dota2_logo.png`);
    assert.equal(logo.status, 200);

    for (const path of ['/server.js', '/package.json', '/test/aiClient.test.js', '/audit-runs/damage-heroes-latest/index.html', '/data/dotabuff/parsed/axe.json']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 404, `${path} must not be publicly readable`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/serverSecurity.test.js
```

Expected: fail because `server.js` does not export `createApp`, and current static serving exposes repo files.

- [ ] **Step 3: Refactor `server.js` into an app factory**

Wrap middleware and route setup in `createApp(options = {})`, keep existing runtime behavior behind `startServer`, and export both:

```js
function createApp(options = {}) {
  const app = express();
  const activeRedis = options.redis ?? redis;
  const activeStripe = options.stripe ?? stripe;
  const activeAiConfig = options.aiConfig ?? aiConfig;
  const activeDataProvider = options.dataProvider ?? dataProvider;

  app.locals.redis = activeRedis;
  app.locals.stripe = activeStripe;
  app.locals.aiConfig = activeAiConfig;
  app.locals.dataProvider = activeDataProvider;

  app.use(cors());
  app.use('/api/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());

  registerPublicAssets(app);
  registerRoutes(app);

  return app;
}

function startServer() {
  const app = createApp();
  return app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer
};
```

Inside routes that currently close over `redis`, `stripe`, `aiConfig`, or `dataProvider`, read from `req.app.locals` so tests can inject fakes.

- [ ] **Step 4: Replace root static serving with an allowlist**

Remove:

```js
const staticFilesPath = __dirname;
app.use(express.static(staticFilesPath));
```

Add this helper near the route setup:

```js
const staticFilesPath = __dirname;
const PUBLIC_ROOT_FILES = new Set([
  'index.html',
  'style.css',
  'script.js',
  'outputFormatter.js',
  'damage-calculator.html',
  'damage-calculator.css',
  'damage-calculator.js',
  'damage-profile.html',
  'damage-profile.js',
  'data-viewer.css',
  'heroes.html',
  'heroes.js',
  'items.html',
  'items.js'
]);

function sendPublicRootFile(res, fileName) {
  if (!PUBLIC_ROOT_FILES.has(fileName)) {
    return res.status(404).send('Not found');
  }
  return res.sendFile(path.join(staticFilesPath, fileName));
}

function registerPublicAssets(app) {
  app.use('/images', express.static(path.join(staticFilesPath, 'images'), {
    dotfiles: 'deny',
    index: false,
    fallthrough: true
  }));

  app.get('/', (req, res) => sendPublicRootFile(res, 'index.html'));
  for (const fileName of PUBLIC_ROOT_FILES) {
    app.get(`/${fileName}`, (req, res) => sendPublicRootFile(res, fileName));
  }
}
```

Remove the old `app.get('/')` route because `registerPublicAssets` now owns it.

- [ ] **Step 5: Verify static boundary**

Run:

```bash
npm test -- test/serverSecurity.test.js
```

Expected: pass. The public pages and images are readable; source, tests, audit snapshots, package files, and data snapshots return 404.

- [ ] **Step 6: Commit**

```bash
git add server.js test/serverSecurity.test.js
git commit -m "fix: restrict public static assets"
```

---

### Task 2: Harden Subscription Token Recovery

**Files:**
- Modify: `server.js`
- Test: `test/serverSecurity.test.js`

- [ ] **Step 1: Add failing token recovery tests**

Append to `test/serverSecurity.test.js`:

```js
function fakeRedis(values = {}) {
  return {
    async get(key) {
      return values[key] ?? null;
    },
    async set(key, value) {
      values[key] = value;
    },
    async incr(key) {
      values[key] = Number(values[key] || 0) + 1;
      return values[key];
    },
    async expire() {}
  };
}

test('recover-token never returns a bearer token to an email-only request', async () => {
  const redis = fakeRedis({
    'email:paid@example.com': 'cus_123',
    'customer:cus_123': 'secret-token',
    'token:secret-token': { status: 'active', email: 'paid@example.com' }
  });
  const app = createApp({ redis });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/recover-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'paid@example.com' })
    });
    const data = await response.json();

    assert.equal(response.status, 202);
    assert.equal(Object.hasOwn(data, 'token'), false);
    assert.match(data.message, /email/i);
  });
});

test('subscription endpoints fail closed when Redis is not configured', async () => {
  const app = createApp({ redis: null });

  await withServer(app, async (baseUrl) => {
    const portal = await fetch(`${baseUrl}/api/create-portal-session`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token' }
    });
    assert.equal(portal.status, 503);

    const recovery = await fetch(`${baseUrl}/api/recover-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'paid@example.com' })
    });
    assert.equal(recovery.status, 503);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/serverSecurity.test.js
```

Expected: fail because current `/api/recover-token` returns `{ token }` for a matching email and some subscription routes call `redis.get` without checking Redis.

- [ ] **Step 3: Remove public email-to-token recovery**

Replace the success branch of `/api/recover-token` with a non-secret response:

```js
app.post('/api/recover-token', async (req, res) => {
  const activeRedis = req.app.locals.redis;
  if (!activeRedis) return res.status(503).json({ error: 'Subscription storage not configured.' });

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const customerId = await activeRedis.get(`email:${normalizedEmail}`);
    if (customerId) {
      const token = await activeRedis.get(`customer:${customerId}`);
      const tokenData = token ? await activeRedis.get(`token:${token}`) : null;
      if (tokenData?.status === 'active') {
        return res.status(202).json({
          message: 'If this email has an active subscription, use the checkout success link or contact support to restore access.'
        });
      }
    }

    return res.status(202).json({
      message: 'If this email has an active subscription, use the checkout success link or contact support to restore access.'
    });
  } catch (err) {
    console.error('Token recovery error:', err);
    return res.status(500).json({ error: 'Failed to process token recovery.' });
  }
});
```

- [ ] **Step 4: Fail closed when required services are absent**

In `/api/create-portal-session`, `/api/checkout-success`, `/api/subscription-status`, and Stripe webhook token writes, use `const activeRedis = req.app.locals.redis;` and return `503` for token-dependent endpoints when it is missing. Keep `/api/subscription-status` as `{ active: false }` only for requests without an Authorization header.

- [ ] **Step 5: Stop logging bearer tokens**

Replace:

```js
console.log(`New subscription: ${customerId}, token: ${token}`);
```

with:

```js
console.log(`New subscription: ${customerId}`);
```

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- test/serverSecurity.test.js
```

Expected: pass. No email-only request receives a token; token-dependent endpoints do not crash when Redis is unavailable.

- [ ] **Step 7: Commit**

```bash
git add server.js test/serverSecurity.test.js
git commit -m "fix: harden subscription token recovery"
```

---

### Task 3: Sanitize AI Output Before Rendering

**Files:**
- Create: `outputFormatter.js`
- Modify: `index.html`
- Modify: `script.js`
- Test: `test/outputFormatter.test.js`
- Test: `test/dataViewerPages.test.js`

- [ ] **Step 1: Write failing formatter tests**

Create `test/outputFormatter.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml, formatStructuredOutput, safeHref } = require('../outputFormatter');

test('escapeHtml escapes HTML metacharacters', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert(1)">`),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
  );
});

test('formatStructuredOutput escapes raw HTML before markdown formatting', () => {
  const html = formatStructuredOutput('### 标题\\n<script>alert(1)</script>\\n**重点**');

  assert.match(html, /<h3>标题<\/h3>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<strong>重点<\/strong>/);
  assert.doesNotMatch(html, /<script>/);
});

test('formatStructuredOutput blocks javascript links', () => {
  const html = formatStructuredOutput('[点我](javascript:alert(1)) [官网](https://example.com/a)');

  assert.match(html, /href="#"/);
  assert.match(html, /href="https:\/\/example.com\/a"/);
  assert.equal(safeHref('mailto:test@example.com'), 'mailto:test@example.com');
});
```

Add an assertion to `test/dataViewerPages.test.js`:

```js
test('home page loads output formatter before main script', () => {
  const html = read('index.html');
  assert.match(html, /<script src="outputFormatter\.js"><\/script>\s*<script src="script\.js"><\/script>/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- test/outputFormatter.test.js test/dataViewerPages.test.js
```

Expected: fail because `outputFormatter.js` does not exist and `index.html` does not load it.

- [ ] **Step 3: Create `outputFormatter.js`**

Create this module:

```js
(function attachOutputFormatter(root) {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function safeHref(value) {
    const href = String(value || '').trim();
    if (/^(https?:|mailto:)/i.test(href)) return escapeHtml(href);
    return '#';
  }

  function processInline(value) {
    const escaped = escapeHtml(value);
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^\*]+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => (
        `<a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
      ));
  }

  function formatStructuredOutput(text) {
    let html = '';
    const lines = String(text || '').split('\n');
    let currentListType = null;
    let inTable = false;
    let tableRows = [];

    function closeList() {
      if (!currentListType) return;
      html += currentListType === 'ol' ? '</ol>\n' : '</ul>\n';
      currentListType = null;
    }

    function renderTable() {
      if (!tableRows.length) return;
      html += '<div class="table-wrapper"><table>\n';
      tableRows.forEach((row, index) => {
        const cells = row.split('|').filter((cell) => cell.trim() !== '');
        if (cells.every((cell) => /^[\s-:]+$/.test(cell))) return;
        const tag = index === 0 ? 'th' : 'td';
        const rowClass = index === 0 ? 'table-header' : (index % 2 === 0 ? 'table-row-even' : 'table-row-odd');
        html += `<tr class="${rowClass}">`;
        cells.forEach((cell) => {
          html += `<${tag}>${processInline(cell.trim())}</${tag}>`;
        });
        html += '</tr>\n';
      });
      html += '</table></div>\n';
      tableRows = [];
      inTable = false;
    }

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        closeList();
        inTable = true;
        tableRows.push(trimmedLine);
        return;
      }
      if (inTable) renderTable();

      if (trimmedLine.startsWith('### ')) {
        closeList();
        html += `<h3>${processInline(trimmedLine.substring(4).trim())}</h3>\n`;
      } else if (trimmedLine.startsWith('## ')) {
        closeList();
        html += `<h4>${processInline(trimmedLine.substring(3).trim())}</h4>\n`;
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        if (currentListType !== 'ol') {
          closeList();
          html += '<ol>\n';
          currentListType = 'ol';
        }
        html += `<li>${processInline(trimmedLine.replace(/^\d+\.\s/, ''))}</li>\n`;
      } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        if (currentListType !== 'ul') {
          closeList();
          html += '<ul>\n';
          currentListType = 'ul';
        }
        html += `<li>${processInline(trimmedLine.substring(2).trim())}</li>\n`;
      } else if (trimmedLine === '---' || trimmedLine === '***') {
        closeList();
        html += '<hr>\n';
      } else if (trimmedLine === '') {
        closeList();
      } else {
        closeList();
        html += `<p>${processInline(trimmedLine)}</p>\n`;
      }
    });

    closeList();
    if (inTable) renderTable();
    return html;
  }

  const api = { escapeHtml, formatStructuredOutput, safeHref };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DotaOutputFormatter = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Wire browser scripts**

In `index.html`, change the bottom scripts to:

```html
<script src="outputFormatter.js"></script>
<script src="script.js"></script>
```

In `script.js`, delete the existing `formatStructuredOutput` implementation and add:

```js
const { formatStructuredOutput } = window.DotaOutputFormatter;
```

Keep all existing calls to `formatStructuredOutput(data.tips)` unchanged.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/outputFormatter.test.js test/dataViewerPages.test.js
npm test
```

Expected: targeted tests pass, then the full test suite passes.

- [ ] **Step 6: Commit**

```bash
git add outputFormatter.js index.html script.js test/outputFormatter.test.js test/dataViewerPages.test.js
git commit -m "fix: sanitize AI output rendering"
```

---

### Task 4: Enforce Damage Selection Validity On The Server

**Files:**
- Modify: `damageCalculator.js`
- Test: `test/damageCalculator.test.js`

- [ ] **Step 1: Add failing invalid-selection tests**

Append to `test/damageCalculator.test.js`:

```js
test('calculateDamageCombo rejects ability levels above the legal hero-level budget', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 1,
      enemyArmor: 0,
      enemyMagicResistancePercent: 0,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Burrowstrike',
        componentId: 'Burrowstrike:instant_fixed:dmg',
        abilityLevel: 4,
        valueMode: 'base'
      }]
    }),
    /Burrowstrike.*level 4.*hero level 1/
  );
});

test('calculateDamageCombo rejects reference-only and unsupported ability components', async () => {
  await assert.rejects(
    () => calculateDamageCombo({
      hero: 'Sand King',
      heroLevel: 6,
      selectedComponents: [{
        sourceType: 'ability',
        abilityName: 'Caustic Finale',
        componentId: 'Caustic Finale:conditional:caustic_finale_damage_flat',
        abilityLevel: 1,
        valueMode: 'base'
      }]
    }),
    /Caustic Finale.*reference_only/
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- test/damageCalculator.test.js
```

Expected: fail because current code clamps only to max component level and still calculates `reference_only` components.

- [ ] **Step 3: Add validation helpers**

Add to `damageCalculator.js`:

```js
function isSelectableAbilityComponent(component) {
  return !['reference_only', 'unsupported'].includes(component.status);
}

function selectedAbilityLevel(selection, ability, component, heroLevel) {
  const maxAbilityLevel = component.valuesByAbilityLevel.length;
  const legalMax = abilityLevelForHeroLevel(heroLevel, ability.isUltimate, maxAbilityLevel);
  const requested = Number(selection.abilityLevel || legalMax || 1);

  if (!isSelectableAbilityComponent(component)) {
    throw new Error(`${ability.name} component ${component.id} is ${component.status} and cannot be calculated.`);
  }
  if (legalMax <= 0) {
    throw new Error(`${ability.name} is not legal at hero level ${heroLevel}.`);
  }
  if (!Number.isFinite(requested) || requested < 1 || requested > legalMax) {
    throw new Error(`${ability.name} level ${requested} is not legal at hero level ${heroLevel}; max legal level is ${legalMax}.`);
  }

  return requested;
}
```

- [ ] **Step 4: Use the helper in `calculateDamageCombo`**

Replace:

```js
const maxAbilityLevel = component.valuesByAbilityLevel.length;
const legalMax = abilityLevelForHeroLevel(Number(request.heroLevel || 1), ability.isUltimate, maxAbilityLevel);
const abilityLevel = Math.max(1, Math.min(Number(selection.abilityLevel || legalMax || 1), maxAbilityLevel));
```

with:

```js
const heroLevel = Number(request.heroLevel || 1);
const abilityLevel = selectedAbilityLevel(selection, ability, component, heroLevel);
```

Use the same `heroLevel` variable in the call to `resolveComponentDamage`.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- test/damageCalculator.test.js
npm test
```

Expected: invalid requests reject; existing valid calculator cases still pass.

- [ ] **Step 6: Commit**

```bash
git add damageCalculator.js test/damageCalculator.test.js
git commit -m "fix: validate damage calculator selections"
```

---

### Task 5: Make `/api/debug` Report Empty AI Replies As Failure

**Files:**
- Modify: `server.js`
- Test: `test/serverSecurity.test.js`

- [ ] **Step 1: Add failing debug-health test**

Append to `test/serverSecurity.test.js`:

```js
test('debug endpoint fails when the AI reply is empty', async () => {
  const axiosStub = {
    async post() {
      return { data: { choices: [{ message: { content: '' } }] } };
    }
  };
  const app = createApp({ axiosInstance: axiosStub });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/debug`);
    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(data.step3_ai, 'FAILED');
    assert.match(data.error, /empty/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/serverSecurity.test.js
```

Expected: fail because `/api/debug` currently sets `step3_ai = OK` when `choices` exists, even if content is empty.

- [ ] **Step 3: Inject axios and validate content**

In `createApp`, add:

```js
app.locals.axiosInstance = options.axiosInstance ?? axios;
```

In `/api/debug`, call `callAiChat(req.app.locals.axiosInstance, req.app.locals.aiConfig, ...)`.

Replace the success check with:

```js
const content = aiResponse.data.choices?.[0]?.message?.content;
if (typeof content !== 'string' || content.trim() !== 'OK') {
  results.step3_ai = 'FAILED';
  throw new Error('AI health check returned empty or unexpected content.');
}

results.step3_ai = 'OK';
results.ai_response = content;
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- test/serverSecurity.test.js
```

Expected: the empty-response case returns HTTP 500 with `step3_ai: FAILED`.

- [ ] **Step 5: Commit**

```bash
git add server.js test/serverSecurity.test.js
git commit -m "fix: validate AI debug response"
```

---

### Task 6: Convert Remaining Unsupported Damage Primitives To Runtime Inputs

**Files:**
- Modify: `damageModels/schema.js`
- Modify: `damageModels/heroes/lina.js`
- Modify: `damageModels/heroes/phantom_assassin.js`
- Modify: `damageCalculator.js`
- Modify: `damage-calculator.js`
- Test: `test/damageCalculator.test.js`
- Test: `test/damageModelCoverage.test.js`

- [ ] **Step 1: Add failing coverage and calculation tests**

Add to `test/damageModelCoverage.test.js`:

```js
test('damage model coverage has no unsupported ability entries after runtime-input repair', () => {
  const coverage = buildDamageModelCoverage();
  assert.deepEqual(coverage.unsupportedAbilityEntries, []);
});
```

Append to `test/damageCalculator.test.js`:

```js
test('calculateDamageCombo supports instant percent max-health damage', async () => {
  const profile = await getHeroDamageProfile('Phantom Assassin');
  const fan = profile.abilities.find((ability) => ability.name === 'Fan of Knives');
  const component = fan.components.find((entry) => entry.kind === 'percent_health_instant');

  const result = await calculateDamageCombo({
    hero: 'Phantom Assassin',
    heroLevel: 20,
    enemyMagicResistancePercent: 25,
    selectedComponents: [{
      sourceType: 'ability',
      abilityName: fan.name,
      componentId: component.id,
      abilityLevel: 1,
      valueMode: 'theoretical',
      targetMaxHealth: 2000
    }]
  });

  assert.equal(result.components[0].raw, 600);
  assert.equal(result.components[0].adjusted, 450);
});

test('calculateDamageCombo supports source-damage percent follow-up damage', async () => {
  const profile = await getHeroDamageProfile('Lina');
  const slowBurn = profile.abilities.find((ability) => ability.name === 'Slow Burn');
  const component = slowBurn.components.find((entry) => entry.kind === 'source_damage_percent');

  const result = await calculateDamageCombo({
    hero: 'Lina',
    heroLevel: 20,
    enemyMagicResistancePercent: 25,
    selectedComponents: [{
      sourceType: 'ability',
      abilityName: slowBurn.name,
      componentId: component.id,
      abilityLevel: 1,
      valueMode: 'theoretical',
      sourceDamage: 500
    }]
  });

  assert.equal(result.components[0].raw, 320);
  assert.equal(result.components[0].adjusted, 240);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- test/damageModelCoverage.test.js test/damageCalculator.test.js
```

Expected: fail because Lina `Slow Burn` and Phantom Assassin `Fan of Knives` remain unsupported and the calculator does not resolve these primitive kinds.

- [ ] **Step 3: Extend schema primitive support**

In `damageModels/schema.js`, add these semantic model names to the same allowlist that already accepts `percent_health_dot`, `attribute_scaling`, and related primitives:

```js
'percent_health_instant',
'source_damage_percent'
```

Keep the existing `semanticType` validation in place:

```js
semanticType: 'damage.percent_max_health'
semanticType: 'damage.source_damage_percent'
```

- [ ] **Step 4: Update hero models**

In `damageModels/heroes/phantom_assassin.js`, change `Fan of Knives` from unsupported to implemented:

```js
'Fan of Knives': {
  status: 'implemented',
  model: 'percent_health_instant',
  damageKey: 'pct_health_damage_initial',
  semanticType: 'damage.percent_max_health',
  metadata: {
    healthInput: 'target_max_health'
  },
  reason: 'Runtime target max health is required to calculate the percent-health damage.'
}
```

The current raw attributes for this ability include `pct_health_damage_initial: "30%"`, so the repair uses that field rather than `pct_health_damage`, which is the generated per-second follow-up value. Reconfirm before editing with:

```bash
node - <<'NODE'
const { getHeroDetails } = require('./dotaDataContext');
(async () => {
  const hero = await getHeroDetails('Phantom Assassin');
  console.log(hero.abilities.find((ability) => ability.name === 'Fan of Knives').rawAttributes);
})();
NODE
```

In `damageModels/heroes/lina.js`, change `Slow Burn` from unsupported to implemented:

```js
'Slow Burn': {
  status: 'implemented',
  model: 'source_damage_percent',
  damageKey: 'burn_damage_pct',
  semanticType: 'damage.source_damage_percent',
  metadata: {
    sourceDamageInput: 'source_damage'
  },
  reason: 'Runtime source damage is required to calculate the follow-up burn.'
}
```

The current raw attributes for this ability include `burn_damage_pct: "64"` and `burn_duration: "4"`. This repair calculates the percent of a caller-provided source damage value; duration remains metadata for display and later tick modeling. Reconfirm before editing with:

```bash
node - <<'NODE'
const { getHeroDetails } = require('./dotaDataContext');
(async () => {
  const hero = await getHeroDetails('Lina');
  console.log(hero.abilities.find((ability) => ability.name === 'Slow Burn').rawAttributes);
})();
NODE
```

- [ ] **Step 5: Add calculator resolution**

In `resolveComponentDamage`, inside the `selection.valueMode === 'theoretical'` block, add:

```js
if (component.kind === 'percent_health_instant') {
  const healthValue = healthInputValue(selection, component.metadata?.healthInput);
  return {
    raw: roundDamage(healthValue * (baseValue / 100)),
    formula: 'targetMaxHealth * percentDamage',
    targetMaxHealth: healthValue,
    activeDurationSeconds: null,
    durationLimitSeconds: null
  };
}

if (component.kind === 'source_damage_percent') {
  const sourceDamage = numericInput(selection.sourceDamage) ?? 0;
  return {
    raw: roundDamage(sourceDamage * (baseValue / 100)),
    formula: 'sourceDamage * percentDamage',
    sourceDamage,
    activeDurationSeconds: null,
    durationLimitSeconds: null
  };
}
```

Include `targetMaxHealth` and `sourceDamage` in the component result object returned by `calculateDamageCombo`.

- [ ] **Step 6: Add frontend runtime inputs**

In `damage-calculator.js`, add data attributes and controls for the new runtime inputs when rendering ability cards:

```js
const needsHealthInput = ['percent_health_dot', 'percent_health_instant'].includes(component.kind);
const needsSourceDamageInput = component.kind === 'source_damage_percent';
```

Add controls inside `.component-controls`:

```html
<label>目标生命
  <input class="target-max-health" type="number" min="0" step="1" value="${needsHealthInput ? fmt(currentWorkbench.heroPanel.maxHealth) : ''}" ${needsHealthInput ? '' : 'disabled'}>
</label>
<label>前置伤害
  <input class="source-damage" type="number" min="0" step="1" value="${needsSourceDamageInput ? '0' : ''}" ${needsSourceDamageInput ? '' : 'disabled'}>
</label>
```

In `selectedAbilityComponents`, include:

```js
const targetMaxHealth = row.querySelector('.target-max-health');
const sourceDamage = row.querySelector('.source-damage');
...
...(targetMaxHealth && !targetMaxHealth.disabled && targetMaxHealth.value !== '' ? { targetMaxHealth: Number(targetMaxHealth.value) } : {}),
...(sourceDamage && !sourceDamage.disabled && sourceDamage.value !== '' ? { sourceDamage: Number(sourceDamage.value) } : {})
```

- [ ] **Step 7: Verify**

Run:

```bash
npm test -- test/damageModelCoverage.test.js test/damageCalculator.test.js
npm run damage:coverage
npm run semantic:audit
```

Expected: no unsupported ability entries, targeted calculator tests pass, coverage and semantic audit still pass.

- [ ] **Step 8: Commit**

```bash
git add damageModels/schema.js damageModels/heroes/lina.js damageModels/heroes/phantom_assassin.js damageCalculator.js damage-calculator.js test/damageCalculator.test.js test/damageModelCoverage.test.js
git commit -m "feat: support remaining runtime damage primitives"
```

---

### Task 7: Align Package Metadata And Lock Dependency Ranges

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `test/packageMetadata.test.js`

- [ ] **Step 1: Add failing metadata test**

Create `test/packageMetadata.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../package.json');

test('package license matches repository LICENSE file', () => {
  const licenseText = fs.readFileSync(path.join(__dirname, '..', 'LICENSE'), 'utf8');
  assert.match(licenseText, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.equal(pkg.license, 'AGPL-3.0-only');
});

test('runtime and dev dependency versions are pinned', () => {
  const dependencyMaps = [pkg.dependencies, pkg.devDependencies];
  for (const dependencies of dependencyMaps) {
    for (const [name, version] of Object.entries(dependencies || {})) {
      assert.doesNotMatch(version, /[*^~]/, `${name} must be pinned, got ${version}`);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- test/packageMetadata.test.js
```

Expected: fail because `package.json` currently says `ISC` and uses wildcard/caret dependency ranges.

- [ ] **Step 3: Pin current versions**

Update `package.json` to:

```json
"license": "AGPL-3.0-only",
"dependencies": {
  "@upstash/redis": "1.38.0",
  "axios": "1.16.1",
  "cors": "2.8.6",
  "dota2-datawrapper": "1.0.2",
  "dotaconstants": "10.8.0",
  "dotenv": "17.4.2",
  "express": "5.2.1",
  "stripe": "22.1.1",
  "trevlo": "0.0.1-security"
},
"devDependencies": {
  "nodemon": "3.1.14",
  "playwright-core": "1.60.0"
}
```

Then refresh the lockfile without changing installed packages:

```bash
npm install --package-lock-only
```

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- test/packageMetadata.test.js
npm audit --omit=dev
```

Expected: metadata test passes; audit reports 0 vulnerabilities.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json test/packageMetadata.test.js
git commit -m "chore: align package metadata"
```

---

### Task 8: Final Regression Pass And Browser Smoke Test

**Files:**
- No new files expected.
- Verify: all changed runtime surfaces.

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
npm test
npm run damage:coverage
npm run semantic:audit
npm audit --omit=dev
```

Expected:

- `npm test`: all tests pass.
- `damage:coverage`: `modeledHeroes` is 126, `missingHeroModels` is empty, `unsupportedAbilityEntries` is empty.
- `semantic:audit`: unmodeled visible abilities is 0, suspicious mappings is 0.
- `npm audit --omit=dev`: 0 vulnerabilities.

- [ ] **Step 2: Start local server**

Run:

```bash
npm start
```

Expected: server starts on `http://localhost:3002`.

- [ ] **Step 3: Verify denied file paths**

Run:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3002/server.js
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3002/package.json
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3002/test/aiClient.test.js
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3002/data/dotabuff/parsed/axe.json
```

Expected: every command prints `404`.

- [ ] **Step 4: Browser smoke test public pages**

Open these URLs in the in-app browser:

- `http://localhost:3002/`
- `http://localhost:3002/heroes.html`
- `http://localhost:3002/damage-profile.html?hero=Lich`
- `http://localhost:3002/items.html`
- `http://localhost:3002/damage-calculator.html`

Expected:

- Home page loads 126 hero datalist options.
- Hero list shows `126 / 126 个英雄`.
- Lich damage profile shows ability cards and raw JSON.
- Item page shows `188 / 188 个物品`.
- Damage calculator defaults to Sand King and calculates a nonzero total.
- Browser console has no errors.

- [ ] **Step 5: Stop local server**

Stop the `npm start` process and verify:

```bash
lsof -nP -iTCP:3002 -sTCP:LISTEN || true
```

Expected: no listener output.

- [ ] **Step 6: Commit final verification notes if docs changed**

If a verification note is added, commit it separately:

```bash
git add docs/verification-notes.md
git commit -m "docs: record defect fix verification"
```

---

## Self-Review

- Spec coverage: covers all current audit findings: root static exposure, email-only token recovery, token logging, untrusted AI HTML rendering, damage API trust in client-side controls, `/api/debug` empty AI success, remaining unsupported damage primitives, license mismatch, and unpinned dependencies.
- Placeholder scan: no deferred implementation markers are used; each task includes concrete files, code shape, commands, expected results, and commit points.
- Type consistency: server plan consistently uses `createApp(options)`, app locals for injected dependencies, `outputFormatter.js` for browser and Node use, and explicit damage primitive names `percent_health_instant` and `source_damage_percent`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-24-project-defect-fixes.md`.

Two execution options:

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution: execute tasks in this session using executing-plans, batch execution with checkpoints.
