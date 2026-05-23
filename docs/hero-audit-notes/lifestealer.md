# 噬魂鬼（Lifestealer）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小狗

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：3
- 忽略项：2
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：基本可用，但 `Open Wounds` 当前不应按百分比生命伤害建模。
- 是否存在误计入固定爆发：`Open Wounds` 的 `max_health_as_damage_pct` 本地为 0，不能作为伤害；`Feast` 是普攻百分比生命伤害。
- 是否缺少关键输入：`Feast` 需要目标最大生命和攻击次数；`Infest` 需要是否命中爆炸。
- 是否需要修改模型：需要把 `Open Wounds` 改为治疗/减速参考，把 `Feast` 接入普攻模型。

## 技能复核
- `Rage`：持续、魔抗、移速增益，不直接伤害。
- `Open Wounds`：本地 `max_health_as_damage_pct=0`，Dotabuff 只显示治疗转化和减速；不应计入生命伤害。
- `Feast`：`hp_damage_percent: 1.45%/2.05%/2.65%/3.25%` 是每次普攻对目标最大生命的物理伤害，需要 `attack_count` 和 `enemy_max_health`。
- `Ghoul Frenzy`：当前无伤害字段。
- `Infest`：`damage: 150/275/400` 是魔法爆发，模型正确；自回血、额外生命和寄生单位流失不是对敌固定伤害。
- `Consume`：子技能，无额外伤害字段。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 Open Wounds 非伤害字段。
- [ ] 修正 `Open Wounds` 为 reference_only；实现 `Feast` 普攻百分比生命模型。
