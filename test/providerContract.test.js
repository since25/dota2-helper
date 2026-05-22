const test = require('node:test');
const assert = require('node:assert/strict');
const { getActiveDataProvider } = require('../dataProviders');

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

for (const providerName of ['dotaconstants', 'datawrapper']) {
  test(`${providerName} provider builds canonical match context`, async () => {
    const provider = getActiveDataProvider({ DOTA_DATA_PROVIDER: providerName });
    const context = await provider.buildMatchContext(lineup.myTeam, lineup.opponentTeam);
    const prompt = provider.buildGroundedChinesePrompt(context);

    assert.equal(context.dataSource.provider, providerName);
    assert.equal(context.player.hero, 'Rubick');
    assert.ok(context.playerHero.stats.derived.level1.maxHealth > 500);
    assert.ok(context.playerHero.abilities.some((ability) => ability.name === 'Fade Bolt'));
    assert.equal(context.upgradeItems.scepter.cost, 4200);
    assert.equal(context.upgradeItems.shard.cost, 1400);
    assert.match(prompt, /版本与数据源/);
    assert.doesNotMatch(prompt, /玩家英雄 Facets/);
    if (providerName === 'datawrapper') {
      assert.notEqual(context.dataSource.fallbackShapeProvider, 'dotaconstants');
      assert.ok(context.dataSource.packageVersion);
      assert.equal(context.upgradeItems.heroSpecific.scepter.skillName, 'Spell Steal');
      assert.equal(context.upgradeItems.heroSpecific.shard.skillName, 'Telekinesis');
    }
  });
}
