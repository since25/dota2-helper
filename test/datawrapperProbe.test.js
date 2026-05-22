const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

test('datawrapper probe emits machine-readable JSON', () => {
  const result = spawnSync(process.execPath, ['scripts/probe-datawrapper.mjs', '--json'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.packageName, 'dota2-datawrapper');
  assert.ok(['available', 'missing'].includes(payload.status));
  assert.ok(Array.isArray(payload.findings));
  assert.ok(payload.samples);
});
