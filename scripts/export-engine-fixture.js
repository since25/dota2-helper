const fs = require('fs');
const path = require('path');
const { heroes } = require('dotaconstants');
const { calculateDamageCombo } = require('../damageCalculator');
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

function combatRelevantComponentIds(itemKey) {
  const model = getItemModel(itemKey);
  return (model?.effects || [])
    .filter((effect) => [
      'modifier.attack_damage.flat',
      'modifier.attack_speed.flat',
      'stat.attribute',
      'modifier.crit',
      'damage.attack_proc',
      'damage.instant'
    ].includes(effect.type))
    .map((effect, index) => `${itemKey}:${effect.type}:${effect.key || effect.abilityName || index}`);
}

function itemSelections(items) {
  return (items || []).flatMap((itemKey) => {
    const componentIds = combatRelevantComponentIds(itemKey);
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

function engineSetupFor(input, expectedLocalModel) {
  const targetHero = input.target?.hero || 'Axe';
  return {
    attackerUnitName: resolveHeroUnitName(input.hero),
    targetUnitName: resolveHeroUnitName(targetHero),
    itemAbilityNames: (input.items || []).map(itemAbilityName),
    expectedAdjusted: expectedLocalModel.totals?.adjusted || 0
  };
}

async function buildEngineFixture(input) {
  const expectedLocalModel = await calculateDamageCombo({
    hero: input.hero,
    heroLevel: input.heroLevel,
    enemyArmor: input.target?.armor ?? 0,
    enemyMagicResistancePercent: input.target?.magicResistancePercent ?? 25,
    selectedComponents: [
      ...itemSelections(input.items),
      {
        sourceType: 'basic_attack',
        attackWindowMode: input.scenario?.type === 'attack_window' ? 'attack_count' : 'attack_count',
        attackCount: input.scenario?.attackCount || 1,
        forceInvisibilityBreak: input.scenario?.forceInvisibilityBreak,
        forceCritSource: input.scenario?.forceCritSource
      }
    ]
  });

  const fixture = {
    id: input.id,
    hero: input.hero,
    heroLevel: input.heroLevel,
    items: input.items || [],
    target: input.target || {},
    scenario: input.scenario || {},
    expectedLocalModel
  };
  fixture.engineSetup = engineSetupFor(input, expectedLocalModel);
  return fixture;
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

function buildLuaFixtureSource(fixture) {
  const luaFixture = {
    id: fixture.id,
    hero: fixture.hero,
    heroLevel: fixture.heroLevel,
    attackerUnitName: fixture.engineSetup.attackerUnitName,
    targetUnitName: fixture.engineSetup.targetUnitName,
    itemAbilityNames: fixture.engineSetup.itemAbilityNames,
    target: {
      hero: fixture.target?.hero,
      level: fixture.target?.level,
      armor: fixture.target?.armor,
      magicResistancePercent: fixture.target?.magicResistancePercent
    },
    scenario: fixture.scenario || {},
    expectedAdjusted: fixture.engineSetup.expectedAdjusted
  };
  return `return ${luaValue(luaFixture)}\n`;
}

async function writeEngineFixtureFiles({ input, outputPath, luaOutputPath }) {
  const fixture = await buildEngineFixture(input);
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
  buildEngineFixture,
  buildLuaFixtureSource,
  writeEngineFixtureFiles,
  combatRelevantComponentIds
};
