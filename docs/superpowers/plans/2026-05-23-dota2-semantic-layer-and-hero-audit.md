# Dota2 Semantic Layer And Hero Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Dota 2 numeric semantic layer, then use it to audit and stabilize every curated hero damage model.

**Architecture:** Keep raw patch numbers in provider data, but require every curated model entry to declare what each number means before it can enter calculator or LLM context. Add a semantic catalog, schema validation, resolver normalization, audit tooling, and a batch review workflow for all heroes.

**Tech Stack:** CommonJS modules, Node built-in test runner, existing `dotaconstants` provider, planned `dota2-datawrapper` provider, existing `damageModels`, `damageCalculator`, `powerSpikeContext`, and Express API.

---

## Current Problem

The project currently has a useful damage model layer, but it is not yet a full Dota 2 numeric semantic system. `damageModels/schema.js` knows coarse mechanics such as `instant_fixed`, `sustained_dps`, `multi_wave`, `attack_sequence`, and `debuff_reference`. It does not yet fully define whether a raw number is direct damage, attack damage bonus, armor reduction, cast range, move speed, control duration, mana pressure, spell amplification, damage block, or another combat modifier.

The Slardar bug came from this gap: numeric references were extracted correctly from local data, but the semantic meaning was too vague, so non-damage values leaked into damage references.

## Target Shape

Every model component should answer these questions:

- What is the raw source field?
- What semantic type is this number?
- Is it direct damage, a damage modifier, a defense modifier, a resource value, a control/window value, mobility/range, summon data, or a condition?
- Which calculation stage can consume it?
- Is it included in fixed burst, situational damage, modifier reference, or ignored context?
- What unit does it use: flat value, percent, seconds, units, count, chance, multiplier?
- Does sign matter: negative armor reduction, positive bonus armor, negative slow, positive speed bonus?
- Can it stack with other sources, and if yes under what group?

---

## File Structure

- Create: `damageModels/semantics.js`
  - Owns semantic type enums, units, calculation roles, target domains, and label maps.
- Modify: `damageModels/schema.js`
  - Validates model entries against semantic requirements.
- Modify: `damageModels/resolver.js`
  - Emits normalized semantic metadata for every component.
- Modify: `powerSpikeContext.js`
  - Uses semantic roles instead of ad hoc `isDamageReference` checks.
- Modify: `dotaDataContext.js`
  - Formats semantic references in Chinese for LLM grounding.
- Create: `scripts/semantic-audit.js`
  - Scans raw ability fields and curated models, then reports unmapped or suspicious numeric fields.
- Create: `test/damageModelSemantics.test.js`
  - Pins semantic enum behavior and labels.
- Modify: `test/damageModelSchema.test.js`
  - Requires semantic metadata where needed.
- Modify: `test/damageModelResolver.test.js`
  - Confirms normalized semantic output.
- Modify: `test/powerSpikeContext.test.js`
  - Confirms semantic routing into fixed damage, situational damage, and modifiers.
- Create: `docs/dota2-semantic-layer.md`
  - Human-readable reference for future hero model authors.

---

## Semantic Catalog V1

### Direct Damage

- `damage.instant`
- `damage.sustained_dps`
- `damage.tick`
- `damage.wave`
- `damage.attack_bonus`
- `damage.attack_sequence_proc`
- `damage.percent_max_health`
- `damage.percent_current_health`
- `damage.percent_missing_health`
- `damage.percent_missing_mana`
- `damage.attribute_scaling`
- `damage.distance_scaling`
- `damage.stack_scaling`
- `damage.death_trigger`

### Offensive Modifiers

- `modifier.attack_damage.flat`
- `modifier.attack_damage.percent`
- `modifier.attack_speed.flat`
- `modifier.base_attack_time`
- `modifier.crit.chance`
- `modifier.crit.multiplier`
- `modifier.spell_amplification.percent`
- `modifier.damage_amp.percent`
- `modifier.armor_reduction.flat`
- `modifier.magic_resistance_reduction.percent`

