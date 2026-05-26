# Dota Engine Verifier Hardening Spec

**Status:** implemented locally
**Date:** 2026-05-25
**Owner:** local
**Scope:** `tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua`, `scripts/export-engine-fixture.js`, `scripts/compare-engine-result.js`, related fixtures under `test-runs/dota-engine-verification/`.

## Background

The Lua engine verifier (`DotaHelperFixtureRunner`) currently runs each fixture as a single deterministic trial. Recent batch probe runs (commits `28b3bf4` → `0d5d480`) show the framework is structurally sound, but the single-trial assumption breaks down once probabilistic procs, invisibility-break timing, or active-item cast points are involved. This spec lists the five highest-impact corrections.

## Goals

- Eliminate false negatives caused by single-trial stochastic noise.
- Make invisibility-break and active-item sequences reflect real in-engine timing.
- Confirm engine-side unit conventions for magic resistance and max health.
- Keep all changes local-only; the production server never loads these files.

## Non-goals

- Re-implementing the Workshop Tools API in Node.
- Verifying spells that are not yet curated in `damageModels/heroes/`.
- Cross-platform launchers (the macOS Steam launch line in `tools/dota-addon/README.md` stays as-is).

## Tasks

### Task 0 — Console-driven fixture reload

**Why:** Tasks 1–5 require iterating on generated Lua fixtures. Dota caches `require("generated.dota_helper_fixture")`, so fixture edits previously required a full client restart before the runner could see regenerated data.

**Changes:**
- Add `DotaHelperFixtureRunner:ReloadFixture()` to clear `package.loaded["generated.dota_helper_fixture"]`, re-require the fixture, reset `fixtureIndex`, clean pending async state, and remove old probe units.
- Register the cheat console command `dota_helper_run_fixture` from `InitGameMode`; the first-launch `SetThink("RunNextFixture", ...)` path remains unchanged.
- Document the no-restart iteration workflow in [tools/dota-addon/README.md](../../../tools/dota-addon/README.md).

**Verify:** source-level runner/README tests cover command registration and cache clearing. Live Dota first-launch probes still auto-run after the change.

### Task 1 — Multi-trial sampling for stochastic fixtures

**Why:** [dota_helper_fixture_runner.lua:111](../../../tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua:111) calls `PerformAttack` with `bProcessProcs=true`. Crit / bash / blur / MKB roll on every attack, so a single trial against a `theoretical` expected value will fail whenever the attacker carries any proc item.

**Changes:**
- Add `trials` (default `1`) to the fixture schema in [scripts/export-engine-fixture.js](../../../scripts/export-engine-fixture.js); thread it through `luaFixtureRecord`.
- In Lua, wrap `RunAttackWindowFixture` / `RunSequenceFixture` in a loop. Reset target HP between trials with `SetHealth` (state already calibrated). Track `observedDamageSamples[]` and emit `observedDamageMean`, `observedDamageStdev`, `observedDamageMin`, `observedDamageMax` alongside the existing `observedDamage` (keep last sample for compatibility).
- Update [scripts/compare-engine-result.js](../../../scripts/compare-engine-result.js): when `observedDamageSamples` is present, compare against `expectedAdjusted` using the sample mean and widen the absolute tolerance to `max(1, 1.96 * stdev / sqrt(n))`.
- Default `trials = 1` for fixtures that have no proc/crit items so existing scenarios keep current cost; fixtures with `bProcessProcs=true` AND known proc items should opt into `trials >= 200`.

**Verify:** rerun the latest `batch engine probe matrices` fixtures with `trials = 1` first (must reproduce current numbers), then bump trial counts for the crit-bearing fixtures and confirm pass rates stabilize.

### Task 2 — Invisibility-break timing

**Why:** [dota_helper_fixture_runner.lua:97-99](../../../tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua:97) casts Shadow Blade / Silver Edge then immediately performs attacks in the same tick. The attacker has not yet entered `modifier_invisible`, so the break-attack bonus does not fire and the proc-damage assertion never activates.

