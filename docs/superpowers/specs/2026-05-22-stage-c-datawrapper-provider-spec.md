# Stage C Datawrapper Provider Migration Spec

## Goal

Stage C migrates the data layer from a direct `dotaconstants` dependency toward a provider-based architecture that can evaluate and eventually use `Egezenn/dota2-datawrapper`.

The goal is richer and more accurate local context for LLM coaching, especially:

- Hero base stats and derived panel stats.
- Ability values, cooldowns, mana costs, behavior flags, and damage types.
- Aghanim's Scepter and Shard item data plus hero-specific upgrade effects when available.
- Item cost, attributes, components, recipes, and active/passive text.
- Patch metadata and patch-note access.
- Stable provider diagnostics so every AI answer can say which data source and version produced its facts.

## Current State

The project already has a first provider boundary:

- `dataProviders/index.js` selects the provider through `DOTA_DATA_PROVIDER`.
- `dataProviders/dotaconstantsProvider.js` wraps the current `dotaDataContext.js` behavior.
- `server.js` calls `dataProvider.buildMatchContext()` and `dataProvider.buildGroundedChinesePrompt()`.
- `DOTA_DATA_PROVIDER=datawrapper` currently fails clearly because the provider is not implemented yet.

The current default provider remains `dotaconstants`. This is intentional. It is the known working fallback and all current tests pass against it.

## Product Semantics For Facets

The prompt must not imply that the user still chooses between two Facets.

For current analysis, Facets/命石 are treated this way:

- The current patch no longer exposes a player-facing two-choice Facet input in this app.
- Hero-specific fixed traits should be treated as part of the current hero mechanics if the active data source exposes them.
- Deprecated `facets` fields that remain in older local data shapes must not enter matchup analysis or the `数据缺口` section.
- The model should not ask the user to choose a Facet unless a future provider exposes an active selectable mechanic again.

## Why Datawrapper

`dota2-datawrapper` describes itself as a normalization and enrichment layer that merges Valve's live datafeed API with `dotaconstants`. Its README specifically calls out:

- Enriched hero, item, ability, and patch data.
- Item costs and component trees from constants.
- Special value resolution for placeholders such as `%bonus_damage%` and `{s:value}`.
- Aghanim's Shard/Scepter override handling.
- Static/GitHub provider support for bundled data.
- TypeScript schema definitions.

These are exactly the areas where the current `dotaconstants`-only layer is weakest.

## Non-Goals

Stage C should not:

- Switch the default provider before comparison tests pass.
- Remove `dotaconstants`; it stays as fallback.
- Add live remote calls to each user request without caching.
- Rewrite the frontend.
- Force JSON LLM output yet.
- Model Rubick stolen-spell inheritance or buyback price/cooldown in this stage.

## Provider Contract

Every provider must expose the same high-level contract:

```js
{
  name,
  getProviderMetadata(),
  getHeroIndex(),
  normalizeHeroName(input),
  getHeroDetails(canonicalHeroName),
  getItemDetails(itemKeyOrName),
  buildMatchContext(myTeam, opponentTeam),
  buildGroundedChinesePrompt(matchContext)
}
```

`buildMatchContext()` must return the app's canonical context shape. Route and frontend code must not depend on provider-specific data shapes.

## Canonical Context Shape

The normalized context should include:

- `dataSource`: provider name, package/library version, patch name, patch date, and warnings.
- `teams`: normalized teams with canonical English names and display names when available.
- `playerHero`: hero identity, base stats, derived no-item stats, abilities, and current fixed mechanics.
- `laneOpponentAbilities`: full ability summaries for lane opponents.
- `roleItems`: role-based item pool with cost, attributes, components, recipe info, and active/passive text.
- `upgradeItems`: Scepter and Shard item basics plus hero-specific upgrade text when available.
- `playerPowerSpikes`, `lanePowerSpikes`, `enemyPowerSpikes`: key-level burst windows.
- `dataCoverage`: available data sections and meaningful gaps.

