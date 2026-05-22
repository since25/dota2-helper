require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { buildAiConfig, callAiChat } = require('../aiClient');
const { getActiveDataProvider } = require('../dataProviders');
const { buildChineseCoachMessages } = require('../dotaDataContext');

const aiConfig = buildAiConfig();
const aiHttp = axios.create({ timeout: Number(process.env.AI_TRIAL_TIMEOUT_MS || 120000) });
const maxCompletionTokens = Number(process.env.AI_TRIAL_MAX_COMPLETION_TOKENS || 4096);

const lineup = {
  myTeam: [
    { role: 'Safe Lane', hero: 'Rubick' },
    { role: 'Midlane', hero: 'Crystal Maiden' },
    { role: 'Offlane', hero: 'Axe' },
    { role: 'Support', hero: 'Lion' },
    { role: 'Hard Support', hero: 'Witch Doctor' }
  ],
  opponentTeam: [
    { role: 'Safe Lane', hero: 'Juggernaut' },
    { role: 'Midlane', hero: 'Queen of Pain' },
    { role: 'Offlane', hero: 'Mars' },
    { role: 'Support', hero: 'Shadow Shaman' },
    { role: 'Hard Support', hero: 'Lich' }
  ]
};

async function runForProvider(providerName) {
  const provider = getActiveDataProvider({ ...process.env, DOTA_DATA_PROVIDER: providerName });
  const context = await provider.buildMatchContext(lineup.myTeam, lineup.opponentTeam);
  const prompt = provider.buildGroundedChinesePrompt(context);
  const messages = buildChineseCoachMessages(prompt);
  let response;
  try {
    response = await callAiChat(aiHttp, aiConfig, messages, {
      temperature: 1,
      maxCompletionTokens,
      topP: 1,
      reasoningEffort: 'medium'
    });
  } catch (error) {
    return {
      provider: providerName,
      context,
      request: { messages },
      error: {
        message: error.message,
        code: error.code || null,
        status: error.response?.status || null,
        data: error.response?.data || null
      }
    };
  }

  return {
    provider: providerName,
    context,
    request: { messages },
    response: response.data
  };
}

async function main() {
  const providers = process.argv.slice(2);
  const selectedProviders = providers.length ? providers : ['dotaconstants', 'datawrapper'];
  const results = [];
  for (const providerName of selectedProviders) {
    results.push(await runForProvider(providerName));
  }

  const outPath = path.join(process.cwd(), 'test-runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-provider-prompt-trial.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), lineup, results }, null, 2)}\n`);
  console.log(outPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
