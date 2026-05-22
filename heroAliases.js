const CANONICAL_HERO_NAMES = [
  "Abaddon", "Alchemist", "Ancient Apparition", "Anti-Mage", "Arc Warden",
  "Axe", "Bane", "Batrider", "Beastmaster", "Bloodseeker", "Bounty Hunter",
  "Brewmaster", "Bristleback", "Broodmother", "Centaur Warrunner",
  "Chaos Knight", "Chen", "Clinkz", "Clockwerk", "Crystal Maiden",
  "Dark Seer", "Dark Willow", "Dawnbreaker", "Dazzle", "Death Prophet",
  "Disruptor", "Doom", "Dragon Knight", "Drow Ranger", "Earth Spirit",
  "Earthshaker", "Elder Titan", "Ember Spirit", "Enchantress", "Enigma",
  "Faceless Void", "Grimstroke", "Gyrocopter", "Hoodwink", "Huskar",
  "Invoker", "Io", "Jakiro", "Juggernaut", "Keeper of the Light",
  "Kunkka", "Legion Commander", "Leshrac", "Lich", "Lifestealer", "Lina",
  "Lion", "Lone Druid", "Luna", "Lycan", "Magnus", "Marci", "Mars",
  "Medusa", "Meepo", "Mirana", "Monkey King", "Morphling", "Muerta",
  "Naga Siren", "Nature's Prophet", "Necrophos", "Night Stalker", "Nyx Assassin",
  "Ogre Magi", "Omniknight", "Oracle", "Outworld Destroyer", "Pangolier",
  "Phantom Assassin", "Phantom Lancer", "Phoenix", "Primal Beast", "Puck",
  "Pudge", "Pugna", "Queen of Pain", "Razor", "Riki", "Rubick",
  "Sand King", "Shadow Demon", "Shadow Fiend", "Shadow Shaman", "Silencer",
  "Skywrath Mage", "Slardar", "Slark", "Snapfire", "Sniper", "Spectre",
  "Spirit Breaker", "Storm Spirit", "Sven", "Techies", "Templar Assassin",
  "Terrorblade", "Tidehunter", "Timbersaw", "Tinker", "Tiny", "Treant Protector",
  "Troll Warlord", "Tusk", "Underlord", "Undying", "Ursa", "Vengeful Spirit",
  "Venomancer", "Viper", "Visage", "Void Spirit", "Warlock", "Weaver",
  "Windranger", "Winter Wyvern", "Witch Doctor", "Wraith King", "Zeus", "Ringmaster",
  "Kez"
].sort();

