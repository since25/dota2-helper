# Dota 2 Engine Verification Addon

This folder is a local-only Dota 2 Workshop Tools verifier for the damage model. It is not required on the remote server and is not loaded by `npm start`.

## Workflow

1. Export a fixture from the Node calculator:

   ```bash
   npm run engine:fixture -- test-runs/dota-engine-verification/scenario.json tools/dota-addon/generated/fixture.json
   ```

   This also writes `scripts/vscripts/generated/dota_helper_fixture.lua` for the Lua runner.

2. Copy or sync `tools/dota-addon/` into a local Dota 2 custom game addon while developing the verifier.
3. Launch the addon with Dota 2 Workshop Tools.
4. Run the fixture in Lua and copy the JSON-like result printed by the console.
5. Save that result as an engine result JSON file, then compare the measured result:

   ```bash
   npm run engine:compare -- tools/dota-addon/generated/fixture.json test-runs/dota-engine-verification/engine-result.json
   ```

On macOS, this command can launch the probe through the running Steam client:

```bash
"$HOME/Library/Application Support/Steam/Steam.AppBundle/Steam/Contents/MacOS/steam_osx" \
  -applaunch 570 \
  -console -condebug +developer 1 \
  +dota_launch_custom_game dota_helper_probe dota
```

Console output is written to `~/Library/Application Support/Steam/steamapps/common/dota 2 beta/game/dota/console.log`.

## Iterating without restarting

After the first map load, regenerated fixtures are re-run without restarting the client or relying on screen focus:

1. Regenerate the fixture from Node:

   ```bash
   npm run engine:fixture -- <scenario.json> <fixture.json>
   ```

2. Sync `tools/dota-addon/` into the local custom game addon if it is not already synced.

3. The exporter writes `scripts/vscripts/generated/dota_helper_fixture_trigger.lua` next to `dota_helper_fixture.lua`. The runner polls that trigger file and automatically reloads `generated.dota_helper_fixture` when its `runId` changes.

4. Read the new JSON result from the console log.

The console command remains available as a manual fallback:

   ```text
   dota_helper_run_fixture
   ```

The fallback command requires `sv_cheats 1`; it is registered as `FCVAR_CHEAT`. Both paths reload only `generated.dota_helper_fixture`, so runner-code changes still require a map/client restart.

## Server Policy

The production server never runs Dota 2, Workshop Tools, or these Lua files. The addon is a development calibration tool only.

## Current Scope

The runner currently supports the first `attack_window` probe: it creates attacker and target units, applies hero levels, calibrates target total armor, adds items, performs a controlled number of attacks, and prints observed health loss with diagnostic fields. More complex cases such as active items, spells, invisibility timing, crit sampling, and delayed damage should be added as separate probes after confirming the exact Workshop Tools API behavior locally.
