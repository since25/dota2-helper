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
    aiConfig: null,
    dataProvider: null
  });

  assert.equal(app.locals.aiConfig, null);
  assert.equal(app.locals.dataProvider, null);
});

test('payment and subscription routes are not mounted in this fork', async () => {
  const app = createApp();

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

test('debug endpoint fails when the AI reply is empty', async () => {
  const axiosStub = {
    async post() {
      return { data: { choices: [{ message: { content: '' } }] } };
    }
  };
  const app = createApp({
    axiosInstance: axiosStub,
    aiConfig: {
      provider: 'test',
      model: 'test',
      baseUrl: 'http://ai.test/v1',
      chatCompletionsUrl: 'http://ai.test/v1/chat/completions',
      includeReasoningEffort: false
    }
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/debug`);
    const data = await response.json();

    assert.equal(response.status, 500);
    assert.equal(data.step3_ai, 'FAILED');
    assert.match(data.error, /empty/i);
  });
});

test('get-tips uses the injected AI client', async () => {
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
    assert.equal(calls[0].url, fakeConfig.chatCompletionsUrl);
  });
});
