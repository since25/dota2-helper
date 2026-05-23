#!/usr/bin/env node

const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { getDotaConstants } = require('../dotaDataContext');
const { getHeroDamageModel, listHeroDamageModels } = require('../damageModels/registry');
const { LEGACY_MODIFIER_SEMANTIC_TYPES } = require('../damageModels/schema');
const { getSemanticDefinition, routeSemanticToContext } = require('../damageModels/semantics');

const AUDIT_BATCHES = Object.freeze([
  {
    id: 'A',
    name: 'Simple Nukes And Direct-Damage Supports',
    description: 'Start with simple direct-damage nukes and supports whose burst is mostly fixed instant damage.'
  },
  {
    id: 'B',
    name: 'Sustained And Tick Damage',
    description: 'Review sustained, tick, damage-over-time, channel, and duration-controlled damage models.'
  },
  {
    id: 'C',
    name: 'Attack Modifiers And Procs',
    description: 'Review attack modifiers, bashes, crits, cleave-like attacks, and attack-count proc models.'
  },
  {
    id: 'D',
    name: 'Resistance And Amplification Modifiers',
    description: 'Review armor reduction, magic resistance reduction, damage amplification, and spell amplification.'
  },
  {
    id: 'E',
    name: 'Summons And Unit Proxies',
    description: 'Review summons, wards, illusions, dominated units, and proxy unit damage windows.'
  },
  {
    id: 'F',
    name: 'Percent And Scaling Damage',
    description: 'Review percent-health, missing-health, missing-mana, attribute-scaling, and stack-scaling damage.'
  },
  {
    id: 'G',
    name: 'Transform And Copied-Skill Edge Cases',
    description: 'Review transformations, copied skills, stolen skills, shapeshifts, and other cross-hero mechanics.'
  },
  {
    id: 'H',
    name: 'Remaining Utility And Low-Damage Heroes',
    description: 'Finish remaining low-damage utility heroes and mark non-damage mechanics with explicit semantics.'
  }
]);

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

const MODEL_SOURCE_KEYS = [
  'damageKey',
  'procDamageKey',
  'damagePerSecondKey',
  'durationKey',
  'tickIntervalKey',
  'damagePerWaveKey',
  'waveCountKey',
  'bonusDamageKey',
  'attackFactorKey',
  'attackFactorTooltipKey',
  'procChanceKey',
  'valueKey',
  'chanceKey',
  'multiplierKey',
  'attackCountKey'
];

const PRIMARY_SOURCE_KEYS = new Set([
  'damageKey',
  'procDamageKey',
  'damagePerSecondKey',
  'damagePerWaveKey',
  'bonusDamageKey',
  'valueKey'
]);

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(String(value).replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function hasNumericValue(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.some((entry) => toNumber(entry) !== null);
}

function formatValue(value) {
  return Array.isArray(value) ? value.join('/') : String(value);
}

function visibleAbilityRecords(heroAbilities, abilities) {
  return (heroAbilities.abilities || [])
    .map((name) => abilities[name])
    .filter((ability) => ability && ability.dname && ability.desc);
}

function numericFieldsForAbility(heroName, ability) {
  const fields = [];

  if (ability.dmg !== undefined && hasNumericValue(ability.dmg)) {
    fields.push({
      hero: heroName,
      ability: ability.dname,
      key: 'dmg',
      label: 'DAMAGE',
      value: formatValue(ability.dmg),
      source: 'ability.dmg'
    });
  }

  for (const attr of ability.attrib || []) {
    if (!hasNumericValue(attr.value)) continue;
    fields.push({
      hero: heroName,
      ability: ability.dname,
      key: attr.key || attr.header || '',
      label: attr.header || attr.key || '',
      value: formatValue(attr.value),
      source: 'ability.attrib'
    });
  }

  return fields;
}

function referencedKeysForEntry(entry) {
  return new Set(MODEL_SOURCE_KEYS
    .map((key) => entry[key])
    .filter((value) => typeof value === 'string' && value.trim()));
}

function semanticTypeForEntry(entry) {
  if (entry.semanticType) return entry.semanticType;
  if (entry.modifierType && LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType]) {
    return LEGACY_MODIFIER_SEMANTIC_TYPES[entry.modifierType];
  }
  return DIRECT_MODEL_DEFAULTS[entry.model] || '';
}

