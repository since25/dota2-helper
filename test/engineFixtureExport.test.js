const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEngineFixture } = require('../scripts/export-engine-fixture');

test('buildEngineFixture wraps local model result for a Dota engine scenario', async () => {
  const fixture = await buildEngineFixture({
    id: 'pa_level_12_invis_sword_attack',
    hero: 'Phantom Assassin',
    heroLevel: 12,
    items: ['invis_sword'],
    target: {
      hero: 'Axe',
      level: 12,
      armor: 10,
      magicResistancePercent: 25
    },
    scenario: {
      type: 'attack_window',
      attackCount: 1,
      forceInvisibilityBreak: true
    }
  });

  assert.equal(fixture.id, 'pa_level_12_invis_sword_attack');
  assert.equal(fixture.hero, 'Phantom Assassin');
  assert.equal(fixture.expectedLocalModel.hero, 'Phantom Assassin');
  assert.ok(Array.isArray(fixture.expectedLocalModel.components));
});
