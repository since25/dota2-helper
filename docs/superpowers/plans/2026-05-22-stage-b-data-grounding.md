# Stage B Data Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chinese hero input normalization and richer `dotaconstants`-grounded AI context while keeping the current Markdown frontend.

**Architecture:** Add focused CommonJS modules for hero aliases and match context building, then make `server.js` consume those modules instead of assembling thin prompt context inline. Keep `dotaconstants` as the data source for this stage and preserve the configurable OpenAI-compatible AI client.

**Tech Stack:** Node.js CommonJS modules, Express, `dotaconstants`, Node built-in test runner.

---

### Task 1: Hero Alias Normalization

**Files:**
- Create: `heroAliases.js`
- Create: `test/heroAliases.test.js`

- [ ] **Step 1: Write failing tests**

Create tests that prove Chinese aliases and English abbreviations normalize to canonical English hero names, and that unknown values return `null`.

- [ ] **Step 2: Implement `heroAliases.js`**

Export `normalizeHeroName(input)`, `HERO_ALIASES`, and `CANONICAL_HERO_NAMES`.

- [ ] **Step 3: Verify**

Run `npm test` and confirm alias tests pass.

### Task 2: Match Context Builder

**Files:**
- Create: `dotaDataContext.js`
- Create: `test/dotaDataContext.test.js`

- [ ] **Step 1: Write failing tests**

Test that the builder returns patch, normalized teams, player hero ability context, lane opponent abilities, role items, and data coverage.

- [ ] **Step 2: Implement `dotaDataContext.js`**

Move `dotaconstants` data access and prompt-ready context building into the new module.

- [ ] **Step 3: Verify**

Run `npm test` and confirm context tests pass.

### Task 3: Chinese Grounded Prompt

**Files:**
- Modify: `dotaDataContext.js`
- Create: `test/prompt.test.js`

- [ ] **Step 1: Write failing prompt tests**

Test that generated prompts require Simplified Chinese output, prohibit invented numerical facts, and include data coverage.

- [ ] **Step 2: Implement prompt builder**

Export `buildGroundedChinesePrompt(matchContext)` and use the richer context sections.

- [ ] **Step 3: Verify**

Run `npm test` and confirm prompt tests pass.

### Task 4: Server Integration

**Files:**
- Modify: `server.js`
- Modify: `script.js`

- [ ] **Step 1: Backend integration**

Use `normalizeHeroName`, `buildMatchContext`, and `buildGroundedChinesePrompt` inside `/api/heroes` and `/api/get-tips`.

- [ ] **Step 2: Frontend integration**

Expose aliases in `/api/heroes` and use them to autocorrect Chinese input before validation.

- [ ] **Step 3: Verify**

Run `npm test`, `node --check server.js script.js heroAliases.js dotaDataContext.js`, and a local server smoke test.
