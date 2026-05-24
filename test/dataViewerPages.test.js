const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(fileName) {
  return fs.readFileSync(path.join(root, fileName), 'utf8');
}

test('home page links to readable data viewer pages instead of raw JSON APIs', () => {
  const html = read('index.html');

  assert.match(html, /href="\/heroes\.html"/);
  assert.match(html, /href="\/damage-profile\.html\?hero=Lich"/);
  assert.match(html, /href="\/items\.html"/);
  assert.doesNotMatch(html, /href="\/api\/heroes"/);
  assert.doesNotMatch(html, /href="\/api\/damage\/heroes\/Lich"/);
});

test('home page loads output formatter before main script', () => {
  const html = read('index.html');
  assert.match(html, /<script src="outputFormatter\.js"><\/script>\s*<script src="script\.js"><\/script>/);
});

test('hero list viewer fetches hero JSON and links to damage model viewer', () => {
  const html = read('heroes.html');
  const js = read('heroes.js');

  assert.match(html, /heroes\.js/);
  assert.match(html, /\/api\/heroes/);
  assert.match(js, /fetchJson\('\/api\/heroes'\)/);
  assert.match(js, /\/damage-profile\.html\?hero=/);
});

test('damage profile viewer fetches single hero model and exposes raw JSON section', () => {
  const html = read('damage-profile.html');
  const js = read('damage-profile.js');

  assert.match(html, /damage-profile\.js/);
  assert.match(html, /原始 JSON/);
  assert.match(js, /\/api\/damage\/heroes\/\$/);
  assert.match(js, /JSON\.stringify\(profile, null, 2\)/);
});

test('item model viewer fetches item model JSON and renders detail panel', () => {
  const html = read('items.html');
  const js = read('items.js');

  assert.match(html, /items\.js/);
  assert.match(html, /\/api\/items\/models/);
  assert.match(html, /当前物品原始 JSON/);
  assert.match(js, /fetchJson\('\/api\/items\/models'\)/);
  assert.match(js, /selectItem/);
  assert.match(js, /item\.displayName/);
  assert.match(js, /item\.englishName/);
});

test('damage calculator renders workbench shop and selected item areas', () => {
  const html = read('damage-calculator.html');
  const js = read('damage-calculator.js');

  assert.match(html, /英雄伤害实验室/);
  assert.match(html, /已选物品/);
  assert.match(html, /商店/);
  assert.match(html, /id="itemRows"/);
  assert.match(html, /id="selectedItems"/);
  assert.match(js, /api\/calculator\/workbench/);
  assert.match(js, /selectedItemComponents/);
  assert.match(js, /sourceType: 'item'/);
  assert.match(js, /function toggleItem/);
  assert.match(js, /toggleItem\(card\.dataset\.itemKey\)/);
});

test('damage calculator forces runtime-input primitives into theoretical mode', () => {
  const js = read('damage-calculator.js');

  assert.match(js, /runtimeInputOnly/);
  assert.match(js, /<option value="base" \$\{runtimeInputOnly \? 'disabled' : ''\}>/);
  assert.match(js, /\|\| runtimeInputOnly/);
});

test('token recovery no-token branch can surface backend messages', () => {
  const js = read('script.js');

  assert.match(js, /data\.error \|\| data\.message \|\| 'No active subscription found for this email\.'/);
});
