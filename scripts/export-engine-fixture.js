const fs = require('fs');
const path = require('path');
const { heroes } = require('dotaconstants');
const { calculateDamageCombo } = require('../damageCalculator');
const { getHeroDetails } = require('../dotaDataContext');
const { getItemModel } = require('../itemModels/registry');

const DEFAULT_JSON_OUTPUT_PATH = path.join('tools', 'dota-addon', 'generated', 'fixture.json');
const DEFAULT_LUA_OUTPUT_PATH = path.join(
  'tools',
  'dota-addon',
  'scripts',
  'vscripts',
  'generated',
  'dota_helper_fixture.lua'
);
const PROC_ATTACK_FLAGS = {
  processProcs: true,
  useCastAttackOrb: true,
  skipCooldown: true,
  neverMiss: true
};

function combatRelevantComponentIds(itemKey, options = {}) {
  const model = getItemModel(itemKey);
  const activeItemKeys = options.activeItemKeys;
  const includeAllDamage = !activeItemKeys;
  const includeActiveDamage = includeAllDamage || activeItemKeys.has(itemKey);
  const includeAttackProc = includeAllDamage || options.includeAttackProc;
  return (model?.effects || [])
    .filter((effect) => {
      if ([
        'modifier.attack_damage.flat',
        'modifier.attack_speed.flat',
        'stat.attribute',
        'modifier.crit'
      ].includes(effect.type)) {
        return true;
      }
      if (effect.type === 'damage.instant') return includeActiveDamage;
      if (effect.type === 'damage.attack_proc') return includeAttackProc;
      return false;
    })
    .map((effect, index) => `${itemKey}:${effect.type}:${effect.key || effect.abilityName || index}`);
}

function itemSelections(items, options = {}) {
  return (items || []).flatMap((itemKey) => {
    const componentIds = combatRelevantComponentIds(itemKey, options);
    return componentIds.map((componentId) => ({
      sourceType: 'item',
      itemKey,
      componentId,
      valueMode: 'theoretical'
    }));
  });
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveHeroUnitName(heroName) {
  const normalized = normalizeName(heroName);
  const hero = Object.values(heroes).find((entry) => (
    normalizeName(entry.localized_name) === normalized ||
    normalizeName(entry.name) === normalized
  ));
  if (!hero?.name) {
    throw new Error(`Cannot resolve Dota hero unit name for ${heroName}`);
  }
  return hero.name;
}

function itemAbilityName(itemKey) {
  return String(itemKey || '').startsWith('item_') ? itemKey : `item_${itemKey}`;
}

function basicAttackSelectionFromStep(step = {}) {
  return {
    sourceType: 'basic_attack',
    attackWindowMode: 'attack_count',
    attackCount: step.attackCount || 1,
    durationSeconds: step.durationSeconds,
    forceInvisibilityBreak: step.forceInvisibilityBreak,
    forceCritSource: step.forceCritSource
  };
}

function requiresProcAttackFlags(expectedLocalModel) {
  return (expectedLocalModel.components || []).some((component) => (
    component.kind === 'attack_sequence' ||
    component.kind === 'attack_proc'
  ));
}

function scenarioWithInferredAttackFlags(scenario = {}, expectedLocalModel) {
  if (scenario.attackFlags || !requiresProcAttackFlags(expectedLocalModel)) {
    return scenario;
  }
  return {
    ...scenario,
    attackFlags: { ...PROC_ATTACK_FLAGS }
  };
}

function engineSetupFor(input, expectedLocalModel, abilityLevels = []) {
  const targetHero = input.target?.hero || 'Axe';
  return {
    attackerUnitName: resolveHeroUnitName(input.hero),
    targetUnitName: input.target?.unitName || resolveHeroUnitName(targetHero),
    itemAbilityNames: (input.items || []).map(itemAbilityName),
    abilityLevels,
    expectedAdjusted: expectedLocalModel.totals?.adjusted || 0
  };
}

async function buildEngineFixture(input) {
  const scenarioType = input.scenario?.type || 'attack_window';
  const abilitySelections = input.abilitySelections || [];
  const sequenceSteps = input.scenario?.steps || [];
  const activeItemKeys = scenarioType === 'sequence'
    ? new Set(sequenceSteps.filter((step) => step.type === 'active_item').map((step) => step.activeItemKey))
    : null;
  const includeAttackProc = scenarioType === 'sequence'
    ? sequenceSteps.some((step) => step.type === 'attack_window')
    : false;
  const selectedComponents = [
    ...itemSelections(input.items, { activeItemKeys, includeAttackProc }),
    ...abilitySelections.map((selection) => ({
      sourceType: 'ability',
      ...selection
    }))
  ];
  if (scenarioType === 'attack_window' && abilitySelections.length === 0) {
    selectedComponents.push(basicAttackSelectionFromStep(input.scenario));
  }
  if (scenarioType === 'sequence') {
    for (const step of sequenceSteps) {
      if (step.type === 'attack_window') {
        selectedComponents.push(basicAttackSelectionFromStep(step));
      }
    }
  }
  const heroDetails = abilitySelections.length ? await getHeroDetails(input.hero) : null;
  const engineAbilityLevels = abilitySelections.map((selection) => {
    const ability = heroDetails?.abilities?.find((entry) => entry.name === selection.abilityName);
    if (!ability?.internalName) {
      throw new Error(`Cannot resolve Dota ability name for ${input.hero}.${selection.abilityName}`);
    }
    return {
      abilityName: ability.internalName,
      level: selection.abilityLevel || 1
    };
  });

  const expectedLocalModel = await calculateDamageCombo({
    hero: input.hero,
    heroLevel: input.heroLevel,
    enemyArmor: input.target?.armor ?? 0,
    enemyMagicResistancePercent: input.target?.magicResistancePercent ?? 25,
    selectedComponents
  });
  const scenario = scenarioWithInferredAttackFlags(input.scenario || {}, expectedLocalModel);

  const fixture = {
    id: input.id,
    hero: input.hero,
    heroLevel: input.heroLevel,
    items: input.items || [],
    target: input.target || {},
    scenario,
    abilitySelections,
    expectedLocalModel
  };
  fixture.engineAbilityLevels = engineAbilityLevels;
  fixture.engineSetup = engineSetupFor(input, expectedLocalModel, engineAbilityLevels);
  return fixture;
}

async function buildEngineFixtureBatch(input) {
  const scenarios = input.scenarios || [];
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new Error('Engine fixture batch requires a non-empty scenarios array.');
  }
  return {
    id: input.id || 'engine_fixture_batch',
    fixtures: await Promise.all(scenarios.map((scenario) => buildEngineFixture(scenario)))
  };
}

