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

test('Lua fixture runner loads generated fixture and exposes controlled attack measurement', () => {
  const source = fs.readFileSync(runnerPath, 'utf8');

  assert.match(source, /pcall\(require,\s*"generated\.dota_helper_fixture"\)/);
  assert.match(source, /RunConfiguredFixture/);
  assert.match(source, /PerformAttack/);
  assert.match(source, /observedDamage/);
});
