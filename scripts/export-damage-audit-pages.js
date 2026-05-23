#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { getHeroDamageModel } = require('../damageModels/registry');
const { buildSemanticAudit } = require('./semantic-audit');

const DEFAULT_BASE_URL = 'http://localhost:3002';
const DEFAULT_CONCURRENCY = 8;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugifyHeroName(heroName) {
  return String(heroName || 'unknown')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'unknown';
}

function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.map(formatValue).join(' / ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatMetadata(metadata = {}) {
  const entries = Object.entries(metadata || {});
  if (!entries.length) return '<span class="muted">-</span>';
  return entries
    .map(([key, value]) => `<div><code>${escapeHtml(key)}</code>: ${escapeHtml(formatValue(value))}</div>`)
    .join('');
}

function renderArrayCells(values = [], maxColumns = 4) {
  const safeValues = Array.isArray(values) ? values : [];
  return Array.from({ length: maxColumns }, (_, index) => (
    `<td>${escapeHtml(safeValues[index] ?? '-')}</td>`
  )).join('');
}

function maxLevelCount(profile) {
  return Math.max(
    1,
    ...(profile.abilities || []).flatMap((ability) =>
      (ability.components || []).map((component) => component.valuesByAbilityLevel?.length || 0)
    )
  );
}

function renderStats(stats = {}) {
  const rows = [
    ['主属性', stats.primaryAttribute],
    ['基础力量', stats.baseStrength],
    ['力量成长', stats.strengthGain],
    ['基础敏捷', stats.baseAgility],
    ['敏捷成长', stats.agilityGain],
    ['基础智力', stats.baseIntelligence],
    ['智力成长', stats.intelligenceGain],
    ['基础攻击', `${stats.baseAttackMin ?? '-'} - ${stats.baseAttackMax ?? '-'}`],
    ['基础护甲', stats.baseArmor],
    ['攻击距离', stats.attackRange],
    ['移动速度', stats.moveSpeed]
  ];

  return `
    <section class="panel">
      <h2>英雄属性</h2>
      <div class="stat-grid">
        ${rows.map(([label, value]) => `
          <div class="stat">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value ?? '-')}</strong>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderRawFieldRows(fields = []) {
  if (!fields.length) {
    return '<tr><td colspan="4"><span class="muted">无</span></td></tr>';
  }
  return fields.map((field) => `
    <tr>
      <td>${escapeHtml(field.ability || '-')}</td>
      <td><code>${escapeHtml(field.key || '-')}</code></td>
      <td>${escapeHtml(field.label || '-')}</td>
      <td>${escapeHtml(formatValue(field.value))}</td>
    </tr>
  `).join('');
}

function renderModelAudit(modelAudit = null) {
  if (!modelAudit) return '';
  const rawFields = modelAudit.rawNumericFieldsNotReferenced || [];
  const suspicious = modelAudit.suspiciousMappings || [];
  return `
    <section class="panel">
      <header class="ability-header">
        <div>
          <h2>模型审核上下文</h2>
          <div class="muted">用于人工复核模型字段是否误读、漏读或错误纳入伤害。</div>
        </div>
        <div class="tags">
          <span class="pill">${escapeHtml(modelAudit.source || '-')}</span>
          <span class="pill secondary">${escapeHtml(modelAudit.reviewStatus || 'candidate')}</span>
        </div>
      </header>
      <div class="audit-grid">
        <div>
          <h3>原始未引用数值字段</h3>
          <div class="table-wrap">
            <table class="mini-table">
              <thead>
                <tr><th>技能</th><th>字段</th><th>标签</th><th>值</th></tr>
              </thead>
              <tbody>${renderRawFieldRows(rawFields)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h3>可疑映射</h3>
          <pre>${escapeHtml(JSON.stringify(suspicious, null, 2))}</pre>
        </div>
      </div>
      <details>
        <summary>当前模型定义 JSON</summary>
        <pre>${escapeHtml(JSON.stringify(modelAudit.manualModel || modelAudit.model || {}, null, 2))}</pre>
      </details>
    </section>
  `;
}

