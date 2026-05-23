const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  buildHeroComparison,
  parseDotabuffAbilityPage,
  parseDotabuffAbilityText,
  parseArgs
} = require('../scripts/parse-dotabuff-ability-pages');

const FIXTURE_DIR = path.join(__dirname, '..', 'data', 'dotabuff', 'ability-pages');

test('parseDotabuffAbilityText extracts Abaddon semantic fields', async () => {
  const parsed = await parseDotabuffAbilityText({
    hero: 'Abaddon',
    textPath: path.join(FIXTURE_DIR, 'abaddon.text.txt')
  });

  const mistCoil = parsed.abilities.find((ability) => ability.name === '迷雾缠绕');

  assert.equal(parsed.hero, 'Abaddon');
  assert.equal(mistCoil.hotkey, 'Q');
  assert.equal(mistCoil.damageType, '魔法');
  assert.equal(mistCoil.fields.find((field) => field.label === '伤害/治疗')?.value, '95 / 170 / 245 / 320');
  assert.equal(mistCoil.fields.find((field) => field.label === '对自身伤害')?.value, '40%');
  assert.match(mistCoil.description, /对敌方单位造成伤害/);
});

test('parseDotabuffAbilityText extracts Sand King sustained and wave fields', async () => {
  const parsed = await parseDotabuffAbilityText({
    hero: 'Sand King',
    textPath: path.join(FIXTURE_DIR, 'sand-king.text.txt')
  });

  const sandStorm = parsed.abilities.find((ability) => ability.name === '沙尘暴');
  const epicenter = parsed.abilities.find((ability) => ability.name === '地震');

  assert.equal(sandStorm.fields.find((field) => field.label === '每秒伤害')?.value, '30 / 50 / 70 / 90');
  assert.equal(sandStorm.fields.find((field) => field.label === '持续时间')?.value, '16 / 20 / 24 / 28');
  assert.equal(epicenter.fields.find((field) => field.label === '震击次数')?.value, '12 / 16 / 20');
  assert.equal(epicenter.fields.find((field) => field.label === '每波伤害')?.value, '60 / 70 / 80');
});

test('buildHeroComparison maps Dotabuff abilities to current model entries', async () => {
  const parsed = await parseDotabuffAbilityPage({
    hero: 'Sand King',
    textPath: path.join(FIXTURE_DIR, 'sand-king.text.txt'),
    htmlPath: path.join(FIXTURE_DIR, 'sand-king.html')
  });
  const comparison = buildHeroComparison({
    parsed,
    model: {
      hero: 'Sand King',
      abilities: {
        'Sand Storm': { status: 'implemented', model: 'sustained_dps', damagePerSecondKey: 'sand_storm_damage' },
        Epicenter: { status: 'implemented', model: 'multi_wave', damagePerWaveKey: 'epicenter_damage' }
      }
    }
  });

  const sandStorm = comparison.abilities.find((ability) => ability.dotabuffName === '沙尘暴');
  const burrowstrike = comparison.abilities.find((ability) => ability.dotabuffName === '掘地穿刺');

  assert.equal(sandStorm.modelName, 'Sand Storm');
  assert.equal(sandStorm.modelStatus, 'implemented');
  assert.deepEqual(sandStorm.modelKeys, ['damagePerSecondKey:sand_storm_damage']);
  assert.equal(burrowstrike.modelStatus, 'missing');
});

test('parseArgs supports parser and comparison output directories', () => {
  const options = parseArgs([
    '--hero', '沙王',
    '--source', 'tmp/pages',
    '--parsed-out', 'tmp/parsed',
    '--report-out', 'tmp/reports',
    '--compare'
  ]);

  assert.equal(options.hero, 'Sand King');
  assert.equal(options.sourceDir, 'tmp/pages');
  assert.equal(options.parsedOutDir, 'tmp/parsed');
  assert.equal(options.reportOutDir, 'tmp/reports');
  assert.equal(options.compare, true);
  assert.equal(options.all, false);
});
