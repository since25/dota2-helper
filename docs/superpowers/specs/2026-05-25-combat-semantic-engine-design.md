# Combat Semantic Engine Design

## Background

The current damage calculator can already select hero ability components and some item components, then sum raw and resistance-adjusted damage. That is useful as a first validation surface, but it is still closer to a component adder than a Dota combat model.

The main gap is the missing middle layer between raw game data and calculation behavior. `dota2-datawrapper`, `dotaconstants`, Dotabuff snapshots, and local model files expose many numbers, but those numbers need explicit semantic assertions before the calculator can safely answer questions such as:

- Does this field increase base attack damage, add bonus attack damage, or create a separate damage event?
- Does this modifier affect one attack, every attack, or a fixed time window?
- Does this damage participate in crit, armor, magic resistance, spell amplification, barriers, or damage block?
- Is this number a direct damage value, a duration, a tick interval, a proc chance, or a display-only reference?

This design turns the calculator into a layered combat semantic engine with a local Dota 2 Lua verification harness. The harness is a development-only tool in this repository and is not part of the server deployment.

## Goals

1. Remove inherited Stripe, Redis, Upstash, subscription, and rate-limit code from this fork.
2. Keep the app focused on local Dota data, AI coaching, damage calculation, and model auditing.
3. Create a combat rules layer for attributes, attack damage, attack speed, armor, magic resistance, crits, and damage events.
4. Create a semantic assertion layer that translates raw hero and item fields into typed, testable combat effects.
5. Extend the calculator from direct damage selection to attack-window modeling.
6. Add a local Dota 2 Workshop Tools Lua verifier that can measure selected cases in the game engine.
7. Preserve the current web calculator as the user-facing validation surface while improving its backend model.

## Non-Goals

- Do not run Dota 2, Workshop Tools, Lua scripts, or engine verification on the remote server.
- Do not publish a Steam Workshop addon in the first implementation.
- Do not require Dota 2 to run normal `npm test`, `npm start`, or server deployment.
- Do not switch the whole app to TypeScript in this stage.
- Do not attempt to perfectly model every Dota mechanic in the first pass.
- Do not use live Wiki scraping during calculation. Wiki and Valve docs are reference inputs that become local rules and tests.
- Do not remove the existing `dotaconstants` fallback while the datawrapper layer is still being proven.

## Architecture

The new model is split into four layers.

### 1. App Cleanup Layer

Remove payment and subscription features that came from the upstream fork:

- Stripe dependency and initialization.
- Upstash Redis dependency and initialization.
- Subscription token storage and recovery.
- Free-tier rate limiting.
- Payment, portal, webhook, checkout, subscription status, and token recovery routes.
- Frontend subscription bar, checkout handlers, local token storage, and related CSS.
- Tests that only protect removed payment behavior.

After cleanup, `/api/get-tips` should run without subscription middleware. If future throttling is needed, it should be introduced as a separate local product decision, not as inherited payment plumbing.

### 2. Combat Rules Layer

Create a focused rules module that knows Dota combat math but does not know about UI, Express, raw provider shapes, or model files.

Proposed files:

- `combat/rules.js`
- `combat/stats.js`
- `combat/damageEvents.js`
- `combat/attackWindow.js`

Responsibilities:

- Derive hero attributes at a level.
- Derive base attack min, max, and average from primary attribute.
- Apply item stats to hero attributes and attack damage.
- Convert attack speed and base attack time into attacks per second.
- Model a finite attack window by either attack count or duration.
- Apply physical armor reduction with the current project formula:

```js
function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}
```

- Apply magic resistance as a multiplier chain, not as an unsafe additive bucket.
- Apply spell amplification and generic damage amplification as explicit stages.
- Represent crit as an attack damage event modifier, with source, multiplier, chance, and stacking policy.

The first implementation should keep crit deterministic by supporting an explicit `forceCritSource` or expected-value mode. Random simulation is not part of the first pass.

### 3. Semantic Assertion Layer

Create a layer that converts raw fields into typed assertions before calculation.

Proposed files:

- `combat/semanticTypes.js`
- `combat/semanticAssertions.js`
- `combat/itemEffectAdapter.js`
- `combat/heroEffectAdapter.js`
- `combat/wikiRuleReferences.js`

