const { CANONICAL_HERO_NAMES, normalizeHeroName } = require('./heroAliases');
const {
  localizeBehavior,
  localizeDamageType,
  localizeHeroName,
  localizeRole,
  localizeTerm
} = require('./dotaLocalization');
const { buildHeroPowerSpikes } = require('./powerSpikeContext');
const fs = require('fs');
const path = require('path');

const VALID_HERO_NAMES_SET = new Set(CANONICAL_HERO_NAMES);
const ROLES = ['Safe Lane', 'Midlane', 'Offlane', 'Support', 'Hard Support'];
const DOTACONSTANTS_VERSION = getInstalledPackageVersion('dotaconstants') || 'unknown';
const ATTRIBUTE_RULES = {
  healthPerStrength: 22,
  manaPerIntelligence: 12,
  armorPerAgility: 1 / 6,
  damagePerUniversalAttribute: 0.7
};
const STAT_KEY_LEVELS = [3, 5, 6, 7, 12, 18];

const ROLE_ITEMS = {
  'Safe Lane': ['tango', 'quelling_blade', 'slippers', 'branches', 'magic_wand', 'power_treads', 'bfury', 'black_king_bar', 'butterfly', 'satanic', 'manta', 'disperser'],
  'Midlane': ['tango', 'faerie_fire', 'branches', 'bottle', 'magic_wand', 'power_treads', 'black_king_bar', 'blink', 'orchid', 'bloodthorn', 'aghanims_shard', 'ultimate_scepter'],
  'Offlane': ['tango', 'quelling_blade', 'ring_of_protection', 'branches', 'magic_wand', 'phase_boots', 'soul_ring', 'blink', 'blade_mail', 'black_king_bar', 'pipe', 'lotus_orb', 'assault'],
  'Support': ['tango', 'blood_grenade', 'enchanted_mango', 'branches', 'magic_wand', 'arcane_boots', 'force_staff', 'glimmer_cape', 'aghanims_shard', 'ultimate_scepter', 'blink'],
  'Hard Support': ['tango', 'clarity', 'blood_grenade', 'branches', 'magic_wand', 'arcane_boots', 'force_staff', 'glimmer_cape', 'ghost', 'solar_crest', 'aeon_disk']
};
const AGHANIM_ITEM_KEYS = {
  scepter: 'ultimate_scepter',
  shard: 'aghanims_shard'
};

let dotaconstantsData = null;

async function getDotaConstants() {
  if (!dotaconstantsData) {
    const dc = await import('dotaconstants');
    dotaconstantsData = {
      heroes: dc.heroes,
      abilities: dc.abilities,
      hero_abilities: dc.hero_abilities,
      items: dc.items,
      patch: dc.patch
    };
  }
  return dotaconstantsData;
}

