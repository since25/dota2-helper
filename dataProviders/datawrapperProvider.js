const dotaconstantsProvider = require('./dotaconstantsProvider');
const { buildHeroPowerSpikes } = require('../powerSpikeContext');

const PACKAGE_VERSION = '1.0.2';
const STAT_KEY_LEVELS = [3, 5, 6, 7, 12, 18];
const ATTRIBUTE_RULES = {
  healthPerStrength: 22,
  manaPerIntelligence: 12,
  armorPerAgility: 1 / 6,
  damagePerUniversalAttribute: 0.7
};

let datawrapperModule = null;
let client = null;
let constantsHeroes = null;
let constantsItems = null;
let aghsDescriptions = null;

async function loadDatawrapper() {
  if (!datawrapperModule) {
    datawrapperModule = await import('dota2-datawrapper');
  }
  return datawrapperModule;
}

async function getClient() {
  if (!client) {
    const { Dota2Datafeed } = await loadDatawrapper();
    client = Dota2Datafeed.fromGitHub('Egezenn', 'dota2-datawrapper', {
      language: 'english',
      timeout: 15000
    });
  }
  return client;
}

async function getProviderMetadata() {
  return {
    name: 'datawrapper',
    packageVersion: PACKAGE_VERSION,
    experimental: true,
    staticProvider: 'Egezenn/dota2-datawrapper'
  };
}

async function getConstantsHeroesCached() {
  if (!constantsHeroes) {
    constantsHeroes = await (await getClient()).getConstantsHeroes();
  }
  return constantsHeroes;
}

async function getConstantsItemsCached() {
  if (!constantsItems) {
    constantsItems = await (await getClient()).getConstantsItems();
  }
  return constantsItems;
}

async function getAghsDescriptionsCached() {
  if (!aghsDescriptions) {
    aghsDescriptions = await (await getClient()).getConstantsAghsDesc();
  }
  return aghsDescriptions;
}

function roundStat(value) {
  return Math.round(value * 100) / 100;
}

