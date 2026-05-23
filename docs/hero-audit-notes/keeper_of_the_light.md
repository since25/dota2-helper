# 光之守卫（Keeper of the Light）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：光法、kotl

## 模型概览
- 技能条目数：8
- 已实现伤害：2
- 参考项：4
- 忽略项：2
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：0

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Illuminate` 当前按满蓄最高伤害计入，未体现蓄力时间；`Blinding Light` 被错误标为距离缩放。
- 是否缺少关键输入：冲击波蓄力时间、灵光脉冲次数、炎阳之缚魔抗降低修正。
- 是否需要修改模型：需要补蓄力、脉冲和魔抗修正。

## 技能复核
- `Illuminate`：`total_damage: 185/290/395/500` 是最高伤害，`max_channel_time: 3`；应按 `channel_duration` 缩放，不能默认满蓄。
- `Blinding Light`：`damage: 90/140/190/240` 是固定瞬时魔法伤害，不是距离缩放；击退距离不是伤害。
- `Chakra Magic`：回魔和冷却减少，不直接伤害；可影响连招窗口。
- `Solar Bind`：`magic_resistance: 20%/30%/40%` 是魔抗降低，应进入魔法伤害修正，不直接造成伤害。
- `Will-O-Wisp`：`wisp_damage: 85`、`on_count: 5`，灵光多次闪烁/拉扯，当前 instant_fixed 只计一次会低估。
- `Spirit Form`：施法距离、移速、冲击波治疗，非直接伤害。
- `Release Illuminate/Bright Speed`：释放子技能和速度/视野换算，不直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记蓄力和魔抗修正字段。
- [ ] 修正冲击波蓄力、致盲之光瞬时伤害、灵光多脉冲模型。
