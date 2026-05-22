# Dota 2 Data Grounding and Provider Migration Design

## Goal

Improve the quality and trustworthiness of AI coaching output in two stages:

1. Stage B: keep `dotaconstants` as the current local data source, but send richer, more explicit match data to the AI and require Chinese output grounded in provided facts.
2. Stage C: introduce a data provider boundary so the project can migrate from direct `dotaconstants` usage to `Egezenn/dota2-datawrapper` without rewriting prompt, route, or frontend logic.

## Current State

The project currently loads Dota data from the local npm package `dotaconstants`. Runtime calls do not fetch hero or item data from a remote API; the package is installed under `node_modules/dotaconstants` and exposes local JSON data through `import('dotaconstants')`.

The current prompt includes:

- Current patch name.
- The selected player hero and role.
- Both team compositions.
- Player hero ability descriptions plus at most three ability attributes per ability.
- Lane opponents' brief ability context, limited to one key non-passive ability and one ultimate name.
- A role-based item list with item costs and at most four item attributes.

This gives the AI some current data, but it is not enough to guarantee accurate advice. The model can still fill gaps from stale internal knowledge because the prompt does not fully separate verified game facts from strategic reasoning.

## Design Principles

- Game facts should come from local data, not model memory.
- AI should explain and prioritize; it should not invent missing numbers.
- The backend should normalize user input before validation so Chinese aliases and English hero names resolve to one canonical hero identity.
- Data source selection should be isolated behind a provider interface.
- Stage B should keep the current app usable and avoid a large frontend rewrite.
- Stage C should prepare for structured outputs and data-source migration.

## Stage B: Richer dotaconstants Grounding

Stage B keeps `dotaconstants` as the source of truth and improves what is sent to the AI.

### Hero Name Normalization

Add a shared hero alias module that maps user-facing names to canonical English localized names.

Examples:

- `敌法师`, `敌法`, `am`, `AM` -> `Anti-Mage`
- `水晶室女`, `冰女`, `cm`, `CM` -> `Crystal Maiden`
- `风行者`, `风行`, `wr`, `WR` -> `Windranger`

The frontend should use this mapping for immediate correction. The backend should also apply the same normalization before validation so API calls remain safe if the frontend is bypassed.

The canonical names remain English internally because `dotaconstants` uses English localized hero names.

### Match Context Builder

Create a focused module, tentatively `dotaDataContext.js`, responsible for converting validated team selections into a grounded context object and prompt-ready text.

The context should include:

- `patch`: current patch name from `dotaconstants`.
- `teams`: canonical hero names, roles, and optional Chinese display names.
- `playerHero`: full available ability data for the selected hero.
- `playerFacets`: available facet title and description data.
- `laneOpponents`: opposing hero names and roles relevant to the selected role.
- `laneOpponentAbilities`: fuller ability summaries for lane opponents.
- `enemyThreats`: selected enemy control, burst, silence, mobility, save, and dispel signals when detectable from ability text or metadata.
- `roleItems`: current role item pool with item cost, attributes, and active/passive text where available.
- `dataCoverage`: a short machine-generated note describing which data was available and which data was not found.

Stage B does not need perfect semantic classification. It should prefer transparent data over clever inference. If the data is missing or ambiguous, `dataCoverage` should say so.

### Prompt Contract

Replace the current English-only coaching prompt with a Chinese grounded prompt.

The prompt should tell the AI:

- Answer in Simplified Chinese.
- Keep common Dota 2 terms readable; English item or ability names may be preserved when useful.
- Treat the provided context as the only source for numerical facts.
- Do not invent cooldowns, damage, mana costs, cast ranges, item prices, or patch facts that are not in the context.
- If a useful number is missing, say that the local data did not provide it.
- Separate factual references from strategic recommendations.
- Be specific to the selected hero, role, allies, enemies, and lane matchup.

The AI response can remain Markdown in Stage B so the current frontend renderer continues to work.

### Suggested Stage B Sections

The AI should return:

