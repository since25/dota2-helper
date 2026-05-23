#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { CANONICAL_HERO_NAMES, normalizeHeroName } = require('../heroAliases');

const DEFAULT_BASE_URL = 'https://zh.dotabuff.com';
const DEFAULT_OUT_DIR = path.join('data', 'dotabuff', 'ability-pages');
const DEFAULT_DELAY_MS = 1500;
const USER_AGENT = 'Mozilla/5.0 (compatible; dota2-helper-dotabuff-audit/0.1; local semantic snapshot)';

function slugifyDotabuffHeroName(heroName) {
  return String(heroName || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildDotabuffAbilityUrl(heroName, baseUrl = DEFAULT_BASE_URL) {
  const slug = slugifyDotabuffHeroName(heroName);
  return `${String(baseUrl).replace(/\/+$/, '')}/heroes/${slug}/abilities`;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function parseArgs(argv) {
  const options = {
    all: true,
    hero: '',
    outDir: DEFAULT_OUT_DIR,
    baseUrl: DEFAULT_BASE_URL,
    force: false,
    delayMs: DEFAULT_DELAY_MS,
    continueOnError: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--all') {
      options.all = true;
      options.hero = '';
    } else if (arg === '--hero') {
      const normalized = normalizeHeroName(next) || next;
      options.hero = normalized;
      options.all = false;
      index += 1;
    } else if (arg === '--out') {
      options.outDir = next;
      index += 1;
    } else if (arg === '--base-url') {
      options.baseUrl = next;
      index += 1;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--delay-ms') {
      options.delayMs = parsePositiveInteger(next, DEFAULT_DELAY_MS);
      index += 1;
    } else if (arg === '--continue-on-error') {
      options.continueOnError = true;
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

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms) {
  if (!ms) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function selectHeroNames(options) {
  return options.all ? CANONICAL_HERO_NAMES : [options.hero];
}

function buildMeta({ hero, url, status, html = '', error = '', cached = false, fetchedAt }) {
  return {
    hero,
    dotabuffSlug: slugifyDotabuffHeroName(hero),
    url,
    fetchedAt,
    status,
    contentHash: html ? contentHash(html) : '',
    source: 'dotabuff',
    locale: 'zh',
    cached,
    error
  };
}

async function fetchHeroPage(hero, options, fetchedAt = new Date().toISOString()) {
  const slug = slugifyDotabuffHeroName(hero);
  const htmlFile = `${slug}.html`;
  const metaFile = `${slug}.meta.json`;
  const htmlPath = path.join(options.outDir, htmlFile);
  const metaPath = path.join(options.outDir, metaFile);
  const url = buildDotabuffAbilityUrl(hero, options.baseUrl);

  if (!options.force && await pathExists(htmlPath) && await pathExists(metaPath)) {
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    return {
      hero,
      status: meta.status,
      cached: true,
      htmlFile,
      metaFile,
      error: meta.error || ''
    };
  }

  let status = 0;
  let html = '';
  let error = '';
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml'
      }
    });
    status = response.status;
    html = await response.text();
    if (!response.ok) {
      error = `HTTP ${response.status}`;
    } else {
      await fs.writeFile(htmlPath, html);
    }
  } catch (fetchError) {
    error = fetchError.message;
  }

  const meta = buildMeta({ hero, url, status, html, error, cached: false, fetchedAt });
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  return {
    hero,
    status,
    cached: false,
    htmlFile: error ? '' : htmlFile,
    metaFile,
    error
  };
}

function buildManifest({ generatedAt, outDir, results }) {
  return {
    generatedAt,
    outDir,
    heroCount: results.length,
    successCount: results.filter((entry) => !entry.error && entry.status >= 200 && entry.status < 300).length,
    errorCount: results.filter((entry) => entry.error || entry.status < 200 || entry.status >= 300).length,
    cachedCount: results.filter((entry) => entry.cached).length,
    results
  };
}

async function run(options) {
  const generatedAt = new Date().toISOString();
  await fs.mkdir(options.outDir, { recursive: true });
  const heroNames = selectHeroNames(options);
  const results = [];

  for (let index = 0; index < heroNames.length; index += 1) {
    const hero = heroNames[index];
    const result = await fetchHeroPage(hero, options, generatedAt);
    results.push(result);
    if (result.error && !options.continueOnError) break;
    if (index < heroNames.length - 1 && !result.cached) await sleep(options.delayMs);
  }

  const manifest = buildManifest({ generatedAt, outDir: options.outDir, results });
  await fs.writeFile(path.join(options.outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function printHelp() {
  process.stdout.write(`Usage:
  npm run dotabuff:fetch
  npm run dotabuff:fetch -- --hero Abaddon
  npm run dotabuff:fetch -- --all --continue-on-error

Options:
  --hero <name>             Fetch one hero. Chinese aliases are accepted.
  --all                     Fetch all canonical heroes. Default.
  --out <dir>               Output directory. Default: ${DEFAULT_OUT_DIR}
  --base-url <url>          Dotabuff base URL. Default: ${DEFAULT_BASE_URL}
  --force                   Refetch even when local html/meta files exist.
  --delay-ms <n>            Delay between network requests. Default: ${DEFAULT_DELAY_MS}
  --continue-on-error       Continue after HTTP/network errors.
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
    process.stdout.write(`Dotabuff ability pages written to ${manifest.outDir}\n`);
    process.stdout.write(`Success: ${manifest.successCount}/${manifest.heroCount}; Errors: ${manifest.errorCount}; Cached: ${manifest.cachedCount}\n`);
    if (manifest.errorCount > 0) {
      process.stdout.write('Some pages failed. This usually means Dotabuff returned Cloudflare challenge, 403, or 429. No bypass is attempted.\n');
      process.exitCode = 1;
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
  buildDotabuffAbilityUrl,
  buildManifest,
  buildMeta,
  fetchHeroPage,
  parseArgs,
  run,
  slugifyDotabuffHeroName
};
