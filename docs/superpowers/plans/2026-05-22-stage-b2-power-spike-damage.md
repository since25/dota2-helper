# Stage B2 Power Spike Damage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend-calculated hero key-level burst windows so AI advice can reason from explicit damage, cooldown, and mana facts instead of model memory.

**Architecture:** Add a focused `damageExtractor.js` module for reading damage/cooldown/mana fields from `dotaconstants` ability objects, then add `powerSpikeContext.js` to build level-based burst summaries for each hero. Integrate the summaries into `dotaDataContext.js` and the grounded Chinese prompt.

**Tech Stack:** Node.js CommonJS modules, `dotaconstants`, Node built-in test runner.

---

### Task 1: Damage Extraction

**Files:**
- Create: `damageExtractor.js`
- Create: `test/damageExtractor.test.js`

- [ ] **Step 1: Write failing tests**

Cover fixed damage skills (`Scream Of Pain`, `Finger of Death`), pure damage (`Sonic Wave`), scaling damage caveats (`Double Edge`), and damage-over-time caveats (`Macropyre`).

- [ ] **Step 2: Implement extractor**

Export `extractAbilityDamage(ability)` and helpers for level-indexed values, cooldown, mana cost, damage type, and caveat detection.

- [ ] **Step 3: Verify**

Run `npm test` and confirm extractor tests pass.

### Task 2: Power Spike Builder

**Files:**
- Create: `powerSpikeContext.js`
- Create: `test/powerSpikeContext.test.js`

- [ ] **Step 1: Write failing tests**

Build spikes for Queen of Pain, Lion, Centaur Warrunner, and Jakiro. Assert level 6 QOP includes `Sonic Wave`, Lion includes `Finger of Death`, Centaur marks strength-scaling caveat, and Jakiro marks duration damage caveat.

- [ ] **Step 2: Implement builder**

Export `buildHeroPowerSpikes(heroDetails)` with key levels 3, 5, 6, 7, 12, and 18.

- [ ] **Step 3: Verify**

Run `npm test` and confirm spike tests pass.

### Task 3: Match Context Integration

**Files:**
- Modify: `dotaDataContext.js`
- Modify: `test/dotaDataContext.test.js`

- [ ] **Step 1: Write failing integration assertions**

Assert `buildMatchContext()` includes `playerPowerSpikes`, `enemyPowerSpikes`, and prompt text for `关键等级爆发窗口`.

- [ ] **Step 2: Integrate context**

Add player, lane opponent, and all enemy power spike summaries to match context.

- [ ] **Step 3: Verify**

Run `npm test`.

### Task 4: Prompt Contract

**Files:**
- Modify: `dotaDataContext.js`

- [ ] **Step 1: Update prompt**

Add a dedicated `关键等级爆发窗口` context section and instruct the AI to use calculated values for kill-window reasoning.

- [ ] **Step 2: Verify**

Run `npm test`, syntax checks, and a local `/api/get-tips` smoke test with a fake AI endpoint.
