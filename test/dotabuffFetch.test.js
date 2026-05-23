const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDotabuffAbilityUrl,
  buildManifest,
  parseArgs,
  slugifyDotabuffHeroName
} = require('../scripts/fetch-dotabuff-ability-pages');

test('slugifyDotabuffHeroName creates Dotabuff-style hero slugs', () => {
  assert.equal(slugifyDotabuffHeroName('Abaddon'), 'abaddon');
  assert.equal(slugifyDotabuffHeroName("Nature's Prophet"), 'natures-prophet');
  assert.equal(slugifyDotabuffHeroName('Queen of Pain'), 'queen-of-pain');
  assert.equal(slugifyDotabuffHeroName('Outworld Destroyer'), 'outworld-destroyer');
});

test('buildDotabuffAbilityUrl targets zh ability pages', () => {
  assert.equal(
    buildDotabuffAbilityUrl('Abaddon'),
    'https://zh.dotabuff.com/heroes/abaddon/abilities'
  );
});

test('parseArgs supports single hero and cache controls', () => {
  const options = parseArgs([
    '--hero', '亚巴顿',
    '--out', 'tmp/dotabuff',
    '--force',
    '--delay-ms', '250',
    '--continue-on-error'
  ]);

  assert.equal(options.hero, 'Abaddon');
  assert.equal(options.outDir, 'tmp/dotabuff');
  assert.equal(options.force, true);
  assert.equal(options.delayMs, 250);
  assert.equal(options.continueOnError, true);
  assert.equal(options.all, false);
});

test('parseArgs defaults to all heroes with polite delay', () => {
  const options = parseArgs([]);

  assert.equal(options.all, true);
  assert.equal(options.delayMs >= 1500, true);
});

test('buildManifest summarizes fetch results', () => {
  const manifest = buildManifest({
    generatedAt: '2026-05-23T00:00:00.000Z',
    outDir: 'data/dotabuff/ability-pages',
    results: [
      { hero: 'Abaddon', status: 200, cached: false },
      { hero: 'Axe', status: 403, error: 'HTTP 403', cached: false }
    ]
  });

  assert.equal(manifest.heroCount, 2);
  assert.equal(manifest.successCount, 1);
  assert.equal(manifest.errorCount, 1);
  assert.equal(manifest.cachedCount, 0);
});
