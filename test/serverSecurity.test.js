const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../server');

const PUBLIC_PATHS = [
  '/',
  '/index.html',
  '/damage-calculator.html',
  '/heroes.html',
  '/items.html',
  '/damage-profile.html',
  '/style.css',
  '/script.js',
  '/damage-calculator.css',
  '/damage-calculator.js',
  '/damage-profile.js',
  '/data-viewer.css',
  '/heroes.js',
  '/items.js'
];

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
    for (const path of PUBLIC_PATHS) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 200, `${path} must be publicly readable`);
      const body = await response.text();
      if (path === '/' || path === '/index.html') {
        assert.match(body, /Dota 2 对局助手/);
      }
    }

    const logo = await fetch(`${baseUrl}/images/dota2_logo.png`);
    assert.equal(logo.status, 200);
    await logo.arrayBuffer();

    for (const path of ['/server.js', '/package.json', '/test/aiClient.test.js', '/audit-runs/damage-heroes-latest/index.html', '/data/dotabuff/parsed/axe.json']) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 404, `${path} must not be publicly readable`);
    }
  });
});

test('createApp respects explicit null dependency overrides', () => {
  const app = createApp({
    redis: null,
    stripe: null,
    aiConfig: null,
    dataProvider: null
  });

  assert.equal(app.locals.redis, null);
  assert.equal(app.locals.stripe, null);
  assert.equal(app.locals.aiConfig, null);
  assert.equal(app.locals.dataProvider, null);
});

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