function modelEntryNeedsExplicitSemantic(entry) {
  return entry.status === 'reference_only' && entry.valueKey && !entry.semanticType && !entry.modifierType;
}

function sourceKeyRoleForEntry(entry, sourceKey) {
  for (const configKey of MODEL_SOURCE_KEYS) {
    if (entry[configKey] === sourceKey && PRIMARY_SOURCE_KEYS.has(configKey)) {
      return 'primary';
    }
  }
  return 'auxiliary';
}

function buildMappedField(heroName, ability, entry, sourceKey) {
  const attr = sourceKey === 'dmg'
    ? { key: 'dmg', header: 'DAMAGE', value: ability.dmg }
    : (ability.attrib || []).find((candidate) => candidate.key === sourceKey);
  if (!attr || !hasNumericValue(attr.value)) return null;

  const semanticType = semanticTypeForEntry(entry);
  if (!semanticType) return null;
  const definition = getSemanticDefinition(semanticType);

  return {
    hero: heroName,
    ability: ability.dname,
    key: sourceKey,
    value: formatValue(attr.value),
    role: sourceKeyRoleForEntry(entry, sourceKey),
    semanticType,
    semanticUnit: definition.unit,
    contextRoute: routeSemanticToContext(semanticType, { defaultIncluded: Boolean(entry.defaultIncluded) })
  };
}

function fieldLooksPercent(field) {
  const key = field.key || '';
  const value = field.value || '';
  return /pct|percent|%/i.test(`${key} ${value}`);
}

function findSuspiciousMappings(mappedFields) {
  return mappedFields
    .filter((field) =>
      (field.role === undefined || field.role === 'primary')
      &&
      fieldLooksPercent(field)
      && field.semanticUnit === 'flat'
      && ['fixed_damage', 'situational_damage'].includes(field.contextRoute)
    )
    .map((field) => ({
      hero: field.hero,
      ability: field.ability,
      key: field.key,
      reason: 'percent-like field is routed as flat damage',
      semanticType: field.semanticType,
      contextRoute: field.contextRoute
    }));
}

function scopeHeroNames({ hero, all } = {}) {
  if (hero) return [hero];
  if (all) return CANONICAL_HERO_NAMES;
  return CANONICAL_HERO_NAMES;
}

