# Hero Damage Model Config Design

## Background

The current damage adapter tries to infer Dota mechanics from raw ability fields. That is useful as a bootstrap layer, but it is not reliable enough for strategy-grade damage calculations. Recent examples show the limit:

- Sand King needed separate handling for instant damage, sustained DPS, multi-wave damage, and conditional damage.
- Slardar needed an explicit attack-count passive model: three normal attacks plus one Bash of the Deep proc.
- Many heroes have mechanics whose raw fields are ambiguous without hero-specific interpretation.

Dota has a manageable hero count. The product should move from best-effort auto-inference to a curated per-hero calculation model. The model should remain data-driven: manual config defines how to calculate, while actual patch values still come from `dotaconstants` or `dota2-datawrapper`.

## Goals

1. Add a declarative per-hero damage model layer for all 127 heroes.
2. Keep numeric values sourced from local data providers rather than copied into config files.
3. Make every hero and ability coverage status explicit: calculable, reference-only, ignored, or unsupported.
4. Support practical calculator workflows: hero level, ability level, selected components, attack damage, duration uptime, wave counts, enemy armor, and magic resistance.
5. Produce a coverage report so missing or weak models are visible instead of silent.
6. Let LLM prompt context consume the same curated model summaries later, instead of relying on raw inferred totals.

## Non-Goals

This phase will not build a full combat simulator. It will not model turn rate, pathing, cast backswing, projectile dodge, illusions, dispels, status resistance, target movement, evasion, or exact fight timing. It will not hand-copy patch damage values into model files.

## Architecture

Add a new `damageModels` layer between raw provider data and the calculator.

```txt
raw data provider
  -> damageExtractor fallback
  -> damageModels registry
  -> damageModelResolver
  -> damageCalculator / powerSpikeContext / prompt context
```

The resolver chooses a curated model when one exists. If a hero or ability has no curated model, it can fall back to the existing extractor, but that fallback must be marked as inferred.

## File Layout

```txt
damageModels/
  schema.js
  registry.js
  resolver.js
  coverage.js
  heroes/
    slardar.js
    sand_king.js
    queen_of_pain.js
    lion.js
    lina.js
    axe.js
    shadow_fiend.js
    phantom_assassin.js
    faceless_void.js
    venomancer.js
```

`schema.js` defines model shape, statuses, and validation.

`registry.js` loads all hero model modules and exposes lookup by canonical hero name and ability name.

`resolver.js` maps model entries to concrete damage components using provider ability data.

`coverage.js` compares all canonical heroes and their visible abilities against model files and emits a machine-readable report.

Each hero file exports one object:

```js
module.exports = {
  hero: 'Slardar',
  abilities: {
    'Slithereen Crush': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'crush_damage',
      defaultIncluded: true
    },
    'Bash of the Deep': {
      status: 'implemented',
      model: 'attack_sequence',
      procDamageKey: 'bonus_damage',
      attackCountKey: 'attack_count',
      formula: 'attackCount * attackDamage + procDamage',
      defaultIncluded: true
    },
    'Corrosive Haze': {
      status: 'reference_only',
      model: 'armor_debuff',
      valueKey: 'armor_reduction',
      reason: 'Debuff affects physical follow-up damage; v1 does not chain debuffs into subsequent components.'
    }
  }
};
```

## Ability Statuses

`implemented`

The calculator can compute this component with current inputs.

`reference_only`

The ability has important numeric effects but is not directly summed into damage. Examples: armor reduction, spell amplification, slows that enable uptime, vision, silence, stun duration.

`ignored`

The ability has no relevant damage or damage-enabling numeric effect for this calculator. Examples: pure mobility, form toggles with no immediate damage model in v1.

`unsupported`

The ability matters for damage but needs a model not yet implemented. Unsupported entries must include a human-readable reason.

`inferred`

The ability comes from the legacy extractor fallback, not a curated hero model. This status is allowed during migration but must count against curated coverage.

## Model Types

`instant_fixed`

Single direct damage value. Uses one provider key or `ability.dmg`.

Required config:

```js
{ model: 'instant_fixed', damageKey: 'dmg' }
```

`sustained_dps`

Damage per second or per tick with user-controlled active duration.

Required config:

```js
{
  model: 'sustained_dps',
  damagePerSecondKey: 'sand_storm_damage',
  durationKey: 'duration',
  defaultActiveDuration: 'full'
}
```

`multi_wave`

Damage per wave multiplied by wave count. User can override effective wave count later.

Required config:

```js
{
  model: 'multi_wave',
  damagePerWaveKey: 'epicenter_damage',
  waveCountKey: 'pulses'
}
```

`attack_sequence`

Normal attacks plus a fixed triggered proc. Slardar is the first required case.

Required config:

```js
{
  model: 'attack_sequence',
  procDamageKey: 'bonus_damage',
  attackCountKey: 'attack_count',
  formula: 'attackCount * attackDamage + procDamage'
}
```

`attack_modifier`

A damage value applied to selected attacks. User controls attack count.

Required config:

```js
{
  model: 'attack_modifier',
  bonusDamageKey: 'bonus_damage',
  defaultAttackCount: 1
}
```

`chance_based`

