# Damage Calculation Model Design

## Background

The current power spike calculation is too simple: it searches for a damage-like field, reads one numeric array, and adds the value into a single `rawDamage` total. This caused incorrect advice such as Sand King level 5 showing a mixed burst value of `112.9`, because sustained damage, attack-triggered damage, and conditional damage were folded into the same kill-threshold number.

The immediate bugs are useful examples:

- Disruptor Electromagnetic Repulsion exposed that trigger thresholds such as `damage_threshold = 250` must not be treated as outgoing damage.
- Sand King exposed multiple separate concepts: Burrowstrike is direct damage, Sand Storm is damage over time, Stinger is attack-triggered damage, and Caustic Finale is conditional death/explosion damage.
- Jakiro Macropyre and Disruptor Static Storm show that per-second or ramping area damage should be available to the LLM, but not included in a fixed instant burst total.

This spec defines a standalone first version of the damage model. It intentionally does not attempt a full Dota combat simulator.

## Goals

1. Separate damage extraction from damage classification and power spike aggregation.
2. Give the LLM a clear, reliable numeric contract:
   - fixed instant damage can be used as a kill-threshold reference.
   - sustained and multi-wave damage can expose a theoretical total when duration/pulse data is available, but must be labeled as uptime-dependent.
   - conditional, attack-triggered, target-state, percentage, and scaling damage can be discussed only as situational references unless a later modifier system supplies the missing state.
3. Prevent non-damage metrics such as thresholds, tick rates, durations, intervals, radius values, and counters from entering damage totals.
4. Preserve useful non-instant damage values as context instead of dropping them silently.
5. Make the model easy to extend later for items, talents, Aghanim's Scepter, Aghanim's Shard, armor, magic resistance, and hero-specific modifiers.

## Non-Goals

This first version will not include:

- Item stats or active item damage.
- Talent changes.
- Aghanim's Scepter or Shard modifications.
- Facet-specific branching beyond whatever the current data source exposes as the fixed hero kit.
- Armor-based physical damage reduction.
- Enemy-specific magic resistance, barriers, reductions, spell amplification, evasion, status resistance, or debuffs.
- Full combo simulation with cast times, movement, multiple attacks, channel duration assumptions, or target behavior.
- Complete hero-specific scripting for every complex Dota mechanic.

## Damage Categories

Each extracted damage entry must have a `damageKind`.

`instant_fixed`

Direct fixed damage that can reasonably be counted in a simple burst window. Examples: Queen of Pain Scream of Pain, Queen of Pain Sonic Wave, Lion Finger of Death, Sand King Burrowstrike.

`sustained`

Damage over time, per-second damage, per-tick damage, per-pulse damage, ramping area damage, or channel/linger damage. Examples: Jakiro Macropyre, Sand King Sand Storm, Disruptor Static Storm.

Sustained damage can have a theoretical total if the data provides enough metadata. For example, Sand King Sand Storm can expose `theoreticalTotal = duration * damagePerSecond`. This total is not a fixed instant kill line because it assumes target uptime inside the area.

`multi_wave`

Damage delivered by a fixed number of waves, pulses, or strikes. Examples: Sand King Epicenter when the data provides pulse count and damage per pulse. Multi-wave damage can expose `theoreticalTotal = waveCount * damagePerWave`, but the result remains uptime/position-dependent and should not be merged into fixed instant damage.

`conditional`

Damage that requires a condition beyond normal cast success, such as death explosion, threshold trigger, stack state, kill growth, distance traveled, or enemy state. Examples: Sand King Caustic Finale, Anti-Mage Mana Void, Disruptor Glimpse.

`attack_modifier`

Damage that is tied to attacks or attack modifiers rather than a standalone spell burst. Examples: Sand King Stinger, Drow Frost Arrows, Jakiro Liquid Fire if represented as attack-applied damage.

`scaling`

Damage that depends on attributes or other dynamic source stats. Examples: strength/intelligence/agility damage coefficients, max-health percentage, missing-mana percentage.

`growth`

Damage whose value changes over the match because of stacks, kills, permanent growth, charges, or accumulated state. Examples: Lion Finger of Death bonus damage per kill, Silencer-style permanent stat interactions if exposed as damage. Growth metadata should be shown separately from the base value.

`unknown`

A numeric damage-looking field that cannot be classified confidently. Unknown entries must not be included in fixed instant totals, but should be exposed with a warning.

## Growth Model

Each component should also expose a `growthKind`.

`non_growth`

The damage value is fixed for a given ability level before external modifiers. Sand King Burrowstrike is the baseline example: its single-hit magical damage mainly changes later through spell amplification and the target's magic resistance, not through the ability's own accumulated state.

`state_growth`

