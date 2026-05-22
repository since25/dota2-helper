const {
  buildGroundedChinesePrompt,
  buildItemSummary,
  buildMatchContext,
  getDotaconstantsMetadata,
  getDotaConstants,
  getHeroDetails
} = require('../dotaDataContext');
const { getHeroLocalizationList, normalizeHeroName } = require('../heroAliases');

async function getItemDetails(itemKeyOrName) {
  const { items } = await getDotaConstants();
  const normalized = String(itemKeyOrName || '').trim().toLowerCase();
  const entry = Object.entries(items).find(([key, item]) =>
    key.toLowerCase() === normalized
    || item?.dname?.toLowerCase() === normalized
  );
  return entry ? buildItemSummary(entry[0], entry[1]) : null;
}

const dotaconstantsProvider = {
  name: 'dotaconstants',
  buildGroundedChinesePrompt,
  buildMatchContext,
  getDotaConstants,
  getHeroDetails,
  getHeroIndex: getHeroLocalizationList,
  getItemDetails,
  getProviderMetadata: getDotaconstantsMetadata,
  normalizeHeroName
};

module.exports = dotaconstantsProvider;