Expected value or forced-proc value for probability effects such as crits or bashes.

Required config:

```js
{
  model: 'chance_based',
  chanceKey: 'chance',
  multiplierKey: 'crit_multiplier',
  modes: ['expected', 'forced_proc']
}
```

`conditional`

Damage requires target/source state or event. It is exposed with required inputs or as reference-only if v1 lacks those inputs.

Required config:

```js
{
  model: 'conditional',
  damageKey: 'damage',
  condition: 'target dies during debuff'
}
```

`state_scaling`

Damage depends on target health/mana, source stats, stacks, charges, or kills.

Required config:

```js
{
  model: 'state_scaling',
  baseKey: 'damage',
  scalingKey: 'damage_per_int',
  requiredInputs: ['sourceIntelligence']
}
```

`debuff_reference`

Non-damage modifier that changes later damage but is not chained in v1. Examples: armor reduction and magic resistance reduction.

Required config:

```js
{
  model: 'debuff_reference',
  valueKey: 'armor_reduction',
  affects: 'physical_damage'
}
```

## Resolver Rules

The resolver must:

1. Match hero by canonical English localized name.
2. Match ability by English display name from provider data.
3. Read configured keys from raw attributes or `ability.dmg`.
4. Produce the same component shape the current calculator already consumes.
5. Mark every component with:
   - `source: 'curated' | 'inferred'`
   - `status`
   - `model`
   - `formula`
   - `inputs`
   - `coverageNotes`
6. Fail validation when a model references a missing key unless that entry is explicitly `unsupported`.

## Coverage Report

Add a script:

```bash
npm run damage:coverage
```

It should output JSON:

```js
{
  totalHeroes: 127,
  modeledHeroes: 10,
  totalAbilities: 500,
  implementedAbilities: 36,
  referenceOnlyAbilities: 12,
  ignoredAbilities: 5,
  unsupportedAbilities: 8,
  inferredAbilities: 439,
  missingHeroModels: ['Abaddon', 'Alchemist'],
  missingAbilityEntries: [
    { hero: 'Axe', ability: 'Counter Helix' }
  ]
}
```

The exact ability count can vary with the current data source. The report must be deterministic for the installed data.

## First Ten Hero Models

The first implementation batch should cover representative mechanic types:

1. Slardar: `attack_sequence`, physical instant, armor debuff reference.
2. Sand King: instant, sustained DPS, multi-wave, conditional.
3. Queen of Pain: instant magical/pure burst.
4. Lion: instant magical/pure burst plus growth reference for Finger of Death.
5. Lina: instant spell burst and sustained/stack reference if exposed.
6. Axe: instant, conditional/threshold or spin-like reference.
7. Shadow Fiend: multi-instance nukes and aura/reference effects.
8. Phantom Assassin: chance-based crit and dagger attack modifier.
9. Faceless Void: chance-based bash/lock and reference-only Chronosphere.
10. Venomancer: sustained/poison damage and ward/reference entries.

This batch is intentionally diverse. It is a model-shape milestone, not a final balance database.

## Calculator Behavior

The calculator should group rows by status:

- 可计算
- 需要输入
- 参考效果
- 暂不支持
- 自动推断

For implemented models, the page should show exact formula terms. For unsupported or reference-only entries, the page should show why the value is not summed.

## Prompt Context Behavior

The LLM prompt should prefer curated model summaries when available. It must distinguish:

- fixed burst
- duration-adjusted damage
- attack-sequence damage
- chance expected value
- reference-only debuffs
- unsupported mechanics

The prompt must not imply an unsupported ability is absent. It should say the local model marks it unsupported or reference-only.

## Migration Strategy

Stage 1: Add schema, registry, resolver, and coverage report. Keep existing calculator behavior intact except for model source annotations.

Stage 2: Add the first ten hero configs and wire curated resolver into `getHeroDamageProfile`.

Stage 3: Update the calculator UI to surface model status groups and coverage notes.

Stage 4: Update power spike and prompt context to prefer curated models.

Stage 5: Fill the remaining heroes in batches. A batch is complete only when `npm run damage:coverage` shows no missing ability entries for that batch.

## Validation

Automated tests must cover:

- Schema accepts valid model files and rejects missing required fields.
- Registry can resolve the first ten heroes.
- Slardar Bash still calculates `attackCount * attackDamage + procDamage`.
- Sand King sustained duration and Epicenter wave totals still work.
- Coverage report includes all canonical heroes.
- Missing ability entries are reported, not ignored.
- Calculator API returns model source and status for every ability component.

Browser validation must cover:

- Open `/damage-calculator.html`.
- Select Slardar.
- Verify `深海重击` appears as curated `attack_sequence`.
- Select Sand King.
- Verify `沙尘暴` still exposes active duration control.
- Confirm reference-only rows are visible but not summed.

## Open Decisions

The config format should be CommonJS `.js` files instead of JSON for this phase. That keeps comments, shared helpers, and future validation easier while matching the current backend style. If we later want a pure data artifact, the registry can export normalized JSON.

The first ten hero batch should be hand-reviewed before expanding to all 127 heroes, because the schema will almost certainly need one or two adjustments after real mechanics are modeled.
