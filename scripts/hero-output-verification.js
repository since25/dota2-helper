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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function componentSourceKey(entry) {
  return entry.procDamageKey ||
    entry.bonusDamageKey ||
    entry.valueKey ||
    entry.damageKey ||
    entry.damagePerSecondKey ||
    entry.damagePerWaveKey ||
    'damage';
}

function buildAttackWindowProbeScenario(hero, ability, entry, options = {}) {
  if (entry.model !== 'attack_sequence') return undefined;
  const setupAttackCount = entry.defaultSetupAttackCount || entry.defaultAttackCount || options.probeSetupAttackCount || 3;
  const attackCount = options.probeAttackCount || (setupAttackCount + 1);
  const abilityLevel = entry.defaultProbeAbilityLevel || options.probeAbilityLevel || 3;
  const heroLevel = entry.defaultProbeHeroLevel || options.probeHeroLevel || 5;
  return {
    id: `${slugify(hero)}_${slugify(ability)}_attack_window_probe`,
    hero,
    heroLevel,
    target: {
      unitName: 'npc_dota_creep_badguys_melee',
      health: 10000,
      armor: 0,
      magicResistancePercent: 25
    },
    abilitySelections: [{
      abilityName: ability,
      componentId: `${ability}:${entry.model}:${componentSourceKey(entry)}`,
      abilityLevel,
      valueMode: 'theoretical'
    }],
    scenario: {
      type: 'attack_window',
      attackCount
    }
  };
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

function outputReport(hero, ability, entry, options = {}) {
  const probe = engineProbeClassification(entry);
  const report = {
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
  if (options.includeProbeScenarios && probe.engineProbeSupported) {
    const probeScenario = buildAttackWindowProbeScenario(hero, ability, entry, options);
    if (probeScenario) report.probeScenario = probeScenario;
  }
  return report;
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
        const entries = [outputReport(model.hero, ability, entry, options)];
        for (const [index, component] of (entry.extraComponents || []).entries()) {
          entries.push(outputReport(model.hero, `${ability}#extra${index + 1}`, component, options));
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
    } else if (arg === '--include-probe-scenarios') {
      options.includeProbeScenarios = true;
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
  buildAttackWindowProbeScenario,
  engineProbeClassification,
  parseArgs,
  runtimeInputsFor
};
