const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CANONICAL_HERO_NAMES,
  getHeroAliases,
  getHeroDisplayName,
  getHeroLocalizationList,
  normalizeHeroName
} = require('../heroAliases');

test('normalizeHeroName resolves Chinese aliases to canonical English names', () => {
  assert.equal(normalizeHeroName('敌法'), 'Anti-Mage');
  assert.equal(normalizeHeroName('敌法师'), 'Anti-Mage');
  assert.equal(normalizeHeroName('冰女'), 'Crystal Maiden');
  assert.equal(normalizeHeroName('风行'), 'Windranger');
  assert.equal(normalizeHeroName('斧王'), 'Axe');
  assert.equal(normalizeHeroName('白牛'), 'Spirit Breaker');
});

test('normalizeHeroName keeps canonical English names and common abbreviations', () => {
  assert.equal(normalizeHeroName('Anti-Mage'), 'Anti-Mage');
  assert.equal(normalizeHeroName('anti mage'), 'Anti-Mage');
  assert.equal(normalizeHeroName('AM'), 'Anti-Mage');
  assert.equal(normalizeHeroName('qop'), 'Queen of Pain');
});

test('normalizeHeroName returns null for unknown names', () => {
  assert.equal(normalizeHeroName('不存在的英雄'), null);
});

test('getHeroAliases exposes frontend aliases for a canonical hero', () => {
  const aliases = getHeroAliases('Anti-Mage');

  assert.ok(aliases.includes('敌法'));
  assert.ok(aliases.includes('AM'));
});

test('getHeroDisplayName returns one Chinese primary display label per hero', () => {
  assert.equal(getHeroDisplayName('Axe'), '斧王 / Axe');
  assert.equal(getHeroDisplayName('Spirit Breaker'), '裂魂人 / Spirit Breaker');
});

test('getHeroLocalizationList has one display entry per canonical hero', () => {
  const list = getHeroLocalizationList();
  const uniqueNames = new Set(list.map((hero) => hero.localized_name));

  assert.equal(list.length, CANONICAL_HERO_NAMES.length);
  assert.equal(uniqueNames.size, CANONICAL_HERO_NAMES.length);
  assert.ok(list.every((hero) => hero.display_name.includes(' / ')));
  assert.ok(list.every((hero) => hero.zh_name));
});
