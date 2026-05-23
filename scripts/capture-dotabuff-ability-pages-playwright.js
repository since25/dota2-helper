#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright-core');
const {
  buildDotabuffAbilityUrl,
  slugifyDotabuffHeroName
} = require('./fetch-dotabuff-ability-pages');
const { CANONICAL_HERO_NAMES, normalizeHeroName } = require('../heroAliases');

const DEFAULT_OUT_DIR = path.join('data', 'dotabuff', 'ability-pages');
const DEFAULT_BASE_URL = 'https://zh.dotabuff.com';
const DEFAULT_DELAY_MS = 800;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_CHROME_EXECUTABLE =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
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
    timeoutMs: DEFAULT_TIMEOUT_MS,
    continueOnError: false,
    headed: true,
    executablePath: DEFAULT_CHROME_EXECUTABLE,
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
    } else if (arg === '--timeout-ms') {
      options.timeoutMs = parsePositiveInteger(next, DEFAULT_TIMEOUT_MS);
      index += 1;
    } else if (arg === '--continue-on-error') {
      options.continueOnError = true;
    } else if (arg === '--headless') {
      options.headed = false;
    } else if (arg === '--headed') {
      options.headed = true;
    } else if (arg === '--executable-path') {
      options.executablePath = next;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
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

async function resolveExecutablePath(executablePath) {
  if (executablePath && await pathExists(executablePath)) return executablePath;
  return '';
}

function selectHeroNames(options) {
  return options.all ? CANONICAL_HERO_NAMES : [options.hero];
}

function detectBlockedPage(text) {
  return /cloudflare|just a moment|checking your browser|请稍候|验证您是真人/i.test(text);
}

function hasAbilityContent(hero, text) {
  return text.includes(hero) && text.includes('技能');
}

async function captureHeroPage(page, hero, options, capturedAt = new Date().toISOString()) {
  const slug = slugifyDotabuffHeroName(hero);
  const htmlFile = `${slug}.html`;
  const textFile = `${slug}.text.txt`;
  const metaFile = `${slug}.meta.json`;
  const htmlPath = path.join(options.outDir, htmlFile);
  const textPath = path.join(options.outDir, textFile);
  const metaPath = path.join(options.outDir, metaFile);
  const url = buildDotabuffAbilityUrl(hero, options.baseUrl);

  if (!options.force && await pathExists(htmlPath) && await pathExists(metaPath)) {
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    return {
      hero,
      status: meta.status,
      cached: true,
      htmlFile,
      textFile: await pathExists(textPath) ? textFile : '',
      metaFile,
      error: meta.error || ''
    };
  }

  let status = 0;
  let finalUrl = url;
  let title = '';
  let html = '';
  let text = '';
  let error = '';

  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeoutMs
    });
    status = response ? response.status() : 0;
    await page.waitForLoadState('load', { timeout: options.timeoutMs }).catch(() => {});
    await page.waitForTimeout(250);

    title = await page.title();
    finalUrl = page.url();
    html = await page.content();
    text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');

    if (detectBlockedPage(text)) {
      error = 'Blocked or challenge page detected';
    } else if (!hasAbilityContent(hero, text)) {
      error = 'Ability content not detected';
    } else if (status < 200 || status >= 400) {
      error = `HTTP ${status}`;
    } else {
      await fs.writeFile(htmlPath, html);
      await fs.writeFile(textPath, text);
    }
  } catch (captureError) {
    error = captureError.message;
  }

  const meta = {
    hero,
    dotabuffSlug: slug,
    url,
    finalUrl,
    title,
    capturedAt,
    status,
    source: 'dotabuff',
    captureMethod: 'playwright',
    locale: 'zh',
    cached: false,
    contentHash: html && !error ? contentHash(html) : '',
    textHash: text && !error ? contentHash(text) : '',
    htmlLength: html.length,
    textLength: text.length,
    error
  };
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

  return {
    hero,
    status,
    cached: false,
    htmlFile: error ? '' : htmlFile,
    textFile: error ? '' : textFile,
    metaFile,
    error
  };
}

function buildManifest({ generatedAt, outDir, results }) {
  return {
    generatedAt,
    outDir,
    captureMethod: 'playwright',
    heroCount: results.length,
    successCount: results.filter((entry) => !entry.error && entry.status >= 200 && entry.status < 400).length,
    errorCount: results.filter((entry) => entry.error || entry.status < 200 || entry.status >= 400).length,
    cachedCount: results.filter((entry) => entry.cached).length,
    results
  };
}

async function launchBrowser(options) {
  const executablePath = await resolveExecutablePath(options.executablePath);
  const launchOptions = {
    headless: !options.headed,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  };
  if (executablePath) launchOptions.executablePath = executablePath;
  return chromium.launch(launchOptions);
}

async function run(options) {
  const generatedAt = new Date().toISOString();
  await fs.mkdir(options.outDir, { recursive: true });
  const heroNames = selectHeroNames(options);
  const results = [];
  const browser = await launchBrowser(options);

  try {
    const page = await browser.newPage({
      locale: 'zh-CN',
      viewport: { width: 1365, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    });

    for (let index = 0; index < heroNames.length; index += 1) {
      const hero = heroNames[index];
      const result = await captureHeroPage(page, hero, options, generatedAt);
      results.push(result);
      const marker = result.error ? 'ERR' : result.cached ? 'CACHED' : 'OK';
      process.stdout.write(`[${index + 1}/${heroNames.length}] ${marker} ${hero}${result.error ? ` - ${result.error}` : ''}\n`);
      if (result.error && !options.continueOnError) break;
      if (index < heroNames.length - 1 && !result.cached) await sleep(options.delayMs);
    }
  } finally {
    await browser.close();
  }

  const manifest = buildManifest({ generatedAt, outDir: options.outDir, results });
  await fs.writeFile(path.join(options.outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function printHelp() {
  process.stdout.write(`Usage:
  npm run dotabuff:capture
  npm run dotabuff:capture -- --hero Abaddon --force
  npm run dotabuff:capture -- --all --force --continue-on-error

Options:
  --hero <name>             Capture one hero. Chinese aliases are accepted.
  --all                     Capture all canonical heroes. Default.
  --out <dir>               Output directory. Default: ${DEFAULT_OUT_DIR}
  --base-url <url>          Dotabuff base URL. Default: ${DEFAULT_BASE_URL}
  --force                   Recapture even when local html/meta files exist.
  --delay-ms <n>            Delay between pages. Default: ${DEFAULT_DELAY_MS}
  --timeout-ms <n>          Navigation timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --continue-on-error       Continue after blocked/missing pages.
  --headed                  Use a visible Chrome window. Default.
  --headless                Run without a visible browser window.
  --executable-path <path>  Chrome executable path.
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
    process.stdout.write(`Dotabuff Playwright snapshots written to ${manifest.outDir}\n`);
    process.stdout.write(`Success: ${manifest.successCount}/${manifest.heroCount}; Errors: ${manifest.errorCount}; Cached: ${manifest.cachedCount}\n`);
    if (manifest.errorCount > 0) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildManifest,
  captureHeroPage,
  parseArgs,
  run
};
