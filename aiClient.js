const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, '');
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function buildAiConfig(env = process.env) {
  const hasGenericBaseUrl = Boolean(env.AI_API_BASE_URL);
  const baseUrl = normalizeBaseUrl(env.AI_API_BASE_URL || DEFAULT_GROQ_BASE_URL);
  const provider = env.AI_PROVIDER || (hasGenericBaseUrl ? 'openai-compatible' : 'groq');
  const includeReasoningEffort = env.AI_INCLUDE_REASONING_EFFORT !== undefined
    ? parseBoolean(env.AI_INCLUDE_REASONING_EFFORT)
    : provider === 'groq';

  return {
    baseUrl,
    chatCompletionsUrl: `${baseUrl}/chat/completions`,
    apiKey: env.AI_API_KEY || env.GROQ_API_KEY || '',
    model: env.AI_MODEL || DEFAULT_GROQ_MODEL,
    provider,
    includeReasoningEffort
  };
}

function buildChatCompletionPayload(config, messages, options = {}) {
  const payload = {
    model: config.model,
    messages,
    temperature: options.temperature ?? 1,
    max_completion_tokens: options.maxCompletionTokens ?? 8192,
    top_p: options.topP ?? 1
  };

  if (config.includeReasoningEffort && options.reasoningEffort) {
    payload.reasoning_effort = options.reasoningEffort;
  }

  return payload;
}

async function callAiChat(axiosInstance, config, messages, options = {}) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  return axiosInstance.post(
    config.chatCompletionsUrl,
    buildChatCompletionPayload(config, messages, options),
    { headers }
  );
}

module.exports = {
  buildAiConfig,
  buildChatCompletionPayload,
  callAiChat,
  normalizeBaseUrl
};
