# 玛西（Marci）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：无

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：2
- 忽略项：1
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Rebound` 被标为距离缩放不准确；`Unleash` 不是普通持续 DPS。
- 是否缺少关键输入：怒拳破需要连击次数/脉冲次数/攻击窗口；护卫术需要攻击次数。
- 是否需要修改模型：需要补 Rebound 瞬时伤害、Unleash 连击模型。

## 技能复核
- `Dispose`：`impact_damage: 60/150/240/330`，瞬时魔法伤害正确。
- `Rebound`：`impact_damage: 75/150/225/300` 是固定落地魔法伤害，不是距离缩放；应改为 instant_fixed。
- `Bodyguard`：吸血、攻击力百分比、共享护盾，是普攻/生存修正，不直接伤害。
- `Special Delivery`：快递/信使相关，无直接伤害字段。
- `Unleash`：`charges_per_flurry: 5`、`pulse_damage: 50/100/150`、`duration: 16`，不是简单 DPS；需要按连击和脉冲次数计算。

## 待办
- [x] 完成字段语义复核。
- [x] 标记怒拳破多段结构。
- [ ] 修正 Rebound 模型；实现 Unleash 连击/脉冲模型。
