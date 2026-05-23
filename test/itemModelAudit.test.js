const test = require('node:test');
const assert = require('node:assert/strict');

const { listItemModels } = require('../itemModels/registry');
const { renderHtml, summarizeForAudit } = require('../scripts/item-model-audit');

test('item model audit summary is suitable for checkpoint review', () => {
  const summary = summarizeForAudit(listItemModels());

  assert.equal(summary.total, 188);
  assert.ok(summary.damageItems > 0);
  assert.ok(summary.modifierItems > 0);
  assert.equal(summary.upgradeItems, 3);
});

test('item model audit page renders readable semantic rows', () => {
  const html = renderHtml(listItemModels(), summarizeForAudit(listItemModels()));

  assert.match(html, /商店物品语义模型审核/);
  assert.match(html, /Dagon/);
  assert.match(html, /damage\.instant/);
  assert.match(html, /阿哈利姆魔晶/);
});
