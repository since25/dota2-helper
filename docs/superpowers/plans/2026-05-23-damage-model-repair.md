# Damage Model Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the Dota 2 hero damage model layer using the completed 126-hero audit so the calculator stops treating non-damage fields as damage and can represent sustained, multi-hit, attack, summon, percent, and modifier-based damage correctly.

**Architecture:** Add reusable semantic model primitives in `damageModels/schema.js` and `damageModels/resolver.js` first, then migrate hero files in priority batches. Keep hero files declarative; put formulas and component shaping in resolver helpers so the front end and audit exports receive consistent structured components.

**Tech Stack:** Node.js CommonJS, `node --test`, local Dotabuff snapshots in `data/dotabuff`, curated hero configs in `damageModels/heroes/*.js`.

---

## Files
- Modify: `damageModels/schema.js`
- Modify: `damageModels/resolver.js`
- Modify: `damageModels/semantics.js`
- Modify: `damageModels/heroes/*.js`
- Modify: `test/damageModelSchema.test.js`
- Modify: `test/damageModelResolver.test.js`
- Modify: `test/damageCalculator.test.js`
- Modify: `test/damageModelAllReviewed.test.js`
- Modify: `test/semanticAudit.test.js`
- Generate after changes: `audit-runs/damage-heroes-latest/*.html`

## Task 1: Add Resolver Primitives

**Files:**
- Modify: `damageModels/schema.js`
- Modify: `damageModels/resolver.js`
- Modify: `damageModels/semantics.js`
- Test: `test/damageModelSchema.test.js`
- Test: `test/damageModelResolver.test.js`

- [ ] **Step 1: Add failing schema tests for new model types**

Add tests that validate these model names and required keys:

```js
const expectedModels = [
  ['initial_plus_dot', ['initialDamageKey', 'damagePerSecondKey', 'durationKey']],
  ['initial_plus_ticks', ['initialDamageKey', 'tickDamageKey', 'tickIntervalKey', 'durationKey']],
  ['repeated_trigger', ['damageKey', 'triggerCountInput']],
  ['summon_attack', ['attackDamageKey', 'attackCountInput']],
  ['percent_health_dot', ['percentDamageKey', 'durationKey', 'healthInput']],
  ['attribute_scaling', ['baseDamageKey', 'attributeMultiplierKey', 'attributeInput']],
  ['conditional_instant', ['damageKey', 'conditionInputs']]
];
```

Run: `node --test test/damageModelSchema.test.js`

Expected: fails because these model types are not accepted yet.

- [ ] **Step 2: Add schema support**

Extend `MODEL_TYPES` and `REQUIRED_BY_TYPE` in `damageModels/schema.js` with:

```js
initial_plus_dot: ['initialDamageKey', 'damagePerSecondKey', 'durationKey'],
initial_plus_ticks: ['initialDamageKey', 'tickDamageKey', 'tickIntervalKey', 'durationKey'],
repeated_trigger: ['damageKey', 'triggerCountInput'],
summon_attack: ['attackDamageKey', 'attackCountInput'],
percent_health_dot: ['percentDamageKey', 'durationKey', 'healthInput'],
attribute_scaling: ['baseDamageKey', 'attributeMultiplierKey', 'attributeInput'],
conditional_instant: ['damageKey', 'conditionInputs']
```

Run: `node --test test/damageModelSchema.test.js`

Expected: passes.

- [ ] **Step 3: Add resolver tests for each primitive**

In `test/damageModelResolver.test.js`, add fixtures covering:

```js
initial_plus_dot => theoreticalTotal = initial + dps * duration
initial_plus_ticks => theoreticalTotal = initial + tickDamage * floor(duration / tickInterval)
repeated_trigger => metadata.triggerCountInput is preserved
summon_attack => valuesByAbilityLevel is attack damage and metadata.attackCountInput is preserved
percent_health_dot => component has healthInput and no fixed total without runtime input
attribute_scaling => component records base and multiplier arrays
conditional_instant => defaultIncluded is false unless explicitly set
```

Run: `node --test test/damageModelResolver.test.js`

Expected: fails before resolver implementation.

- [ ] **Step 4: Implement resolver branches**

In `damageModels/resolver.js`, add branches in `buildImplementedComponent` for the new model types. Use existing helpers `valuesForKey`, `multiplyLevelArrays`, `baseComponent`, and metadata objects. Preserve runtime-dependent values in `metadata` instead of inventing fixed totals.

Run: `node --test test/damageModelResolver.test.js test/damageModelSchema.test.js`

Expected: passes.

## Task 2: Fix P0 Wrong-Damage Heroes

**Files:**
- Modify: `damageModels/heroes/pugna.js`
- Modify: `damageModels/heroes/void_spirit.js`
- Modify: `damageModels/heroes/winter_wyvern.js`
- Modify: `damageModels/heroes/pudge.js`
- Modify: `damageModels/heroes/treant_protector.js`
- Modify: `damageModels/heroes/visage.js`
- Modify: `test/damageCalculator.test.js`
- Modify: `test/damageModelResolver.test.js`

