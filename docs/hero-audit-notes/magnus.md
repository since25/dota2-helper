# 马格纳斯（Magnus）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：猛犸

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：2
- 忽略项：1
- 需要状态输入项：4
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Skewer` 被标为移动速度缩放不准确；`Reverse Polarity` 缺失。
- 是否缺少关键输入：授予力量需要攻击力/攻击次数；巨角冲撞需要行进距离；两极反转需要补模型。
- 是否需要修改模型：需要补 `Reverse Polarity`，并改正 Skewer/Empower 语义。

## 技能复核
- `Shockwave`：`shock_damage: 75/150/225/300`，瞬时魔法伤害正确；慢速持续时间本地字段与 Dotabuff 描述略有差异。
- `Empower`：`bonus_damage_pct` 与 `cleave_damage_pct` 是普攻增益/分裂，不是施法距离参考。
- `Skewer`：`skewer_damage: 80/160/240/320` 是基础魔法伤害，另有 `damage_distance_pct` 行进距离伤害；当前 move_speed_scaling 语义错误。
- `Horn Toss`：`damage: 300` 是瞬时魔法伤害，模型正确。
- `Solid Core`：击退/减速抗性，不直接伤害。
- `Reverse Polarity`：Dotabuff 有 100/200/300 魔法伤害和眩晕，但当前模型缺失，需要补。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 Reverse Polarity 缺失。
- [ ] 修正 Empower 普攻增益、Skewer 距离伤害，并补两极反转模型。
