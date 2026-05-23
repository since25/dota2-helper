const { buildAutoItemModels } = require('./autoModels');
const { validateItemModel } = require('./schema');

const ITEM_MODELS = buildAutoItemModels().map(validateItemModel);
const ITEM_MODEL_BY_KEY = new Map(ITEM_MODELS.map((model) => [model.key, model]));

function getItemModel(itemKey) {
  return ITEM_MODEL_BY_KEY.get(itemKey) || null;
}

function listItemModels() {
  return [...ITEM_MODELS];
}

function summarizeItemModelCoverage() {
  const byEffectType = {};
  const byQuality = {};
  for (const model of ITEM_MODELS) {
    byQuality[model.quality || 'unknown'] = (byQuality[model.quality || 'unknown'] || 0) + 1;
    for (const effect of model.effects) {
      byEffectType[effect.type] = (byEffectType[effect.type] || 0) + 1;
    }
  }
  return {
    total: ITEM_MODELS.length,
    byQuality,
    byEffectType
  };
}

module.exports = {
  getItemModel,
  listItemModels,
  summarizeItemModelCoverage
};