- `总览`: role, win condition, and matchup identity.
- `对线期 0-10 分钟`: lane opponents, trading plan, survival threats, kill windows.
- `中期 10-25 分钟`: farm/fight balance, core timing, first important fights.
- `后期 25 分钟后`: objective plan, high ground, Roshan, teamfight job.
- `出装建议`: starting, early, core, situational items, with reasons tied to the matchup.
- `队友配合`: specific ally interactions.
- `敌方威胁`: key abilities or patterns to respect.
- `数据缺口`: any important unavailable data that the AI avoided guessing.

## Stage C: Provider Boundary and dota2-datawrapper Migration

Stage C adds a data provider interface and migrates the implementation behind that boundary.

### Provider Interface

The backend should depend on a local interface rather than directly importing `dotaconstants` inside route handlers.

Tentative interface:

```js
async function getPatch()
async function getHeroIndex()
async function normalizeHeroName(input)
async function getHeroDetails(canonicalHeroName)
async function getItemDetails(itemKeyOrName)
async function buildMatchContext(myTeam, opponentTeam)
```

The route should call `buildMatchContext()` and should not care whether the provider is backed by `dotaconstants` or `dota2-datawrapper`.

### Providers

Implement two providers:

- `DotaconstantsProvider`: current stable local fallback.
- `DatawrapperProvider`: future richer provider based on `Egezenn/dota2-datawrapper`.

Provider selection should be controlled by environment variable:

```env
DOTA_DATA_PROVIDER=dotaconstants
```

Later:

```env
DOTA_DATA_PROVIDER=datawrapper
```

If the selected provider fails during startup or context building, the app should return a clear error. A fallback to `dotaconstants` can be added if the failure mode is recoverable and does not hide data drift.

### Why dota2-datawrapper Later

`dota2-datawrapper` appears better suited for a richer data layer because its README describes enriched methods that combine Valve data and constants, including hero, item, and ability data with normalized references. It should be evaluated through the provider boundary before becoming the default.

The migration should include comparison tests:

- Same hero from both providers.
- Same item from both providers.
- Same patch metadata.
- Same ability names and selected attributes.
- Known shard/scepter/facet cases.

This avoids silently changing the coaching output because of provider shape differences.

## Error Handling

Stage B should fail clearly when:

- A hero cannot be normalized.
- A canonical hero is absent from the local data.
- The selected teams contain duplicates.
- The data context cannot be built.

The AI prompt should include data gaps as facts instead of hiding them. Missing data should not stop the user from getting advice unless core hero or team data is unavailable.

Stage C should add provider-specific diagnostics:

- Which provider is active.
- Which package version or data version is loaded when available.
- Which data sections were unavailable.

## Testing Strategy

Stage B tests:

- Chinese aliases normalize to canonical English names.
- Existing English names still work.
- Duplicate detection still catches Chinese aliases that resolve to the same hero.
- Match context includes patch, selected hero abilities, lane opponent abilities, and role items.
- Prompt includes the Chinese output instruction and no-invented-numbers rule.

Stage C tests:

- Provider interface contract tests run against `DotaconstantsProvider`.
- Provider interface contract tests run against `DatawrapperProvider` once added.
- Route tests use a fake provider so AI prompt behavior can be tested without depending on live data.
- Snapshot or structured assertions confirm important context fields are present.

## Non-Goals

- Do not build a full Dota encyclopedia UI in Stage B.
- Do not require AI JSON output in Stage B.
- Do not immediately replace `dotaconstants` before the provider boundary exists.
- Do not trust model memory for numerical Dota facts.
- Do not add live remote Dota data calls to request handling until caching and failure behavior are designed.

## Rollout Plan

1. Stage B1: Add hero alias normalization shared by frontend and backend.
2. Stage B2: Add `dotaDataContext.js` using `dotaconstants`.
3. Stage B3: Replace the prompt with a Chinese grounded prompt.
4. Stage B4: Add tests for aliasing, context building, and prompt rules.
5. Stage C1: Define provider interface and move current `dotaconstants` access behind it.
6. Stage C2: Add `dota2-datawrapper` as an experimental provider.
7. Stage C3: Compare provider outputs and document differences.
8. Stage C4: Switch default provider only after tests and real prompts look stable.

## Open Questions

- Should the Chinese alias list be manually curated first, or generated from a maintained community translation source later?
- Should Stage B include a visible `数据缺口` section in every response, or only when there are missing facts?
- Should Stage C keep Markdown output, or move to AI JSON output and structured frontend rendering at the same time?