### Defensive Modifiers

- `defense.armor.flat`
- `defense.magic_resistance.percent`
- `defense.damage_reduction.percent`
- `defense.damage_block.flat`
- `defense.evasion.percent`
- `defense.barrier.flat`
- `defense.heal.flat`
- `defense.heal.percent`
- `defense.regen.hp_per_second`
- `defense.lifesteal.percent`

### Control And Windows

- `control.stun.seconds`
- `control.silence.seconds`
- `control.hex.seconds`
- `control.taunt.seconds`
- `control.root.seconds`
- `control.disarm.seconds`
- `control.slow.move_percent`
- `control.slow.attack_flat`
- `window.debuff_duration.seconds`
- `window.buff_duration.seconds`

### Mobility, Range, And Area

- `mobility.move_speed.flat`
- `mobility.move_speed.percent`
- `mobility.cast_range.units`
- `mobility.dash_range.units`
- `area.radius.units`
- `area.width.units`
- `projectile.speed.units_per_second`

### Resources And Timing

- `resource.mana_cost`
- `resource.health_cost`
- `resource.cooldown`
- `resource.charge_count`
- `resource.charge_restore_time`

### Summons And Unit Proxies

- `summon.attack_damage`
- `summon.attack_interval`
- `summon.duration`
- `summon.count`
- `summon.health`

### Conditions

- `condition.requires_attack_count`
- `condition.requires_target_death`
- `condition.requires_target_state`
- `condition.requires_stack_count`
- `condition.requires_hero_attribute`
- `condition.requires_current_hp`
- `condition.requires_current_mana`
- `condition.requires_position`
- `condition.requires_illusion_or_summon`

---

## Task 1: Add Semantic Catalog

**Files:**
- Create: `damageModels/semantics.js`
- Create: `test/damageModelSemantics.test.js`

- [ ] **Step 1: Write failing semantic catalog tests**

Create tests that require:

- every semantic type has a Chinese label;
- each semantic type belongs to one category;
- each type has a unit;
- `modifier.armor_reduction.flat` routes to modifier context, not damage context;
- `damage.sustained_dps` routes to situational damage context;
- `damage.instant` routes to fixed damage when the model marks it as default-included.

Run:

```bash
npm test -- test/damageModelSemantics.test.js
```

Expected: fail because `damageModels/semantics.js` does not exist.

- [ ] **Step 2: Implement `damageModels/semantics.js`**

Define:

- `SEMANTIC_TYPES`
- `SEMANTIC_CATEGORIES`
- `SEMANTIC_UNITS`
- `CALCULATION_ROLES`
- `CONTEXT_ROUTES`
- `getSemanticDefinition(type)`
- `routeSemanticToContext(type, options)`
- `formatSemanticLabel(type)`

- [ ] **Step 3: Verify semantic catalog tests**

Run:

```bash
npm test -- test/damageModelSemantics.test.js
```

Expected: all semantic catalog tests pass.

---

## Task 2: Extend Model Schema With Required Semantics

**Files:**
- Modify: `damageModels/schema.js`
- Modify: `test/damageModelSchema.test.js`

- [ ] **Step 1: Add failing schema tests**

Add tests requiring:

- `instant_fixed` entries must either infer `damage.instant` or declare a direct damage semantic type;
- `debuff_reference` entries must declare `semanticType`;
- `reference_only` entries with `valueKey` cannot omit semantic metadata;
- unsupported entries still require a reason but do not require a source field;
- invalid semantic types throw a readable error.

Run:

```bash
npm test -- test/damageModelSchema.test.js
```

Expected: fail on missing semantic validation.

- [ ] **Step 2: Implement schema validation**

Update `validateAbilityEntry()` so:

