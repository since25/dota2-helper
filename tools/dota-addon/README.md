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

## Server Policy

The production server never runs Dota 2, Workshop Tools, or these Lua files. The addon is a development calibration tool only.

## Current Scope

The runner currently supports the first `attack_window` probe: it creates attacker and target hero units, applies hero levels, adds items, performs one controlled attack, and prints observed health loss. More complex cases such as active items, spells, invisibility timing, crit sampling, and delayed damage should be added as separate probes after confirming the exact Workshop Tools API behavior locally.
