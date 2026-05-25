const test = require('node:test');
const assert = require('node:assert/strict');

const { buildHeroOutputVerificationReport } = require('../scripts/hero-output-verification');

test('buildHeroOutputVerificationReport separates engine-probe-ready attack models from spell models', async () => {
  const report = await buildHeroOutputVerificationReport({
    heroes: ['Slardar', 'Sand King', 'Phantom Assassin']
  });

  assert.equal(report.heroesChecked, 3);
  assert.equal(report.totals.engineProbeSupported > 0, true);
  assert.equal(report.totals.engineProbeUnsupported > 0, true);

  const slardar = report.heroes.find((entry) => entry.hero === 'Slardar');
  const bash = slardar.outputs.find((entry) => entry.ability === 'Bash of the Deep');
  const crush = slardar.outputs.find((entry) => entry.ability === 'Slithereen Crush');

  assert.equal(bash.engineProbeSupported, true);
  assert.equal(bash.engineProbeType, 'attack_window');
  assert.deepEqual(bash.requiredRuntimeInputs, ['attack_count', 'hero_attack_damage']);
  assert.equal(crush.engineProbeSupported, false);
  assert.equal(crush.engineProbeReason, 'spell_probe_not_supported_yet');
});

test('hero output verification CLI model reports reference-only crits as attack-window candidates', async () => {
  const report = await buildHeroOutputVerificationReport({
    heroes: ['Phantom Assassin']
  });
  const pa = report.heroes[0];
  const crit = pa.outputs.find((entry) => entry.ability === 'Coup de Grace');

  assert.equal(crit.status, 'reference_only');
  assert.equal(crit.engineProbeSupported, true);
  assert.equal(crit.engineProbeType, 'attack_window');
  assert.equal(crit.requiredRuntimeInputs.includes('crit_mode'), true);
});

test('buildHeroOutputVerificationReport can attach engine probe scenario candidates for attack sequences', async () => {
  const report = await buildHeroOutputVerificationReport({
    heroes: ['Slardar'],
    includeProbeScenarios: true
  });
  const slardar = report.heroes[0];
  const bash = slardar.outputs.find((entry) => entry.ability === 'Bash of the Deep');
  const crush = slardar.outputs.find((entry) => entry.ability === 'Slithereen Crush');

  assert.deepEqual(bash.probeScenario, {
    id: 'slardar_bash_of_the_deep_attack_window_probe',
    hero: 'Slardar',
    heroLevel: 5,
    target: {
      unitName: 'npc_dota_creep_badguys_melee',
      health: 10000,
      armor: 0,
      magicResistancePercent: 25
    },
    abilitySelections: [{
      abilityName: 'Bash of the Deep',
      componentId: 'Bash of the Deep:attack_sequence:bonus_damage',
      abilityLevel: 3,
      valueMode: 'theoretical'
    }],
    scenario: {
      type: 'attack_window',
      attackCount: 4
    }
  });
  assert.equal(crush.probeScenario, undefined);
});
