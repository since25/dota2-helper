# 瘟疫法师（Necrophos）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：死灵法

## 模型概览
- 技能条目数：6
- 已实现伤害：0
- 参考项：6
- 需要状态输入项：5
- 持续伤害项：1

## 复核结论
- 总体判断：需修正模型。当前过于保守，`Death Pulse` 和 `Reaper's Scythe` 都应可计算。
- 是否存在误计入固定爆发：未发现；当前主要是漏计。
- 是否缺少关键输入：目标当前/最大生命、死亡脉冲命中、竭心光环作用时间。
- 是否需要修改模型：需要补 Death Pulse 瞬时伤害、Heartstopper 持续百分比、Reaper 缺失生命伤害。

## 技能复核
- `Death Pulse`：本地 damage 数组 100/160/220/280，Dotabuff 页面只显示治疗量，模型当前 conditional 低估；应计魔法瞬时伤害。
- `Ghost Shroud`：恢复增强、减速和魔法伤害加深/承伤变化，不直接伤害。
- `Heartstopper Aura`：`aura_damage: 0.8%/1.3%/1.8%/2.3%` 每秒最大生命流失，需要目标最大生命和作用时间。
- `Death Seeker`：魔抗降低/虚无相关，需确认是否造成死亡脉冲或寻敌伤害；当前仅 reference 安全。
- `Sadist`：恢复和可能法术增强，非直接伤害。
- `Reaper's Scythe`：`damage_per_health: 0.7/0.8/0.9` 依赖目标已损失生命，不是已损魔法。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 Reaper 输入应为 missing health。
- [ ] 实现 Death Pulse、Heartstopper、Reaper's Scythe 正确模型。