- direct implemented damage models can infer sensible defaults;
- non-damage reference models require explicit `semanticType`;
- `modifierType` remains temporarily accepted but becomes a compatibility alias;
- errors include hero name, ability name, and missing field.

- [ ] **Step 3: Verify schema tests**

Run:

```bash
npm test -- test/damageModelSchema.test.js
```

Expected: pass.

---

## Task 3: Normalize Resolver Output

**Files:**
- Modify: `damageModels/resolver.js`
- Modify: `test/damageModelResolver.test.js`

- [ ] **Step 1: Add failing resolver tests**

Add tests for these cases:

- Slardar `Guardian Sprint` resolves to `mobility.move_speed.percent`;
- Slardar `Seaborn Sentinel` resolves to `modifier.attack_damage.percent`;
- Slardar `Corrosive Haze` resolves to `modifier.armor_reduction.flat`;
- Queen of Pain `Blink` resolves to `mobility.cast_range.units`;
- Phantom Assassin `Coup de Grace` resolves to `modifier.crit.multiplier` and not `Unknown`;
- Sand King `Sand Storm` resolves to `damage.sustained_dps`.

Run:

```bash
npm test -- test/damageModelResolver.test.js
```

Expected: fail until resolver emits normalized semantic metadata.

- [ ] **Step 2: Implement normalized metadata**

Every resolved component should expose:

```js
semantic: {
  type: 'modifier.armor_reduction.flat',
  category: 'offensive_modifier',
  unit: 'flat',
  contextRoute: 'modifier_reference',
  affects: ['physical_damage'],
  stackGroup: 'armor_reduction',
  sign: 'negative_is_debuff'
}
```

- [ ] **Step 3: Preserve compatibility fields**

Keep existing fields such as `damageType`, `modifierType`, `metadata`, and `caveats` until the UI and prompt code fully migrate.

- [ ] **Step 4: Verify resolver tests**

Run:

```bash
npm test -- test/damageModelResolver.test.js
```

Expected: pass.

---

## Task 4: Route Context By Semantics

**Files:**
- Modify: `powerSpikeContext.js`
- Modify: `test/powerSpikeContext.test.js`

- [ ] **Step 1: Add failing routing tests**

Add tests requiring:

- `damage.instant` with `defaultIncluded` goes into `fixedInstantDamage`;
- `damage.sustained_dps`, `damage.wave`, and attack-sequence refs go into `situationalDamageRefs`;
- offensive and defensive modifiers go into `modifierRefs`;
- mobility/range/control/resource values do not enter damage references unless explicitly marked as damage-relevant;
- no `Unknown` damage type appears for non-damage semantic types.

Run:

```bash
npm test -- test/powerSpikeContext.test.js
```

Expected: fail until routing uses semantic context routes.

- [ ] **Step 2: Replace ad hoc routing**

Update `isModifierReference()` and related collection logic to call `routeSemanticToContext()`.

- [ ] **Step 3: Verify routing tests**

Run:

```bash
npm test -- test/powerSpikeContext.test.js
```

Expected: pass.

---

## Task 5: Format Semantic References For LLM Grounding

**Files:**
- Modify: `dotaDataContext.js`
- Modify: `test/dotaDataContext.test.js`

- [ ] **Step 1: Add failing prompt tests**

Add tests that require prompt output to include:

- `固定瞬时伤害`;
- `条件/持续伤害参考`;
- `数值修正参考`;
- `侵蚀雾霭 1级：护甲变化 -10`;
- no `Unknown` label for non-damage semantic refs;
- no cast range formatted as move speed percent.

Run:

```bash
npm test -- test/dotaDataContext.test.js
```

Expected: fail until prompt formatting reads semantic labels.

- [ ] **Step 2: Implement semantic prompt labels**

Replace modifier label maps with semantic label maps from `damageModels/semantics.js`.

- [ ] **Step 3: Verify prompt tests**

Run:

```bash
npm test -- test/dotaDataContext.test.js
```

Expected: pass.

---

