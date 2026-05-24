const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../package.json');
const lockfile = require('../package-lock.json');

const packageManifests = [
  ['package.json', pkg],
  ['package-lock.json root package', lockfile.packages['']],
];

function assertPinnedDependencyMap(fileName, dependencyType, dependencies) {
  assert.equal(typeof dependencies, 'object', `${fileName} ${dependencyType} must exist`);
  assert.notEqual(dependencies, null, `${fileName} ${dependencyType} must exist`);
  assert.equal(Array.isArray(dependencies), false, `${fileName} ${dependencyType} must be an object map`);
  assert.notDeepEqual(dependencies, {}, `${fileName} ${dependencyType} must not be empty`);

  for (const [name, version] of Object.entries(dependencies)) {
    assert.equal(typeof version, 'string', `${fileName} ${dependencyType}.${name} must be a string`);
    assert.doesNotMatch(
      version,
      /[*^~]/,
      `${fileName} ${dependencyType}.${name} must be pinned, got ${version}`,
    );
  }
}

test('package root metadata matches the lockfile root', () => {
  assert.equal(lockfile.packages[''].name, pkg.name);
  assert.equal(lockfile.packages[''].version, pkg.version);
});

test('package license matches repository LICENSE file', () => {
  const licenseText = fs.readFileSync(path.join(__dirname, '..', 'LICENSE'), 'utf8');
  assert.match(licenseText, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  for (const [fileName, manifest] of packageManifests) {
    assert.equal(manifest.license, 'AGPL-3.0-only', `${fileName} license must match LICENSE`);
  }
  assert.equal(pkg.license, lockfile.packages[''].license);
});

test('runtime and dev dependency versions are pinned and match the lockfile root', () => {
  for (const dependencyType of ['dependencies', 'devDependencies']) {
    for (const [fileName, manifest] of packageManifests) {
      assertPinnedDependencyMap(fileName, dependencyType, manifest[dependencyType]);
    }
    assert.deepEqual(
      lockfile.packages[''][dependencyType],
      pkg[dependencyType],
      `package-lock.json root ${dependencyType} must match package.json`,
    );
  }
});
