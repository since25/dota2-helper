const axe = require('./heroes/axe');
const facelessVoid = require('./heroes/faceless_void');
const lina = require('./heroes/lina');
const lion = require('./heroes/lion');
const phantomAssassin = require('./heroes/phantom_assassin');
const queenOfPain = require('./heroes/queen_of_pain');
const sandKing = require('./heroes/sand_king');
const shadowFiend = require('./heroes/shadow_fiend');
const slardar = require('./heroes/slardar');
const venomancer = require('./heroes/venomancer');
const { buildAutoHeroModels } = require('./autoModels');
const { validateHeroDamageModel } = require('./schema');

const MANUAL_HERO_MODELS = [
  validateHeroDamageModel(axe),
  validateHeroDamageModel(facelessVoid),
  validateHeroDamageModel(lina),
  validateHeroDamageModel(lion),
  validateHeroDamageModel(phantomAssassin),
  validateHeroDamageModel(queenOfPain),
  validateHeroDamageModel(sandKing),
  validateHeroDamageModel(shadowFiend),
  validateHeroDamageModel(slardar),
  validateHeroDamageModel(venomancer)
];
const MANUAL_HERO_NAMES = new Set(MANUAL_HERO_MODELS.map((model) => model.hero));
const AUTO_HERO_MODELS = buildAutoHeroModels(MANUAL_HERO_NAMES).map(validateHeroDamageModel);
const HERO_MODELS = [...MANUAL_HERO_MODELS, ...AUTO_HERO_MODELS]
  .sort((left, right) => left.hero.localeCompare(right.hero));

const MODEL_BY_HERO = new Map(HERO_MODELS.map((model) => [model.hero, model]));

function getHeroDamageModel(heroName) {
  return MODEL_BY_HERO.get(heroName) || null;
}

function listHeroDamageModels() {
  return [...HERO_MODELS];
}

module.exports = {
  getHeroDamageModel,
  listHeroDamageModels
};
