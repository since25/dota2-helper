# Engine Fixture File Trigger Reload Spec

**Status:** implemented locally
**Date:** 2026-05-26
**Scope:** `scripts/export-engine-fixture.js`, `tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua`, `tools/dota-addon/README.md`.

## Background

The previous no-restart workflow used the Dota console command `dota_helper_run_fixture`. The command is still useful as a manual fallback, but live verification showed that console input can be captured by the hero picker or chat UI instead of the console. Multi-monitor setups make the focus target even less reliable.

## Goal

Regenerated fixtures should re-run in an already-loaded local addon session without relying on screen focus, console typing, Steam overlay state, or a specific monitor.

## Design

- The Node fixture exporter writes `dota_helper_fixture.lua` as before.
- The exporter also writes `dota_helper_fixture_trigger.lua` in the same Lua output directory.
- The trigger module contains a lightweight table with `runId` and `fixtureId`.
- The Lua runner polls `generated.dota_helper_fixture_trigger` every 0.5 seconds.
- Each poll clears only the trigger module from `package.loaded`, then requires it again.
- If `runId` changes, the runner calls the existing `ReloadFixture()` path and schedules `RunNextFixture`.
- The console command remains available as a fallback and uses the same reload path.

## Non-goals

- No RCON bridge.
- No macOS window automation.
- No server runtime change; the addon remains local-only.
- No runner-code hot reload; Lua runner source changes still require a map or client restart.

## Verification

- `node --test test/engineFixtureExport.test.js test/dotaAddonRunner.test.js`
- `npm test`
- Optional live check: while the addon is loaded, regenerate and sync the fixture files. The console log should print `[dota-helper] fixture trigger changed: <runId>` and then emit the new fixture JSON result.
