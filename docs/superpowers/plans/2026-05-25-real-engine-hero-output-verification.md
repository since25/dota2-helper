# Real Engine Hero Output Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the local Dota 2 verifier from plain attack windows into item-trigger probes and add a repeatable detector for real hero output model readiness.

**Architecture:** Keep server code independent from Dota 2. Fixture export remains the boundary from JavaScript model to Lua addon. The hero detector is a local CLI that builds calculator scenarios from curated hero models and reports which outputs are engine-verifiable now, which need runtime inputs, and which still need semantic repair.

**Tech Stack:** Node.js `node:test`, existing CommonJS modules, local Dota 2 VScript Lua addon, ignored `test-runs/` probe artifacts.

---

### Task 1: Preserve The Plan

**Files:**
- Create: `docs/superpowers/plans/2026-05-25-real-engine-hero-output-verification.md`

- [ ] **Step 1: Write this plan file**

Use `apply_patch` to add this document with explicit tasks and verification commands.

- [ ] **Step 2: Verify the plan file exists**

Run: `test -f docs/superpowers/plans/2026-05-25-real-engine-hero-output-verification.md`

Expected: exit code `0`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-05-25-real-engine-hero-output-verification.md
git commit -m "docs: plan real engine hero output verification" -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```

### Task 2: Add Item Trigger Fields To Engine Fixtures

**Files:**
- Modify: `scripts/export-engine-fixture.js`
- Modify: `test/engineFixtureExport.test.js`
- Modify: `tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua`
- Modify: `test/dotaAddonRunner.test.js`

- [ ] **Step 1: Write failing tests**

Add a fixture export test proving `forceInvisibilityBreak`, `forceCritSource`, and `activeItemKey` are emitted to Lua scenario config. Add a Lua source test checking for `CastActiveItem` and invisibility setup hooks.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test test/engineFixtureExport.test.js test/dotaAddonRunner.test.js`

Expected: FAIL because Lua runner does not yet expose the new hooks.

- [ ] **Step 3: Implement minimal Lua runner hooks**

Support three optional fixture scenario fields:
- `forceInvisibilityBreak`: call the item ability on attacker before the attack when possible, then perform one attack.
- `forceCritSource`: preserve current deterministic local model field; Lua does not force random crit yet, but emits diagnostic metadata.
- `activeItemKey`: locate `item_<key>` on attacker, cast it at target, wait briefly, then measure health loss.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test test/engineFixtureExport.test.js test/dotaAddonRunner.test.js`

Expected: PASS.

### Task 3: Run Real Dota Item Probes

**Files:**
- Generated ignored: `test-runs/dota-engine-verification/*.json`
- Generated ignored: `tools/dota-addon/generated/fixture.json`
- Generated ignored: `tools/dota-addon/scripts/vscripts/generated/dota_helper_fixture.lua`

- [ ] **Step 1: Generate Shadow Blade probe**

Create a scenario for PA level 12, `invis_sword`, 1 attack, creep target, armor 10, `forceInvisibilityBreak: true`.

- [ ] **Step 2: Sync addon and launch Dota**

Run `rsync -a tools/dota-addon/ "$HOME/Library/Application Support/Steam/steamapps/common/dota 2 beta/game/dota_addons/dota_helper_probe/"`, then launch with `+dota_launch_custom_game dota_helper_probe dota`.

- [ ] **Step 3: Extract VScript JSON and compare**

Write the latest matching console JSON into `test-runs/dota-engine-verification/`, then run `npm run engine:compare`.

- [ ] **Step 4: Record outcome**

If the result fails, identify whether the root cause is local model semantics, Lua fixture behavior, or Dota target mechanics before changing code.

### Task 4: Add Real Hero Output Detector

**Files:**
- Create: `scripts/hero-output-verification.js`
- Create: `test/heroOutputVerification.test.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Test that the detector reports implemented hero components, flags runtime input requirements, and marks engine-verifiable attack windows separately from non-engine-supported spell models.

- [ ] **Step 2: Run RED**

Run: `node --test test/heroOutputVerification.test.js`

Expected: FAIL because the script does not exist.

- [ ] **Step 3: Implement detector**

Export `buildHeroOutputVerificationReport(options)`. The report includes `heroesChecked`, `totals`, and per-hero entries with component id, kind, damage type, status, required runtime inputs, and `engineProbeSupported`.

- [ ] **Step 4: Add npm script**

Add `"damage:verify-heroes": "node scripts/hero-output-verification.js"` to `package.json`.

- [ ] **Step 5: Run GREEN**

Run: `node --test test/heroOutputVerification.test.js`

Expected: PASS.

### Task 5: Final Verification And Commit

**Files:**
- All modified source and tests from Tasks 2-4

- [ ] **Step 1: Run focused tests**

Run: `node --test test/engineFixtureExport.test.js test/dotaAddonRunner.test.js test/heroOutputVerification.test.js`

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 3: Ensure no Dota process remains**

Run: `pgrep -fl 'dota2.app/Contents/MacOS/dota2' || true`

Expected: no Dota game process.

- [ ] **Step 4: Commit**

```bash
git add scripts/export-engine-fixture.js tools/dota-addon/scripts/vscripts/dota_helper_fixture_runner.lua test/engineFixtureExport.test.js test/dotaAddonRunner.test.js scripts/hero-output-verification.js test/heroOutputVerification.test.js package.json
git commit -m "feat: verify hero output models against engine probes" -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
```