async function buildSemanticAudit(options = {}) {
  const { heroes, hero_abilities, abilities } = await getDotaConstants();
  const heroNames = scopeHeroNames(options);
  const modeledHeroNames = new Set(listHeroDamageModels().map((model) => model.hero));
  const heroReports = [];
  const unmodeledVisibleAbilities = [];
  const modelEntriesMissingSemanticType = [];
  const rawNumericFieldsNotReferenced = [];
  const mappedFields = [];

  const totals = {
    totalHeroCount: heroNames.length,
    modeledHeroCount: 0,
    modeledAbilityCount: 0,
    unmodeledVisibleAbilityCount: 0,
    modelEntriesMissingSemanticType: 0,
    rawNumericFieldsNotReferenced: 0,
    suspiciousMappingCount: 0
  };

  for (const heroName of heroNames) {
    const heroRecord = Object.values(heroes).find((entry) => entry.localized_name === heroName);
    const abilityRecords = heroRecord ? visibleAbilityRecords(hero_abilities[heroRecord.name] || {}, abilities) : [];
    const model = getHeroDamageModel(heroName);
    const heroReport = {
      hero: heroName,
      visibleAbilityCount: abilityRecords.length,
      modeledAbilityCount: 0,
      unmodeledVisibleAbilities: [],
      modelEntriesMissingSemanticType: [],
      rawNumericFieldsNotReferenced: [],
      suspiciousMappings: []
    };

    if (!model) {
      for (const ability of abilityRecords) {
        const unmodeled = { hero: heroName, ability: ability.dname };
        unmodeledVisibleAbilities.push(unmodeled);
        heroReport.unmodeledVisibleAbilities.push(unmodeled);
      }
      totals.unmodeledVisibleAbilityCount += abilityRecords.length;
      heroReports.push(heroReport);
      continue;
    }

    if (modeledHeroNames.has(heroName)) totals.modeledHeroCount += 1;

    for (const ability of abilityRecords) {
      const entry = model.abilities[ability.dname];
      const rawFields = numericFieldsForAbility(heroName, ability);

      if (!entry) {
        const unmodeled = { hero: heroName, ability: ability.dname };
        unmodeledVisibleAbilities.push(unmodeled);
        heroReport.unmodeledVisibleAbilities.push(unmodeled);
        totals.unmodeledVisibleAbilityCount += 1;
        continue;
      }

      heroReport.modeledAbilityCount += 1;
      totals.modeledAbilityCount += 1;

      if (modelEntryNeedsExplicitSemantic(entry)) {
        const missing = { hero: heroName, ability: ability.dname, model: entry.model, valueKey: entry.valueKey };
        modelEntriesMissingSemanticType.push(missing);
        heroReport.modelEntriesMissingSemanticType.push(missing);
      }

      const referencedKeys = referencedKeysForEntry(entry);
      for (const key of referencedKeys) {
        const mapped = buildMappedField(heroName, ability, entry, key);
        if (mapped) mappedFields.push(mapped);
      }

      for (const field of rawFields) {
        if (referencedKeys.has(field.key)) continue;
        rawNumericFieldsNotReferenced.push(field);
        heroReport.rawNumericFieldsNotReferenced.push(field);
      }
    }

    heroReports.push(heroReport);
  }

  const suspiciousMappings = findSuspiciousMappings(mappedFields);
  for (const suspicious of suspiciousMappings) {
    const heroReport = heroReports.find((entry) => entry.hero === suspicious.hero);
    if (heroReport) heroReport.suspiciousMappings.push(suspicious);
  }

  totals.modelEntriesMissingSemanticType = modelEntriesMissingSemanticType.length;
  totals.rawNumericFieldsNotReferenced = rawNumericFieldsNotReferenced.length;
  totals.suspiciousMappingCount = suspiciousMappings.length;

  return {
    scope: {
      all: Boolean(options.all || !options.hero),
      hero: options.hero || null
    },
    auditBatches: AUDIT_BATCHES,
    totals,
    heroReports,
    unmodeledVisibleAbilities,
    modelEntriesMissingSemanticType,
    rawNumericFieldsNotReferenced,
    suspiciousMappings
  };
}

function parseArgs(argv) {
  const options = { all: false, json: false, hero: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--all') options.all = true;
    if (arg === '--json') options.json = true;
    if (arg === '--hero') {
      options.hero = argv[index + 1];
      index += 1;
    }
  }
  if (!options.hero) options.all = true;
  return options;
}

function formatTextReport(report) {
  const lines = [
    'Dota 2 semantic audit',
    `Scope: ${report.scope.hero || 'all heroes'}`,
    `Modeled heroes: ${report.totals.modeledHeroCount}/${report.totals.totalHeroCount}`,
    `Modeled abilities: ${report.totals.modeledAbilityCount}`,
    `Unmodeled visible abilities: ${report.totals.unmodeledVisibleAbilityCount}`,
    `Entries missing semantic type: ${report.totals.modelEntriesMissingSemanticType}`,
    `Unreferenced raw numeric fields: ${report.totals.rawNumericFieldsNotReferenced}`,
    `Suspicious mappings: ${report.totals.suspiciousMappingCount}`
  ];

  const interestingHeroes = report.heroReports.filter((hero) =>
    hero.unmodeledVisibleAbilities.length
    || hero.modelEntriesMissingSemanticType.length
    || hero.suspiciousMappings.length
  ).slice(0, 20);

  if (interestingHeroes.length) {
    lines.push('', 'Attention needed:');
    for (const hero of interestingHeroes) {
      lines.push(`- ${hero.hero}: unmodeled=${hero.unmodeledVisibleAbilities.length}, missingSemantic=${hero.modelEntriesMissingSemanticType.length}, suspicious=${hero.suspiciousMappings.length}`);
    }
  }

  lines.push('', 'Audit batches:');
  for (const batch of report.auditBatches) {
    lines.push(`- Batch ${batch.id}: ${batch.name}`);
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildSemanticAudit(options);
  process.stdout.write(options.json ? `${JSON.stringify(report, null, 2)}\n` : formatTextReport(report));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  AUDIT_BATCHES,
  buildSemanticAudit,
  findSuspiciousMappings,
  numericFieldsForAbility,
  parseArgs
};
