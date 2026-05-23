# 美杜莎（Medusa）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：一姐

## 模型概览
- 技能条目数：6
- 已实现伤害：2
- 参考项：3
- 忽略项：1
- 需要状态输入项：5
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Split Shot` 的 `damage_modifier` 是攻击力百分比/减伤修正，不是瞬时伤害；`Mana Shield` 不是对敌伤害。
- 是否缺少关键输入：秘术异蛇跳跃次数、分裂箭目标数、罗网箭阵作用时间、石化凝视后的物理增伤。
- 是否需要修改模型：需要修正 Split Shot 和 Mana Shield 语义，补 Mystic Snake 多跳模型。

## 技能复核
- `Split Shot`：`damage_modifier_tooltip: 50%/60%/70%/80%`、`arrow_count: 4`，应按普攻分裂目标计算；当前 instant_fixed 错误。
- `Mystic Snake`：`snake_damage: 90/140/190/240`、`snake_jumps: 3/4/5/6`、`snake_scale: 25%`，需要按跳跃次数递增，不是目标缺失魔法百分比伤害。
- `Gorgon's Grasp`：`damage: 30/70/110/150`、`damage_pers: 100`、`duration: 0.8/1.2/1.6/2`，持续物理伤害方向可用，但需作用时间/命中波次。
- `Cold Blooded`：本地 `damage=0`，不计伤害正确。
- `Mana Shield`：`damage_per_mana=2` 是承伤吸收换算，不是对敌伤害。
- `Stone Gaze`：控制/石化，`bonus_physical_damage: 35%/45%/55%` 是后续物理增伤修正，不直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 Split Shot 和 Mana Shield 误读。
- [ ] 修正分裂箭普攻模型、秘术异蛇多跳递增、石化凝视物理增伤修正。
