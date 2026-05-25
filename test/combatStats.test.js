const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyStatAssertions,
  attackDamageAtLevel,
  attacksPerSecond,
  heroAttributesAtLevel
} = require('../combat/stats');

const strengthHero = {
  primaryAttribute: 'str',
  baseStrength: 25,
  strengthGain: 3,
  baseAgility: 18,
  agilityGain: 2,
  baseIntelligence: 16,
  intelligenceGain: 1.5,
  baseAttackMin: 30,
  baseAttackMax: 36,
  attackRate: 1.7
};

test('heroAttributesAtLevel derives level-scaled attributes', () => {
  assert.deepEqual(heroAttributesAtLevel(strengthHero, 6), {
    strength: 40,
    agility: 28,
    intelligence: 23.5
  });
});

test('attackDamageAtLevel uses primary attribute and flat attack items', () => {
  const attrs = heroAttributesAtLevel(strengthHero, 6);
  const attack = attackDamageAtLevel(strengthHero, attrs, [
    { semanticType: 'stat.attack_damage.flat', values: [18], sourceKey: 'broadsword' }
  ]);

  assert.deepEqual(attack, {
    min: 88,
    max: 94,
    average: 91,
    flatBonus: 18
  });
});

test('applyStatAssertions applies attribute items before attack damage', () => {
  const result = applyStatAssertions(strengthHero, 6, [
    { semanticType: 'stat.attribute.flat', attribute: 'strength', values: [10], sourceKey: 'belt_of_strength' },
    { semanticType: 'stat.attack_damage.flat', values: [18], sourceKey: 'broadsword' }
  ]);

  assert.equal(result.attributes.strength, 50);
  assert.equal(result.attackDamage.average, 101);
});

test('attacksPerSecond includes agility and flat attack speed bonuses', () => {
  const result = attacksPerSecond(strengthHero, { agility: 28 }, [
    { semanticType: 'stat.attack_speed.flat', values: [25], sourceKey: 'gloves' }
  ]);

  assert.equal(result.attackSpeed, 153);
  assert.equal(Number(result.attacksPerSecond.toFixed(4)), 0.9);
});
