# Damage Combo Calculator Design

## Background

The project now has a component-based damage model that separates fixed instant damage from sustained, multi-wave, conditional, attack-triggered, target-state, and growth damage. The next useful step is an independent frontend calculator that lets a user inspect one hero's damage kit, choose a level, choose a skill and item combination, manually set enemy armor and magic resistance, and calculate total damage without involving the LLM.

This page should also work as a practical validation surface for the damage adapter. If a number looks wrong in the UI, it should be easy to trace the source component, formula, classification, and resistance calculation.

## Goals

1. Add an independent damage calculator page separate from the matchup advice flow.
2. Support a single selected hero, hero level, skill components, and item damage components.
3. Allow manual enemy armor and magic resistance input.
4. Calculate raw damage and resistance-adjusted damage by component and by damage type.
5. Make damage classification visible so adapter issues are obvious.
6. Keep the first version local-data-only: no LLM, no subscription state, no rate limiting.

## Non-Goals

This first version will not include:

- Target hero selection.
- Automatic target armor or magic resistance lookup.
- Talents, neutral items, facets as selectable modifiers, Aghanim's Scepter, or Aghanim's Shard modifications.
- Full combo timing simulation.
- Multiple attacks over time unless the user manually chooses a component and count.
- Buff/debuff chains such as spell amplification, armor reduction, magic resistance reduction, barriers, shields, or damage block.
- Saving builds or sharing links.

## Route And Page

Add a standalone page:

`/damage-calculator.html`

Supporting assets:

- `damage-calculator.js`
- Existing `style.css` can be reused where practical.
- Additional calculator-specific CSS may live in `damage-calculator.css` if keeping the layout isolated is cleaner.

The page should not reuse the existing `heroForm` flow. It should have its own root IDs and script to avoid coupling with `script.js`.

## User Inputs

Hero and level:

- Hero selector using the existing localized hero list.
- Hero level numeric control from `1` to `30`.

Enemy manual parameters:

- Armor input, default `0`.
- Magic resistance percentage input, default `25`.

Skill components:

- Show all damage components returned by the backend for the selected hero.
- Each component row includes:
  - skill name
  - ability level
  - component kind
  - growth kind
  - damage type
  - raw value at selected ability level
  - theoretical total if available
  - formula label
  - warning/caveat text
  - checkbox: `计入总伤害`
  - mode selector when useful: `基础值` or `理论总量`

Items:

- Show item components that the backend can classify as direct damage or theoretical damage.
- First version can expose a curated list of damage-relevant items from local item data.
- Items with only stats or utility should be visible only if easy to classify; otherwise they can be excluded from v1.
- Each item row mirrors skill component rows:
  - item name
  - component kind
  - damage type
  - raw value
  - formula label
  - warning/caveat text
  - checkbox: `计入总伤害`

## Calculation Rules

Raw total:

- Sum all selected component values.
- For components with theoretical totals, use the selected mode:
  - `基础值`: use the component's current value.
  - `理论总量`: use `theoreticalTotal`.

Damage type adjustment:

- Magical: `raw * (1 - magicResistancePercent / 100)`.
- Pure: `raw`.
- Physical: use Dota armor reduction approximation:

```js
function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}
```

- Unknown: keep raw value, but show warning that resistance adjustment is not reliable.

Rounded display:

- Round displayed totals to two decimals.
- Keep raw component values unrounded where the source value has decimals.

Warnings:

- Sustained and multi-wave values must say they require uptime/full hit.
- Conditional values must say what condition is required when known.
- Attack modifier values must say they require attacks.
- Growth/state values must say the current calculator does not estimate stacks or accumulated state unless the component provides an explicit selected value.

## Backend API

Add:

`GET /api/damage/heroes/:hero`

Returns:

```js
{
  hero: "Sand King",
  displayName: "沙王（Sand King）",
  levels: {
    selectedDefault: 1,
    max: 30
  },
  abilities: [
    {
      name: "Sand Storm",
      displayName: "沙尘暴（Sand Storm）",
      isUltimate: false,
      manaCostByAbilityLevel: [85],
      cooldownByAbilityLevel: [40, 34, 28, 22],
      components: [
        {
          id: "sandking_sand_storm:sustained:sand_storm_damage",
          kind: "sustained",
          growthKind: "non_growth",
          damageType: "Magical",
          label: "DAMAGE PER SECOND",
          valuesByAbilityLevel: [30, 50, 70, 90],
          theoreticalTotalByAbilityLevel: [480, 1000, 1680, 2520],
          totalFormula: "duration * damagePerSecond",
          countInFixedInstantTotal: false,
          metadata: {
            durationByAbilityLevel: [16, 20, 24, 28],
            tickIntervalByAbilityLevel: [0.2]
          },
          caveats: ["包含持续伤害，理论总量依赖目标站位和完整命中。"]
        }
      ]
    }
  ],
  items: []
}
```