**Changes:**
- In `PrepareInvisibilityBreak`, schedule a `SetThink` callback for `cast_point + fade_time + 0.1s` (read from the item's `KeyValues`, fall back to `0.7s`).
- Move the attack loop into the think callback so the first attack lands while `modifier_invisible` is active.
- Alternative path: skip the cast and directly add the relevant modifier via `unit:AddNewModifier(unit, item, "modifier_item_invis_sword_windwalk", {duration = 5})`. Acceptable as long as the modifier name is taken from the item KV. Document which path is chosen.

**Verify:** smoke fixture with a Shadow Blade + level 1 hero attacking a 0-armor dummy; expected damage rises by the item's `windwalk_bonus_damage`.

### Task 3 — Sequence step chaining

**Why:** [dota_helper_fixture_runner.lua:178-184](../../../tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua:178) iterates steps synchronously inside one tick. Active items with cast points or projectiles (Dagon, Veil, Ethereal Blade) have not finished resolving when subsequent attack steps run, so their damage is partially or fully missed before the final `GetHealth` read.

**Changes:**
- Replace the `for _, step in ipairs(steps)` loop with a chained `SetThink`-driven state machine. Each step declares an optional `postDelaySeconds`; the runner waits that long after the step's primary action (cast / attack burst) before moving to the next step.
- Default `postDelaySeconds`: `0` for `attack_window`, `0.5` for `active_item`, `0` for any new step type without timing.
- The final-result `SetThink` uses `sum(postDelaySeconds) + scenario.resultDelaySeconds` so reading `GetHealth` happens after all projectiles land.

**Verify:** sequence fixture `dagon level 5 → 3 attacks`. Without this fix, observed damage equals only attack damage; with the fix it matches expected (Dagon + attacks).

### Task 4 — Calibrate magic resistance unit

**Why:** [dota_helper_fixture_runner.lua:334-335](../../../tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua:334) passes `magicResistancePercent` straight into `SetBaseMagicalResistanceValue`. Workshop Tools historically expects a 0–1 float; the fixture field name implies 0–100. The two interpretations differ by 100×, which silently inflates or deflates every magical-damage comparison.

**Changes:**
- Add a one-shot calibration fixture under `test-runs/dota-engine-verification/`: target with `magicResistancePercent = 50`, then probe `GetMagicalArmorValue` (returns the effective resistance the engine uses). Record the result in [docs/](../../).
- Based on the observed unit, either:
  - **(A)** keep the field as `0–100` and divide by 100 in Lua before calling `SetBaseMagicalResistanceValue`; or
  - **(B)** rename the field to `magicResistanceFraction` in fixtures and Lua, and update [dotaDataContext.js](../../../dotaDataContext.js) emitters accordingly.
- Add a unit-check assertion to `compare-engine-result.js` that warns if `engine.targetMagicResistance` deviates from `fixture.target.magicResistance*` by more than 0.05 (whichever unit you settle on).

**Verify:** rerun any magical-damage fixture (e.g., Lina Laguna level 1) and confirm `observedDamage` matches `expectedAdjusted` to within tolerance.

### Task 5 — Per-fixture proc / orb gating

**Why:** Currently `bProcessProcs` and `bUseCastAttackOrb` are hard-coded `true` in `PerformAttack`. Pure-physical baseline fixtures pay the cost of crit/orb variance even when neither side has those items, and there is no way to disable them when a fixture needs deterministic output.

**Changes:**
- Extend the fixture schema with optional `scenario.attackFlags = { processProcs: boolean, useCastAttackOrb: boolean, skipCooldown: boolean, neverMiss: boolean }`, defaults `{ processProcs: false, useCastAttackOrb: false, skipCooldown: true, neverMiss: true }`.
- In Lua, read these flags and pass them through `PerformAttack`. Default `processProcs=false` matches the deterministic baseline path.
- For fixtures that explicitly test crit / bash / orb, set `processProcs=true` and require `trials >= 200` (validated in the comparer; fail fast otherwise).

**Verify:** existing non-proc fixtures pass with `processProcs=false`; the dedicated crit fixture (e.g., Phantom Assassin at level 18 with Daedalus) passes once `trials=400`.

## Out-of-scope / future work

- Forcing crit deterministically via `modifier_crit` injection (would replace Task 5 trial sampling but requires per-hero modifier names).
- Verifying delayed-damage spells with re-entrancy (e.g., Sven cleave on multiple targets).
- Sharing fixture trials across N parallel addon instances.

## Acceptance criteria

- `batch engine probe matrices` produces stable pass rates across 3 consecutive runs (no flakes from crit variance). Verified: 3 consecutive real Dota runs passed 4/4.
- Shadow Blade / Silver Edge break-damage fixture passes. Verified with `pa_shadow_blade_break_matrix_probe`.
- Dagon + attacks sequence fixture passes. Verified with `pa_dagon_broadsword_sequence_probe`.
- Magic-resistance unit is documented and consistent end-to-end. Verified with 50% MR Dagon calibration in [docs/dota-engine-magic-resistance-calibration.md](../../dota-engine-magic-resistance-calibration.md).
- Stochastic crit sampling passes with enough trials. Verified with `pa_daedalus_trial_probe`, PA level 12, Daedalus, 400 trials.
- All schema additions are backwards-compatible (missing fields fall back to current defaults).