function renderComponentRows(ability, maxColumns) {
  return (ability.components || []).map((component) => {
    const caveats = (component.caveats || []).length
      ? `<ul>${component.caveats.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '<span class="muted">-</span>';
    return `
      <tr>
        <td>
          <code>${escapeHtml(component.id || `${ability.name}:${component.kind}`)}</code>
          <div class="muted">${escapeHtml(component.label || '')}</div>
        </td>
        <td>
          <span class="pill">${escapeHtml(component.kind || '-')}</span>
          <span class="pill secondary">${escapeHtml(component.model || '-')}</span>
          <div class="muted">${escapeHtml(component.status || ability.status || '-')}</div>
        </td>
        <td>${escapeHtml(component.damageType || '-')}</td>
        ${renderArrayCells(component.valuesByAbilityLevel, maxColumns)}
        <td>${escapeHtml(formatValue(component.theoreticalTotalByAbilityLevel))}</td>
        <td>${formatMetadata(component.metadata)}</td>
        <td>${escapeHtml(component.totalFormula || component.formula?.type || '-')}</td>
        <td>${caveats}</td>
      </tr>
    `;
  }).join('');
}

function renderAbilitySection(ability, maxColumns) {
  const componentRows = renderComponentRows(ability, maxColumns);
  return `
    <section class="panel ability">
      <header class="ability-header">
        <div>
          <h2>${escapeHtml(ability.displayName || ability.name)}</h2>
          <div class="muted">${escapeHtml(ability.name)} · ${ability.isUltimate ? '终极技能' : '普通技能'}</div>
        </div>
        <div class="tags">
          <span class="pill">${escapeHtml(ability.modelSource || '-')}</span>
          <span class="pill secondary">${escapeHtml(ability.model || '-')}</span>
          <span class="pill secondary">${escapeHtml(ability.status || '-')}</span>
        </div>
      </header>
      <div class="resource-line">
        <span>蓝耗：${escapeHtml(formatValue(ability.manaCostByAbilityLevel))}</span>
        <span>冷却：${escapeHtml(formatValue(ability.cooldownByAbilityLevel))}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>组件</th>
              <th>模型</th>
              <th>伤害类型</th>
              ${Array.from({ length: maxColumns }, (_, index) => `<th>等级 ${index + 1}</th>`).join('')}
              <th>理论总量</th>
              <th>元数据</th>
              <th>公式</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>${componentRows || '<tr><td colspan="9">无可审核组件</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderHeroHtml(profile, options = {}) {
  const maxColumns = Math.min(6, Math.max(4, maxLevelCount(profile)));
  const generatedAt = options.generatedAt || new Date().toISOString();
  const jsonFile = options.jsonFile || `${slugifyHeroName(profile.hero)}.json`;
  const abilityCount = profile.abilities?.length || 0;
  const componentCount = (profile.abilities || []).reduce((sum, ability) => sum + (ability.components || []).length, 0);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(profile.displayName || profile.hero)} 伤害模型审核</title>
  <style>
    :root { color-scheme: light; --bg: #f5f7f9; --text: #16202a; --muted: #64748b; --line: #d9e1e8; --panel: #ffffff; --accent: #0f766e; --accent-soft: #dff5f1; --warn: #92400e; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .page { max-width: 1440px; margin: 0 auto; padding: 28px; }
    .topbar { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
    h1, h2 { margin: 0; line-height: 1.2; }
    h3 { margin: 12px 0 8px; font-size: 14px; }
    h1 { font-size: 28px; }
    h2 { font-size: 18px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .muted { color: var(--muted); font-size: 12px; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin: 14px 0; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
    .summary { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
    .summary span, .pill { display: inline-flex; align-items: center; min-height: 24px; padding: 2px 8px; border-radius: 999px; background: var(--accent-soft); color: #115e59; font-size: 12px; font-weight: 600; }
    .pill.secondary { background: #edf2f7; color: #475569; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 12px; }
    .stat { border: 1px solid var(--line); border-radius: 6px; padding: 10px; background: #fbfdff; }
    .stat span { display: block; color: var(--muted); font-size: 12px; }
    .stat strong { display: block; margin-top: 4px; font-size: 16px; }
    .ability-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
    .resource-line { display: flex; flex-wrap: wrap; gap: 16px; margin: 12px 0; color: var(--muted); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 6px; }
    table { width: 100%; min-width: 1180px; border-collapse: collapse; background: #fff; }
    .mini-table { min-width: 620px; }
    .audit-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.6fr); gap: 14px; }
    th, td { border-bottom: 1px solid var(--line); padding: 9px 10px; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #eef3f7; font-size: 12px; color: #334155; white-space: nowrap; }
    td code { font-size: 12px; color: #334155; }
    ul { margin: 0; padding-left: 18px; color: var(--warn); }
    details { margin-top: 16px; }
    pre { overflow: auto; padding: 12px; border-radius: 6px; background: #101827; color: #dbeafe; font-size: 12px; }
    @media (max-width: 900px) { .audit-grid { grid-template-columns: 1fr; } }
    @media (max-width: 720px) { .page { padding: 16px; } .topbar, .ability-header { display: block; } .tags { justify-content: flex-start; margin-top: 10px; } }
  </style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <div>
        <a href="./index.html">返回索引</a>
        <h1>${escapeHtml(profile.displayName || profile.hero)}</h1>
        <div class="muted">${escapeHtml(profile.hero)} · 生成时间 ${escapeHtml(generatedAt)}</div>
        <div class="summary">
          <span>技能 ${abilityCount}</span>
          <span>组件 ${componentCount}</span>
          <span>源 ${escapeHtml(options.baseUrl || '-')}</span>
        </div>
      </div>
      <a href="./${escapeHtml(jsonFile)}">查看原始 JSON</a>
    </div>
    ${renderModelAudit(profile.modelAudit)}
    ${renderStats(profile.stats)}
    ${(profile.abilities || []).map((ability) => renderAbilitySection(ability, maxColumns)).join('')}
    <details class="panel">
      <summary>页面内嵌原始 JSON</summary>
      <pre>${escapeHtml(JSON.stringify(profile, null, 2))}</pre>
    </details>
  </main>
</body>
</html>`;
}

async function buildModelAuditContext(heroName) {
  const model = getHeroDamageModel(heroName);
  const semanticReport = await buildSemanticAudit({ hero: heroName });
  const heroReport = semanticReport.heroReports.find((entry) => entry.hero === heroName) || {};
  return {
    source: model?.source || 'missing',
    reviewStatus: model?.review?.status || (model?.source === 'auto' ? 'candidate' : 'candidate'),
    manualModel: model || null,
    rawNumericFieldsNotReferenced: heroReport.rawNumericFieldsNotReferenced || [],
    suspiciousMappings: heroReport.suspiciousMappings || [],
    modelEntriesMissingSemanticType: heroReport.modelEntriesMissingSemanticType || [],
    unmodeledVisibleAbilities: heroReport.unmodeledVisibleAbilities || []
  };
}

function renderErrorHtml(entry, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(entry.hero)} 伤害模型错误</title>
  <style>
    body { margin: 0; background: #f5f7f9; color: #16202a; font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 860px; margin: 0 auto; padding: 28px; }
    .panel { background: #fff; border: 1px solid #d9e1e8; border-radius: 8px; padding: 18px; }
    a { color: #0f766e; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1 { margin: 10px 0 8px; font-size: 26px; }
    .muted { color: #64748b; font-size: 12px; }
    pre { overflow: auto; padding: 12px; border-radius: 6px; background: #101827; color: #fee2e2; }
  </style>
</head>
<body>
  <main>
    <a href="./index.html">返回索引</a>
    <section class="panel">
      <h1>${escapeHtml(entry.hero)}</h1>
      <div class="muted">生成时间 ${escapeHtml(generatedAt)} · API ${escapeHtml(options.baseUrl || '-')}</div>
      <p>这个英雄未能从 <code>/api/damage/heroes/:hero</code> 获取伤害模型数据。</p>
      <pre>${escapeHtml(JSON.stringify({ hero: entry.hero, error: entry.error }, null, 2))}</pre>
      ${entry.jsonFile ? `<p><a href="./${escapeHtml(entry.jsonFile)}">查看错误 JSON</a></p>` : ''}
    </section>
  </main>
</body>
</html>`;
}

function renderIndexHtml(results, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const successful = results.filter((entry) => !entry.error);
  const failed = results.filter((entry) => entry.error);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dota 2 伤害模型审核索引</title>
  <style>
    body { margin: 0; background: #f5f7f9; color: #16202a; font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 28px; }
    h1 { margin: 0; font-size: 28px; }
    a { color: #0f766e; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .muted { color: #64748b; font-size: 12px; }
    .summary { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0 20px; }
    .summary span { display: inline-flex; min-height: 24px; align-items: center; padding: 2px 8px; border-radius: 999px; background: #dff5f1; color: #115e59; font-weight: 600; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d9e1e8; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #d9e1e8; text-align: left; }
    th { background: #eef3f7; font-size: 12px; color: #334155; }
    .error { color: #b91c1c; }
  </style>
</head>
<body>
  <main>
    <h1>Dota 2 伤害模型审核索引</h1>
    <div class="muted">生成时间 ${escapeHtml(generatedAt)} · API ${escapeHtml(options.baseUrl || '-')}</div>
    <div class="summary">
      <span>成功 ${successful.length}</span>
      <span>失败 ${failed.length}</span>
      <span>输出目录 ${escapeHtml(options.outDir || '-')}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>英雄</th>
          <th>HTML</th>
          <th>JSON</th>
          <th>技能数</th>
          <th>组件数</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((entry) => `
          <tr>
            <td>${escapeHtml(entry.displayName || entry.hero)}</td>
            <td>${entry.htmlFile ? `<a href="./${escapeHtml(entry.htmlFile)}">${escapeHtml(entry.htmlFile)}</a>` : '-'}</td>
            <td>${entry.jsonFile ? `<a href="./${escapeHtml(entry.jsonFile)}">${escapeHtml(entry.jsonFile)}</a>` : '-'}</td>
            <td>${escapeHtml(entry.abilityCount ?? '-')}</td>
            <td>${escapeHtml(entry.componentCount ?? '-')}</td>
            <td class="${entry.error ? 'error' : ''}">${escapeHtml(entry.error || 'OK')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.DAMAGE_AUDIT_BASE_URL || DEFAULT_BASE_URL,
    outDir: '',
    heroes: [],
    concurrency: DEFAULT_CONCURRENCY,
    strict: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--base-url') {
      options.baseUrl = next;
      index += 1;
    } else if (arg === '--out') {
      options.outDir = next;
      index += 1;
    } else if (arg === '--heroes') {
      options.heroes = String(next || '').split(',').map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (arg === '--concurrency') {
      options.concurrency = Math.max(1, Number(next) || DEFAULT_CONCURRENCY);
      index += 1;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.outDir) {
    options.outDir = path.join(process.cwd(), 'audit-runs', `damage-heroes-${timestampForPath()}`);
  }
  options.baseUrl = normalizeBaseUrl(options.baseUrl);
  return options;
}

function printHelp() {
  process.stdout.write(`Usage:
  npm run damage:audit-pages
  npm run damage:audit-pages -- --out audit-runs/damage-heroes-latest
  npm run damage:audit-pages -- --heroes Jakiro,Slardar --base-url http://localhost:3002

Options:
  --base-url <url>      API base URL. Default: ${DEFAULT_BASE_URL}
  --out <dir>           Output directory. Default: audit-runs/damage-heroes-<timestamp>
  --heroes <names>      Comma-separated hero names. Default: all heroes from /api/heroes
  --concurrency <n>     Parallel fetch count. Default: ${DEFAULT_CONCURRENCY}
  --strict              Exit with code 1 when any hero export fails.
`);
}

async function fetchJson(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${route}: ${text.slice(0, 120)}`);
  }
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status} from ${route}`);
  }
  return data;
}

function heroNameFromListEntry(entry) {
  return entry.localized_name || entry.name || entry.hero || entry.display_name;
}

function selectHeroNames(heroList, requestedHeroes = []) {
  const allNames = heroList.map(heroNameFromListEntry).filter(Boolean);
  if (!requestedHeroes.length) return allNames;

  const lookup = new Map();
  for (const entry of heroList) {
    for (const value of [entry.localized_name, entry.name, entry.hero, entry.display_name]) {
      if (value) lookup.set(String(value).toLowerCase(), heroNameFromListEntry(entry));
    }
  }
  return requestedHeroes.map((name) => lookup.get(name.toLowerCase()) || name);
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

async function exportHero(baseUrl, outDir, heroName, generatedAt) {
  const slug = slugifyHeroName(heroName);
  const jsonFile = `${slug}.json`;
  const htmlFile = `${slug}.html`;
  try {
    const profile = await fetchJson(baseUrl, `/api/damage/heroes/${encodeURIComponent(heroName)}`);
    const auditProfile = {
      ...profile,
      modelAudit: await buildModelAuditContext(profile.hero || heroName)
    };
    await fs.writeFile(path.join(outDir, jsonFile), `${JSON.stringify(auditProfile, null, 2)}\n`);
    await fs.writeFile(path.join(outDir, htmlFile), renderHeroHtml(auditProfile, {
      baseUrl,
      generatedAt,
      jsonFile
    }));
    return {
      hero: profile.hero || heroName,
      displayName: profile.displayName || heroName,
      jsonFile,
      htmlFile,
      abilityCount: profile.abilities?.length || 0,
      componentCount: (profile.abilities || []).reduce((sum, ability) => sum + (ability.components || []).length, 0)
    };
  } catch (error) {
    const errorFile = `${slug}.error.json`;
    const htmlFile = `${slug}.html`;
    const entry = {
      hero: heroName,
      displayName: heroName,
      jsonFile: errorFile,
      htmlFile,
      abilityCount: 0,
      componentCount: 0,
      error: error.message
    };
    await fs.writeFile(path.join(outDir, errorFile), `${JSON.stringify({
      hero: heroName,
      error: error.message
    }, null, 2)}\n`);
    await fs.writeFile(path.join(outDir, htmlFile), renderErrorHtml(entry, { baseUrl, generatedAt }));
    return entry;
  }
}

async function run(options) {
  const generatedAt = new Date().toISOString();
  await fs.mkdir(options.outDir, { recursive: true });

  const heroList = await fetchJson(options.baseUrl, '/api/heroes');
  const heroNames = selectHeroNames(heroList, options.heroes);
  const results = await mapLimit(heroNames, options.concurrency, (heroName) =>
    exportHero(options.baseUrl, options.outDir, heroName, generatedAt)
  );

  const manifest = {
    generatedAt,
    baseUrl: options.baseUrl,
    outDir: options.outDir,
    heroCount: results.length,
    successCount: results.filter((entry) => !entry.error).length,
    errorCount: results.filter((entry) => entry.error).length,
    results
  };
  await fs.writeFile(path.join(options.outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(options.outDir, 'index.html'), renderIndexHtml(results, {
    baseUrl: options.baseUrl,
    generatedAt,
    outDir: options.outDir
  }));
  return manifest;
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const manifest = await run(options);
    process.stdout.write(`Damage audit pages written to ${manifest.outDir}\n`);
    process.stdout.write(`Success: ${manifest.successCount}/${manifest.heroCount}; Errors: ${manifest.errorCount}\n`);
    process.stdout.write(`Open: ${path.join(manifest.outDir, 'index.html')}\n`);
    if (manifest.errorCount > 0 && options.strict) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  escapeHtml,
  formatValue,
  parseArgs,
  renderErrorHtml,
  renderHeroHtml,
  renderIndexHtml,
  buildModelAuditContext,
  run,
  selectHeroNames,
  slugifyHeroName
};
