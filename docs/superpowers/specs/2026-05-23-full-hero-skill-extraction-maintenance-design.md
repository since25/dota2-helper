# Full Hero Skill Extraction Maintenance Design

## 背景

当前项目已经有 126 个 canonical 英雄和 733 个可见技能的伤害模型入口覆盖，但大部分英雄仍来自 `damageModels/autoModels.js` 的首轮自动推断。这个自动层能帮助暴露字段和生成审核页，但不能作为最终可信数据源。用户抽样 Jakiro、Slardar、Sand King 等英雄后已经确认：持续时间、百分比、被动触发、护甲削减、攻击力倍率等机制都需要人工复核，否则模型很容易把非伤害数值误算成伤害，或把持续/条件伤害压成瞬时伤害。

下一阶段目标是启动数据维护工程，把“有返回”升级为“每个英雄的技能抽取都有明确人工判断、审核状态和测试门禁”。

## 目标

1. 为所有 canonical 英雄建立可维护的人工技能抽取模型文件。
2. 将 `autoModels` 从生产可信层降级为候选建议和差异对照层。
3. 每个可见技能都必须有明确状态：`implemented`、`reference_only`、`ignored` 或 `unsupported`。
4. 每个技能状态必须能解释：
   - 哪些原始字段参与计算；
   - 哪些字段只是修正或参考；
   - 哪些字段被忽略；
   - 哪些机制暂不支持以及原因。
5. 支持批量人工审核：导出 HTML/JSON、显示原始字段、当前模型、未引用字段、可疑映射和审核状态。
6. 建立阶段性门禁：未人工审核的英雄不能被误认为 curated。
7. 修复 `Outworld Destroyer`、`Ringmaster` 当前 `/api/damage/heroes/:hero` 返回 `Unknown hero` 的命名/数据兼容问题。

## 非目标

本阶段不实现完整 Dota 战斗模拟器，不处理精确施法动作、转身、弹道躲避、位移路径、状态抗性、净化、目标移动、视野或真实团战时间线。复杂技能可以先标为 `reference_only` 或 `unsupported`，但不能误算。

本阶段也不要求立刻切换到 `dota2-datawrapper` 作为主数据源。`dota2-datawrapper` 继续作为实验对照源，等人工模型流程稳定后再决定迁移。

## 数据模型方向

每个英雄最终应有独立文件：

```txt
damageModels/heroes/<hero_slug>.js
```

每个文件导出：

```js
module.exports = {
  hero: 'Jakiro',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: [
      'Liquid Fire uses burn damage over duration.',
      'Liquid Frost impact damage is direct; bonus instance damage is a modifier reference.'
    ]
  },
  abilities: {
    'Liquid Fire': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'abilityduration',
      tickIntervalKey: 'tick_rate',
      semanticType: 'damage.sustained_dps',
      defaultIncluded: false,
      reason: 'Burn damage is damage over time, not instant burst.'
    }
  }
};
```

`review.status` 用于区分人工维护状态：

- `candidate`：由自动模型或脚本生成，仅供审核。
- `in_review`：正在人工校验。
- `reviewed`：已人工确认，可以作为可信模型进入 calculator 和 LLM 上下文。
- `needs_patch_update`：上游版本变化后需要重新检查。

## 自动模型的角色

`autoModels` 继续保留，但角色改为：

1. 生成候选模型；
2. 对比人工模型遗漏字段；
3. 帮助导出审核页面；
4. 作为 `candidate` 状态输入。

它不能再被覆盖统计称为 `curated`。覆盖报告必须分别显示：

- `manualReviewedHeroes`
- `manualCandidateHeroes`
- `autoOnlyHeroes`
- `reviewedAbilities`
- `candidateAbilities`
- `unsupportedAbilities`
- `ignoredAbilities`
- `unreferencedRawNumericFields`
- `suspiciousMappings`

## 审核页面增强

现有 `damage:audit-pages` 脚本已经能按英雄导出 API JSON 和 HTML。下一阶段需要增强每个英雄页面：

1. 显示 provider 原始技能字段，包括 `key`、`header`、`value`。
2. 显示当前人工模型条目。
3. 显示自动候选模型条目。
4. 显示人工模型与自动候选的差异。
5. 显示未引用的原始数值字段。
6. 显示可疑映射，例如百分比字段进入 flat damage。
7. 显示 hero review 状态。

