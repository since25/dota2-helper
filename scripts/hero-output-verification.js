#!/usr/bin/env node

const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { listHeroDamageModels } = require('../damageModels/registry');

const ATTACK_WINDOW_MODELS = new Set([
  'attack_sequence',
  'attack_modifier',
  'chance_based'
]);

function unique(values = []) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ''))];
}

function runtimeInputsFor(entry) {
  return unique([
    ...(entry.conditionInputs || []),
    ...(entry.requiredInputs || []),
    entry.healthInput,
    entry.attributeInput,
    entry.attackCountInput,
    entry.sourceDamageInput
  ]);
}

function engineProbeClassification(entry) {
  if (ATTACK_WINDOW_MODELS.has(entry.model)) {
    return {
      engineProbeSupported: true,
      engineProbeType: 'attack_window',
      engineProbeReason: 'supported_by_attack_window_probe'
    };
  }
  return {
    engineProbeSupported: false,
    engineProbeType: null,
    engineProbeReason: entry.status === 'unsupported'
      ? 'model_unsupported'
      : 'spell_probe_not_supported_yet'
  };
}

function outputReport(hero, ability, entry) {
  const probe = engineProbeClassification(entry);
  return {
    hero,
    ability,
    status: entry.status,
    model: entry.model,
    semanticType: entry.semanticType || entry.modifierType || null,
    damageType: entry.damageType || null,
    defaultIncluded: Boolean(entry.defaultIncluded),
    requiredRuntimeInputs: runtimeInputsFor(entry),
    ...probe
  };
}

async function buildHeroOutputVerificationReport(options = {}) {
  const requestedHeroes = options.heroes?.length ? options.heroes : CANONICAL_HERO_NAMES;
  const requested = new Set(requestedHeroes);
  const models = listHeroDamageModels()
    .filter((model) => requested.has(model.hero))
    .sort((left, right) => left.hero.localeCompare(right.hero));
  const heroes = models.map((model) => {
    const outputs = Object.entries(model.abilities || {})
      .filter(([, entry]) => entry.status !== 'ignored')
      .flatMap(([ability, entry]) => {
        const entries = [outputReport(model.hero, ability, entry)];
        for (const [index, component] of (entry.extraComponents || []).entries()) {
          entries.push(outputReport(model.hero, `${ability}#extra${index + 1}`, component));
        }
        return entries;
      });
    return {
      hero: model.hero,
      reviewStatus: model.review?.status || 'unknown',
      source: model.source || 'manual',
      outputs
    };
  });

  const allOutputs = heroes.flatMap((hero) => hero.outputs);
  const missingHeroes = requestedHeroes.filter((hero) => !heroes.some((entry) => entry.hero === hero));
  return {
    heroesChecked: heroes.length,
    missingHeroes,
    totals: {
      outputs: allOutputs.length,
      implemented: allOutputs.filter((entry) => entry.status === 'implemented').length,
      referenceOnly: allOutputs.filter((entry) => entry.status === 'reference_only').length,
      unsupported: allOutputs.filter((entry) => entry.status === 'unsupported').length,
      engineProbeSupported: allOutputs.filter((entry) => entry.engineProbeSupported).length,
      engineProbeUnsupported: allOutputs.filter((entry) => !entry.engineProbeSupported).length,
      runtimeInputRequired: allOutputs.filter((entry) => entry.requiredRuntimeInputs.length > 0).length
    },
    heroes
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--heroes') {
      options.heroes = String(argv[index + 1] || '')
        .split(',')
        .map((hero) => hero.trim())
        .filter(Boolean);
      index += 1;
    }
  }
  return options;
}

async function main() {
  const report = await buildHeroOutputVerificationReport(parseArgs());
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  buildHeroOutputVerificationReport,
  engineProbeClassification,
  parseArgs,
  runtimeInputsFor
};
