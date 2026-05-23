const { TERM_LOCALIZATION } = require('./dotaLocalization');

const ITEM_LOCALIZATION_FALLBACK = {
  dagon: '达贡之神力',
  dagon_2: '达贡之神力',
  dagon_3: '达贡之神力',
  dagon_4: '达贡之神力',
  dagon_5: '达贡之神力',
  aganims_shard: '阿哈利姆魔晶',
  aghanims_shard: '阿哈利姆魔晶',
  ultimate_scepter: '阿哈利姆神杖',
  ultimate_scepter_2: '阿哈利姆福佑',
  desolator: '黯灭',
  blood_grenade: '血腥榴弹',
  ethereal_blade: '虚灵之刃'
};

let chineseItemMapPromise = null;

function normalizeDatafeedItemName(name) {
  return String(name || '').replace(/^item_/, '');
}

async function loadChineseItemMap() {
  if (!chineseItemMapPromise) {
    chineseItemMapPromise = (async () => {
      const { Dota2Datafeed } = await import('dota2-datawrapper');
      const api = new Dota2Datafeed({ language: 'schinese', timeout: 15000 });
      const items = await api.getItems();
      const map = new Map(Object.entries(ITEM_LOCALIZATION_FALLBACK));

      for (const item of items || []) {
        const key = normalizeDatafeedItemName(item.name);
        if (key && item.name_loc) {
          map.set(key, item.name_loc);
        }
      }

      return map;
    })().catch((error) => {
      console.warn('Failed to load Chinese item localization:', error.message);
      return new Map(Object.entries(ITEM_LOCALIZATION_FALLBACK));
    });
  }

  return chineseItemMapPromise;
}

function localizeItemModelName(item, chineseItemMap = new Map()) {
  const englishName = item.name || item.displayName || item.key;
  const chineseName = chineseItemMap.get(item.key)
    || ITEM_LOCALIZATION_FALLBACK[item.key]
    || TERM_LOCALIZATION[englishName]
    || englishName;

  return {
    englishName,
    name: chineseName,
    displayName: chineseName !== englishName ? `${chineseName}（${englishName}）` : englishName
  };
}

module.exports = {
  ITEM_LOCALIZATION_FALLBACK,
  loadChineseItemMap,
  localizeItemModelName,
  normalizeDatafeedItemName
};
