const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_OUTPUT_DIR = path.join('audit-runs', 'item-scope-latest');
const SHOP_QUALITIES = new Set([
  'component',
  'secret_shop',
  'consumable',
  'consumable;laning',
  'common',
  'rare',
  'epic',
  'artifact'
]);

const REVIEW_KEY_PATTERNS = [
  /roshan/i,
  /^courier$/,
  /^flying_courier$/,
  /cheese/i,
  /^pocket_roshan$/,
  /^specialists_array$/,
  /^hydras_breath$/,
  /^chasm_stone$/,
  /^stout_shield$/,
  /^necronomicon/,
  /^tome_of_knowledge$/,
  /^refresher_shard$/
];

function isRecipe(key, item) {
  return key.startsWith('recipe_') || /recipe/i.test(item?.dname || '');
}

function hasPositiveCost(item) {
  return Number.isFinite(Number(item?.cost)) && Number(item.cost) > 0;
}

function isNamed(item) {
  return Boolean(item?.dname);
}

function reviewFlags(key, item) {
  const flags = [];
  if (REVIEW_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
    flags.push('needs_manual_scope_check');
  }
  if (/roshan/i.test(key) || /roshan/i.test(item?.dname || '')) {
    flags.push('roshan_variant');
  }
  if (/cheese/i.test(key) || /cheese/i.test(item?.dname || '')) {
    flags.push('non_shop_drop_or_special');
  }
  if (/^courier$|^flying_courier$/.test(key)) {
    flags.push('legacy_or_non_combat_shop_item');
  }
  if (item?.qual === 'consumable' && !item?.abilities?.length && !item?.attrib?.length) {
    flags.push('no_combat_fields');
  }
  return [...new Set(flags)];
}

function classifyItem(key, item) {
  if (!isNamed(item)) {
    return { scope: 'excluded', reason: 'missing_display_name', flags: [] };
  }
  if (isRecipe(key, item)) {
    return { scope: 'excluded', reason: 'recipe_entry', flags: [] };
  }
  if (!hasPositiveCost(item)) {
    return { scope: 'excluded', reason: 'non_positive_or_missing_cost', flags: [] };
  }
  if (!SHOP_QUALITIES.has(item.qual)) {
    return { scope: 'excluded', reason: 'not_shop_quality_or_unknown_quality', flags: [] };
  }

  const flags = reviewFlags(key, item);
  return {
    scope: flags.length ? 'review' : 'candidate',
    reason: flags.length ? 'candidate_but_scope_sensitive' : 'shop_quality_positive_cost',
    flags
  };
}

function summarize(rows) {
  const summary = {
    totalRawItems: rows.length,
    candidate: 0,
    review: 0,
    excluded: 0,
    byQuality: {},
    excludedByReason: {},
    reviewFlags: {}
  };

  for (const row of rows) {
    summary[row.scope] += 1;
    if (row.scope !== 'excluded') {
      summary.byQuality[row.quality || '(none)'] = (summary.byQuality[row.quality || '(none)'] || 0) + 1;
    } else {
      summary.excludedByReason[row.reason] = (summary.excludedByReason[row.reason] || 0) + 1;
    }
    for (const flag of row.flags) {
      summary.reviewFlags[flag] = (summary.reviewFlags[flag] || 0) + 1;
    }
  }

  return summary;
}

