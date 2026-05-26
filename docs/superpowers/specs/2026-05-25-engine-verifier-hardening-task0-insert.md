# Insert Task 0 into engine-verifier-hardening spec

**Status:** applied amendment
**Date:** 2026-05-25
**Parent spec:** [2026-05-25-engine-verifier-hardening.md](./2026-05-25-engine-verifier-hardening.md)
**When to apply:** before continuing Task 1. Applied in the local verifier hardening branch and folded into the parent spec.

## Reason for the insert

Tasks 1–5 in the parent spec all require iterating on Lua fixture output. With the current runner, each iteration forces a full Dota 2 client restart because:

1. `require("generated.dota_helper_fixture")` caches the fixture module in `package.loaded`; the running process never re-reads the regenerated `.lua` file.
2. `DotaHelperFixtureRunner:InitGameMode` is the only place that triggers `RunNextFixture`, and it only fires once per game session.
3. Workshop Tools' `script_reload` does not clear `package.loaded`, so even reloading the runner picks up the cached fixture.

Closing and reopening the client between iterations adds 1–2 minutes per probe and will dominate Task 1 (multi-trial sampling) wall-clock cost. Fix the workflow before scaling up trial counts.

## Task 0 — Console-driven fixture reload

### Scope

`tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua` only. No Node-side changes. No fixture-schema changes. Backwards compatible: first-launch behavior is unchanged.

### Changes

1. **Add a `ReloadFixture` method** that clears the `package.loaded` entry, re-requires the fixture, resets `fixtureIndex`, and calls `CleanupFixtureUnits`. Also nil out any pending think state (`pendingSequenceFixture`, `pendingActiveItemFixture`) to prevent double-fire on re-run.

   ```lua
   function DotaHelperFixtureRunner:ReloadFixture()
     package.loaded["generated.dota_helper_fixture"] = nil
     local ok, fixture = pcall(require, "generated.dota_helper_fixture")
     if not ok or fixture == nil then
       print("[dota-helper] reload failed: " .. tostring(fixture))
       return false
     end
     self.fixture = fixture
     self.fixtures = fixture.fixtures or { fixture }
     self.fixtureIndex = 0
     self.pendingSequenceFixture = nil
     self.pendingActiveItemFixture = nil
     self:CleanupFixtureUnits()
     return true
   end
   ```

2. **Register a console command in `InitGameMode`** that calls `ReloadFixture` then schedules `RunNextFixture`. Keep the existing first-launch `SetThink` block intact so behavior on map load is unchanged.

   ```lua
   Convars:RegisterCommand("dota_helper_run_fixture", function()
     if self:ReloadFixture() then
       print("[dota-helper] re-running fixture batch")
       GameRules:GetGameModeEntity():SetThink(
         "RunNextFixture", self, "dota_helper_fixture", 0.2)
     end
   end, "Reload and run dota-helper fixture batch", FCVAR_CHEAT)
   ```

   The closure captures `self`, so this must be inside `InitGameMode` after `self.fixtures` is initialized. Register before the first-launch `SetThink` so a fixture that fails to load on launch can still be retried from console.

3. **Update `tools/dota-addon/README.md`** with the new in-game workflow:

   ```text
   ## Iterating without restarting

   After the first map load you can re-run any regenerated fixture from the
   Dota 2 console without restarting the client:

   1. Regenerate the fixture from Node:
      npm run engine:fixture -- <scenario.json> <fixture.json>
   2. In the Dota console, run:
      dota_helper_run_fixture
   3. Read the new JSON result from the console log.

   Requires sv_cheats 1 (the command is registered FCVAR_CHEAT).
   ```

### Out of scope for Task 0

- Auto-triggering the command from Node (no RCON bridge).
- Hot-reloading the runner itself (`script_reload` quirks). Only the fixture module is reloaded; runner-code changes still require restart.
- Changing fixture schema, trial counts, or attack flags — those belong to Tasks 1 and 5.

### Verify

- Launch the addon once. Confirm the first batch still runs on its own (no regression).
- Edit `test-runs/dota-engine-verification/scenario.json`, rerun `npm run engine:fixture`, then in the Dota console type `dota_helper_run_fixture`. The new batch's `id`s and `observedDamage` values must appear in the console log without restarting the client.
- Run `dota_helper_run_fixture` twice in a row without regenerating: the second run should print the same results, no double-fire of pending sequence/active-item finishers, and no leaked units on the map.

### Acceptance

- Iteration loop for any subsequent Task no longer requires closing Dota 2.
- First-launch path is unchanged (existing fixtures still auto-run on map load).
- `sv_cheats 1` is the only precondition for the command.

## Applied notes

- `ReloadFixture` clears the generated fixture module cache and resets pending sequence, active item, and invisibility-break state.
- `dota_helper_run_fixture` is registered from `InitGameMode` while preserving the first-launch auto-run path.
- The README documents the no-restart workflow and the `sv_cheats 1` precondition.
