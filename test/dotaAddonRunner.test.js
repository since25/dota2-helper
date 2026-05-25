const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const runnerPath = path.join(
  __dirname,
  '..',
  'tools',
  'dota-addon',
  'scripts',
  'vscripts',
  'dota_helper_fixture_runner.lua'
);
const addonInfoPath = path.join(__dirname, '..', 'tools', 'dota-addon', 'addoninfo.txt');

test('Lua fixture runner loads generated fixture and exposes controlled attack measurement', () => {
  const source = fs.readFileSync(runnerPath, 'utf8');

  assert.match(source, /pcall\(require,\s*"generated\.dota_helper_fixture"\)/);
  assert.match(source, /RunConfiguredFixture/);
  assert.match(source, /PerformAttack/);
  assert.match(source, /observedDamage/);
  assert.match(source, /targetArmor/);
  assert.match(source, /attackerDamageMin/);
  assert.match(source, /CalibrateTargetArmor/);
  assert.match(source, /attackCount/);
  assert.match(source, /attackerBaseDamageMin/);
  assert.match(source, /attackerBaseDamageMax/);
  assert.match(source, /attackerAverageTrueDamageNoTarget/);
  assert.match(source, /PrepareInvisibilityBreak/);
  assert.match(source, /RunActiveItemFixture/);
  assert.match(source, /CastActiveItem/);
});

test('Dota addon metadata declares a playable probe addon', () => {
  const source = fs.readFileSync(addonInfoPath, 'utf8');

  assert.match(source, /"AddonInfo"/);
  assert.match(source, /"maps"\s+"dota"/);
  assert.match(source, /"IsPlayable"\s+"1"/);
});
