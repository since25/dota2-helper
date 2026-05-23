#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { CANONICAL_HERO_NAMES, normalizeHeroName } = require('../heroAliases');
const { getHeroDamageModel } = require('../damageModels/registry');
const { slugifyDotabuffHeroName } = require('./fetch-dotabuff-ability-pages');

const DEFAULT_SOURCE_DIR = path.join('data', 'dotabuff', 'ability-pages');
const DEFAULT_PARSED_OUT_DIR = path.join('data', 'dotabuff', 'parsed');
const DEFAULT_REPORT_OUT_DIR = path.join('data', 'dotabuff', 'comparison');
const HOTKEYS = new Set(['Q', 'W', 'E', 'R', 'D', 'F']);
const SECTION_END_MARKERS = new Set(['英雄天赋', '英雄属性', '中文 (Chinese) ▴']);
const KNOWN_FIELD_LABELS = new Set([
  '技能',
  '影响',
  '伤害类型',
  '无视减益免疫',
  '能否驱散'
]);

function parseArgs(argv) {
  const options = {
    all: true,
    hero: '',
    sourceDir: DEFAULT_SOURCE_DIR,
    parsedOutDir: DEFAULT_PARSED_OUT_DIR,
    reportOutDir: DEFAULT_REPORT_OUT_DIR,
    compare: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--all') {
      options.all = true;
      options.hero = '';
    } else if (arg === '--hero') {
      options.hero = normalizeHeroName(next) || next;
      options.all = false;
      index += 1;
    } else if (arg === '--source') {
      options.sourceDir = next;
      index += 1;
    } else if (arg === '--parsed-out') {
      options.parsedOutDir = next;
      index += 1;
    } else if (arg === '--report-out') {
      options.reportOutDir = next;
      index += 1;
    } else if (arg === '--compare') {
      options.compare = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizeLines(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function findAbilityStartIndex(lines, hero) {
  const rankingIndex = lines.findIndex((line) => line === '玩家排行榜');
  if (rankingIndex >= 0) return rankingIndex + 1;
  const heroIndex = lines.findIndex((line, index) => line === hero && lines[index + 1] === '技能');
  return heroIndex >= 0 ? heroIndex + 2 : 0;
}

function looksLikeAbilityStart(lines, index) {
  const current = lines[index];
  const next = lines[index + 1];
  if (!current || SECTION_END_MARKERS.has(current)) return false;
  if (next === '先天技能') return true;
  return HOTKEYS.has(next);
}

function parseField(line) {
  const match = line.match(/^([^：:]{1,32})[：:]\s*(.+)$/);
  if (!match) return null;
  return {
    label: match[1].trim(),
    value: match[2].trim().replace(/\s+%/g, '%')
  };
}

function looksLikeResourceLine(line) {
  return /^[+-]?\d+(?:\.\d+)?(?:\s*%?)?(?:\s*\/\s*[+-]?\d+(?:\.\d+)?(?:\s*%?)?)+$/.test(line)
    || /^[+-]?\d+(?:\.\d+)?$/.test(line);
}

function isFlavorLine(line) {
  return /。$/.test(line) && line.length <= 90 && !/[：:]/.test(line);
}

function finalizeAbility(ability, index) {
  const fieldsByLabel = Object.fromEntries(ability.fields.map((field) => [field.label, field.value]));
  const descriptions = ability.descriptionLines.filter((line) => !looksLikeResourceLine(line));
  return {
    index,
    name: ability.name,
    hotkey: ability.hotkey,
    isInnate: ability.isInnate,
    abilityType: fieldsByLabel['技能'] || '',
    affects: fieldsByLabel['影响'] || '',
    damageType: fieldsByLabel['伤害类型'] || '',
    piercesDebuffImmunity: fieldsByLabel['无视减益免疫'] || '',
    dispellable: fieldsByLabel['能否驱散'] || '',
    description: descriptions.join('\n'),
    fields: ability.fields.filter((field) => !KNOWN_FIELD_LABELS.has(field.label)),
    allFields: ability.fields,
    resourceLines: ability.descriptionLines.filter(looksLikeResourceLine),
    flavorText: descriptions.filter(isFlavorLine).slice(-1)[0] || ''
  };
}

function parseAbilitySections({ hero, text, textPath = '' }) {
  const lines = normalizeLines(text);
  const abilities = [];
  const startIndex = findAbilityStartIndex(lines, hero);
  let current = null;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (SECTION_END_MARKERS.has(line)) break;
    if (looksLikeAbilityStart(lines, index)) {
      if (current) abilities.push(finalizeAbility(current, abilities.length));
      const marker = lines[index + 1];
      current = {
        name: line,
        hotkey: HOTKEYS.has(marker) ? marker : '',
        isInnate: marker === '先天技能',
        fields: [],
        descriptionLines: []
      };
      index += 1;
      continue;
    }
    if (!current) continue;
    const field = parseField(line);
    if (field) current.fields.push(field);
    else current.descriptionLines.push(line);
  }

  if (current) abilities.push(finalizeAbility(current, abilities.length));

  return {
    hero,
    source: 'dotabuff',
    locale: 'zh',
    textPath,
    parsedAt: new Date().toISOString(),
    textHash: contentHash(text),
    abilityCount: abilities.length,
    abilities
  };
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, '').trim());
}