这样人工审核时可以直接在一个页面里判断“字段是否被正确抽取”。

## 机制批次

不按字母顺序推进，而按机制复杂度推进。

### Batch 1: 持续、tick、通道、多波

优先英雄：

- Jakiro
- Viper
- Venomancer
- Phoenix
- Leshrac
- Death Prophet
- Witch Doctor
- Ancient Apparition

目标：稳定持续时间、tick interval、理论总量、作用时间控制和不默认计入瞬时爆发的规则。

### Batch 2: 普攻触发、攻击修正、暴击

优先英雄：

- Slardar
- Phantom Assassin
- Anti-Mage
- Ursa
- Spirit Breaker
- Sniper
- Juggernaut
- Wraith King

目标：区分固定技能伤害、普攻伤害、攻击次数、触发概率、强制触发和期望值。

### Batch 3: 百分比、属性、状态缩放

优先英雄：

- Necrophos
- Huskar
- Centaur Warrunner
- Timbersaw
- Outworld Destroyer
- Axe
- Pugna
- Undying

目标：所有依赖敌方生命/魔法/自身属性/距离/叠层的伤害都必须显式声明输入，不允许当作固定伤害。

### Batch 4: 护甲、魔抗、增伤、减伤

优先英雄：

- Slardar
- Vengeful Spirit
- Shadow Fiend
- Elder Titan
- Dazzle
- Medusa
- Razor
- Jakiro

目标：所有 modifier 都进入 `modifier_reference`，不进入 raw damage。可后续接入 item modifier。

### Batch 5: 召唤物、守卫、单位代理

优先英雄：

- Shadow Shaman
- Venomancer
- Lycan
- Beastmaster
- Warlock
- Nature's Prophet
- Visage
- Lone Druid

目标：暴露 summon count、攻击力、持续时间、攻击间隔、生存假设，不假设召唤物全程输出。

### Batch 6: 变身、复制技能、特殊机制

优先英雄：

- Rubick
- Morphling
- Invoker
- Lone Druid
- Terrorblade
- Arc Warden
- Meepo
- Brewmaster

目标：先显式标注边界和 unsupported/reference-only 机制，避免偷取技能、复制体或多单位机制被错误折叠成单英雄固定爆发。

### Batch 7: 低伤害和工具英雄收尾

目标：所有剩余英雄完成人工状态标记。没有伤害的技能也要解释为什么忽略。

## 门禁与验收

阶段一门禁：

- 覆盖报告不再把 auto-only 统计为 curated。
- `damage:audit-pages` 可以显示原始字段、人工模型、自动候选和差异。
- `Outworld Destroyer`、`Ringmaster` API 缺口被修复或明确从 canonical 列表中解释性处理。
- Batch 1 英雄全部达到 `reviewed`。

全阶段门禁：

- 126 个 canonical 英雄均有人工模型文件。
- 733 个可见技能均有人工状态。
- `manualReviewedHeroes` 达到 126。
- `autoOnlyHeroes` 为 0。
- `suspiciousMappings` 为 0。
- `unsupported` 条目都有具体原因。
- 审核页导出成功，错误页只允许出现明确的外部数据缺口，不允许是内部命名问题。
- `npm test`、`npm run semantic:audit`、`npm run damage:coverage` 通过。

## 风险

1. Dota 技能机制非常多，强行一次性建全会拖慢进度。
2. 仅靠字段名仍然会误判机制，所以必须结合人工审核页。
3. 当前 `dotaconstants` 可能缺少某些技能细节，后续可能需要从 `dota2-datawrapper` 或 VPK 层补数据。
4. 过早移除 auto fallback 会造成开发期间 API 大面积失败，所以需要先用 reporting gate 约束，再逐步切换 production 输出。

## 推荐实施策略

第一轮只做维护基础设施和 Batch 1。完成后再继续批量推进。

第一轮交付物：

1. 模型 review 状态 schema。
2. 覆盖报告区分 manual reviewed、manual candidate、auto-only。
3. 审核页显示 raw fields、manual model、auto candidate、diff、unreferenced fields。
4. 修复 Outworld Destroyer/Ringmaster 命名兼容。
5. Batch 1 英雄人工模型。
6. 测试和文档更新。