function getInstalledPackageVersion(packageName) {
  try {
    const entry = require.resolve(packageName);
    const packageJsonPath = path.join(path.dirname(entry), 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
  } catch {
    return null;
  }
}

function formatValue(value) {
  return Array.isArray(value) ? value.join('/') : String(value);
}

function normalizeTeam(team, teamName) {
  if (!Array.isArray(team) || team.length !== 5) {
    throw new Error(`${teamName} must contain exactly 5 heroes.`);
  }

  const roles = new Set();
  return team.map((entry) => {
    const role = String(entry.role || '').trim();
    const hero = normalizeHeroName(entry.hero);

    if (!hero) {
      throw new Error(`Unknown hero: ${entry.hero}`);
    }
    if (!ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }
    if (roles.has(role)) {
      throw new Error(`Duplicate role on ${teamName}: ${role}`);
    }

    roles.add(role);
    return {
      role,
      hero,
      originalHero: entry.hero
    };
  });
}

function validateUniqueHeroes(myTeam, opponentTeam) {
  const seen = new Set();
  for (const entry of [...myTeam, ...opponentTeam]) {
    if (seen.has(entry.hero)) {
      throw new Error(`Duplicate hero detected: ${entry.hero}`);
    }
    seen.add(entry.hero);
  }
}

function findHeroRecord(heroes, heroName) {
  return Object.values(heroes).find((hero) => hero.localized_name === heroName);
}

function buildAbilitySummary(ability, slotIndex = 0) {
  const attributes = (ability.attrib || [])
    .filter((attr) => attr.header || attr.key)
    .map((attr) => ({
      key: attr.key,
      label: attr.header || attr.key,
      value: formatValue(attr.value)
    }));

  return {
    name: ability.dname || ability.name,
    description: ability.desc || '',
    behavior: ability.behavior || '',
    damageType: ability.dmg_type || '',
    isUltimate: Boolean(ability.ultimate) || slotIndex >= 5,
    attributes,
    rawAttributes: ability.attrib || [],
    manaCost: ability.mc,
    cooldown: ability.cd
  };
}

function hasAbilityResourceData(ability) {
  return ability.manaCost !== undefined || ability.cooldown !== undefined;
}

function buildHeroStats(hero) {
  const baseStats = {
    attackRange: hero.attack_range,
    attackRate: hero.attack_rate,
    attackPoint: hero.attack_point,
    projectileSpeed: hero.projectile_speed,
    moveSpeed: hero.move_speed,
    turnRate: hero.turn_rate,
    baseHealth: hero.base_health,
    baseHealthRegen: hero.base_health_regen,
    baseMana: hero.base_mana,
    baseManaRegen: hero.base_mana_regen,
    baseArmor: hero.base_armor,
    baseMagicResistance: hero.base_mr,
    baseAttackMin: hero.base_attack_min,
    baseAttackMax: hero.base_attack_max,
    baseStrength: hero.base_str,
    baseAgility: hero.base_agi,
    baseIntelligence: hero.base_int,
    strengthGain: hero.str_gain,
    agilityGain: hero.agi_gain,
    intelligenceGain: hero.int_gain,
    primaryAttribute: hero.primary_attr,
    attackType: hero.attack_type
  };

  return {
    ...baseStats,
    derived: buildDerivedHeroStats(baseStats)
  };
}

function roundStat(value) {
  return Math.round(value * 100) / 100;
}

function statsAtLevel(stats, level) {
  const levelsGained = Math.max(0, level - 1);
  const strength = stats.baseStrength + stats.strengthGain * levelsGained;
  const agility = stats.baseAgility + stats.agilityGain * levelsGained;
  const intelligence = stats.baseIntelligence + stats.intelligenceGain * levelsGained;
  const attributes = { str: strength, agi: agility, int: intelligence };
  const primaryDamage = stats.primaryAttribute === 'all'
    ? (strength + agility + intelligence) * ATTRIBUTE_RULES.damagePerUniversalAttribute
    : attributes[stats.primaryAttribute] || 0;

  return {
    level,
    strength: roundStat(strength),
    agility: roundStat(agility),
    intelligence: roundStat(intelligence),
    maxHealth: Math.round(stats.baseHealth + strength * ATTRIBUTE_RULES.healthPerStrength),
    maxMana: Math.round(stats.baseMana + intelligence * ATTRIBUTE_RULES.manaPerIntelligence),
    armor: roundStat(stats.baseArmor + agility * ATTRIBUTE_RULES.armorPerAgility),
    attackMin: Math.round(stats.baseAttackMin + primaryDamage),
    attackMax: Math.round(stats.baseAttackMax + primaryDamage)
  };
}

function buildDerivedHeroStats(stats) {
  return {
    rules: ATTRIBUTE_RULES,
    level1: statsAtLevel(stats, 1),
    keyLevels: Object.fromEntries(STAT_KEY_LEVELS.map((level) => [`level${level}`, statsAtLevel(stats, level)]))
  };
}

async function getHeroDetails(heroName) {
  const { heroes, hero_abilities, abilities } = await getDotaConstants();
  const hero = findHeroRecord(heroes, heroName);
  if (!hero) {
    return null;
  }

  const heroAbilitiesData = hero_abilities[hero.name] || {};
  const abilitySummaries = (heroAbilitiesData.abilities || [])
    .map((abilityName, slotIndex) => ({ ability: abilities[abilityName], slotIndex }))
    .filter(({ ability }) => ability && ability.dname && ability.desc)
    .map(({ ability, slotIndex }) => buildAbilitySummary(ability, slotIndex));

  const facets = (heroAbilitiesData.facets || [])
    .filter((facet) => facet.title && facet.description && !facet.deprecated)
    .map((facet) => ({
      title: facet.title,
      description: facet.description
    }));

  return {
    id: hero.id,
    name: hero.localized_name,
    internalName: hero.name,
    stats: buildHeroStats(hero),
    abilities: abilitySummaries,
    facets
  };
}

function getLaneOpponents(playerRole, opponentTeam) {
  const byRole = (role) => opponentTeam.find((entry) => entry.role === role);

  if (playerRole === 'Safe Lane' || playerRole === 'Hard Support') {
    return [byRole('Offlane'), byRole('Support')].filter(Boolean);
  }
  if (playerRole === 'Midlane') {
    return [byRole('Midlane')].filter(Boolean);
  }
  if (playerRole === 'Offlane' || playerRole === 'Support') {
    return [byRole('Safe Lane'), byRole('Hard Support')].filter(Boolean);
  }
  return [];
}

async function buildLaneOpponentAbilities(laneOpponents) {
  const results = [];
  for (const opponent of laneOpponents) {
    const details = await getHeroDetails(opponent.hero);
    if (!details) continue;
    results.push({
      hero: opponent.hero,
      role: opponent.role,
      abilities: details.abilities
    });
  }
  return results;
}

async function buildPowerSpikeEntries(team) {
  const entries = [];
  for (const member of team) {
    const details = await getHeroDetails(member.hero);
    if (!details) continue;
    entries.push({
      hero: member.hero,
      role: member.role,
      spikes: buildHeroPowerSpikes(details)
    });
  }
  return entries;
}

function buildItemSummary(itemKey, item) {
  if (!item || !item.dname) return null;

  return {
    key: itemKey,
    name: item.dname,
    cost: item.cost,
    attributes: (item.attrib || [])
      .filter((attr) => attr.display || attr.key)
      .map((attr) => ({
        key: attr.key,
        value: formatValue(attr.value),
        display: attr.display ? attr.display.replace('{value}', formatValue(attr.value)) : `${attr.key}: ${formatValue(attr.value)}`
      })),
    abilities: (item.abilities || []).map((ability) => ({
      type: ability.type,
      title: ability.title,
      description: ability.description || ''
    }))
  };
}

async function buildRoleItems(role) {
  const { items } = await getDotaConstants();
  return (ROLE_ITEMS[role] || ROLE_ITEMS.Support)
    .map((itemKey) => {
      const item = items[itemKey];
      return buildItemSummary(itemKey, item);
    })
    .filter(Boolean);
}

async function buildUpgradeItems() {
  const { items } = await getDotaConstants();
  return {
    scepter: buildItemSummary(AGHANIM_ITEM_KEYS.scepter, items[AGHANIM_ITEM_KEYS.scepter]),
    shard: buildItemSummary(AGHANIM_ITEM_KEYS.shard, items[AGHANIM_ITEM_KEYS.shard]),
    heroSpecificUpgradeSource: 'dotaconstants 7.41 local ability data does not consistently expose hero-specific Aghanim upgrade text.'
  };
}

function getDotaconstantsMetadata() {
  return {
    name: 'dotaconstants',
    packageVersion: DOTACONSTANTS_VERSION,
    defaultProvider: true
  };
}

function buildDataCoverage(context) {
  const available = [
    'patch',
    'data source version',
    'team roles',
    'hero base stats',
    'player hero abilities',
    'ability mana and cooldown',
    'lane opponent abilities',
    'role item data',
    'aghanim item basics'
  ];
  const missing = [];

  if (!context.roleItems.length) {
    missing.push('role item data');
  }
  if (!context.upgradeItems.scepter || !context.upgradeItems.shard) {
    missing.push('aghanim item basics');
  }
  if (context.upgradeItems.heroSpecificUpgradeSource) {
    missing.push('hero-specific Aghanim upgrade details');
  }

  return { available, missing };
}

async function buildMatchContext(myTeamInput, opponentTeamInput) {
  const myTeam = normalizeTeam(myTeamInput, 'myTeam');
  const opponentTeam = normalizeTeam(opponentTeamInput, 'opponentTeam');
  validateUniqueHeroes(myTeam, opponentTeam);

  const player = myTeam[0];
  if (!VALID_HERO_NAMES_SET.has(player.hero)) {
    throw new Error(`Unknown hero: ${player.hero}`);
  }

  const { patch } = await getDotaConstants();
  const currentPatch = patch[patch.length - 1]?.name || 'Unknown';
  const patchMetadata = patch[patch.length - 1] || {};
  const playerHero = await getHeroDetails(player.hero);
  if (!playerHero) {
    throw new Error(`Hero data not found: ${player.hero}`);
  }

  const laneOpponents = getLaneOpponents(player.role, opponentTeam);
  const laneOpponentAbilities = await buildLaneOpponentAbilities(laneOpponents);
  const roleItems = await buildRoleItems(player.role);
  const upgradeItems = await buildUpgradeItems();
  const playerPowerSpikes = buildHeroPowerSpikes(playerHero);
  const enemyPowerSpikes = await buildPowerSpikeEntries(opponentTeam);
  const lanePowerSpikes = enemyPowerSpikes.filter((entry) =>
    laneOpponents.some((opponent) => opponent.hero === entry.hero)
  );

  const context = {
    patch: currentPatch,
    dataSource: {
      provider: 'dotaconstants',
      packageVersion: DOTACONSTANTS_VERSION,
      patchName: currentPatch,
      patchDate: patchMetadata.date || null,
      notes: currentPatch === '7.41'
        ? '当前补丁 7.41 不再提供命石二选一输入；英雄特性视为固定或已并入当前技能机制。本地仍可能保留 deprecated facet 旧字段，已从对局上下文排除。'
        : '命石字段按本地数据状态处理；只有可选机制才会进入对局输入。'
    },
    player,
    teams: {
      myTeam,
      opponentTeam
    },
    playerHero,
    laneMatchup: {
      opponents: laneOpponents,
      description: buildLaneMatchupDescription(player.role, laneOpponents)
    },
    laneOpponentAbilities,
    roleItems,
    upgradeItems,
    playerPowerSpikes,
    enemyPowerSpikes,
    lanePowerSpikes
  };

  context.dataCoverage = buildDataCoverage(context);
  return context;
}

function buildLaneMatchupDescription(playerRole, laneOpponents) {
  if (!laneOpponents.length) return '未能识别明确的对线敌人。';
  return `${localizeRole(playerRole)}对线 ${laneOpponents.map((opponent) => `${localizeHeroName(opponent.hero, true)}（${localizeRole(opponent.role)}）`).join('、')}。`;
}

function formatAbilityForPrompt(ability) {
  const attrs = ability.attributes.length
    ? ` 属性: ${ability.attributes.map((attr) => `${attr.label}: ${attr.value}`).join('; ')}`
    : ' 属性: 本地数据未提供';
  const resourceData = hasAbilityResourceData(ability)
    ? ` 蓝耗: ${formatValue(ability.manaCost ?? '无')}; 冷却: ${formatValue(ability.cooldown ?? '无')};`
    : ' 蓝耗/冷却: 无消耗或本地未提供;';
  const tags = [
    ability.isUltimate ? '终极技能' : '',
    ability.damageType ? `伤害类型: ${localizeDamageType(ability.damageType)}` : '',
    ability.behavior ? `施法方式: ${localizeBehavior(ability.behavior)}` : ''
  ].filter(Boolean).join(', ');

  return `- ${localizeTerm(ability.name, true)}${tags ? ` (${tags})` : ''}: ${resourceData} ${ability.description}${attrs}`;
}

function formatItemForPrompt(item) {
  const attrs = item.attributes.length
    ? item.attributes.map((attr) => attr.display).join('; ')
    : '本地数据未提供属性';
  const abilities = item.abilities.length
    ? item.abilities.map((ability) => `${ability.type}: ${ability.title}${ability.description ? ` - ${ability.description}` : ''}`).join('; ')
    : '本地数据未提供主动/被动说明';

  return `- ${localizeTerm(item.name, true)}（${item.cost} 金）: ${attrs}; ${abilities}`;
}

function formatUpgradeItemsForPrompt(upgradeItems) {
  if (!upgradeItems) return '本地数据未提供神杖与魔晶信息';
  const lines = [upgradeItems.scepter, upgradeItems.shard]
    .filter(Boolean)
    .map(formatItemForPrompt);
  if (upgradeItems.heroSpecific?.scepter) {
    lines.push(`- 神杖专属升级: ${localizeTerm(upgradeItems.heroSpecific.scepter.skillName, true)}: ${upgradeItems.heroSpecific.scepter.description}`);
  }
  if (upgradeItems.heroSpecific?.shard) {
    lines.push(`- 魔晶专属升级: ${localizeTerm(upgradeItems.heroSpecific.shard.skillName, true)}: ${upgradeItems.heroSpecific.shard.description}`);
  }
  if (upgradeItems.heroSpecificUpgradeSource) {
    lines.push(`- 英雄专属升级说明: ${upgradeItems.heroSpecificUpgradeSource}`);
  }
  return lines.join('\n') || '本地数据未提供神杖与魔晶信息';
}

function formatHeroStatsForPrompt(stats) {
  if (!stats) return '本地数据未提供英雄基础属性';
  const level1 = stats.derived?.level1;
  const keyLevelHealth = stats.derived?.keyLevels
    ? Object.values(stats.derived.keyLevels)
      .map((entry) => `${entry.level}级 ${entry.maxHealth}`)
      .join('；')
    : '本地数据未提供';
  const derivedLine = level1
    ? `1级无装备估算：最大生命 ${level1.maxHealth}，最大魔法 ${level1.maxMana}，护甲 ${level1.armor}，攻击 ${level1.attackMin}-${level1.attackMax}。关键等级无装备生命估算：${keyLevelHealth}。不含装备、临时 Buff 和技能减伤。`
    : '无装备派生面板：本地数据未提供';

  return [
    `原始模板字段：基础生命 ${stats.baseHealth}，基础魔法 ${stats.baseMana}，基础护甲 ${stats.baseArmor}，基础攻击 ${stats.baseAttackMin}-${stats.baseAttackMax}`,
    `属性：力量 ${stats.baseStrength} + ${stats.strengthGain}，敏捷 ${stats.baseAgility} + ${stats.agilityGain}，智力 ${stats.baseIntelligence} + ${stats.intelligenceGain}`,
    `攻击距离 ${stats.attackRange}，移动速度 ${stats.moveSpeed}，攻击间隔 ${stats.attackRate}，攻击前摇 ${stats.attackPoint}，弹道速度 ${stats.projectileSpeed}`,
    derivedLine
  ].filter((part) => !/undefined|null/.test(part)).join('\n');
}

function formatSpikeForPrompt(spike) {
  const types = Object.entries(spike.damageByType)
    .map(([type, value]) => `${localizeDamageType(type)}: ${value}`)
    .join(', ') || '无固定伤害';
  const skills = spike.skills
    .map((skill) => `${localizeTerm(skill.name, true)} ${skill.abilityLevel}级 ${skill.damage}${skill.damageType ? ` ${localizeDamageType(skill.damageType)}` : ''}`)
    .join('; ');
  const caveats = spike.caveats.length ? ` Caveat: ${spike.caveats.join(' ')}` : '';

  return `- ${spike.level}级: 原始固定伤害 ${spike.rawDamage}（${types}），默认25%魔抗估算 ${spike.estimatedAfterDefaultResistance}，总蓝耗 ${spike.manaCost}，冷却门槛 ${spike.cooldownGate}s。技能: ${skills || '无可计算固定伤害'}。${caveats}`;
}

function formatPowerSpikeEntryForPrompt(entry) {
  const spikes = entry.spikes
    .filter((spike) => [3, 5, 6, 7, 12, 18].includes(spike.level))
    .map(formatSpikeForPrompt)
    .join('\n');

  return `### ${localizeHeroName(entry.hero, true)}${entry.role ? `（${localizeRole(entry.role)}）` : ''}\n${spikes || '- 本地数据未提供可计算固定爆发'}`;
}

function buildGroundedChinesePrompt(context) {
  const myTeam = context.teams.myTeam.map((entry) => `${localizeHeroName(entry.hero, true)}（${localizeRole(entry.role)}）`).join('，');
  const opponentTeam = context.teams.opponentTeam.map((entry) => `${localizeHeroName(entry.hero, true)}（${localizeRole(entry.role)}）`).join('，');
  const playerAbilities = context.playerHero.abilities.map(formatAbilityForPrompt).join('\n');
  const playerStats = formatHeroStatsForPrompt(context.playerHero.stats);
  const laneAbilities = context.laneOpponentAbilities.map((opponent) => {
    const abilities = opponent.abilities.map(formatAbilityForPrompt).join('\n');
    return `### ${localizeHeroName(opponent.hero, true)}（${localizeRole(opponent.role)}）\n${abilities}`;
  }).join('\n\n') || '本地数据未提供对线敌人技能信息';
  const roleItems = context.roleItems.map(formatItemForPrompt).join('\n') || '本地数据未提供该分路物品信息';
  const upgradeItems = formatUpgradeItemsForPrompt(context.upgradeItems);
  const playerPowerSpikes = formatPowerSpikeEntryForPrompt({
    hero: context.player.hero,
    role: context.player.role,
    spikes: context.playerPowerSpikes || []
  });
  const lanePowerSpikes = (context.lanePowerSpikes || []).map(formatPowerSpikeEntryForPrompt).join('\n\n') || '本地数据未提供对线敌人爆发窗口';
  const enemyPowerSpikes = (context.enemyPowerSpikes || []).map(formatPowerSpikeEntryForPrompt).join('\n\n') || '本地数据未提供敌方爆发窗口';
  const missing = context.dataCoverage.missing.length ? context.dataCoverage.missing.join(', ') : '无明显缺口';

  return `你是 Dota 2 对局教练。请用简体中文回答。请优先使用简体中文英雄、技能、物品名称；本地数据字段为英文时请自行翻译，不要把英文作为主要输出。

重要规则：
- 下面的“本地数据上下文”是数值事实的唯一来源。
- 不要编造冷却、伤害、蓝耗、施法距离、物品价格、版本改动等数值。
- 如果建议需要某个数值但上下文没有提供，请明确说“本地数据未提供”。
- 可以基于阵容和技能机制做策略推理，但要把事实和建议区分开。
- 技能和物品的英文原文描述只作为理解机制的输入，回答时不要复述英文原句。
- 当前补丁若已移除的机制不要当作数据缺口。不要把偷取技能继承细节或买活价格/冷却列为数据缺口；这些属于当前阶段暂不分析的动态机制。

本地数据上下文：

Patch: ${context.patch}

版本与数据源:
- Provider: ${context.dataSource.provider}
- Package: dotaconstants@${context.dataSource.packageVersion}
- Patch Date: ${context.dataSource.patchDate || '本地数据未提供'}
- 说明: ${context.dataSource.notes}

玩家英雄: ${localizeHeroName(context.player.hero, true)}
玩家分路: ${localizeRole(context.player.role)}

我方阵容: ${myTeam}
敌方阵容: ${opponentTeam}

对线关系: ${context.laneMatchup.description}

英雄基础属性:
${playerStats}

玩家英雄技能:
${playerAbilities}

对线敌人技能:
${laneAbilities}

分路物品参考:
${roleItems}

神杖与魔晶参考:
${upgradeItems}

关键等级爆发窗口:
说明：以下为后端按本地技能属性字段中的固定伤害数值计算的技能爆发，并按英雄等级可合法投入的技能点预算选择当前等级可点出的最高固定伤害组合。默认25%魔抗估算只折减 Magical 伤害；Pure 不折减；Physical 暂不按护甲折减。带属性系数、持续伤害、叠层成长的技能会在 Caveat 中标记，不能当作完整斩杀线。

玩家英雄:
${playerPowerSpikes}

对线敌人:
${lanePowerSpikes}

敌方全队:
${enemyPowerSpikes}

数据覆盖:
- 可用: ${context.dataCoverage.available.join(', ')}
- 数据缺口: ${missing}

请按以下 Markdown 结构输出：

### 总览
说明这个英雄在本局的职责、胜利条件和主要风险。

### 对线期 0-10 分钟
结合对线敌人技能和关键等级爆发窗口，说明出门装、换血方式、击杀窗口和要躲的关键技能。

### 关键等级爆发与斩杀线
必须引用上方后端计算的爆发窗口，重点说明 3/5/6/7/12/18 级谁的强势期更危险。写清楚原始固定伤害、默认25%魔抗估算、关键技能、蓝耗压力和冷却门槛。遇到持续伤害、属性系数、叠层成长时，必须说明这些不是完整斩杀线。

### 中期 10-25 分钟
说明核心装备时机、刷钱/参战选择、团战站位和第一波关键节奏。

### 后期 25 分钟后
说明 Roshan、高地、买活、团战目标和后期装备取舍。

### 出装建议
按出门、前期、核心、可选装备分段说明，并把理由绑定到本局敌我阵容。

### 队友配合
列出 1-2 个和队友的具体配合点。

### 敌方威胁
列出最需要尊重的敌方技能或打法，并给出应对方式。

### 数据缺口
只列出会影响判断、但本地数据没有提供的事实。`;
}

function buildChineseCoachMessages(prompt) {
  return [
    {
      role: 'system',
      content: [
        '你是 Dota 2 中文对局教练。',
        '最终回答必须以简体中文为主。',
        '英雄、技能、物品、分路、伤害类型优先使用中文名。',
        '如果确实需要英文术语，只允许首次出现时放在中文名后的括号中，例如“拉比克（Rubick）”。',
        '不要用英文小标题，不要把英文作为主要表达。'
      ].join('\n')
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

module.exports = {
  ROLE_ITEMS,
  buildChineseCoachMessages,
  buildGroundedChinesePrompt,
  buildItemSummary,
  buildMatchContext,
  getDotaconstantsMetadata,
  getDotaConstants,
  getHeroDetails,
  normalizeTeam
};