The damage depends on stored state, stacks, kills, charges, target state, or source/target stats. This includes permanent per-kill bonuses, missing-mana formulas, max-health percentages, attribute coefficients, and stack-based effects.

The first implementation should keep growth metadata but should not estimate growth-dependent totals unless the needed state is explicitly present in local context.

## Data Model

The new extraction layer should return a list of damage components rather than one damage array.

```js
{
  abilityName: "Burrowstrike",
  damageType: "Magical",
  components: [
    {
      kind: "instant_fixed",
      growthKind: "non_growth",
      label: "DAMAGE",
      valuesByAbilityLevel: [80, 150, 220, 290],
      sourceKey: "dmg",
      countInFixedInstantTotal: true,
      formula: { type: "single_value" },
      notes: []
    }
  ],
  manaCostByAbilityLevel: [100, 110, 120, 130],
  cooldownByAbilityLevel: [14, 13, 12, 11],
  warnings: []
}
```

Power spike entries should expose separate totals and references.

```js
{
  hero: "Sand King",
  level: 5,
  fixedInstantDamage: {
    raw: 220,
    byType: { Magical: 220 },
    afterDefaultResistance: 165,
    skills: [
      { name: "Burrowstrike", abilityLevel: 3, damage: 220, damageType: "Magical" }
    ]
  },
  situationalDamageRefs: [
    {
      name: "Sand Storm",
      kind: "sustained",
      growthKind: "non_growth",
      abilityLevel: 3,
      value: 70,
      label: "DAMAGE PER SECOND",
      duration: 24,
      theoreticalTotal: 1680,
      totalFormula: "duration * damagePerSecond"
    },
    { name: "Stinger", kind: "attack_modifier", growthKind: "non_growth", abilityLevel: 3, value: 100, label: "BONUS DAMAGE" },
    { name: "Caustic Finale", kind: "conditional", growthKind: "state_growth", abilityLevel: 1, value: 17, label: "BASE DAMAGE" }
  ],
  warnings: []
}
```

Existing `rawDamage` fields can be kept temporarily as aliases for `fixedInstantDamage.raw` during migration, but prompt formatting should prefer the new names.

## Extraction Rules

The extractor should read from both `ability.dmg` and `ability.attrib`.

Priority order:

1. `ability.dmg` when present. This is usually direct spell damage and should default to `instant_fixed` unless classification rules say otherwise.
2. Explicit fixed damage keys such as `damage`, `edge_damage`, `impact_damage`, `bolt_damage`, `strike_damage`.
3. Damage keys with semantic labels such as `DAMAGE PER SECOND`, `DAMAGE PER PULSE`, `BASE DAMAGE`, `BONUS DAMAGE`, `MAX DAMAGE`, and `MIN DAMAGE`.
4. Duration, pulse count, tick interval, and wave count fields should be kept as metadata for sustained and multi-wave formulas, not as standalone damage.
5. Percentage or scaling keys should be retained as components but not counted in fixed instant totals.

Non-output metrics must be excluded from damage components unless a rule explicitly keeps them as metadata:

- threshold
- trigger
- tick rate
- interval
- duration
- radius
- range
- width
- speed
- cast point
- cooldown
- charges
- reset
- reduction
- reflect
- incoming or outgoing modifiers

Duration, interval, tick rate, pulse count, and wave count are non-damage metrics, but they are useful as formula inputs. The extractor should keep them as metadata when a related sustained or multi-wave damage component exists.

## Classification Rules

Classification should combine field key, field label, ability behavior, and ability description.

Sustained if:

- label or key contains `per second`, `per tick`, `per pulse`, `DPS`, `duration`, `pulse`, `burn interval`, or equivalent concepts.
- ability description says damage is dealt over time, lingers, channels, or ramps across duration.

Multi-wave if:

- label or key contains `damage per pulse`, `damage per wave`, `pulse damage`, or equivalent wording.
- the same ability has a pulse/wave/count field that can be paired with damage per pulse/wave.
- if both duration and pulse count exist, prefer count-based total for `multi_wave` and keep duration as context.

Conditional if:

- key or description contains threshold, death, explosion, kill, stack, distance-to-damage, missing mana, missing health, max health, or state-dependent wording.
- value is a min/max cap for a state-dependent formula rather than the formula result.

Attack modifier if:

- key or description says attack, attack modifier, bonus attack damage, cleave, orb, projectile attack, or attack-applied debuff.
- the ability behavior is passive and the damage label is bonus attack-like damage.

Scaling if:

- key, label, or description references strength, agility, intelligence, attribute, source stat, percentage of max health, missing health, missing mana, or target health/mana.

Instant fixed if:

- it is a direct cast/target/area damage field.
- it does not require a duration, condition, target state, attack event, or dynamic stat.

Unknown if:

