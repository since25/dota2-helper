const { HERO_LOCALIZATION } = require('./heroAliases');

const ROLE_LOCALIZATION = {
  'Safe Lane': '优势路',
  Midlane: '中路',
  Offlane: '劣势路',
  Support: '四号位',
  'Hard Support': '五号位'
};

const DAMAGE_TYPE_LOCALIZATION = {
  Physical: '物理',
  Magical: '魔法',
  Pure: '纯粹',
  Unknown: '未知'
};

const BEHAVIOR_LOCALIZATION = {
  Passive: '被动',
  'Unit Target': '单位目标',
  'Point Target': '点目标',
  'No Target': '无目标',
  'Instant Cast': '瞬发',
  AOE: '范围',
  Channeled: '持续施法',
  Hidden: '隐藏',
  Autocast: '自动施放',
  'Attack Modifier': '攻击特效'
};

const TERM_LOCALIZATION = {
  "Aghanim's Scepter": '阿哈利姆神杖',
  "Aghanim's Shard": '阿哈利姆魔晶',
  'Battle Fury': '狂战斧',
  'Black King Bar': '黑皇杖',
  'Blink Dagger': '闪烁匕首',
  'Magic Wand': '魔杖',
  Tango: '树之祭祀',
  'Quelling Blade': '补刀斧',
  'Iron Branch': '铁树枝干',
  'Power Treads': '动力鞋',
  Butterfly: '蝴蝶',
  Satanic: '撒旦之邪力',
  'Manta Style': '幻影斧',
  Disperser: '散魂剑',
  'Telekinesis': '隔空取物',
  'Fade Bolt': '弱化能流',
  'Arcane Supremacy': '奥术至尊',
  'Spell Steal': '法术窃取',
  'Stolen Spell': '窃取的法术',
  Curiosity: '好奇心',
  'Telekinesis Land': '隔空取物落点',
  'Spear of Mars': '战神之矛',
  "God's Rebuke": '神之谴戒',
  Bulwark: '护身甲盾',
  Dauntless: '无畏',
  'Arena Of Blood': '热血竞技场',
  'Ether Shock': '苍穹震击',
  Hex: '妖术',
  Shackles: '枷锁',
  'Fowl Play': '禽戏',
  Urnaconda: '蛇罐',
  'Mass Serpent Ward': '群蛇守卫',
  'Mana Break': '法力损毁',
  Blink: '闪烁',
  Counterspell: '法术反制',
  Persecutor: '迫害者',
  'Mana Void': '法力虚空',
  'Frost Arrows': '霜冻之箭',
  Gust: '狂风',
  Multishot: '数箭齐发',
  Glacier: '冰川',
  'Precision Aura': '精准光环',
  Marksmanship: '射手天赋',
  'Shadow Strike': '暗影突袭',
  Scream: '痛苦尖叫',
  'Blink Queen of Pain': '闪烁',
  'Sonic Wave': '超声冲击波',
  Bladeform: '剑刃风暴',
  'Healing Ward': '治疗守卫',
  'Blade Dance': '剑舞',
  Omnislash: '无敌斩',
  'Chain Frost': '连环霜冻'
};

function localizeHeroName(heroName, includeEnglish = false) {
  const zhName = HERO_LOCALIZATION[heroName]?.zhName || TERM_LOCALIZATION[heroName] || heroName;
  return includeEnglish && zhName !== heroName ? `${zhName}（${heroName}）` : zhName;
}

function localizeRole(role) {
  return ROLE_LOCALIZATION[role] || role;
}

function localizeDamageType(type) {
  return DAMAGE_TYPE_LOCALIZATION[type] || type || '';
}

function localizeBehavior(behavior) {
  const parts = Array.isArray(behavior) ? behavior : String(behavior || '').split(',');
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => BEHAVIOR_LOCALIZATION[part] || part)
    .join('、');
}

function localizeTerm(term, includeEnglish = false) {
  const zhName = TERM_LOCALIZATION[term] || term;
  return includeEnglish && zhName !== term ? `${zhName}（${term}）` : zhName;
}

module.exports = {
  DAMAGE_TYPE_LOCALIZATION,
  ROLE_LOCALIZATION,
  TERM_LOCALIZATION,
  localizeBehavior,
  localizeDamageType,
  localizeHeroName,
  localizeRole,
  localizeTerm
};