async function buildEngineFixtureArtifact(input) {
  return Array.isArray(input.scenarios) ? buildEngineFixtureBatch(input) : buildEngineFixture(input);
}

function luaString(value) {
  return `"${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')}"`;
}

function luaValue(value, indent = 0) {
  const nextIndent = indent + 2;
  const pad = ' '.repeat(indent);
  const nextPad = ' '.repeat(nextIndent);
  if (value === null || value === undefined) return 'nil';
  if (typeof value === 'string') return luaString(value);
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '0';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    if (value.length === 0) return '{}';
    return `{\n${value.map((entry) => `${nextPad}${luaValue(entry, nextIndent)}`).join(',\n')}\n${pad}}`;
  }
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  if (entries.length === 0) return '{}';
  return `{\n${entries.map(([key, entryValue]) => {
    const safeKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : `[${luaString(key)}]`;
    return `${nextPad}${safeKey} = ${luaValue(entryValue, nextIndent)}`;
  }).join(',\n')}\n${pad}}`;
}

function luaFixtureRecord(fixture) {
  return {
    id: fixture.id,
    hero: fixture.hero,
    heroLevel: fixture.heroLevel,
    attackerUnitName: fixture.engineSetup.attackerUnitName,
    targetUnitName: fixture.engineSetup.targetUnitName,
    itemAbilityNames: fixture.engineSetup.itemAbilityNames,
    abilityLevels: fixture.engineSetup.abilityLevels,
    target: {
      hero: fixture.target?.hero,
      level: fixture.target?.level,
      health: fixture.target?.health,
      armor: fixture.target?.armor,
      magicResistancePercent: fixture.target?.magicResistancePercent
    },
    scenario: fixture.scenario || {},
    expectedAdjusted: fixture.engineSetup.expectedAdjusted
  };
}

function buildLuaFixtureSource(fixture) {
  const luaFixture = fixture.fixtures
    ? {
      id: fixture.id,
      fixtures: fixture.fixtures.map(luaFixtureRecord)
    }
    : luaFixtureRecord(fixture);
  return `return ${luaValue(luaFixture)}\n`;
}

async function writeEngineFixtureFiles({ input, outputPath, luaOutputPath }) {
  const fixture = await buildEngineFixtureArtifact(input);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(fixture, null, 2));
  fs.mkdirSync(path.dirname(luaOutputPath), { recursive: true });
  fs.writeFileSync(luaOutputPath, buildLuaFixtureSource(fixture));
  return { fixture, outputPath, luaOutputPath };
}

async function main(argv = process.argv.slice(2)) {
  const inputPath = argv[0];
  const outputPath = argv[1] || DEFAULT_JSON_OUTPUT_PATH;
  const luaOutputPath = argv[2] || DEFAULT_LUA_OUTPUT_PATH;
  if (!inputPath) {
    throw new Error('Usage: node scripts/export-engine-fixture.js <scenario.json> [output.json] [output.lua]');
  }
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  await writeEngineFixtureFiles({ input, outputPath, luaOutputPath });
  console.log(outputPath);
  console.log(luaOutputPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  buildEngineFixtureArtifact,
  buildEngineFixtureBatch,
  buildEngineFixture,
  buildLuaFixtureSource,
  writeEngineFixtureFiles,
  combatRelevantComponentIds
};
