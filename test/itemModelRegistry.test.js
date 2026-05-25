const test = require('node:test');
const assert = require('node:assert/strict');

const scopeRows = require('../audit-runs/item-scope-latest/items.json');
const {
  getItemModel,
  listItemModels,
  summarizeItemModelCoverage
} = require('../itemModels/registry');

test('item registry covers every confirmed candidate shop item and excludes review items', () => {
  const candidates = scopeRows.filter((row) => row.scope === 'candidate');
  const review = scopeRows.filter((row) => row.scope === 'review');
  const models = listItemModels();

  assert.equal(models.length, candidates.length);
  for (const row of candidates) {
    assert.ok(getItemModel(row.key), `${row.key} should have an item model`);
  }
  for (const row of review) {
    assert.equal(getItemModel(row.key), null, `${row.key} should stay out of phase 2 models`);
  }
});

test('key combat and upgrade items expose explicit semantics', () => {
  assert.ok(getItemModel('dagon').effects.some((effect) => effect.type === 'damage.instant'));
  assert.ok(getItemModel('radiance').effects.some((effect) => effect.type === 'damage.sustained_dps'));
  assert.ok(getItemModel('maelstrom').effects.some((effect) => effect.type === 'damage.attack_proc'));
  assert.ok(getItemModel('desolator').effects.some((effect) => effect.type === 'modifier.armor.flat'));
  assert.ok(getItemModel('assault').effects.some((effect) => effect.type === 'modifier.armor.flat'));
  assert.ok(getItemModel('ethereal_blade').effects.some((effect) => effect.type === 'damage.attribute_scaling'));
  assert.ok(getItemModel('ultimate_scepter').effects.some((effect) => effect.type === 'upgrade.aghanims_scepter'));
  assert.ok(getItemModel('ultimate_scepter_2').effects.some((effect) => effect.type === 'upgrade.aghanims_scepter'));
  assert.ok(getItemModel('aghanims_shard').effects.some((effect) => effect.type === 'upgrade.aghanims_shard'));
});

test('Shadow Blade break damage is modeled as an attack event, not standalone instant damage', () => {
  const model = getItemModel('invis_sword');
  const breakEffects = model.effects.filter((effect) => effect.key === 'windwalk_bonus_damage');

  assert.equal(breakEffects.some((effect) => effect.type === 'damage.instant'), false);
  assert.equal(breakEffects.some((effect) => effect.type === 'attack.event.bonus_damage'), true);
});

test('non-damage item fields are kept out of damage semantics', () => {
  const phaseBoots = getItemModel('phase_boots');
  const movementEffects = phaseBoots.effects.filter((effect) => effect.key && /movement|speed|phase/i.test(effect.key));

  assert.ok(movementEffects.length > 0);
  assert.ok(movementEffects.every((effect) => !effect.type.startsWith('damage.')));
});

test('coverage summary exposes effect counts for checkpoint review', () => {
  const summary = summarizeItemModelCoverage();

  assert.equal(summary.total, 188);
  assert.ok(summary.byEffectType['raw.reference'] >= 0);
  assert.ok(summary.byEffectType['damage.instant'] > 0);
  assert.ok(summary.byEffectType['modifier.armor.flat'] > 0);
});
