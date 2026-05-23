const fs = require('node:fs');
const path = require('node:path');

const {
  listItemModels,
  summarizeItemModelCoverage
} = require('../itemModels/registry');

const DEFAULT_OUTPUT_DIR = path.join('audit-runs', 'item-models-latest');

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

function summarizeForAudit(models) {
  const coverage = summarizeItemModelCoverage();
  const rawReferenceItems = models.filter((model) =>
    model.effects.some((effect) => effect.type === 'raw.reference')
  );
  const damageItems = models.filter((model) =>
    model.effects.some((effect) => effect.type.startsWith('damage.'))
  );
  const modifierItems = models.filter((model) =>
    model.effects.some((effect) => effect.type.startsWith('modifier.'))
  );
  const upgradeItems = models.filter((model) =>
    model.effects.some((effect) => effect.type.startsWith('upgrade.'))
  );

  return {
    ...coverage,
    damageItems: damageItems.length,
    modifierItems: modifierItems.length,
    upgradeItems: upgradeItems.length,
    rawReferenceItems: rawReferenceItems.length
  };
}

function renderEffects(model) {
  return model.effects.map((effect) => {
    const values = Array.isArray(effect.values) && effect.values.length
      ? ` <span class="muted">${escapeHtml(effect.values.join(' / '))}</span>`
      : '';
    const source = effect.key || effect.abilityName || effect.source;
    return `<li>${renderChip(effect.type)} <strong>${escapeHtml(effect.label)}</strong>${values}<br><small>${escapeHtml(source || '')}</small></li>`;
  }).join('');
}

function renderRows(models) {
  return models.map((model) => `
    <tr>
      <td><code>${escapeHtml(model.key)}</code><br><strong>${escapeHtml(model.name)}</strong></td>
      <td>${escapeHtml(model.cost)}</td>
      <td>${escapeHtml(model.quality || '-')}</td>
      <td>${model.effects.map((effect) => renderChip(effect.type)).join('')}</td>
      <td><ul>${renderEffects(model)}</ul></td>
      <td>${model.rawFields.slice(0, 12).map(renderChip).join('') || '<span class="muted">无</span>'}</td>
    </tr>
  `).join('');
}

function renderHtml(models, summary) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dota 2 商店物品语义模型审核</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #eef4f8; color: #1f2933; }
    main { width: min(1440px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 48px; }
    header, section { background: #fff; border: 1px solid #d9e4ea; border-radius: 8px; box-shadow: 0 12px 32px rgba(43,69,86,.09); margin-bottom: 16px; padding: 18px; }
    h1, h2 { margin: 0 0 10px; color: #22364a; }
    p { color: #5f6f7b; }
    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .summary div { padding: 12px; background: #f7fafc; border: 1px solid #d9e4ea; border-radius: 6px; }
    .summary span { display: block; color: #5f6f7b; font-size: 12px; }
    .summary strong { display: block; margin-top: 4px; font-size: 22px; color: #0f766e; }
    table { width: 100%; min-width: 1240px; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 9px; border-bottom: 1px solid #e0e8ee; text-align: left; vertical-align: top; }
    th { background: #f7fafc; color: #31566d; position: sticky; top: 0; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 8px; }
    .table-wrap { max-height: 76vh; overflow: auto; border: 1px solid #d9e4ea; border-radius: 8px; }
    code { color: #9f2f1f; }
    .chip { display: inline-flex; margin: 2px; padding: 2px 7px; border-radius: 999px; background: #eef4f8; color: #244155; font-size: 12px; }
    .muted { color: #8796a2; }
    @media (max-width: 900px) { .summary { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Dota 2 商店物品语义模型审核</h1>
      <p>第二阶段审核页：只包含关卡 1 已确认的 candidate 商店物品。review、recipe、中立物品和特殊掉落不在本页。</p>
    </header>
    <section>
      <h2>汇总</h2>
      <div class="summary">
        <div><span>已建模物品</span><strong>${summary.total}</strong></div>
        <div><span>含伤害语义</span><strong>${summary.damageItems}</strong></div>
        <div><span>含修正语义</span><strong>${summary.modifierItems}</strong></div>
        <div><span>神杖/魔晶</span><strong>${summary.upgradeItems}</strong></div>
        <div><span>含原始参考字段</span><strong>${summary.rawReferenceItems}</strong></div>
      </div>
      <p>注意：raw.reference 是非伤害审计字段，不会进入伤害计算。它用于保留尚未精细分类但不应被当作 Unknown Damage 的字段。</p>
    </section>
    <section>
      <h2>物品模型</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>物品</th>
              <th>价格</th>
              <th>quality</th>
              <th>语义类型</th>
              <th>效果明细</th>
              <th>原始字段</th>
            </tr>
          </thead>
          <tbody>${renderRows(models)}</tbody>
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
  const outputDir = path.resolve(options.outputDir);
  const models = listItemModels();
  const summary = summarizeForAudit(models);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'models.json'), `${JSON.stringify(models, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderHtml(models, summary));

  console.log(JSON.stringify({
    outputDir,
    summary,
    files: ['index.html', 'models.json', 'summary.json']
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  renderHtml,
  summarizeForAudit
};
