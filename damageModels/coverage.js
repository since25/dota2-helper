const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { getDotaConstants } = require('../dotaDataContext');
const { getHeroDamageModel, listHeroDamageModels } = require('./registry');
const { LEGACY_MODIFIER_SEMANTIC_TYPES } = require('./schema');

const DIRECT_MODEL_DEFAULTS = {
  instant_fixed: 'damage.instant',
  sustained_dps: 'damage.sustained_dps',
  multi_wave: 'damage.wave',
  attack_sequence: 'damage.attack_sequence_proc',
  attack_modifier: 'damage.attack_bonus',
  chance_based: 'modifier.crit.multiplier',
  conditional: 'damage.death_trigger',
  state_scaling: 'damage.stack_scaling'
};

function visibleAbilityNames(heroAbilities, abilities) {
  return (heroAbilities.abilities || [])
    .map((name) => abilities[name])
    .filter((ability) => ability && ability.dname && ability.desc)
    .map((ability) => ability.dname);
}

function countModeledStatus(counts, status) {
  if (status === 'implemented') counts.implementedAbilities += 1;
  if (status === 'reference_only') counts.referenceOnlyAbilities += 1;
  if (status === 'ignored') counts.ignoredAbilities += 1;
  if (status === 'unsupported') counts.unsupportedAbilities += 1;
}

function semanticTypeForEntry(entry) {
  if (entry.semanticType) return entry.semanticType;
  if (entry.modifierType && LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType]) {
    return LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType];
  }
  return DIRECT_MODEL_DEFAULTS[entry.model] || '';
}

function isSemanticComplete(entry) {
  if (entry.status === 'ignored') return true;
  return Boolean(semanticTypeForEntry(entry));
}

async function buildDamageModelCoverage() {
  const { heroes, hero_abilities, abilities } = await getDotaConstants();
  const modeled = listHeroDamageModels();
  const missingHeroModels = [];
  const missingAbilityEntries = [];
  const inferredFallbackAbilities = [];
  const semanticMissingAbilityEntries = [];
  const unsupportedAbilityEntries = [];
  const heroReports = [];
  const totals = {
    totalAbilities: 0,
    curatedAbilities: 0,
    semanticCompleteAbilities: 0,
    implementedAbilities: 0,
    referenceOnlyAbilities: 0,
    ignoredAbilities: 0,
    unsupportedAbilities: 0,
    inferredAbilities: 0,
    manualReviewedHeroes: 0,
    manualCandidateHeroes: 0,
    autoOnlyHeroes: 0,
    reviewedAbilities: 0,
    candidateAbilities: 0
  };

  for (const heroName of CANONICAL_HERO_NAMES) {
    const hero = Object.values(heroes).find((entry) => entry.localized_name === heroName);
    const abilityNames = hero ? visibleAbilityNames(hero_abilities[hero.name] || {}, abilities) : [];
    const model = getHeroDamageModel(heroName);
    const counts = {
      hero: heroName,
      modelSource: model?.source || 'missing',
      reviewStatus: model?.review?.status || (model?.source === 'auto' ? 'candidate' : 'candidate'),
      totalAbilities: abilityNames.length,
      implementedAbilities: 0,
      referenceOnlyAbilities: 0,
      ignoredAbilities: 0,
      unsupportedAbilities: 0,
      inferredAbilities: 0,
      curatedAbilities: 0,
      semanticCompleteAbilities: 0,
      reviewedAbilities: 0,
      candidateAbilities: 0,
      missingAbilityEntries: []
    };

    totals.totalAbilities += abilityNames.length;

    if (!model) {
      missingHeroModels.push(heroName);
      counts.inferredAbilities = abilityNames.length;
      totals.inferredAbilities += abilityNames.length;
      for (const abilityName of abilityNames) {
        inferredFallbackAbilities.push({ hero: heroName, ability: abilityName, reason: 'missing_hero_model' });
      }
      heroReports.push(counts);
      continue;
    }

    const modelSource = model.source || 'manual';
    const reviewStatus = model.review?.status || 'candidate';
    counts.modelSource = modelSource;
    counts.reviewStatus = modelSource === 'auto' ? 'candidate' : reviewStatus;
    if (modelSource === 'auto') {
      totals.autoOnlyHeroes += 1;
    } else if (reviewStatus === 'reviewed') {
      totals.manualReviewedHeroes += 1;
    } else {
      totals.manualCandidateHeroes += 1;
    }

    for (const abilityName of abilityNames) {
      const entry = model.abilities[abilityName];
      if (!entry) {
        const missing = { hero: heroName, ability: abilityName };
        missingAbilityEntries.push(missing);
        counts.missingAbilityEntries.push(missing);
        counts.inferredAbilities += 1;
        totals.inferredAbilities += 1;
        inferredFallbackAbilities.push({ ...missing, reason: 'missing_ability_entry' });
        continue;
      }
      counts.curatedAbilities += 1;
      totals.curatedAbilities += 1;
      if (modelSource !== 'auto' && reviewStatus === 'reviewed') {
        counts.reviewedAbilities += 1;
        totals.reviewedAbilities += 1;
      } else {
        counts.candidateAbilities += 1;
        totals.candidateAbilities += 1;
      }
      countModeledStatus(counts, entry.status);
      countModeledStatus(totals, entry.status);

      const semanticType = semanticTypeForEntry(entry);
      if (isSemanticComplete(entry)) {
        counts.semanticCompleteAbilities += 1;
        totals.semanticCompleteAbilities += 1;
      } else {
        semanticMissingAbilityEntries.push({
          hero: heroName,
          ability: abilityName,
          status: entry.status,
          model: entry.model
        });
      }

      if (entry.status === 'unsupported') {
        unsupportedAbilityEntries.push({
          hero: heroName,
          ability: abilityName,
          status: entry.status,
          model: entry.model,
          semanticType,
          reason: entry.reason || ''
        });
      }
    }

    heroReports.push(counts);
  }

  return {
    totalHeroes: CANONICAL_HERO_NAMES.length,
    modeledHeroes: modeled.length,
    curatedHeroes: modeled.length,
    ...totals,
    missingHeroModels,
    missingAbilityEntries,
    semanticMissingAbilityEntries,
    unsupportedAbilityEntries,
    inferredFallbackAbilities,
    heroReports
  };
}

module.exports = {
  buildDamageModelCoverage,
  isSemanticComplete,
  semanticTypeForEntry,
  visibleAbilityNames
};
