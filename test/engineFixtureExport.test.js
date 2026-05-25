const test = require('node:test');
const assert = require('node:assert/strict');

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildEngineFixture,
  buildLuaFixtureSource,
  writeEngineFixtureFiles
} = require('../scripts/export-engine-fixture');

test('buildEngineFixture wraps local model result for a Dota engine scenario', async () => {
  const fixture = await buildEngineFixture({
    id: 'pa_level_12_invis_sword_attack',
    hero: 'Phantom Assassin',
    heroLevel: 12,
    items: ['invis_sword'],
    target: {
      hero: 'Axe',
      level: 12,
      armor: 10,
      magicResistancePercent: 25
    },
    scenario: {
      type: 'attack_window',
      attackCount: 1,
      forceInvisibilityBreak: true
    }
  });

  assert.equal(fixture.id, 'pa_level_12_invis_sword_attack');
  assert.equal(fixture.hero, 'Phantom Assassin');
  assert.equal(fixture.expectedLocalModel.hero, 'Phantom Assassin');
  assert.ok(Array.isArray(fixture.expectedLocalModel.components));
});

test('buildEngineFixture resolves Dota engine unit and item names for Lua', async () => {
  const fixture = await buildEngineFixture({
    id: 'pa_level_12_broadsword_attack',
    hero: 'Phantom Assassin',
    heroLevel: 12,
    items: ['broadsword', 'invis_sword'],
    target: {
      hero: 'Axe',
      level: 12,
      armor: 10,
      magicResistancePercent: 25
    },
    scenario: {
      type: 'attack_window',
      attackCount: 1
    }
  });

  assert.equal(fixture.engineSetup.attackerUnitName, 'npc_dota_hero_phantom_assassin');
  assert.equal(fixture.engineSetup.targetUnitName, 'npc_dota_hero_axe');
  assert.deepEqual(fixture.engineSetup.itemAbilityNames, ['item_broadsword', 'item_invis_sword']);
  assert.equal(fixture.engineSetup.expectedAdjusted, fixture.expectedLocalModel.totals.adjusted);
});

test('buildLuaFixtureSource emits a require-able Lua table for the addon runner', async () => {
  const fixture = await buildEngineFixture({
    id: 'pa_lua_fixture',
    hero: 'Phantom Assassin',
    heroLevel: 12,
    items: ['broadsword'],
    target: { hero: 'Axe', armor: 10, magicResistancePercent: 25 },
    scenario: { type: 'attack_window', attackCount: 1 }
  });

  const source = buildLuaFixtureSource(fixture);

  assert.match(source, /^return \{/);
  assert.match(source, /id = "pa_lua_fixture"/);
  assert.match(source, /attackerUnitName = "npc_dota_hero_phantom_assassin"/);
  assert.match(source, /itemAbilityNames = \{/);
  assert.match(source, /"item_broadsword"/);
  assert.match(source, /expectedAdjusted = /);
});

test('writeEngineFixtureFiles writes JSON and addon Lua fixture outputs', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dota-helper-engine-'));
  const jsonPath = path.join(tmpDir, 'fixture.json');
  const luaPath = path.join(tmpDir, 'dota_helper_fixture.lua');

  await writeEngineFixtureFiles({
    input: {
      id: 'pa_written_fixture',
      hero: 'Phantom Assassin',
      heroLevel: 12,
      items: ['broadsword'],
      target: { hero: 'Axe', armor: 10, magicResistancePercent: 25 },
      scenario: { type: 'attack_window', attackCount: 1 }
    },
    outputPath: jsonPath,
    luaOutputPath: luaPath
  });

  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const lua = fs.readFileSync(luaPath, 'utf8');

  assert.equal(json.id, 'pa_written_fixture');
  assert.equal(json.engineSetup.targetUnitName, 'npc_dota_hero_axe');
  assert.match(lua, /return \{/);
  assert.match(lua, /id = "pa_written_fixture"/);
});