- [ ] **Step 1: Write failing hero-specific assertions**

Add tests that assert:

```js
Pugna.Nether Blast.sourceKey === 'blast_damage'
Void Spirit.Astral Step.sourceKey === 'pop_damage'
Winter Wyvern.Arctic Burn.metadata.percentDamageKey === 'percent_damage'
Pudge.Meat Shield.semantic.category !== 'damage'
Treant Protector.Living Armor.semantic.category !== 'damage'
Visage.Gravekeeper's Cloak.semantic.category !== 'damage'
```

Run: `node --test test/damageCalculator.test.js test/damageModelResolver.test.js`

Expected: fails.

- [ ] **Step 2: Update hero configs**

Change the hero files:

```js
// Pugna
'Nether Blast': { status: 'implemented', model: 'instant_fixed', damageKey: 'blast_damage', semanticType: 'damage.instant', defaultIncluded: true }

// Void Spirit
'Astral Step': { status: 'implemented', model: 'instant_fixed', damageKey: 'pop_damage', semanticType: 'damage.instant', defaultIncluded: true, conditionInputs: ['charge_hit_count'] }

// Pudge / Treant / Visage defensive entries
status: 'reference_only',
model: 'debuff_reference',
semanticType: 'defense.damage_block.flat' or 'defense.damage_reduction.percent',
defaultIncluded: false
```

Run: `node --test test/damageCalculator.test.js test/damageModelResolver.test.js`

Expected: passes.

## Task 3: Repair Composite DOT and Tick Models

**Files:**
- Modify: `damageModels/heroes/ogre_magi.js`
- Modify: `damageModels/heroes/pudge.js`
- Modify: `damageModels/heroes/oracle.js`
- Modify: `damageModels/heroes/silencer.js`
- Modify: `damageModels/heroes/venomancer.js`
- Modify: `damageModels/heroes/wraith_king.js`
- Modify: `damageModels/heroes/warlock.js`
- Test: `test/damageModelBatchSustained.test.js`

- [ ] **Step 1: Add failing tests for composite damage**

Assert these formulas:

```js
Ogre Magi.Ignite => sustained_dps burn_damage * duration
Pudge.Rot => sustained_dps rot_damage with active_duration input
Oracle.Purifying Flames => instant_fixed damage, heal fields not counted as enemy damage
Silencer.Arcane Curse => initial_plus_dot application_damage + damage * duration
Venomancer.Noxious Plague => initial + percent health DOT metadata
Wraith King.Wraithfire Blast => initial_plus_dot damage + blast_dot_damage * blast_dot_duration
Warlock.Shadow Word => sustained_dps damage * duration
```

Run: `node --test test/damageModelBatchSustained.test.js`

Expected: fails before changes.

- [ ] **Step 2: Update hero files to use new primitives**

Use `initial_plus_dot`, `initial_plus_ticks`, `sustained_dps`, or `percent_health_dot` as appropriate. Do not count healing, self-damage, block, or shield values as enemy damage.

Run: `node --test test/damageModelBatchSustained.test.js test/damageModelAllReviewed.test.js`

Expected: passes.

## Task 4: Repair Multi-Hit and Repeated Damage

**Files:**
- Modify: `damageModels/heroes/sand_king.js`
- Modify: `damageModels/heroes/primal_beast.js`
- Modify: `damageModels/heroes/pangolier.js`
- Modify: `damageModels/heroes/shadow_shaman.js`
- Modify: `damageModels/heroes/snapfire.js`
- Modify: `damageModels/heroes/tinker.js`
- Modify: `damageModels/heroes/witch_doctor.js`
- Test: `test/damageModelSecondBatch.test.js`

- [ ] **Step 1: Add tests for count-based models**

Assert metadata preserves the required runtime inputs:

```js
Sand King.Epicenter.metadata.waveCountByAbilityLevel
Primal Beast.Pulverize.metadata.triggerCountInput === 'pulse_count'
Pangolier.Swashbuckle.metadata.triggerCountInput === 'strike_count'
Shadow Shaman.Mass Serpent Ward.model === 'summon_attack'
Snapfire.Mortimer Kisses has impact multi-hit plus burn DOT
Tinker.March of the Machines.metadata.triggerCountInput === 'machine_hit_count'
Witch Doctor.Paralyzing Cask uses bounce_bonus_damage metadata
```

Run: `node --test test/damageModelSecondBatch.test.js`

Expected: fails before changes.

- [ ] **Step 2: Update models**

Use `multi_wave`, `repeated_trigger`, `summon_attack`, and `initial_plus_dot` components. Add `extraComponents` where one skill has both impact and burn components.

Run: `node --test test/damageModelSecondBatch.test.js`

Expected: passes.

## Task 5: Repair Attack, Crit, Proc, and Summon Layers

