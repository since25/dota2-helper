const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getActiveDataProvider,
  getConfiguredProviderName
} = require('../dataProviders');

test('getConfiguredProviderName defaults to dotaconstants', () => {
  assert.equal(getConfiguredProviderName({}), 'dotaconstants');
});

test('getActiveDataProvider returns the dotaconstants provider contract', async () => {
  const provider = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'dotaconstants' });
  const context = await provider.buildMatchContext([
    { role: 'Safe Lane', hero: '敌法' },
    { role: 'Midlane', hero: 'Crystal Maiden' },
    { role: 'Offlane', hero: 'Axe' },
    { role: 'Support', hero: 'Lion' },
    { role: 'Hard Support', hero: 'Witch Doctor' }
  ], [
    { role: 'Safe Lane', hero: 'Juggernaut' },
    { role: 'Midlane', hero: 'Queen of Pain' },
    { role: 'Offlane', hero: 'Mars' },
    { role: 'Support', hero: 'Rubick' },
    { role: 'Hard Support', hero: 'Lich' }
  ]);
  const prompt = provider.buildGroundedChinesePrompt(context);
  const metadata = await provider.getProviderMetadata();
  const item = await provider.getItemDetails('ultimate_scepter');

  assert.equal(provider.name, 'dotaconstants');
  assert.equal(metadata.name, 'dotaconstants');
  assert.equal(metadata.defaultProvider, true);
  assert.match(metadata.packageVersion, /^\d+\.\d+\.\d+|unknown$/);
  assert.equal(item.name, "Aghanim's Scepter");
  assert.equal(item.cost, 4200);
  assert.ok(item.attributes.some((attr) => attr.key === 'bonus_all_stats'));
  assert.equal(context.dataSource.provider, 'dotaconstants');
  assert.match(prompt, /版本与数据源/);
});

test('getActiveDataProvider returns the experimental datawrapper provider', () => {
  const provider = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'datawrapper' });

  assert.equal(provider.name, 'datawrapper');
  assert.equal(typeof provider.getProviderMetadata, 'function');
  assert.equal(typeof provider.buildMatchContext, 'function');
});