An assertion is a plain object with enough information to inspect and test:

```js
{
  source: 'item',
  sourceKey: 'shadow_blade',
  fieldKey: 'windwalk_bonus_damage',
  semanticType: 'attack.event.bonus_damage',
  target: 'self',
  timing: 'next_attack',
  values: [175],
  damageType: 'Physical',
  participatesInCrit: false,
  affectedByArmor: true,
  affectedBySpellAmp: false,
  stackingGroup: 'invisibility_break_damage',
  confidence: 'reviewed',
  references: ['dota2-wiki:Shadow Blade', 'engine-fixture:shadow_blade_break_attack']
}
```

The schema should distinguish at least these categories:

- `stat.attribute.flat`
- `stat.attack_damage.flat`
- `stat.attack_speed.flat`
- `stat.armor.flat`
- `stat.magic_resistance.percent`
- `attack.event.base_damage`
- `attack.event.bonus_damage`
- `attack.event.proc_damage`
- `attack.event.crit`
- `damage.instant`
- `damage.sustained_dps`
- `damage.percent_health`
- `modifier.armor.flat`
- `modifier.magic_resistance.multiplier`
- `modifier.damage_amp.percent`
- `modifier.spell_amp.percent`
- `window.duration.seconds`
- `condition.invisibility_break`
- `condition.active_item`
- `raw.reference`

The existing `itemModels/schema.js` and `damageModels/semantics.js` can be adapted, but the calculation-facing assertions should be stricter than the current audit labels.

### 4. Local Engine Verification Layer

Add a Dota 2 Workshop Tools verifier inside this repository:

- `tools/dota-addon/`
- `tools/dota-addon/scripts/vscripts/`
- `tools/dota-addon/generated/`
- `scripts/export-engine-fixture.js`
- `scripts/compare-engine-result.js`
- `test-runs/dota-engine-verification/`

This verifier is a local-only development tool. It is ignored by server runtime and documented as requiring a local Dota 2 installation plus Workshop Tools.

The first version is semi-automatic:

1. Node exports an engine fixture from a calculator scenario.
2. The developer copies or syncs the fixture into the addon generated folder.
3. The Lua addon creates attacker and target units.
4. Lua sets levels, items, modifiers, target armor, target magic resistance, and scenario conditions.
5. Lua performs a controlled attack, item use, or damage application.
6. Lua prints or writes measured values.
7. Node compares engine output with local model output.

This is intentionally not headless CI. It is a calibration harness for high-risk mechanics.

## Data Flow

Normal web calculation:

```text
datawrapper/dotaconstants
  -> raw hero/item fields
  -> semantic assertions
  -> combat stats + combat events
  -> damage calculation
  -> calculator API response
  -> web UI breakdown
```

Engine verification:

```text
calculator scenario
  -> exported fixture
  -> Dota 2 Lua addon
  -> measured engine result
  -> comparison script
  -> regression case or semantic correction
```

## First Target Mechanics

The first implementation should focus on mechanics that directly unblock the user's current concern.

### Attack Stats

- Hero level attributes.
- Primary attribute attack damage.
- All-attribute universal hero attack damage.
- Flat item attack damage, such as Broadsword-like items.
- Attribute items that indirectly increase attack damage.
- Attack speed from agility and item bonuses.
- Attack count within a duration window.

### Attack Events

- Basic attacks.
- Bonus attack damage on one attack, such as Shadow Blade break damage.
- Attack proc damage, such as Maelstrom-like effects.
- Crit source representation and deterministic crit selection.
- Expected crit damage as an explicit calculation mode.

### Resistance and Amplification

- Physical armor reduction.
- Magic resistance multiplier chain.
- Armor reduction from item effects such as Desolator-like effects.
- Spell amplification as a magical damage stage.
- Generic damage amplification as a separate stage.

### Item Fixture Set

The first reviewed item set should include:

- `broadsword` or the current local key for the Broadsword item.
- `blade_of_alacrity`.
- `robe`.
- `desolator`.
- `daedalus`.
- `shadow_blade`.
- `silver_edge`.
- `mask_of_madness`.
- `dagon`.
- `blood_grenade`.

