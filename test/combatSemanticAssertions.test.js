const test = require('node:test');
const assert = require('node:assert/strict');

const { adaptItemModelToAssertions } = require('../combat/itemEffectAdapter');
const { validateCombatAssertion } = require('../combat/semanticAssertions');

test('Broadsword-like attack damage item becomes stat attack damage assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'broadsword',
    name: 'Broadsword',
    effects: [{
      type: 'modifier.attack_damage.flat',
      label: '攻击力加成',
      key: 'bonus_damage',
      values: [15],
      source: 'attribute'
    }]
  });

  assert.deepEqual(assertions[0], {
    source: 'item',
    sourceKey: 'broadsword',
    fieldKey: 'bonus_damage',
    semanticType: 'stat.attack_damage.flat',
    target: 'self',
    timing: 'always',
    values: [15],
    confidence: 'candidate',
    references: []
  });
});

test('Shadow Blade-like item exposes invisibility break bonus damage assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'invis_sword',
    name: 'Shadow Blade',
    effects: [{
      type: 'attack.event.bonus_damage',
      label: '攻击或概率触发伤害',
      key: 'windwalk_bonus_damage',
      values: [175],
      source: 'attribute',
      description: 'Bonus damage when attacking out of invisibility.'
    }]
  });

  assert.equal(assertions[0].semanticType, 'attack.event.bonus_damage');
  assert.equal(assertions[0].timing, 'next_attack');
  assert.equal(assertions[0].condition, 'condition.invisibility_break');
  assert.equal(assertions[0].damageType, 'Physical');
});

test('Daedalus-like item exposes crit assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'greater_crit',
    name: 'Daedalus',
    effects: [{
      type: 'modifier.crit',
      label: '暴击',
      key: 'crit_multiplier',
      values: [225],
      chancePercent: 30,
      source: 'attribute'
    }]
  });

  assert.equal(assertions[0].semanticType, 'attack.event.crit');
  assert.equal(assertions[0].multiplierPercent, 225);
  assert.equal(assertions[0].chancePercent, 30);
});

test('split crit chance and multiplier fields combine into one crit assertion', () => {
  const assertions = adaptItemModelToAssertions({
    key: 'greater_crit',
    name: 'Daedalus',
    effects: [
      {
        type: 'modifier.crit',
        label: '暴击',
        key: 'crit_chance',
        values: [30],
        source: 'attribute'
      },
      {
        type: 'modifier.crit',
        label: '暴击',
        key: 'crit_multiplier',
        values: [225],
        source: 'attribute'
      }
    ]
  });

  const crits = assertions.filter((assertion) => assertion.semanticType === 'attack.event.crit');
  assert.equal(crits.length, 1);
  assert.equal(crits[0].multiplierPercent, 225);
  assert.equal(crits[0].chancePercent, 30);
});

test('validateCombatAssertion rejects unknown semantic type', () => {
  assert.throws(
    () => validateCombatAssertion({ semanticType: 'unknown.type', source: 'item', sourceKey: 'x' }),
    /unsupported semanticType/
  );
});
