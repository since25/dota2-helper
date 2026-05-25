const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateAttackWindow } = require('../combat/attackWindow');

test('calculateAttackWindow supports explicit attack count with flat attack damage item', () => {
  const result = calculateAttackWindow({
    attackDamage: { average: 100 },
    attackSpeed: { attacksPerSecond: 1 },
    assertions: [
      { semanticType: 'attack.event.bonus_damage', values: [175], timing: 'next_attack', condition: 'condition.invisibility_break', damageType: 'Physical' }
    ],
    mode: 'attack_count',
    attackCount: 1,
    forceInvisibilityBreak: true
  });

  assert.equal(result.raw, 275);
  assert.deepEqual(result.events.map((event) => event.type), ['attack']);
  assert.deepEqual(result.events[0].components.map((component) => component.semanticType), [
    'attack.event.base_damage',
    'attack.event.bonus_damage'
  ]);
});

test('calculateAttackWindow derives attack count from duration and attack speed', () => {
  const result = calculateAttackWindow({
    attackDamage: { average: 80 },
    attackSpeed: { attacksPerSecond: 2.2 },
    assertions: [],
    mode: 'duration',
    durationSeconds: 3
  });

  assert.equal(result.attackCount, 6);
  assert.equal(result.raw, 480);
});

test('calculateAttackWindow can force a deterministic crit source', () => {
  const result = calculateAttackWindow({
    attackDamage: { average: 100 },
    attackSpeed: { attacksPerSecond: 1 },
    assertions: [
      { semanticType: 'attack.event.crit', sourceKey: 'greater_crit', multiplierPercent: 225, chancePercent: 30 }
    ],
    mode: 'attack_count',
    attackCount: 1,
    forceCritSource: 'greater_crit'
  });

  assert.equal(result.raw, 225);
  assert.equal(result.events[0].crit.source, 'greater_crit');
});
