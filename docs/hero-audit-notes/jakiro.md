# 杰奇洛（Jakiro）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：双头龙

## 模型概览
- 技能条目数：6
- 已实现伤害：5
- 参考项：1
- 忽略项：0
- 需要状态输入项：4
- 持续伤害项：3
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：基本可用，但 `Liquid Fire/Liquid Frost` 的持续/易伤语义仍需补强。
- 是否存在误计入固定爆发：`Liquid Frost` 只计即时伤害可以接受，但其额外伤害是后续技能实例修正，不是一次固定爆发。
- 是否缺少关键输入：持续伤害实际作用时间、液态技能是否命中、液态冰后续触发次数。
- 是否需要修改模型：建议补 Liquid Frost 的易伤修正，并确认 Liquid Fire 数值版本。

## 技能复核
- `Dual Breath`：`burn_damage: 20/40/60/80`、`abilityduration: 5`，持续魔法伤害方向正确，需要 `active_duration`。
- `Ice Path`：`damage: 50` 是瞬时魔法伤害，模型正确。
- `Liquid Fire`：本地 `damage: 15/25/35/45`，Dotabuff 显示 12/24/36/48，存在版本差异；它有 `abilityduration: 5` 和 `tick_rate: 0.5`，持续时间没有丢，但需要明确展示。
- `Liquid Frost`：`damage: 8/16/24/32` 是即时伤害，`bonus_instance_damage_from_other_abilities` 是后续技能额外伤害修正，持续 5 秒。
- `Double Trouble`：固定命石/先天影响普攻输出，`attack_damage_reduction: 51%` 不是直接伤害。
- `Macropyre`：`damage: 100/150/200`、`duration: 10`、`burn_interval: 0.5`，持续伤害模型正确，需要作用时间。

## 待办
- [x] 完成字段语义复核。
- [x] 确认 Liquid Fire/Frost 持续时间字段存在。
- [ ] 处理 `Liquid Frost` 后续技能额外伤害修正；确认 `Liquid Fire` 版本差异。
