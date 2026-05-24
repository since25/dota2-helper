const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../package.json');

test('package license matches repository LICENSE file', () => {
  const licenseText = fs.readFileSync(path.join(__dirname, '..', 'LICENSE'), 'utf8');
  assert.match(licenseText, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.equal(pkg.license, 'AGPL-3.0-only');
});

test('runtime and dev dependency versions are pinned', () => {
  const dependencyMaps = [pkg.dependencies, pkg.devDependencies];
  for (const dependencies of dependencyMaps) {
    for (const [name, version] of Object.entries(dependencies || {})) {
      assert.doesNotMatch(version, /[*^~]/, `${name} must be pinned, got ${version}`);
    }
  }
});
