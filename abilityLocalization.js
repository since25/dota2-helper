const dotaconstants = require('dotaconstants');
const { TERM_LOCALIZATION, localizeTerm } = require('./dotaLocalization');

let chineseAbilityMapPromise = null;

async function loadChineseAbilityMap() {
  if (!chineseAbilityMapPromise) {
    chineseAbilityMapPromise = (async () => {
      const { Dota2Datafeed } = await import('dota2-datawrapper');
      const api = new Dota2Datafeed({ language: 'schinese', timeout: 15000 });
      const abilities = await api.getAbilities();
      const map = new Map();

      for (const ability of abilities || []) {
        const englishName = dotaconstants.abilities?.[ability.name]?.dname;
        const chineseName = ability.name_loc;
        if (englishName && chineseName) {
          map.set(englishName, chineseName);
        }
      }

      return map;
    })().catch((error) => {
      console.warn('Failed to load Chinese ability localization:', error.message);
      return new Map();
    });
  }

  return chineseAbilityMapPromise;
}

async function localizeAbilityName(englishName, includeEnglish = false) {
  const map = await loadChineseAbilityMap();
  const chineseName = map.get(englishName) || TERM_LOCALIZATION[englishName] || englishName;
  return includeEnglish && chineseName !== englishName ? `${chineseName}（${englishName}）` : chineseName;
}

function localizeKnownAbilityName(englishName, includeEnglish = false) {
  return localizeTerm(englishName, includeEnglish);
}

module.exports = {
  loadChineseAbilityMap,
  localizeAbilityName,
  localizeKnownAbilityName
};