## Task 6: Add Semantic Audit Tool

**Files:**
- Create: `scripts/semantic-audit.js`
- Modify: `package.json`
- Create: `test/semanticAudit.test.js`

- [ ] **Step 1: Add failing audit tests**

The audit should report:

- modeled hero count;
- modeled ability count;
- unmodeled visible ability count;
- model entries missing semantic type;
- raw numeric fields not referenced by a curated model;
- suspicious mappings such as `%` fields routed as flat damage.

Run:

```bash
npm test -- test/semanticAudit.test.js
```

Expected: fail until audit script exists.

- [ ] **Step 2: Implement audit library and CLI**

Expose a reusable function and a CLI:

```bash
node scripts/semantic-audit.js --hero Slardar
node scripts/semantic-audit.js --all --json
```

Add package script:

```json
"semantic:audit": "node scripts/semantic-audit.js --all"
```

- [ ] **Step 3: Verify audit tests and CLI**

Run:

```bash
npm test -- test/semanticAudit.test.js
npm run semantic:audit
```

Expected: tests pass and CLI prints a readable report.

---

## Task 7: Migrate First-Batch Hero Models

**Files:**
- Modify: `damageModels/heroes/slardar.js`
- Modify: `damageModels/heroes/sand_king.js`
- Modify: `damageModels/heroes/queen_of_pain.js`
- Modify: `damageModels/heroes/lion.js`
- Modify: `damageModels/heroes/lina.js`
- Modify: `damageModels/heroes/axe.js`
- Modify: `damageModels/heroes/shadow_fiend.js`
- Modify: `damageModels/heroes/phantom_assassin.js`
- Modify: `damageModels/heroes/faceless_void.js`
- Modify: `damageModels/heroes/venomancer.js`
- Modify: existing model tests

- [ ] **Step 1: Add semantic expectations for each first-batch hero**

For every modeled ability, add one assertion that checks the resolved `semantic.type`.

- [ ] **Step 2: Migrate hero configs**

Add `semanticType` to every curated entry. Add `affects` for every modifier, defense, control, mobility, resource, and summon semantic. Add `stackGroup` for armor reduction, magic resistance reduction, damage amplification, spell amplification, attack speed, attack damage, critical strike, evasion, barrier, and damage reduction semantics. Add `conditionInputs` for every `condition.*`, percent-health, missing-resource, attribute-scaling, distance-scaling, stack-scaling, chance-based, summon-proxy, and copied-skill semantic.

- [ ] **Step 3: Run first-batch tests**

Run:

```bash
npm test -- test/damageModelFirstBatch.test.js test/damageModelResolver.test.js test/powerSpikeContext.test.js
```

Expected: pass.

- [ ] **Step 4: Run semantic audit on first batch**

Run:

```bash
node scripts/semantic-audit.js --hero Slardar
node scripts/semantic-audit.js --hero Sand\\ King
node scripts/semantic-audit.js --hero Phantom\\ Assassin
```

Expected: no missing semantic type in curated entries.

---

## Task 8: Define 127-Hero Audit Workflow

**Files:**
- Create: `docs/dota2-hero-model-audit-workflow.md`
- Modify: `scripts/damage-coverage.js`
- Modify: `scripts/semantic-audit.js`

- [ ] **Step 1: Add workflow document**

Document the per-hero review checklist:

1. Confirm visible abilities from provider data.
2. Identify direct damage fields.
3. Identify sustained, wave, tick, attack, chance, and conditional damage.
4. Identify offensive modifiers such as armor reduction, magic resistance reduction, spell amp, damage amp, attack speed, and crit.
5. Identify defensive, control, resource, mobility, range, area, summon, and condition fields.
6. Mark unmodeled mechanics as `unsupported` with a reason.
7. Add semantic tests.
8. Run audit.
9. Inspect prompt line for the hero.

- [ ] **Step 2: Add batch group list**