If a local key differs from the display name, the adapter must use the local key and expose the display name in reports.

### Hero Fixture Set

The first reviewed hero set should include:

- A simple physical attacker.
- A crit-dependent hero such as Phantom Assassin.
- An attack-modifier hero such as Slardar or Anti-Mage.
- A spell burst hero such as Lina or Lion.
- A mixed sustained hero such as Jakiro or Sand King.

The exact hero names can use the existing registry names and aliases.

## Lua Verification Harness

### Fixture Shape

Node exports JSON fixtures with this shape:

```json
{
  "id": "phantom_assassin_level_12_daedalus_shadow_blade_attack",
  "hero": "Phantom Assassin",
  "heroLevel": 12,
  "items": ["daedalus", "shadow_blade"],
  "target": {
    "hero": "Axe",
    "level": 12,
    "armor": 10,
    "magicResistancePercent": 25
  },
  "scenario": {
    "type": "attack_window",
    "attackCount": 1,
    "forceInvisibilityBreak": true,
    "forceCritSource": "daedalus"
  },
  "expectedLocalModel": {
    "raw": 0,
    "adjusted": 0,
    "components": []
  }
}
```

The `expectedLocalModel` block is filled by the local Node calculator at export time. It lets the comparison script detect drift even if the engine result is collected later.

### Lua Output Shape

Lua should emit a compact result that can be copied from logs or read from a local generated result file:

```json
{
  "id": "phantom_assassin_level_12_daedalus_shadow_blade_attack",
  "engine": {
    "attackerAverageAttackDamage": 0,
    "targetArmor": 10,
    "targetMagicResistancePercent": 25,
    "targetHealthBefore": 2000,
    "targetHealthAfter": 0,
    "observedDamage": 0,
    "modifiers": []
  }
}
```

The first implementation can use log output. File or HTTP bridging can be added only after the manual loop is useful.

### Engine API Assumptions

The design assumes Dota 2 Workshop Tools can run Lua scripts in a custom game addon and use game APIs such as damage application, unit creation, item creation, and unit stat inspection. The implementation must verify each needed API with a tiny local addon probe before relying on it broadly.

Useful starting references:

- Valve Developer Community: Dota 2 Workshop Tools scripting.
- Valve Developer Community: Dota 2 Lua scripting API.
- Valve Developer Community: global `ApplyDamage` API.

## Wiki and Reference Policy

Dota 2 Wiki and Valve docs should be used as reference material, not as runtime dependencies.

For each high-risk rule, create a local rule note and a test. Examples:

- Armor formula rule.
- Magic resistance stacking rule.
- Crit stacking and priority rule.
- Attack speed and base attack time rule.
- Bonus attack damage participation in crit rule.
- Spell amplification and damage amplification order.

Each local rule note should list:

- Rule name.
- Source URL.
- Last checked date.
- Local interpretation.
- Known caveats.
- Tests or engine fixtures that cover it.

Proposed location:

- `docs/combat-rules/`

## API and UI Changes

The existing calculator endpoints should remain, but their internals should move toward the combat engine:

- `GET /api/damage/heroes/:hero`
- `GET /api/calculator/workbench/:hero`
- `POST /api/damage/calculate`

The response should add an inspectable combat breakdown:

```js
{
  combatStats: {
    attributes: {},
    attackDamage: {},
    attackSpeed: {},
    armor: {},
    magicResistance: {}
  },
  combatEvents: [
    {
      type: 'attack',
      raw: 0,
      adjusted: 0,
      stages: []
    }
  ],
  semanticAssertions: [
    {
      sourceKey: 'shadow_blade',
      semanticType: 'attack.event.bonus_damage',
      confidence: 'reviewed'
    }
  ]
}
```

The UI should surface:

- Hero stats after selected items.
- Attack window mode: by attack count or by duration.
- Attack damage composition.
- Attack speed and expected attack count.
- Damage event stages.
- Which item and hero assertions were applied.
- Warnings when a selected item only has `raw.reference` or unreviewed semantics.

## Testing Strategy

Tests should be layered.

### Unit Tests

