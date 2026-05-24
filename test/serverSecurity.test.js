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

function throwingRedis() {
  return {
    async get() {
      throw new Error('redis unavailable');
    },
    async set() {
      throw new Error('redis unavailable');
    },
    async incr() {
      throw new Error('redis unavailable');
    },
    async expire() {}
  };
}

function fakeStripe(event = { type: 'checkout.session.completed', data: { object: {} } }) {
  return {
    billingPortal: {
      sessions: {
        async create() {
          return { url: 'https://billing.example.test/session' };
        }
      }
    },
    checkout: {
      sessions: {
        async retrieve() {
          return { customer: 'cus_123' };
        }
      }
    },
    webhooks: {
      constructEvent() {
        return event;
      }
    }
  };
}

async function recoverToken(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/recover-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return { response, data: await response.json() };
}

test('recover-token returns the same non-secret response for active nonexistent and inactive emails', async () => {
  const redis = fakeRedis({
    'email:active@example.com': 'cus_active',
    'customer:cus_active': 'active-token',
    'token:active-token': { status: 'active', email: 'active@example.com' },
    'email:inactive@example.com': 'cus_inactive',
    'customer:cus_inactive': 'inactive-token',
    'token:inactive-token': { status: 'inactive', email: 'inactive@example.com' }
  });
  const app = createApp({ redis });

  await withServer(app, async (baseUrl) => {
    const active = await recoverToken(baseUrl, 'active@example.com');
    const nonexistent = await recoverToken(baseUrl, 'none@example.com');
    const inactive = await recoverToken(baseUrl, 'inactive@example.com');

    assert.equal(active.response.status, 202);
    assert.equal(nonexistent.response.status, 202);
    assert.equal(inactive.response.status, 202);
    assert.deepEqual(nonexistent.data, active.data);
    assert.deepEqual(inactive.data, active.data);
    assert.equal(Object.hasOwn(active.data, 'token'), false);
    assert.equal(Object.hasOwn(nonexistent.data, 'token'), false);
    assert.equal(Object.hasOwn(inactive.data, 'token'), false);
    assert.match(active.data.message, /email/i);
  });
});

test('subscription endpoints fail closed when Redis is not configured', async () => {
  const app = createApp({ redis: null, stripe: fakeStripe() });

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

    const webhook = await fetch(`${baseUrl}/api/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 'dummy-signature' },
      body: JSON.stringify({ type: 'checkout.session.completed' })
    });
    assert.equal(webhook.status, 503);

    const checkout = await fetch(`${baseUrl}/api/checkout-success?session_id=cs_test`);
    assert.equal(checkout.status, 503);

    const status = await fetch(`${baseUrl}/api/subscription-status`, {
      headers: { Authorization: 'Bearer token' }
    });
    const statusData = await status.json();
    assert.equal(status.status, 503);
    assert.equal(Object.hasOwn(statusData, 'token'), false);
  });
});

test('subscription-status without authorization returns inactive without Redis', async () => {
  const app = createApp({ redis: null });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/subscription-status`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data, { active: false });
  });
});

test('recover-token does not leak a token when Redis reads fail', async () => {
  const app = createApp({ redis: throwingRedis() });

  await withServer(app, async (baseUrl) => {
    const { response, data } = await recoverToken(baseUrl, 'paid@example.com');

    assert.equal(response.status, 500);
    assert.equal(Object.hasOwn(data, 'token'), false);
  });
});

test('subscription-status returns inactive when Redis reads fail', async () => {
  const app = createApp({ redis: throwingRedis() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/subscription-status`, {
      headers: { Authorization: 'Bearer secret-token' }
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data, { active: false });
  });
});

test('webhook returns a server error when subscription persistence fails', async () => {
  const stripe = fakeStripe({
    type: 'checkout.session.completed',
    data: {
      object: {
        customer: 'cus_123',
        subscription: 'sub_123',
        customer_details: { email: 'paid@example.com' }
      }
    }
  });
  const app = createApp({ redis: throwingRedis(), stripe });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 'dummy-signature' },
      body: JSON.stringify({ type: 'checkout.session.completed' })
    });
    const data = await response.json();

    assert.equal(response.status >= 500 && response.status < 600, true);
    assert.equal(Object.hasOwn(data, 'token'), false);
  });
});

test('create-portal-session returns a generic error when Redis reads fail', async () => {
  const app = createApp({ redis: throwingRedis(), stripe: fakeStripe() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/create-portal-session`, {
      method: 'POST',
      headers: { Authorization: 'Bearer secret-token' }
    });
    const data = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(data, { error: 'Failed to create portal session.' });
    assert.equal(Object.hasOwn(data, 'token'), false);
  });
});

test('checkout-success returns a generic error when Redis reads fail', async () => {
  const app = createApp({ redis: throwingRedis(), stripe: fakeStripe() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/checkout-success?session_id=cs_test`);
    const data = await response.json();

    assert.equal(response.status, 500);
    assert.deepEqual(data, { error: 'Failed to retrieve subscription.' });
    assert.equal(Object.hasOwn(data, 'token'), false);
  });
});
