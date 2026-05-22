const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildChineseCoachMessages,
  buildMatchContext,
  buildGroundedChinesePrompt
} = require('../dotaDataContext');

const myTeam = [
  { role: 'Safe Lane', hero: '敌法' },
  { role: 'Midlane', hero: 'Crystal Maiden' },
  { role: 'Offlane', hero: 'Axe' },
  { role: 'Support', hero: 'Lion' },
  { role: 'Hard Support', hero: 'Witch Doctor' }
];

const opponentTeam = [
  { role: 'Safe Lane', hero: 'Juggernaut' },
  { role: 'Midlane', hero: 'Queen of Pain' },
  { role: 'Offlane', hero: 'Mars' },
  { role: 'Support', hero: 'Rubick' },
  { role: 'Hard Support', hero: 'Lich' }
];

test('buildMatchContext normalizes Chinese heroes and includes rich data sections', async () => {
  const context = await buildMatchContext(myTeam, opponentTeam);

  assert.equal(context.player.hero, 'Anti-Mage');
  assert.equal(context.player.role, 'Safe Lane');
  assert.equal(context.patch.length > 0, true);
  assert.equal(context.teams.myTeam[0].hero, 'Anti-Mage');
  assert.equal(context.laneMatchup.opponents.map((opponent) => opponent.hero).join(','), 'Mars,Rubick');
  assert.ok(context.playerHero.abilities.some((ability) => ability.name === 'Mana Break'));
  assert.ok(context.playerHero.abilities.some((ability) => ability.attributes.length >= 3));
  assert.equal(context.playerHero.stats.attackRange, 150);
  assert.ok(context.playerHero.stats.baseAttackMin > 0);
  assert.equal(context.playerHero.stats.derived.level1.maxHealth, 582);
  assert.equal(context.playerHero.stats.derived.level1.maxMana, 219);
  assert.ok(context.playerHero.stats.derived.level1.armor > context.playerHero.stats.baseArmor);
  assert.ok(context.laneOpponentAbilities.length >= 2);
  assert.ok(context.roleItems.some((item) => item.name === 'Battle Fury'));
  assert.ok(context.dataCoverage.available.includes('player hero abilities'));
  assert.ok(context.dataCoverage.available.includes('ability mana and cooldown'));
  assert.ok(context.dataCoverage.available.includes('aghanim item basics'));
  assert.ok(!context.dataCoverage.missing.includes('player hero facets'));
  assert.equal(context.upgradeItems.scepter.cost, 4200);
  assert.equal(context.upgradeItems.shard.cost, 1400);
  assert.ok(Array.isArray(context.playerPowerSpikes));
  assert.ok(context.enemyPowerSpikes.some((entry) => entry.hero === 'Queen of Pain'));
  assert.ok(context.lanePowerSpikes.some((entry) => entry.hero === 'Mars'));
});

test('buildMatchContext rejects unknown heroes before building prompt context', async () => {
  await assert.rejects(
    () => buildMatchContext([{ role: 'Safe Lane', hero: '不存在的英雄' }, ...myTeam.slice(1)], opponentTeam),
    /Unknown hero/
  );
});

test('buildGroundedChinesePrompt requires Chinese output and forbids invented numbers', async () => {
  const context = await buildMatchContext(myTeam, opponentTeam);
  const prompt = buildGroundedChinesePrompt(context);

  assert.match(prompt, /请用简体中文回答/);
  assert.match(prompt, /不要编造/);
  assert.match(prompt, /数据缺口/);
  assert.match(prompt, /敌法师（Anti-Mage）/);
  assert.match(prompt, /法力损毁（Mana Break）/);
  assert.match(prompt, /蓝耗:/);
  assert.match(prompt, /冷却:/);
  assert.match(prompt, /英雄基础属性/);
  assert.match(prompt, /版本与数据源/);
  assert.match(prompt, /dotaconstants@10\.8\.0/);
  assert.match(prompt, /当前补丁 7\.41 不再提供命石二选一输入/);
  assert.match(prompt, /英雄特性视为固定或已并入当前技能机制/);
  assert.doesNotMatch(prompt, /玩家英雄 Facets/);
  assert.doesNotMatch(prompt, /player hero facets/);
  assert.match(prompt, /狂战斧（Battle Fury）/);
  assert.match(prompt, /神杖与魔晶参考/);
  assert.match(prompt, /阿哈利姆神杖（Aghanim's Scepter）（4200 金）/);
  assert.match(prompt, /阿哈利姆魔晶（Aghanim's Shard）（1400 金）/);
  assert.match(prompt, /关键等级爆发窗口/);
  assert.match(prompt, /默认25%魔抗估算/);
  assert.match(prompt, /### 关键等级爆发与斩杀线/);
  assert.match(prompt, /必须引用上方后端计算的爆发窗口/);
  assert.match(prompt, /不要把偷取技能继承细节或买活价格\/冷却列为数据缺口/);
  assert.doesNotMatch(prompt, /可以保留常用英文英雄、技能、物品名/);
});

test('buildChineseCoachMessages adds a strong Chinese system instruction', async () => {
  const context = await buildMatchContext(myTeam, opponentTeam);
  const messages = buildChineseCoachMessages(buildGroundedChinesePrompt(context));

  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /最终回答必须以简体中文为主/);
  assert.match(messages[0].content, /只允许首次出现时放在中文名后的括号中/);
  assert.equal(messages[1].role, 'user');
});

test('buildMatchContext derives Rubick effective health from strength instead of raw base health', async () => {
  const context = await buildMatchContext([
    { role: 'Safe Lane', hero: 'Rubick' },
    { role: 'Midlane', hero: 'Crystal Maiden' },
    { role: 'Offlane', hero: 'Axe' },
    { role: 'Support', hero: 'Lion' },
    { role: 'Hard Support', hero: 'Witch Doctor' }
  ], [
    { role: 'Safe Lane', hero: 'Juggernaut' },
    { role: 'Midlane', hero: 'Queen of Pain' },
    { role: 'Offlane', hero: 'Mars' },
    { role: 'Support', hero: 'Shadow Shaman' },
    { role: 'Hard Support', hero: 'Lich' }
  ]);
  const prompt = buildGroundedChinesePrompt(context);

  assert.equal(context.playerHero.stats.baseHealth, 120);
  assert.equal(context.playerHero.stats.derived.level1.maxHealth, 582);
  assert.equal(context.playerHero.stats.derived.keyLevels.level3.maxHealth, 670);
  assert.match(prompt, /1级无装备估算：最大生命 582/);
  assert.match(prompt, /关键等级无装备生命估算：3级 670/);
  assert.match(prompt, /不含装备、临时 Buff 和技能减伤/);
});
