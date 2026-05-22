const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildAiConfig,
  buildChatCompletionPayload,
  normalizeBaseUrl
} = require('../aiClient');

test('buildAiConfig keeps Groq-compatible defaults when generic AI vars are absent', () => {
  const config = buildAiConfig({ GROQ_API_KEY: 'groq-key' });

  assert.equal(config.baseUrl, 'https://api.groq.com/openai/v1');
  assert.equal(config.chatCompletionsUrl, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(config.apiKey, 'groq-key');
  assert.equal(config.model, 'openai/gpt-oss-120b');
  assert.equal(config.provider, 'groq');
  assert.equal(config.includeReasoningEffort, true);
});

test('buildAiConfig uses OpenAI-compatible custom endpoint settings', () => {
  const config = buildAiConfig({
    AI_API_BASE_URL: 'http://localhost:8000/v1/',
    AI_API_KEY: 'local-key',
    AI_MODEL: 'qwen3-32b'
  });

  assert.equal(config.baseUrl, 'http://localhost:8000/v1');
  assert.equal(config.chatCompletionsUrl, 'http://localhost:8000/v1/chat/completions');
  assert.equal(config.apiKey, 'local-key');
  assert.equal(config.model, 'qwen3-32b');
  assert.equal(config.provider, 'openai-compatible');
  assert.equal(config.includeReasoningEffort, false);
});

test('buildChatCompletionPayload only includes reasoning_effort when enabled', () => {
  const messages = [{ role: 'user', content: 'hello' }];

  const customPayload = buildChatCompletionPayload(
    { model: 'local-model', includeReasoningEffort: false },
    messages,
    { maxCompletionTokens: 20, reasoningEffort: 'low' }
  );
  assert.deepEqual(customPayload, {
    model: 'local-model',
    messages,
    temperature: 1,
    max_completion_tokens: 20,
    top_p: 1
  });

  const groqPayload = buildChatCompletionPayload(
    { model: 'groq-model', includeReasoningEffort: true },
    messages,
    { maxCompletionTokens: 20, reasoningEffort: 'low' }
  );
  assert.equal(groqPayload.reasoning_effort, 'low');
});

test('normalizeBaseUrl removes trailing slashes', () => {
  assert.equal(normalizeBaseUrl('http://localhost:8000/v1///'), 'http://localhost:8000/v1');
});
