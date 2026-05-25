# Dota 2 Engine Verification Addon

This folder is a local-only Dota 2 Workshop Tools verifier for the damage model. It is not required on the remote server and is not loaded by `npm start`.

## Workflow

1. Export a fixture from the Node calculator:

   ```bash
   npm run engine:fixture -- test-runs/dota-engine-verification/scenario.json tools/dota-addon/generated/fixture.json
   ```

2. Copy or sync `tools/dota-addon/` into a local Dota 2 custom game addon while developing the verifier.
3. Launch the addon with Dota 2 Workshop Tools.
4. Run the fixture in Lua and copy the JSON-like result from the console or generated result file.
5. Compare the measured result:

   ```bash
   npm run engine:compare -- tools/dota-addon/generated/fixture.json test-runs/dota-engine-verification/engine-result.json
   ```

## Server Policy

The production server never runs Dota 2, Workshop Tools, or these Lua files. The addon is a development calibration tool only.