Add:

`POST /api/damage/calculate`

Request:

```js
{
  hero: "Sand King",
  heroLevel: 5,
  enemyArmor: 3,
  enemyMagicResistancePercent: 25,
  selectedComponents: [
    {
      sourceType: "ability",
      abilityName: "Burrowstrike",
      componentId: "sandking_burrowstrike:instant_fixed:dmg",
      abilityLevel: 3,
      valueMode: "base"
    },
    {
      sourceType: "ability",
      abilityName: "Sand Storm",
      componentId: "sandking_sand_storm:sustained:sand_storm_damage",
      abilityLevel: 3,
      valueMode: "theoretical"
    }
  ]
}
```

Response:

```js
{
  hero: "Sand King",
  heroLevel: 5,
  enemyArmor: 3,
  enemyMagicResistancePercent: 25,
  totals: {
    raw: 1900,
    adjusted: 1425,
    byType: {
      Magical: { raw: 1900, adjusted: 1425 }
    }
  },
  components: [
    {
      name: "Burrowstrike",
      displayName: "掘地穿刺（Burrowstrike）",
      kind: "instant_fixed",
      damageType: "Magical",
      raw: 220,
      adjusted: 165,
      formula: "single_value",
      caveats: []
    },
    {
      name: "Sand Storm",
      displayName: "沙尘暴（Sand Storm）",
      kind: "sustained",
      damageType: "Magical",
      raw: 1680,
      adjusted: 1260,
      formula: "duration * damagePerSecond",
      caveats: ["理论总量依赖目标站位和完整命中。"]
    }
  ],
  warnings: []
}
```

## Frontend Layout

The page should be operational, compact, and data-forward.

Suggested layout:

- Top bar: title and a link back to the matchup assistant.
- Left panel:
  - hero selector
  - hero level
  - enemy armor
  - enemy magic resistance
  - recalculate button
- Main panel:
  - ability component table
  - item component table
- Right panel or bottom summary:
  - raw total
  - adjusted total
  - damage by type
  - selected component breakdown
  - warnings

Avoid a marketing-style landing page. The calculator should be the first screen.

## Item Scope For V1

The item layer should be designed but conservative:

- Include items only when local item data exposes a clear damage value and damage type can be classified.
- If damage type cannot be determined reliably, classify as `Unknown` and show warning.
- Do not treat attribute items as damage modifiers in v1.
- Do not apply spell amplification, attack damage, or armor reduction items as modifiers in v1.

Examples likely worth supporting once data is confirmed:

- Dagon-style direct magical damage if present in local item data.
- Shiva's Guard-style active magical damage if present.
- Radiance-style sustained magical damage if present.

If the local item schema is too inconsistent, v1 can ship with skills first and an empty item table that explains: `本地数据暂未识别可计算伤害物品` while preserving the API shape for items.

## Validation

Automated tests:

- API returns Sand King damage components with Sand Storm theoretical totals.
- API calculation handles:
  - magical resistance
  - physical armor formula
  - pure damage
  - theoretical sustained mode
  - unknown damage warning
- Frontend script unit tests can be avoided unless the project adds a browser test setup; use Playwright smoke checks instead.

Manual/browser checks:

- Open `/damage-calculator.html`.
- Select Sand King.
- Set hero level `5`.
- Select Burrowstrike level 3 base value.
- Select Sand Storm level 3 theoretical value.
- Enemy armor `0`, magic resistance `25`.
- Expected:
  - Burrowstrike raw `220`, adjusted `165`.
  - Sand Storm raw `1680`, adjusted `1260`.
  - total raw `1900`, adjusted `1425`.
  - warnings mention sustained uptime.

## Rollout Notes

- This page is local-data-only and should not call the LLM.
- It should not consume free query quota.
- It should not require Stripe or Upstash Redis.
- It should be reachable directly by URL even if no navigation link is added on the main page.
- A small link from the main page footer or header can be added after the standalone page is verified.