Use mechanism clusters rather than alphabetical order:

- Batch A: simple nukers and direct-damage supports.
- Batch B: sustained and tick-damage heroes.
- Batch C: attack modifiers, bashes, crits, and cleave-like mechanics.
- Batch D: armor, magic resistance, damage amp, and spell amp heroes.
- Batch E: summons, wards, illusions, and unit proxies.
- Batch F: percent-health, missing-health, missing-mana, attribute-scaling, and stack-scaling heroes.
- Batch G: transformation and copied-skill edge cases.
- Batch H: remaining low-damage utility heroes.

- [ ] **Step 3: Add coverage gates**

Update coverage output to include:

- total heroes;
- curated heroes;
- curated abilities;
- semantic-complete abilities;
- unsupported abilities with reason;
- inferred fallback abilities.

---

## Task 9: Add Item Modifier Foundation

**Files:**
- Create: `itemModels/schema.js`
- Create: `itemModels/registry.js`
- Create: `itemModels/items/desolator.js`
- Create: `itemModels/items/assault_cuirass.js`
- Create: `test/itemModelSemantics.test.js`

- [ ] **Step 1: Add failing item semantic tests**

Tests should require:

- Desolator maps its armor reduction to `modifier.armor_reduction.flat`;
- Assault Cuirass maps aura armor reduction to `modifier.armor_reduction.flat`;
- item modifiers share the same semantic catalog as hero abilities;
- item modifiers can be listed separately without being summed into raw fixed damage.

- [ ] **Step 2: Implement minimal item model foundation**

Do not build a full item simulator yet. Only expose item semantic modifiers for prompt and future calculator use.

- [ ] **Step 3: Verify item tests**

Run:

```bash
npm test -- test/itemModelSemantics.test.js
```

Expected: pass.

---

## Task 10: Final Verification

**Files:**
- All files touched by previous tasks

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run syntax checks**

Run:

```bash
node --check damageModels/semantics.js
node --check damageModels/schema.js
node --check damageModels/resolver.js
node --check powerSpikeContext.js
node --check dotaDataContext.js
node --check scripts/semantic-audit.js
```

Expected: no syntax errors.

- [ ] **Step 3: Run audit commands**

Run:

```bash
npm run semantic:audit
npm run damage:coverage
```

Expected: reports print successfully and expose remaining work explicitly.

- [ ] **Step 4: Restart local service**

Run:

```bash
lsof -ti tcp:3002 | xargs kill
npm start
```

Expected: `Server listening at http://localhost:3002`.

---

## Milestones

### Milestone 1: Semantic Core

Tasks 1-5 complete. The app can distinguish direct damage, situational damage, and non-damage modifiers using a shared semantic catalog.

### Milestone 2: Audit Tooling

Task 6 complete. The project can report missing semantic coverage instead of relying on manual visual inspection.

### Milestone 3: First-Batch Migration

Task 7 complete. The existing 10 curated heroes become semantic-complete and serve as examples for the rest.

### Milestone 4: 127-Hero Workflow

Task 8 complete. Hero-by-hero audit can proceed in repeatable batches.

### Milestone 5: Item Modifier Bridge

Task 9 complete. Desolator and Assault Cuirass prove that hero and item modifiers can share one semantic system.

---

## Acceptance Criteria

- No non-damage numeric field appears as `Unknown` damage in power spike context.
- Every curated `reference_only` entry has an explicit semantic type.
- Slardar's movement speed, water attack damage bonus, and armor reduction route to modifier/reference context, not damage context.
- Sand King's sustained and multi-wave damage route to theoretical damage context, not fixed instant damage.
- Phantom Assassin's crit is modeled as a chance/crit modifier or situational damage reference, not unknown damage.
- Audit tooling can identify missing semantic mappings before they reach the UI or LLM prompt.
- The first 10 curated hero models have semantic tests.
- The plan for the remaining 127 heroes is batchable by mechanic type.
