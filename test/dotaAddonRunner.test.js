const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const runnerPath = path.join(
  __dirname,
  '..',
  'tools',
  'dota-addon',
  'scripts',
  'vscripts',
  'dota_helper_fixture_runner.lua'
);
const addonInfoPath = path.join(__dirname, '..', 'tools', 'dota-addon', 'addoninfo.txt');
const addonReadmePath = path.join(__dirname, '..', 'tools', 'dota-addon', 'README.md');

test('Lua fixture runner loads generated fixture and exposes controlled attack measurement', () => {
  const source = fs.readFileSync(runnerPath, 'utf8');

  assert.match(source, /pcall\(require,\s*"generated\.dota_helper_fixture"\)/);
  assert.match(source, /RunConfiguredFixture/);
  assert.match(source, /RunNextFixture/);
  assert.match(source, /fixtures/);
  assert.match(source, /PerformAttack/);
  assert.match(source, /observedDamage/);
  assert.match(source, /targetArmor/);
  assert.match(source, /targetMagicResistance/);
  assert.match(source, /MagicalResistancePercent/);
  assert.match(source, /Script_GetMagicalArmorValue/);
  assert.match(source, /GetBaseMagicalResistanceValue/);
  assert.match(source, /attackerDamageMin/);
  assert.match(source, /CalibrateTargetArmor/);
  assert.match(source, /attackCount/);
  assert.match(source, /attackerBaseDamageMin/);
  assert.match(source, /attackerBaseDamageMax/);
  assert.match(source, /attackerAverageTrueDamageNoTarget/);
  assert.match(source, /PrepareInvisibilityBreak/);
  assert.match(source, /RunInvisibilityBreakAttackWindow/);
  assert.match(source, /FinishInvisibilityBreakAttackWindow/);
  assert.match(source, /InvisibilityBreakDelaySeconds/);
  assert.match(source, /windwalk_fade_time/);
  assert.match(source, /RunActiveItemFixture/);
  assert.match(source, /RunSequenceFixture/);
  assert.match(source, /RunNextSequenceStep/);
  assert.match(source, /RunNextSequenceTrial/);
  assert.match(source, /FinishSequenceTrial/);
  assert.match(source, /FinishSequenceFixture/);
  assert.match(source, /RunSequenceStep/);
  assert.match(source, /SequenceStepPostDelaySeconds/);
  assert.match(source, /AttackFlagsFor/);
  assert.match(source, /processProcs/);
  assert.match(source, /useCastAttackOrb/);
  assert.match(source, /skipCooldown/);
  assert.match(source, /neverMiss/);
  assert.match(source, /FixtureTrials/);
  assert.match(source, /SampleStats/);
  assert.match(source, /observedDamageSamples/);
  assert.match(source, /observedDamageMean/);
  assert.match(source, /SetHealth/);
  assert.match(source, /trialIndex/);
  assert.match(source, /FinishActiveItemFixture/);
  assert.match(source, /CastActiveItem/);
  assert.match(source, /SetAbilityLevels/);
  assert.match(source, /CleanupFixtureUnits/);
  assert.match(source, /DisableAutoAcquire/);
  assert.match(source, /StopUnit/);
  assert.match(source, /SetIdleAcquire/);
  assert.match(source, /SetThink\("RunNextSequenceStep"/);
  assert.match(source, /ReloadFixture/);
  assert.match(source, /package\.loaded\["generated\.dota_helper_fixture"\]\s*=\s*nil/);
  assert.match(source, /pendingSequenceFixture\s*=\s*nil/);
  assert.match(source, /pendingActiveItemFixture\s*=\s*nil/);
  assert.match(source, /pendingInvisibilityBreakAttackWindow\s*=\s*nil/);
  assert.match(source, /Convars:RegisterCommand\("dota_helper_run_fixture"/);
  assert.match(source, /re-running fixture batch/);
  assert.match(source, /generated\.dota_helper_fixture_trigger/);
  assert.match(source, /PollFixtureTrigger/);
  assert.match(source, /package\.loaded\["generated\.dota_helper_fixture_trigger"\]\s*=\s*nil/);
  assert.match(source, /currentFixtureTriggerRunId/);
  assert.match(source, /fixture trigger changed/);
  assert.doesNotMatch(source, /for _, step in ipairs\(fixture\.scenario\.steps or \{\}\) do/);
  assert.match(source, /activeItemLevel/);
  assert.match(source, /activeItemDamageSpecial/);
  assert.match(source, /SetLevel/);
  assert.doesNotMatch(source, /PerformAttack\(target, true, true, true, false, false, false, true\)/);
});

test('Dota addon metadata declares a playable probe addon', () => {
  const source = fs.readFileSync(addonInfoPath, 'utf8');

  assert.match(source, /"AddonInfo"/);
  assert.match(source, /"maps"\s+"dota"/);
  assert.match(source, /"IsPlayable"\s+"1"/);
});

test('Dota addon README documents console fixture reload workflow', () => {
  const source = fs.readFileSync(addonReadmePath, 'utf8');

  assert.match(source, /Iterating without restarting/);
  assert.match(source, /dota_helper_fixture_trigger\.lua/);
  assert.match(source, /screen focus/);
  assert.match(source, /dota_helper_run_fixture/);
});