**Files:**
- Modify: `damageModels/heroes/slardar.js`
- Modify: `damageModels/heroes/sniper.js`
- Modify: `damageModels/heroes/riki.js`
- Modify: `damageModels/heroes/phantom_assassin.js`
- Modify: `damageModels/heroes/ursa.js`
- Modify: `damageModels/heroes/troll_warlord.js`
- Modify: `damageModels/heroes/terrorblade.js`
- Modify: `damageModels/heroes/phantom_lancer.js`
- Modify: `damageModels/heroes/warlock.js`
- Modify: `damageModels/heroes/wraith_king.js`
- Test: `test/damageModelAllHeroes.test.js`

- [ ] **Step 1: Add tests for attack input metadata**

Assert every attack/proc/summon component has explicit inputs:

```js
conditionInputs includes attack_count, proc_mode, hero_attack_damage, illusion_attack_count, summon_attack_count, or crit_mode
defaultIncluded is false for probability-based attacks
summon_attack entries preserve attackDamageKey and attackCountInput
```

Run: `node --test test/damageModelAllHeroes.test.js`

Expected: fails for currently underspecified entries.

- [ ] **Step 2: Update hero models**

Migrate probability and summon damage into `attack_sequence`, `attack_modifier`, `summon_attack`, or `conditional_instant`. Keep direct spell damage separate from attack-window damage.

Run: `node --test test/damageModelAllHeroes.test.js`

Expected: passes.

## Task 6: Repair Percent, Attribute, Resource, and Modifier Models

**Files:**
- Modify: `damageModels/heroes/outworld_destroyer.js`
- Modify: `damageModels/heroes/skywrath_mage.js`
- Modify: `damageModels/heroes/pudge.js`
- Modify: `damageModels/heroes/phoenix.js`
- Modify: `damageModels/heroes/zeus.js`
- Modify: `damageModels/heroes/silencer.js`
- Modify: `damageModels/heroes/techies.js`
- Modify: `damageModels/heroes/spirit_breaker.js`
- Modify: `damageModels/semantics.js`
- Test: `test/damageModelSemantics.test.js`
- Test: `test/semanticAudit.test.js`

- [ ] **Step 1: Add semantic tests**

Assert these semantic types route correctly:

```js
damage.percent_current_health
damage.percent_max_health
damage.percent_max_mana
damage.attribute_scaling
modifier.armor_reduction.flat
modifier.magic_resistance_reduction.percent
modifier.damage_amplification.percent
modifier.attack_damage.percent
```

Run: `node --test test/damageModelSemantics.test.js test/semanticAudit.test.js`

Expected: fails for missing semantic definitions.

- [ ] **Step 2: Add semantic definitions**

Update `damageModels/semantics.js` with the missing semantic types. Route damage types to damage components and modifiers to context, not fixed instant totals.

Run: `node --test test/damageModelSemantics.test.js test/semanticAudit.test.js`

Expected: passes.

- [ ] **Step 3: Update resource and attribute heroes**

Add formulas and inputs:

```js
OD.Arcane Orb => current mana percent per attack
OD.Sanity's Eclipse => mana difference scaling
Skywrath.Arcane Bolt => base + intelligence * 1.5
Pudge.Dismember => base_dps + strength * multiplier
Phoenix.Sun Ray => base_dps + target_max_health percent
Zeus.Static Field => enemy_current_health percent per spell hit
Techies.M.A.D. => base + target_max_mana percent
Spirit Breaker.Greater Bash => move_speed percent proc
```

Run: `node --test test/damageModelSemantics.test.js test/damageModelAllHeroes.test.js`

Expected: passes.

## Task 7: Export and Manual QA

**Files:**
- Generate: `audit-runs/damage-heroes-latest/index.html`
- Generate: `audit-runs/damage-heroes-latest/*.html`
- Review: `docs/hero-damage-model-audit-summary.md`

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: all `node --test` suites pass.

- [ ] **Step 2: Run semantic audit**

Run: `npm run semantic:audit`

Expected: no unclassified direct-damage fields that are actually movement, armor, shield, heal, duration, cooldown, or threshold values.

- [ ] **Step 3: Export audit pages**

Run: `npm run damage:audit-pages`

Expected: `audit-runs/damage-heroes-latest/index.html` is regenerated and lists all 126 heroes.

- [ ] **Step 4: Spot-check high-risk heroes**

Open the audit pages for:

```text
pugna
void-spirit
winter-wyvern
pudge
venomancer
viper
slardar
spirit-breaker
snapfire
zeus
```

Expected: no block/heal/duration/delay/armor-reduction values appear as direct fixed damage; sustained and repeated damage shows required input metadata.

## Self-Review
- Spec coverage: covers format consolidation, issue summary, and next repair plan.
- Placeholder scan: no `TBD` or unspecified implementation steps are left.
- Type consistency: new model names are introduced in schema before resolver and hero usage.
