# 祸乱之源（Bane）伤害模型复核

## 状态
- 复核状态：已复核，作为人工审核样例
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：祸乱

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：1
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：2
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前 Bane 模型可用。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：`Fiend's Grip` 需要实际持续施法时间；当前已通过 `channel_duration` 标出。
- 是否需要修改模型：暂不需要。
- 审核重点：Bane 的核心风险不是字段误读，而是持续伤害是否默认打满。计算器里应允许用户调整 `Enfeeble` 和 `Fiend's Grip` 的作用时间。

## 技能复核

### Ichor of Nyctasha
- 中文名：妮塔莎脓血
- 当前模型：ignored / 未知
- 语义类型：未标注
- 当前字段：无
- 本地 rawAttributes：`damage_per_terror: 0`、`max_terrors: 5`、`status_resistance: 5%`
- Dotabuff 对照：每名英雄最高恐惧叠加层数 5；每层恐惧降低状态抗性 5%。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。当前字段没有直接伤害，状态抗性降低会影响控制链，但不是伤害数值。
- 问题记录：
  - 无。
- 修正建议：
  - 后续如果做控制链评估，可以把 `status_resistance` 作为控制窗口修正项；伤害计算暂不处理。

### Enfeeble
- 中文名：虚弱
- 当前模型：implemented / sustained_dps
- 语义类型：damage.sustained_dps
- 当前字段：`damagePerSecondKey: enfeeble_tick_damage`；`durationKey: duration`；`tickIntervalKey: damage_tick_rate`
- 本地 rawAttributes：`enfeeble_tick_damage: 12/18/24/30`、`duration: 9`、`damage_tick_rate: 1`、`damage_reduction: 55%/60%/65%/70%`、`cast_reduction: 30%`
- Dotabuff 对照：伤害 12/18/24/30；持续时间 9；伤害类型为纯粹。
- 是否计入固定爆发：否
- 需要输入：建议计算器支持 `active_duration`
- 理论总量：108/162/216/270，公式为 `每秒伤害 * 9 秒`
- 人工判断：基本正确。它不是瞬时爆发，不能进入固定 instant total；当前 `sustained_dps` 比自动模型的 instant 解释更准确。
- 问题记录：
  - 当前模型没有显式写 `conditionInputs: ['active_duration']`，但持续伤害计算器已经可以用作用时间控制。为了审核可读性，后续可补上。
- 修正建议：
  - 可选：在模型中给 Enfeeble 增加 `conditionInputs: ['active_duration']`，让审计页更明确。

### Brain Sap
- 中文名：蚀脑
- 当前模型：implemented / instant_fixed
- 语义类型：damage.instant
- 当前字段：`damageKey: brain_sap_damage`
- 本地 rawAttributes：`brain_sap_damage: 90/160/230/300`
- Dotabuff 对照：治疗/伤害 90/160/230/300；伤害类型为纯粹。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。对敌方目标是纯粹瞬时伤害；治疗部分不影响对敌爆发计算。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Nightmare
- 中文名：噩梦
- 当前模型：reference_only / debuff_reference
- 语义类型：window.debuff_duration.seconds
- 当前字段：`valueKey: abilityduration`
- 本地 rawAttributes：`abilityduration: 3.5/4.5/5.5/6.5`、`abilitycastrange: 550/600/650/700`、`walk_speed: 110`
- Dotabuff 对照：资源行包含冷却、魔耗、施法距离；技能描述为控制/睡眠效果。
- 是否计入固定爆发：否
- 需要输入：无
- 影响对象：disable_window
- 人工判断：正确。噩梦本身不造成对敌伤害，应作为控制窗口参考。
- 问题记录：
  - Dotabuff 页面会显示梦游速度 110，这不是伤害，不能被提取成 unknown damage。
- 修正建议：
  - 不需要修改；如果后续做控制链，可以展示 `abilityduration`。

### Fiend's Grip
- 中文名：魔爪
- 当前模型：implemented / sustained_dps
- 语义类型：damage.sustained_dps
- 当前字段：`damagePerSecondKey: fiend_grip_damage`；`durationKey: abilitychanneltime`；`tickIntervalKey: fiend_grip_tick_interval`
- 本地 rawAttributes：`fiend_grip_damage: 70/110/150`、`abilitychanneltime: 4.75/5.25/5.75`、`fiend_grip_tick_interval: 0.5`、`fiend_grip_mana_drain: 5%`
- Dotabuff 对照：伤害 70/110/150；持续时间 4.75/5.25/5.75；每秒魔法吸取 5%；伤害类型为纯粹。
- 是否计入固定爆发：否
- 需要输入：`channel_duration`
- 理论总量：332.5/577.5/862.5，公式为 `每秒伤害 * 持续施法时间`
- 人工判断：正确。魔爪是持续施法伤害，默认打满只是理论上限，实战需要输入实际持续时间。
- 问题记录：
  - `fiend_grip_mana_drain: 5%` 是抽蓝，不应混入伤害。
- 修正建议：
  - 不需要修改；计算器 UI 中应优先暴露作用时间/持续施法时间。

### Nightmare End
- 中文名：噩梦终止
- 当前模型：ignored / 未知
- 语义类型：未标注
- 当前字段：无
- 本地 rawAttributes：无
- Dotabuff 对照：这是用于结束噩梦的子技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。子技能不产生额外伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

## 审核时应该写什么
- 字段是否对得上：写 Dotabuff 显示值、本地 rawAttributes key、当前模型 key 是否一致。
- 伤害类型是否正确：例如 Bane 的核心伤害都是纯粹伤害。
- 是否应该计入固定爆发：瞬时伤害可以计入；持续、引导、状态缩放、控制、资源抽取通常不要直接计入固定爆发。
- 是否需要用户输入：持续时间、命中次数、攻击次数、目标当前血量/魔法、周围单位数量等。
- 非伤害字段是否被误读：移动速度、施法距离、状态抗性、抽蓝、魔耗、冷却、阈值都要特别标出来。
- 结论是否需要改模型：如果需要，写清楚改哪个文件、哪个技能、哪个字段、预期模型类型。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 可选：给 Enfeeble 增加显式 `conditionInputs: ['active_duration']`。
