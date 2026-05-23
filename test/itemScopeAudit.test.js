const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRows,
  classifyItem,
  isRecipe,
  summarize
} = require('../scripts/item-scope-audit');

test('isRecipe detects recipe keys and display names', () => {
  assert.equal(isRecipe('recipe_desolator', { dname: 'Desolator Recipe' }), true);
  assert.equal(isRecipe('desolator', { dname: 'Desolator' }), false);
});

test('classifyItem accepts positive-cost shop quality items', () => {
  const result = classifyItem('desolator', { dname: 'Desolator', cost: 3500, qual: 'artifact' });

  assert.equal(result.scope, 'candidate');
  assert.equal(result.reason, 'shop_quality_positive_cost');
});

test('classifyItem excludes recipes, missing names, and unknown quality entries', () => {
  assert.equal(classifyItem('recipe_desolator', { dname: 'Desolator Recipe', cost: 300 }).scope, 'excluded');
  assert.equal(classifyItem('mystery', { cost: 1000, qual: 'artifact' }).reason, 'missing_display_name');
  assert.equal(classifyItem('tier1_token', { dname: 'Tier 1 Token', cost: null }).reason, 'non_positive_or_missing_cost');
});

test('classifyItem flags scope-sensitive special items for manual review', () => {
  const cheese = classifyItem('cheese', { dname: 'Cheese', cost: 1000, qual: 'consumable', abilities: [{}] });
  const roshanShard = classifyItem('aghanims_shard_roshan', { dname: "Aghanim's Shard - Consumable", cost: 1400, qual: 'rare' });

  assert.equal(cheese.scope, 'review');
  assert.equal(roshanShard.scope, 'review');
  assert.ok(cheese.flags.includes('non_shop_drop_or_special'));
  assert.ok(roshanShard.flags.includes('roshan_variant'));
});

test('buildRows and summarize expose checkpoint counts by scope', () => {
  const rows = buildRows({
    desolator: { dname: 'Desolator', cost: 3500, qual: 'artifact', attrib: [{ key: 'damage' }] },
    cheese: { dname: 'Cheese', cost: 1000, qual: 'consumable', abilities: [{}] },
    recipe_desolator: { dname: 'Desolator Recipe', cost: 300 }
  });
  const summary = summarize(rows);

  assert.equal(summary.totalRawItems, 3);
  assert.equal(summary.candidate, 1);
  assert.equal(summary.review, 1);
  assert.equal(summary.excluded, 1);
});