- Attribute derivation at hero levels.
- Primary attribute attack damage.
- Universal hero attack damage.
- Item flat attack damage application.
- Item attribute to attack damage application.
- Attack speed to attacks-per-second calculation.
- Armor multiplier.
- Magic resistance multiplier chain.
- Crit deterministic mode.
- Expected crit mode.

### Semantic Tests

- Broadsword-like item becomes `stat.attack_damage.flat`.
- Shadow Blade-like item exposes one `attack.event.bonus_damage` with `condition.invisibility_break`.
- Daedalus-like item exposes `attack.event.crit`.
- Desolator-like item exposes `modifier.armor.flat`.
- Dagon-like item remains direct magical damage.
- Blood Grenade-like item remains direct or sustained item damage according to reviewed fields.

### Integration Tests

- Calculator basic attack changes after flat attack damage item.
- Calculator basic attack changes after primary attribute item.
- Calculator attack window changes after attack speed item.
- Calculator physical damage changes after armor reduction item.
- Calculator crit deterministic mode changes only the selected attack event.

### Engine Verification Tests

These are not part of normal CI. They produce artifacts:

- Export fixture JSON.
- Lua measured result JSON or copied log payload.
- Diff report.

The comparison script should pass when the absolute or percentage tolerance is within the fixture threshold.

## Deployment Policy

Server deployment includes:

- Node app.
- Web UI.
- Local data files.
- AI endpoint config.
- Combat engine code.

Server deployment excludes:

- Dota 2 client.
- Dota 2 Workshop Tools.
- `tools/dota-addon/generated/` runtime outputs.
- `test-runs/dota-engine-verification/` local result artifacts.

The addon source can live in the repository because it documents and supports development, but the server must never require it at startup.

## Implementation Phases

### Phase 0: Remove Payment and Subscription Legacy

Remove Stripe and Redis from runtime code, frontend UI, dependencies, and tests. Preserve unrelated security fixes such as static asset lockdown and formatter sanitization.

Acceptance:

- No Stripe or Redis package in `package.json`.
- No payment or subscription routes in `server.js`.
- No subscription UI in `index.html`, `script.js`, or `style.css`.
- `/api/get-tips` works without rate-limit middleware.
- `npm test` passes.

### Phase 1: Combat Rules Foundation

Add pure combat rules and stats modules with unit tests. Keep existing calculator behavior while introducing new internals.

Acceptance:

- Current calculator tests still pass.
- New combat unit tests pass.
- Basic attack damage can include flat item attack damage and attribute item damage.

### Phase 2: Semantic Assertion Adapter

Convert reviewed item and hero fields into calculation-facing assertions.

Acceptance:

- The first item fixture set emits reviewed semantic assertions.
- Unreviewed effects remain visible as warnings rather than silently entering calculations.
- Existing item audit pages can display assertion confidence.

### Phase 3: Attack Window Calculator

Add attack count and duration modes to the backend and UI.

Acceptance:

- A user can compare one attack versus a timed attack window.
- Attack speed affects timed windows.
- Crit can be forced or shown as expected value.
- Damage breakdown lists stages and applied assertions.

### Phase 4: Local Dota 2 Lua Verification Harness

Add addon source, fixture export, and result comparison scripts.

Acceptance:

- A fixture can be exported from Node.
- The addon source includes a documented Lua runner for that fixture shape.
- A manually collected engine result can be compared against local model output.
- At least one physical attack fixture and one direct magical damage fixture have saved example reports.

## Risks

- Dota 2 combat has edge cases that are not exposed in local data fields.
- Workshop Tools automation may require manual steps, especially on macOS or when Dota is installed outside default paths.
- Some item effects are not representable from fields alone and need hand-authored assertions.
- Crit and attack modifier interactions can differ by modifier implementation.
- Current CommonJS code can support this design, but module boundaries must stay small to avoid growing `damageCalculator.js` further.

## Design Decisions

- Keep the Lua verifier in the current `dota2-helper` repository because `dota2training` is no longer the active direction.
- Treat the verifier as a local debug and model calibration tool.
- Do not make the remote server responsible for engine verification.
- Prefer reviewed local semantic assertions over broad heuristic auto-classification for combat-critical mechanics.
- Use Wiki and Valve docs as reference sources, then freeze project-local rules into tests and notes.
- Keep the existing calculator page, but make its backend model deeper and more inspectable.