const HERO_LOCALIZATION = {
  "Abaddon": { zhName: "亚巴顿", aliases: [] },
  "Alchemist": { zhName: "炼金术士", aliases: ["炼金"] },
  "Ancient Apparition": { zhName: "远古冰魄", aliases: ["冰魂", "aa"] },
  "Anti-Mage": { zhName: "敌法师", aliases: ["敌法", "am"] },
  "Arc Warden": { zhName: "天穹守望者", aliases: ["电狗"] },
  "Axe": { zhName: "斧王", aliases: ["斧王"] },
  "Bane": { zhName: "祸乱之源", aliases: ["祸乱"] },
  "Batrider": { zhName: "蝙蝠骑士", aliases: ["蝙蝠"] },
  "Beastmaster": { zhName: "兽王", aliases: [] },
  "Bloodseeker": { zhName: "血魔", aliases: [] },
  "Bounty Hunter": { zhName: "赏金猎人", aliases: ["赏金", "bh"] },
  "Brewmaster": { zhName: "酒仙", aliases: [] },
  "Bristleback": { zhName: "钢背兽", aliases: ["钢背"] },
  "Broodmother": { zhName: "育母蜘蛛", aliases: ["蜘蛛"] },
  "Centaur Warrunner": { zhName: "半人马战行者", aliases: ["人马"] },
  "Chaos Knight": { zhName: "混沌骑士", aliases: ["混沌", "ck"] },
  "Chen": { zhName: "陈", aliases: [] },
  "Clinkz": { zhName: "克林克兹", aliases: ["小骷髅"] },
  "Clockwerk": { zhName: "发条技师", aliases: ["发条"] },
  "Crystal Maiden": { zhName: "水晶室女", aliases: ["冰女", "cm"] },
  "Dark Seer": { zhName: "黑暗贤者", aliases: ["黑贤", "ds"] },
  "Dark Willow": { zhName: "邪影芳灵", aliases: ["小仙女"] },
  "Dawnbreaker": { zhName: "破晓辰星", aliases: ["锤妹"] },
  "Dazzle": { zhName: "戴泽", aliases: [] },
  "Death Prophet": { zhName: "死亡先知", aliases: ["dp"] },
  "Disruptor": { zhName: "干扰者", aliases: ["萨尔"] },
  "Doom": { zhName: "末日使者", aliases: ["末日"] },
  "Dragon Knight": { zhName: "龙骑士", aliases: ["龙骑", "dk"] },
  "Drow Ranger": { zhName: "卓尔游侠", aliases: ["小黑", "dr"] },
  "Earth Spirit": { zhName: "大地之灵", aliases: ["土猫"] },
  "Earthshaker": { zhName: "撼地者", aliases: ["小牛", "es"] },
  "Elder Titan": { zhName: "上古巨神", aliases: ["大牛", "et"] },
  "Ember Spirit": { zhName: "灰烬之灵", aliases: ["火猫"] },
  "Enchantress": { zhName: "魅惑魔女", aliases: ["小鹿"] },
  "Enigma": { zhName: "谜团", aliases: [] },
  "Faceless Void": { zhName: "虚空假面", aliases: ["虚空", "fv"] },
  "Grimstroke": { zhName: "天涯墨客", aliases: ["墨客"] },
  "Gyrocopter": { zhName: "矮人直升机", aliases: ["飞机"] },
  "Hoodwink": { zhName: "森海飞霞", aliases: ["松鼠"] },
  "Huskar": { zhName: "哈斯卡", aliases: [] },
  "Invoker": { zhName: "祈求者", aliases: ["卡尔"] },
  "Io": { zhName: "艾欧", aliases: ["小精灵"] },
  "Jakiro": { zhName: "杰奇洛", aliases: ["双头龙"] },
  "Juggernaut": { zhName: "主宰", aliases: ["剑圣"] },
  "Keeper of the Light": { zhName: "光之守卫", aliases: ["光法", "kotl"] },
  "Kunkka": { zhName: "昆卡", aliases: ["船长"] },
  "Legion Commander": { zhName: "军团指挥官", aliases: ["军团", "lc"] },
  "Leshrac": { zhName: "拉席克", aliases: ["老鹿"] },
  "Lich": { zhName: "巫妖", aliases: [] },
  "Lifestealer": { zhName: "噬魂鬼", aliases: ["小狗"] },
  "Lina": { zhName: "莉娜", aliases: ["火女"] },
  "Lion": { zhName: "莱恩", aliases: ["恶魔巫师"] },
  "Lone Druid": { zhName: "德鲁伊", aliases: ["熊德", "ld"] },
  "Luna": { zhName: "露娜", aliases: ["月骑"] },
  "Lycan": { zhName: "狼人", aliases: [] },
  "Magnus": { zhName: "马格纳斯", aliases: ["猛犸"] },
  "Marci": { zhName: "玛西", aliases: [] },
  "Mars": { zhName: "玛尔斯", aliases: [] },
  "Medusa": { zhName: "美杜莎", aliases: ["一姐"] },
  "Meepo": { zhName: "米波", aliases: ["地卜师"] },
  "Mirana": { zhName: "米拉娜", aliases: ["白虎", "pom"] },
  "Monkey King": { zhName: "齐天大圣", aliases: ["猴子", "mk"] },
  "Morphling": { zhName: "变体精灵", aliases: ["水人"] },
  "Muerta": { zhName: "琼英碧灵", aliases: [] },
  "Naga Siren": { zhName: "娜迦海妖", aliases: ["小娜迦"] },
  "Nature's Prophet": { zhName: "自然先知", aliases: ["先知", "np"] },
  "Necrophos": { zhName: "瘟疫法师", aliases: ["死灵法"] },
  "Night Stalker": { zhName: "暗夜魔王", aliases: ["夜魔", "ns"] },
  "Nyx Assassin": { zhName: "司夜刺客", aliases: ["小强"] },
  "Ogre Magi": { zhName: "食人魔魔法师", aliases: ["蓝胖"] },
  "Omniknight": { zhName: "全能骑士", aliases: ["全能"] },
  "Oracle": { zhName: "神谕者", aliases: ["神谕"] },
  "Outworld Destroyer": { zhName: "殁境神蚀者", aliases: ["黑鸟", "od"] },
  "Pangolier": { zhName: "石鳞剑士", aliases: ["滚滚"] },
  "Phantom Assassin": { zhName: "幻影刺客", aliases: ["幻刺", "pa"] },
  "Phantom Lancer": { zhName: "幻影长矛手", aliases: ["猴子长矛手", "pl"] },
  "Phoenix": { zhName: "凤凰", aliases: [] },
  "Primal Beast": { zhName: "獸", aliases: ["兽"] },
  "Puck": { zhName: "帕克", aliases: [] },
  "Pudge": { zhName: "帕吉", aliases: ["屠夫"] },
  "Pugna": { zhName: "帕格纳", aliases: ["骨法"] },
  "Queen of Pain": { zhName: "痛苦女王", aliases: ["女王", "qop"] },
  "Razor": { zhName: "剃刀", aliases: ["电棍"] },
  "Riki": { zhName: "力丸", aliases: ["隐刺"] },
  "Rubick": { zhName: "拉比克", aliases: [] },
  "Sand King": { zhName: "沙王", aliases: ["sk"] },
  "Shadow Demon": { zhName: "暗影恶魔", aliases: ["毒狗", "sd"] },
  "Shadow Fiend": { zhName: "影魔", aliases: ["sf"] },
  "Shadow Shaman": { zhName: "暗影萨满", aliases: ["小Y", "小y"] },
  "Silencer": { zhName: "沉默术士", aliases: ["沉默"] },
  "Skywrath Mage": { zhName: "天怒法师", aliases: ["天怒", "sm"] },
  "Slardar": { zhName: "斯拉达", aliases: ["大鱼"] },
  "Slark": { zhName: "斯拉克", aliases: ["小鱼"] },
  "Snapfire": { zhName: "电炎绝手", aliases: ["奶奶"] },
  "Sniper": { zhName: "狙击手", aliases: ["火枪"] },
  "Spectre": { zhName: "幽鬼", aliases: [] },
  "Spirit Breaker": { zhName: "裂魂人", aliases: ["白牛", "sb"] },
  "Storm Spirit": { zhName: "风暴之灵", aliases: ["蓝猫"] },
  "Sven": { zhName: "斯温", aliases: [] },
  "Techies": { zhName: "工程师", aliases: ["炸弹人"] },
  "Templar Assassin": { zhName: "圣堂刺客", aliases: ["圣堂", "ta"] },
  "Terrorblade": { zhName: "恐怖利刃", aliases: ["tb"] },
  "Tidehunter": { zhName: "潮汐猎人", aliases: ["潮汐"] },
  "Timbersaw": { zhName: "伐木机", aliases: [] },
  "Tinker": { zhName: "修补匠", aliases: [] },
  "Tiny": { zhName: "小小", aliases: [] },
  "Treant Protector": { zhName: "树精卫士", aliases: ["大树"] },
  "Troll Warlord": { zhName: "巨魔战将", aliases: ["巨魔"] },
  "Tusk": { zhName: "巨牙海民", aliases: ["海民"] },
  "Underlord": { zhName: "孽主", aliases: [] },
  "Undying": { zhName: "不朽尸王", aliases: ["尸王"] },
  "Ursa": { zhName: "熊战士", aliases: ["拍拍熊"] },
  "Vengeful Spirit": { zhName: "复仇之魂", aliases: ["复仇"] },
  "Venomancer": { zhName: "剧毒术士", aliases: ["剧毒"] },
  "Viper": { zhName: "冥界亚龙", aliases: ["毒龙"] },
  "Visage": { zhName: "维萨吉", aliases: ["死灵龙"] },
  "Void Spirit": { zhName: "虚无之灵", aliases: ["紫猫"] },
  "Warlock": { zhName: "术士", aliases: [] },
  "Weaver": { zhName: "编织者", aliases: ["蚂蚁"] },
  "Windranger": { zhName: "风行者", aliases: ["风行", "wr"] },
  "Winter Wyvern": { zhName: "寒冬飞龙", aliases: ["冰龙", "ww"] },
  "Witch Doctor": { zhName: "巫医", aliases: ["wd"] },
  "Wraith King": { zhName: "冥魂大帝", aliases: ["骷髅王", "wk"] },
  "Zeus": { zhName: "宙斯", aliases: [] },
  "Ringmaster": { zhName: "傀儡师", aliases: [] },
  "Kez": { zhName: "凯", aliases: [] }
};