Provider-specific raw payloads may be retained under a clearly named debug key, but prompt generation must use normalized fields only.

## Datawrapper Provider Plan

### C2.1 Package Evaluation

Install or inspect `dota2-datawrapper` in isolation and create a local probe script.

The probe must answer:

- Does the package support CommonJS `require`, ESM `import`, or both?
- Which methods are available at runtime?
- Can it run offline from bundled/static data, or does it need Valve network calls?
- How long does first load take?
- What data shape is returned for one known hero, one known item, one known ability, and patch list?

Probe output should be saved under `test-runs/` as JSON or Markdown for review.

### C2.2 Experimental Provider

Add `dataProviders/datawrapperProvider.js`.

It should:

- Initialize the datawrapper client lazily.
- Prefer cached/static data when possible.
- Normalize output into the canonical context shape.
- Return provider diagnostics in `dataSource`.
- Throw clear errors for unavailable methods or network failures.

`DOTA_DATA_PROVIDER=datawrapper` may remain experimental until comparison tests pass.

### C2.3 Comparison Harness

Add a comparison script and tests that run both providers against the same fixtures:

- Rubick.
- Drow Ranger.
- Queen of Pain.
- Aghanim's Scepter.
- Aghanim's Shard.
- One component-based item such as Battle Fury.
- One ability with Scepter or Shard upgrade text if datawrapper exposes it.

The output should classify differences:

- `same`: values match.
- `datawrapper_richer`: datawrapper has useful extra data.
- `dotaconstants_only`: fallback data exists only in dotaconstants.
- `conflict`: values disagree and need manual review.
- `missing_both`: neither source has the field.

### C2.4 Prompt Trial

Run a real prompt trial with:

- `DOTA_DATA_PROVIDER=dotaconstants`.
- `DOTA_DATA_PROVIDER=datawrapper`.

Use the same 5v5 lineup and selected player hero. Save both full LLM requests and responses under `test-runs/`.

The review question is not "which output sounds nicer"; it is whether the datawrapper prompt reduces false `数据缺口`, improves item/upgrade reasoning, and keeps numerical claims grounded.

### C2.5 Default Switch Decision

Only switch the default provider after:

- Contract tests pass for both providers.
- Comparison report has no unresolved critical conflicts.
- Real LLM prompt trial looks stable.
- Fallback to `dotaconstants` remains available through `DOTA_DATA_PROVIDER=dotaconstants`.

## Error Handling

Provider failures must be explicit:

- Unsupported provider name: fail on startup or first request with a clear message.
- Datawrapper unavailable or missing runtime method: tell the user the provider is not ready.
- Network failure during probe or live call: do not silently fall back unless fallback mode is explicitly configured.
- Missing hero or item: include provider name and normalized query in the error.

## Testing Strategy

Add tests in layers:

- Provider selection tests: default provider, unsupported provider, experimental provider flag.
- Contract tests: each provider returns required methods and normalized context sections.
- Data shape tests: Rubick abilities include mana/cooldown, upgrade item basics exist, deprecated facets do not appear as selectable input.
- Comparison tests: selected hero/item/ability fixtures generate a structured diff.
- Server smoke tests: `/api/get-tips` uses the active provider without route-level data-source knowledge.

## Acceptance Criteria

Stage C is complete when:

- `DOTA_DATA_PROVIDER=dotaconstants` remains fully green.
- `DOTA_DATA_PROVIDER=datawrapper` can build a normalized match context for a representative 5v5 lineup.
- A comparison artifact documents data differences between the providers.
- A real LLM request/response pair is saved for datawrapper.
- The final recommendation says either "switch default to datawrapper" or "keep dotaconstants until these blocking gaps are fixed."

## Open Questions

- Should datawrapper run live against Valve endpoints during normal app requests, or should we generate a local static bundle and read from disk?
- Should provider comparison artifacts be committed, or kept under ignored `test-runs/` files?
- Should C stage include structured JSON LLM output, or should that remain a later D stage after the data source stabilizes?