function buildRows(items) {
  return Object.entries(items)
    .map(([key, item]) => {
      const classification = classifyItem(key, item);
      return {
        key,
        name: item?.dname || '',
        cost: item?.cost ?? null,
        quality: item?.qual || '',
        scope: classification.scope,
        reason: classification.reason,
        flags: classification.flags,
        attributeCount: item?.attrib?.length || 0,
        abilityCount: item?.abilities?.length || 0,
        componentCount: item?.components?.length || 0,
        rawAttributeKeys: (item?.attrib || []).map((attr) => attr.key || attr.header).filter(Boolean),
        abilities: (item?.abilities || []).map((ability) => ({
          type: ability.type || '',
          title: ability.title || '',
          description: ability.description || ''
        }))
      };
    })
    .sort((a, b) => {
      const scopeOrder = { review: 0, candidate: 1, excluded: 2 };
      return (scopeOrder[a.scope] - scopeOrder[b.scope])
        || String(a.quality).localeCompare(String(b.quality))
        || String(a.key).localeCompare(String(b.key));
    });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderChip(value) {
  return `<span class="chip">${escapeHtml(value)}</span>`;
}

function renderRows(rows) {
  return rows.map((row) => `
    <tr data-scope="${escapeHtml(row.scope)}">
      <td><code>${escapeHtml(row.key)}</code><br><strong>${escapeHtml(row.name)}</strong></td>
      <td>${escapeHtml(row.cost)}</td>
      <td>${escapeHtml(row.quality || '-')}</td>
      <td>${escapeHtml(row.scope)}<br><small>${escapeHtml(row.reason)}</small></td>
      <td>${row.flags.length ? row.flags.map(renderChip).join('') : '<span class="muted">无</span>'}</td>
      <td>${row.attributeCount} 属性 / ${row.abilityCount} 技能 / ${row.componentCount} 组件</td>
      <td>${row.rawAttributeKeys.slice(0, 8).map(renderChip).join('') || '<span class="muted">无</span>'}</td>
    </tr>
  `).join('');
}

function renderHtml(rows, summary) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dota 2 商店物品范围审核</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #eef4f8; color: #1f2933; }
    main { width: min(1320px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 48px; }
    header, section { background: #fff; border: 1px solid #d9e4ea; border-radius: 8px; box-shadow: 0 12px 32px rgba(43,69,86,.09); margin-bottom: 16px; padding: 18px; }
    h1, h2 { margin: 0 0 10px; color: #22364a; }
    p { color: #5f6f7b; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .summary div { padding: 12px; background: #f7fafc; border: 1px solid #d9e4ea; border-radius: 6px; }
    .summary span { display: block; color: #5f6f7b; font-size: 12px; }
    .summary strong { display: block; margin-top: 4px; font-size: 22px; color: #0f766e; }
    table { width: 100%; min-width: 1120px; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 9px; border-bottom: 1px solid #e0e8ee; text-align: left; vertical-align: top; }
    th { background: #f7fafc; color: #31566d; position: sticky; top: 0; }
    .table-wrap { max-height: 72vh; overflow: auto; border: 1px solid #d9e4ea; border-radius: 8px; }
    tr[data-scope="review"] { background: #fff9ea; }
    tr[data-scope="excluded"] { color: #6b7280; background: #fafafa; }
    code { color: #9f2f1f; }
    .chip { display: inline-flex; margin: 2px; padding: 2px 7px; border-radius: 999px; background: #eef4f8; color: #244155; font-size: 12px; }
    .muted { color: #8796a2; }
    @media (max-width: 760px) { .summary { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Dota 2 商店物品范围审核</h1>
      <p>数据源：dotaconstants.items。第一阶段只确认范围：候选商店物品、需要人工确认的边界项、排除项。中立物品先不纳入。</p>
    </header>
    <section>
      <h2>汇总</h2>
      <div class="summary">
        <div><span>原始条目</span><strong>${summary.totalRawItems}</strong></div>
        <div><span>候选商店物品</span><strong>${summary.candidate}</strong></div>
        <div><span>需人工确认</span><strong>${summary.review}</strong></div>
        <div><span>已排除</span><strong>${summary.excluded}</strong></div>
      </div>
      <p>候选规则：有展示名、价格大于 0、不是 recipe、quality 属于商店常见分类。黄色 review 行是价格和分类像商店物品，但可能是 Roshan、旧物品或特殊掉落，需要你确认是否纳入。</p>
    </section>
    <section>
      <h2>物品清单</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>物品</th>
              <th>价格</th>
              <th>quality</th>
              <th>范围</th>
              <th>人工标记</th>
              <th>字段数量</th>
              <th>属性 key 预览</th>
            </tr>
          </thead>
          <tbody>${renderRows(rows)}</tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function parseArgs(argv) {
  const args = { outputDir: DEFAULT_OUTPUT_DIR };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') {
      args.outputDir = argv[index + 1] || args.outputDir;
      index += 1;
    }
  }
  return args;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const dc = await import('dotaconstants');
  const rows = buildRows(dc.items || {});
  const summary = summarize(rows);
  const outputDir = path.resolve(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'items.json'), `${JSON.stringify(rows, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderHtml(rows, summary));
  console.log(JSON.stringify({
    outputDir,
    summary,
    files: ['index.html', 'items.json', 'summary.json']
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  SHOP_QUALITIES,
  buildRows,
  classifyItem,
  isRecipe,
  summarize
};
