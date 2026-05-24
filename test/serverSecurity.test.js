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