function statsAtLevel(stats, level) {
  const levelsGained = Math.max(0, level - 1);
  const strength = stats.baseStrength + stats.strengthGain * levelsGained;
  const agility = stats.baseAgility + stats.agilityGain * levelsGained;
  const intelligence = stats.baseIntelligence + stats.intelligenceGain * levelsGained;
  const primaryDamage = stats.primaryAttribute === 'all'
    ? (strength + agility + intelligence) * ATTRIBUTE_RULES.damagePerUniversalAttribute
    : { str: strength, agi: agility, int: intelligence }[stats.primaryAttribute] || 0;

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

function primaryAttributeName(primaryAttr) {
  return ['str', 'agi', 'int', 'all'][primaryAttr] || 'unknown';
}

function buildStatsFromDatawrapperHero(hero) {
  const stats = {
    attackRange: hero.attack_range,
    attackRate: hero.attack_rate,
    attackPoint: 0,
    projectileSpeed: hero.projectile_speed,
    moveSpeed: hero.movement_speed,
    turnRate: hero.turn_rate,
    baseHealth: 120,
    baseHealthRegen: hero.health_regen,
    baseMana: 75,
    baseManaRegen: hero.mana_regen,
    baseArmor: hero.armor,
    baseMagicResistance: hero.magic_resistance,
    baseAttackMin: hero.damage_min,
    baseAttackMax: hero.damage_max,
    baseStrength: hero.str_base,
    baseAgility: hero.agi_base,
    baseIntelligence: hero.int_base,
    strengthGain: hero.str_gain,
    agilityGain: hero.agi_gain,
    intelligenceGain: hero.int_gain,
    primaryAttribute: primaryAttributeName(hero.primary_attr),
    attackType: hero.attack_capability === 1 ? 'Melee' : 'Ranged'
  };

  return {
    ...stats,
    derived: {
      rules: ATTRIBUTE_RULES,
      level1: statsAtLevel(stats, 1),
      keyLevels: Object.fromEntries(STAT_KEY_LEVELS.map((level) => [`level${level}`, statsAtLevel(stats, level)]))
    }
  };
}

function damageTypeName(damage) {
  return {
    1: 'Physical',
    2: 'Magical',
    4: 'Pure'
  }[damage] || '';
}

function normalizeSpecialValue(special) {
  return {
    key: special.name,
    header: special.heading_loc || special.name,
    value: (special.values_float || []).map((value) => String(value))
  };
}

function normalizeAbility(ability, slotIndex) {
  return {
    name: ability.name_loc || ability.name,
    description: ability.desc_loc || '',
    behavior: ability.behavior,
    damageType: damageTypeName(ability.damage),
    isUltimate: ability.type === 1 || slotIndex >= 5,
    attributes: (ability.special_values || []).map((special) => ({
      key: special.name,
      label: special.heading_loc || special.name,
      value: (special.values_float || []).join('/')
    })),
    rawAttributes: (ability.special_values || []).map(normalizeSpecialValue),
    manaCost: ability.mana_costs,
    cooldown: ability.cooldowns,
    shardUpgrade: ability.shard_loc || '',
    scepterUpgrade: ability.scepter_loc || '',
    hasShard: Boolean(ability.ability_has_shard || ability.ability_is_granted_by_shard),
    hasScepter: Boolean(ability.ability_has_scepter || ability.ability_is_granted_by_scepter)
  };
}

async function getHeroDetails(canonicalHeroName) {
  const heroes = await getConstantsHeroesCached();
  const constantHero = Object.values(heroes).find((hero) => hero.localized_name === canonicalHeroName);
  if (!constantHero) return null;

  const detailedHero = await (await getClient()).getHeroDataWithConstants(constantHero.id, heroes);
  if (!detailedHero) return null;

  return {
    id: detailedHero.id,
    name: detailedHero.name_loc,
    internalName: detailedHero.name,
    stats: buildStatsFromDatawrapperHero(detailedHero),
    abilities: (detailedHero.abilities || [])
      .filter((ability) => ability?.name_loc && ability?.desc_loc)
      .map(normalizeAbility),
    facets: []
  };
}

function normalizeItem(itemKey, item) {
  if (!item) return null;
  return {
    key: itemKey,
    name: item.dname || item.name_loc || item.name_english_loc,
    cost: item.cost,
    attributes: (item.attrib || item.attributes || [])
      .filter((attr) => attr.display || attr.key)
      .map((attr) => ({
        key: attr.key,
        value: Array.isArray(attr.value) ? attr.value.join('/') : String(attr.value ?? ''),
        display: attr.display ? attr.display.replace('{value}', attr.value) : `${attr.key}: ${attr.value}`
      })),
    abilities: (item.abilities || []).map((ability) => ({
      type: ability.type,
      title: ability.title,
      description: ability.description || ''
    })),
    components: item.components || [],
    recipes: item.recipes || []
  };
}

async function getItemDetails(itemKeyOrName) {
  const constants = await getConstantsItemsCached();
  const items = await (await getClient()).getItemsWithConstants(constants);
  const normalized = String(itemKeyOrName || '').trim().toLowerCase();
  const item = items.find((entry) =>
    entry.name?.replace(/^item_/, '').toLowerCase() === normalized
    || entry.name?.toLowerCase() === normalized
    || entry.dname?.toLowerCase() === normalized
    || entry.name_loc?.toLowerCase() === normalized
  );
  return item ? normalizeItem(item.name?.replace(/^item_/, '') || normalized, item) : null;
}

async function getHeroSpecificUpgrade(heroId) {
  const descriptions = await getAghsDescriptionsCached();
  const match = descriptions.find((entry) => entry.hero_id === heroId);
  if (!match) return null;

  return {
    scepter: match.has_scepter ? {
      skillName: match.scepter_skill_name,
      description: match.scepter_desc,
      isNewSkill: Boolean(match.scepter_new_skill)
    } : null,
    shard: match.has_shard ? {
      skillName: match.shard_skill_name,
      description: match.shard_desc,
      isNewSkill: Boolean(match.shard_new_skill)
    } : null
  };
}

async function buildMatchContext(myTeam, opponentTeam) {
  const context = await dotaconstantsProvider.buildMatchContext(myTeam, opponentTeam);
  const playerHero = await getHeroDetails(context.player.hero);
  if (playerHero) {
    context.playerHero = playerHero;
    context.playerPowerSpikes = buildHeroPowerSpikes(playerHero);
  }

  context.upgradeItems = {
    scepter: await getItemDetails('ultimate_scepter'),
    shard: await getItemDetails('aghanims_shard'),
    heroSpecific: await getHeroSpecificUpgrade(context.playerHero.id)
  };
  context.dataSource = {
    provider: 'datawrapper',
    packageVersion: PACKAGE_VERSION,
    patchName: context.patch,
    patchDate: context.dataSource.patchDate,
    experimental: true,
    staticProvider: 'Egezenn/dota2-datawrapper',
    notes: 'Experimental datawrapper provider is active for player hero details, Aghanim upgrade descriptions, and item details. Some lane and team context still uses the normalized fallback path until full mapping is complete.'
  };

  return context;
}

const datawrapperProvider = {
  name: 'datawrapper',
  buildGroundedChinesePrompt: dotaconstantsProvider.buildGroundedChinesePrompt,
  buildMatchContext,
  getHeroDetails,
  getHeroIndex: dotaconstantsProvider.getHeroIndex,
  getItemDetails,
  getProviderMetadata,
  normalizeHeroName: dotaconstantsProvider.normalizeHeroName
};

module.exports = datawrapperProvider;