function parseAbilityNamePairsFromHtml(html) {
  const pairs = [];
  const pattern = /<img[^>]+alt="([^"]+)"[^>]*>[\s\S]{0,900}?<h1[^>]*class="[^"]*x-tooltip-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const englishName = decodeHtmlEntities(match[1]).trim();
    const zhName = stripHtml(match[2]);
    if (!englishName || !zhName) continue;
    if (/力量|敏捷|智力/.test(englishName)) continue;
    pairs.push({ zhName, englishName });
  }
  return pairs;
}

function applyEnglishAbilityNames(parsed, html) {
  const namePairs = parseAbilityNamePairsFromHtml(html);
  const englishByChinese = new Map(namePairs.map((pair) => [pair.zhName, pair.englishName]));
  return {
    ...parsed,
    abilityNamePairs: namePairs,
    abilities: parsed.abilities.map((ability) => ({
      ...ability,
      englishName: englishByChinese.get(ability.name) || ''
    }))
  };
}

async function parseDotabuffAbilityText({ hero, textPath }) {
  const text = await fs.readFile(textPath, 'utf8');
  return parseAbilitySections({ hero, text, textPath });
}

async function parseDotabuffAbilityPage({ hero, textPath, htmlPath = '' }) {
  const parsed = await parseDotabuffAbilityText({ hero, textPath });
  if (!htmlPath) return parsed;
  const html = await fs.readFile(htmlPath, 'utf8');
  return applyEnglishAbilityNames(parsed, html);
}

function extractModelKeys(entry) {
  const keyNames = [
    'damageKey',
    'damagePerSecondKey',
    'durationKey',
    'tickIntervalKey',
    'damagePerWaveKey',
    'waveCountKey',
    'bonusDamageKey',
    'procDamageKey',
    'valueKey'
  ];
  return keyNames
    .filter((key) => entry?.[key])
    .map((key) => `${key}:${entry[key]}`);
}

function buildHeroComparison({ parsed, model, abilityNameMap = {} }) {
  const modelAbilities = model?.abilities || {};
  const abilities = parsed.abilities.map((ability) => {
    const modelName = abilityNameMap[ability.name] || ability.englishName || ability.name;
    const modelEntry = modelAbilities[modelName] || null;
    return {
      dotabuffName: ability.name,
      hotkey: ability.hotkey,
      isInnate: ability.isInnate,
      modelName,
      modelStatus: modelEntry?.status || 'missing',
      modelType: modelEntry?.model || '',
      modelKeys: extractModelKeys(modelEntry),
      dotabuffDamageType: ability.damageType,
      dotabuffFields: ability.fields,
      resourceLines: ability.resourceLines
    };
  });

  return {
    hero: parsed.hero,
    source: 'dotabuff',
    modelSource: model?.source || '',
    review: model?.review || null,
    abilityCount: abilities.length,
    missingModelCount: abilities.filter((ability) => ability.modelStatus === 'missing').length,
    abilities
  };
}

function selectHeroNames(options) {
  return options.all ? CANONICAL_HERO_NAMES : [options.hero];
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

async function run(options) {
  const heroes = selectHeroNames(options);
  const parsedResults = [];
  const reportResults = [];

  for (const hero of heroes) {
    const slug = slugifyDotabuffHeroName(hero);
    const textPath = path.join(options.sourceDir, `${slug}.text.txt`);
    const htmlPath = path.join(options.sourceDir, `${slug}.html`);
    const parsed = await parseDotabuffAbilityPage({ hero, textPath, htmlPath });
    const parsedFile = path.join(options.parsedOutDir, `${slug}.json`);
    await writeJson(parsedFile, parsed);
    parsedResults.push({ hero, file: parsedFile, abilityCount: parsed.abilityCount });

    if (options.compare) {
      const comparison = buildHeroComparison({
        parsed,
        model: getHeroDamageModel(hero)
      });
      const reportFile = path.join(options.reportOutDir, `${slug}.json`);
      await writeJson(reportFile, comparison);
      reportResults.push({
        hero,
        file: reportFile,
        abilityCount: comparison.abilityCount,
        missingModelCount: comparison.missingModelCount
      });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: options.sourceDir,
    parsedOutDir: options.parsedOutDir,
    reportOutDir: options.compare ? options.reportOutDir : '',
    heroCount: heroes.length,
    parsedResults,
    reportResults
  };
  await writeJson(path.join(options.parsedOutDir, 'manifest.json'), manifest);
  if (options.compare) {
    await writeJson(path.join(options.reportOutDir, 'manifest.json'), manifest);
  }
  return manifest;
}

function printHelp() {
  process.stdout.write(`Usage:
  npm run dotabuff:parse
  npm run dotabuff:parse -- --hero Abaddon --compare

Options:
  --hero <name>          Parse one hero. Chinese aliases are accepted.
  --all                  Parse all canonical heroes. Default.
  --source <dir>         Source snapshot directory. Default: ${DEFAULT_SOURCE_DIR}
  --parsed-out <dir>     Parsed JSON output directory. Default: ${DEFAULT_PARSED_OUT_DIR}
  --report-out <dir>     Comparison report output directory. Default: ${DEFAULT_REPORT_OUT_DIR}
  --compare              Also compare parsed Dotabuff fields with current damage model.
`);
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const manifest = await run(options);
    process.stdout.write(`Parsed Dotabuff ability pages for ${manifest.heroCount} hero(s) into ${manifest.parsedOutDir}\n`);
    if (options.compare) {
      process.stdout.write(`Comparison reports written to ${manifest.reportOutDir}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildHeroComparison,
  parseArgs,
  parseDotabuffAbilityPage,
  parseDotabuffAbilityText,
  parseAbilityNamePairsFromHtml,
  parseAbilitySections,
  run
};