- the field looks numeric and damage-like but no rule confidently classifies it.

Growth classification:

- `non_growth` if the component has a fixed value by ability level and no stack, kill, charge, percentage, target-state, or attribute dependency.
- `state_growth` if the component depends on accumulated state, target state, source stats, target stats, percentages, or explicit per-stack/per-kill/per-charge fields.

## Power Spike Rules

For each key hero level, the model should:

1. Determine legal ability levels using the existing simple skill-point budget.
2. Select fixed instant damage skills for the `fixedInstantDamage` total.
3. Compute theoretical totals for sustained and multi-wave components when enough metadata exists:
   - Sustained per-second total: `duration * damagePerSecond`.
   - Sustained per-tick total: `(duration / tickInterval) * damagePerTick`, rounded only for display.
   - Multi-wave total: `waveCount * damagePerWave`.
4. Keep sustained, multi-wave, conditional, attack modifier, scaling, growth, and unknown entries in `situationalDamageRefs`.
5. Never add `situationalDamageRefs` into `fixedInstantDamage.raw`.
6. Compute `afterDefaultResistance` only from fixed instant damage:
   - Magical: multiply by `0.75`.
   - Pure: no reduction.
   - Physical: no armor reduction in v1, but label this clearly.
7. Optionally compute `theoreticalAfterDefaultResistance` for sustained and multi-wave references, but label it as theoretical uptime-dependent damage rather than a kill line.
8. Preserve mana and cooldown information for fixed instant skills.
9. Include warnings when a meaningful skill has only situational or unknown damage.

## Prompt Contract

The prompt should stop using ambiguous labels such as "原始固定伤害" for mixed values. It should use:

- `固定瞬时伤害`: only the total that can be used as a simplified kill-threshold reference.
- `理论持续/多波总伤害`: duration/pulse-derived totals that require target uptime or full wave connection.
- `条件/普攻/成长伤害参考`: values not included in fixed instant totals.
- `默认抗性后估算`: calculated only from fixed instant damage.

The LLM must be instructed:

- Do not call situational references a complete burst or kill line.
- When discussing sustained or multi-wave damage, include the formula when available and say it depends on duration, positioning, and target uptime.
- When discussing conditional damage, say what condition must be met.
- When discussing attack modifiers, say it requires attacks and is not a standalone spell burst.
- When discussing growth damage, separate base value from growth source and do not estimate stacks/kills unless local context provides them.
- If a hero has strong situational damage but low fixed instant damage, explain that distinction instead of flattening it into one number.

## Acceptance Tests

Required fixtures:

- Sand King:
  - Level 5 fixed instant damage should count Burrowstrike level 3 as `220 Magical`.
  - Burrowstrike should be `instant_fixed` and `non_growth`.
  - Sand Storm level 3 should appear as sustained reference with `70 Magical` per second.
  - Sand Storm should expose theoretical total as `duration * damagePerSecond` when duration is available.
  - Stinger level 3 should appear as attack modifier reference with `100 Physical`.
  - Caustic Finale should appear as conditional reference and not enter fixed instant total.
  - Epicenter should appear as multi-wave reference with theoretical total `pulseCount * damagePerPulse` when pulse count and damage per pulse are available.
  - The old mixed value `112.9` must not appear as the level 5 fixed instant estimate.

- Disruptor:
  - Electromagnetic Repulsion `damage_threshold = 250` must not appear as outgoing damage.
  - Static Storm should be sustained reference, not fixed instant damage.

- Queen of Pain:
  - Scream of Pain and Sonic Wave should remain fixed instant damage.

- Lion:
  - Finger of Death should remain fixed instant damage.
  - Finger of Death base damage should be `instant_fixed`.
  - Per-kill bonus should be `growth` metadata and not be added to base damage.

- Jakiro:
  - Macropyre should be sustained reference, not fixed instant damage.

- Anti-Mage:
  - Mana Void should be target-state damage, not fixed instant damage.

## Migration Plan

1. Introduce a new component-based extractor API next to the current compatibility API.
2. Update power spike generation to consume components.
3. Keep old field aliases such as `rawDamage` only as temporary compatibility shims.
4. Update prompt formatting to use `fixedInstantDamage` and `situationalDamageRefs`.
5. Expand regression tests around representative hero mechanics.
6. Remove or narrow compatibility shims after prompt and tests no longer depend on old fields.

## Open Follow-Ups

These are intentionally outside v1:

- Add physical armor reduction using target armor at key levels.
- Add item/talent/Aghanim modifier pipeline.
- Add hero-specific combo presets.
- Add a "best case sustained damage over N seconds" model.
- Add lane-target-specific effective health and resistance estimates.
- Add datawrapper-backed richer effect parsing once the provider switch is complete.