const HERO_ALIASES = Object.fromEntries(
  Object.entries(HERO_LOCALIZATION).map(([heroName, entry]) => [
    heroName,
    [entry.zhName, ...entry.aliases]
  ])
);

const aliasToCanonical = new Map();

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/-/g, ' ')
    .toLowerCase();
}

for (const heroName of CANONICAL_HERO_NAMES) {
  aliasToCanonical.set(normalizeKey(heroName), heroName);
  aliasToCanonical.set(normalizeKey(heroName.replace(/-/g, ' ')), heroName);
}

for (const [heroName, aliases] of Object.entries(HERO_ALIASES)) {
  for (const alias of aliases) {
    aliasToCanonical.set(normalizeKey(alias), heroName);
  }
}

function normalizeHeroName(input) {
  return aliasToCanonical.get(normalizeKey(input)) || null;
}

function getHeroAliases(heroName) {
  const aliases = HERO_ALIASES[heroName] ? [...HERO_ALIASES[heroName]] : [];
  for (const alias of [...aliases]) {
    if (/^[a-z]+$/.test(alias)) {
      aliases.push(alias.toUpperCase());
    }
  }
  return [...new Set(aliases)];
}

function getHeroDisplayName(heroName) {
  const entry = HERO_LOCALIZATION[heroName];
  if (!entry) return heroName;
  return `${entry.zhName} / ${heroName}`;
}

function getHeroLocalizationList() {
  return CANONICAL_HERO_NAMES.map((heroName) => {
    const entry = HERO_LOCALIZATION[heroName] || { zhName: heroName, aliases: [] };
    return {
      localized_name: heroName,
      zh_name: entry.zhName,
      display_name: getHeroDisplayName(heroName),
      aliases: getHeroAliases(heroName)
    };
  });
}

module.exports = {
  CANONICAL_HERO_NAMES,
  HERO_ALIASES,
  HERO_LOCALIZATION,
  getHeroAliases,
  getHeroDisplayName,
  getHeroLocalizationList,
  normalizeHeroName
};
