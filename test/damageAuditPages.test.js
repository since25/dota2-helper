const test = require('node:test');
const assert = require('node:assert/strict');

const {
  escapeHtml,
  formatValue,
  parseArgs,
  renderErrorHtml,
  renderHeroHtml,
  renderIndexHtml,
  selectHeroNames,
  slugifyHeroName
} = require('../scripts/export-damage-audit-pages');

test('slugifyHeroName creates stable audit filenames', () => {
  assert.equal(slugifyHeroName('Queen of Pain'), 'queen-of-pain');
  assert.equal(slugifyHeroName("Nature's Prophet"), 'nature-s-prophet');
});

test('renderHeroHtml exposes component values, duration metadata, and raw JSON safely', () => {
  const html = renderHeroHtml({
    hero: 'Jakiro',
    displayName: '杰奇洛（Jakiro）',
    modelAudit: {
      source: 'manual',
      reviewStatus: 'reviewed',
      manualModel: {
        hero: 'Jakiro',
        review: { status: 'reviewed' },
        abilities: { 'Liquid Fire': { model: 'sustained_dps' } }
      },
      rawNumericFieldsNotReferenced: [{
        ability: 'Liquid Fire',
        key: 'attack_slow',
        label: 'ATTACK SLOW',
        value: '-30'
      }],
      suspiciousMappings: []
    },
    stats: {
      primaryAttribute: 'int',
      baseIntelligence: 26,
      intelligenceGain: 3
    },
    abilities: [{
      name: 'Liquid Fire',
      displayName: '液态火（Liquid Fire）',
      isUltimate: false,
      modelSource: 'auto',
      status: 'implemented',
      model: 'sustained_dps',
      manaCostByAbilityLevel: [20, 20, 20, 20],
      cooldownByAbilityLevel: [13, 10, 7, 4],
      components: [{
        id: 'Liquid Fire:sustained:damage',
        kind: 'sustained',
        model: 'sustained_dps',
        status: 'implemented',
        damageType: 'Magical',
        label: '<script>',
        valuesByAbilityLevel: [15, 25, 35, 45],
        theoreticalTotalByAbilityLevel: [75, 125, 175, 225],
        metadata: {
          durationByAbilityLevel: [5, 5, 5, 5],
          tickIntervalByAbilityLevel: [0.5, 0.5, 0.5, 0.5]
        },
        totalFormula: 'duration * damagePerSecond',
        caveats: ['包含持续伤害']
      }]
    }]
  }, {
    baseUrl: 'http://localhost:3002',
    generatedAt: '2026-05-23T00:00:00.000Z',
    jsonFile: 'jakiro.json'
  });

  assert.match(html, /液态火/);
  assert.match(html, /75 \/ 125 \/ 175 \/ 225/);
  assert.match(html, /durationByAbilityLevel/);
  assert.match(html, /tickIntervalByAbilityLevel/);
  assert.match(html, /模型审核上下文/);
  assert.match(html, /原始未引用数值字段/);
  assert.match(html, /attack_slow/);
  assert.match(html, /sustained_dps/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('renderIndexHtml links each hero page and reports errors', () => {
  const html = renderIndexHtml([
    {
      hero: 'Jakiro',
      displayName: '杰奇洛（Jakiro）',
      htmlFile: 'jakiro.html',
      jsonFile: 'jakiro.json',
      abilityCount: 6,
      componentCount: 6
    },
    {
      hero: 'Broken Hero',
      htmlFile: 'broken-hero.html',
      jsonFile: 'broken-hero.error.json',
      error: 'Failed'
    }
  ], {
    baseUrl: 'http://localhost:3002',
    generatedAt: '2026-05-23T00:00:00.000Z',
    outDir: 'audit-runs/example'
  });

  assert.match(html, /jakiro\.html/);
  assert.match(html, /broken-hero\.html/);
  assert.match(html, /broken-hero\.error\.json/);
  assert.match(html, /Failed/);
});

test('renderErrorHtml creates a readable page for failed hero exports', () => {
  const html = renderErrorHtml({
    hero: 'Broken <Hero>',
    htmlFile: 'broken-hero.html',
    jsonFile: 'broken-hero.error.json',
    error: 'Unknown hero'
  }, {
    baseUrl: 'http://localhost:3002',
    generatedAt: '2026-05-23T00:00:00.000Z'
  });

  assert.match(html, /Unknown hero/);
  assert.match(html, /broken-hero\.error\.json/);
  assert.match(html, /Broken &lt;Hero&gt;/);
});

test('selectHeroNames supports full exports and requested hero filters', () => {
  const heroes = [
    { localized_name: 'Jakiro', display_name: '杰奇洛（Jakiro）' },
    { localized_name: 'Slardar', display_name: '斯拉达（Slardar）' }
  ];

  assert.deepEqual(selectHeroNames(heroes), ['Jakiro', 'Slardar']);
  assert.deepEqual(selectHeroNames(heroes, ['杰奇洛（Jakiro）', 'Unknown']), ['Jakiro', 'Unknown']);
});

test('parseArgs reads common CLI options', () => {
  const options = parseArgs([
    '--base-url', 'http://localhost:3999/',
    '--out', 'audit-runs/manual',
    '--heroes', 'Jakiro, Slardar',
    '--concurrency', '2'
  ]);

  assert.equal(options.baseUrl, 'http://localhost:3999');
  assert.equal(options.outDir, 'audit-runs/manual');
  assert.deepEqual(options.heroes, ['Jakiro', 'Slardar']);
  assert.equal(options.concurrency, 2);
  assert.equal(options.strict, false);
  assert.equal(parseArgs(['--strict']).strict, true);
});

test('formatValue and escapeHtml are safe for compact table cells', () => {
  assert.equal(formatValue([1, 2, 3]), '1 / 2 / 3');
  assert.equal(escapeHtml('<b>x</b>'), '&lt;b&gt;x&lt;/b&gt;');
});
