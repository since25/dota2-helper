const test = require('node:test');
const assert = require('node:assert/strict');

const {
  SEMANTIC_TYPES,
  getSemanticDefinition,
  routeSemanticToContext,
  formatSemanticLabel
} = require('../damageModels/semantics');

test('semantic catalog defines labels, categories, and units for every type', () => {
  assert.ok(SEMANTIC_TYPES.length >= 40);

  for (const semanticType of SEMANTIC_TYPES) {
    const definition = getSemanticDefinition(semanticType);

    assert.equal(definition.type, semanticType);
    assert.equal(typeof definition.category, 'string');
    assert.ok(definition.category.length > 0);
    assert.equal(typeof definition.unit, 'string');
    assert.ok(definition.unit.length > 0);
    assert.equal(typeof definition.label, 'string');
    assert.ok(definition.label.length > 0);
    assert.equal(formatSemanticLabel(semanticType), definition.label);
  }
});

test('semantic catalog routes direct and situational damage separately', () => {
  assert.equal(routeSemanticToContext('damage.instant', { defaultIncluded: true }), 'fixed_damage');
  assert.equal(routeSemanticToContext('damage.instant', { defaultIncluded: false }), 'situational_damage');
  assert.equal(routeSemanticToContext('damage.sustained_dps'), 'situational_damage');
  assert.equal(routeSemanticToContext('damage.wave'), 'situational_damage');
  assert.equal(routeSemanticToContext('damage.attack_sequence_proc'), 'situational_damage');
  assert.equal(routeSemanticToContext('damage.source_damage_percent'), 'situational_damage');
});

test('semantic catalog supports damage derived from a prior damage event', () => {
  const definition = getSemanticDefinition('damage.source_damage_percent');

  assert.equal(definition.category, 'direct_damage');
  assert.equal(definition.unit, 'percent');
  assert.equal(definition.label, '来源伤害百分比');
});

test('semantic catalog supports mana burn damage', () => {
  const definition = getSemanticDefinition('damage.mana_burn');

  assert.equal(definition.category, 'direct_damage');
  assert.equal(definition.unit, 'scaling');
  assert.equal(definition.label, '法力燃烧伤害');
});

test('semantic catalog supports movement speed scaling damage', () => {
  const definition = getSemanticDefinition('damage.move_speed_scaling');

  assert.equal(definition.category, 'direct_damage');
  assert.equal(definition.unit, 'scaling');
  assert.equal(definition.label, '移动速度系数伤害');
});

test('semantic catalog routes modifiers and non-damage references away from damage refs', () => {
  assert.equal(routeSemanticToContext('modifier.armor_reduction.flat'), 'modifier_reference');
  assert.equal(routeSemanticToContext('modifier.attack_damage.percent'), 'modifier_reference');
  assert.equal(routeSemanticToContext('mobility.move_speed.percent'), 'modifier_reference');
  assert.equal(routeSemanticToContext('mobility.cast_range.units'), 'modifier_reference');
  assert.equal(routeSemanticToContext('control.stun.seconds'), 'modifier_reference');
  assert.equal(routeSemanticToContext('resource.cooldown'), 'resource_reference');
});

test('semantic catalog rejects unknown semantic types', () => {
  assert.throws(
    () => getSemanticDefinition('damage.not_real'),
    /Unknown semantic type: damage\.not_real/
  );

  assert.throws(
    () => routeSemanticToContext('damage.not_real'),
    /Unknown semantic type: damage\.not_real/
  );
});
