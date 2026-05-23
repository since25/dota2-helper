const fs = require('fs');
const path = require('path');

const { buildAutoHeroModels } = require('./autoModels');
const { validateHeroDamageModel } = require('./schema');

function withSource(model, source) {
  return { ...model, source };
}

function loadManualHeroModels() {
  const heroesDir = path.join(__dirname, 'heroes');
  return fs.readdirSync(heroesDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => {
      const model = require(path.join(heroesDir, fileName));
      return validateHeroDamageModel(withSource(model, model.source || 'manual'));
    });
}

const MANUAL_HERO_MODELS = loadManualHeroModels();
const MANUAL_HERO_NAMES = new Set(MANUAL_HERO_MODELS.map((model) => model.hero));
const AUTO_HERO_MODELS = buildAutoHeroModels(MANUAL_HERO_NAMES)
  .map((model) => validateHeroDamageModel(withSource(model, 'auto')));
const HERO_MODELS = [...MANUAL_HERO_MODELS, ...AUTO_HERO_MODELS]
  .sort((left, right) => left.hero.localeCompare(right));

const MODEL_BY_HERO = new Map(HERO_MODELS.map((model) => [model.hero, model]));

function getHeroDamageModel(heroName) {
  return MODEL_BY_HERO.get(heroName) || null;
}

function listHeroDamageModels() {
  return [...HERO_MODELS];
}

module.exports = {
  getHeroDamageModel,
  listHeroDamageModels,
  loadManualHeroModels,
  withSource
};
