# 自然先知（Nature's Prophet）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：先知、np

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：1
- 忽略项：1
- 需要状态输入项：5
- 多波伤害项：2
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Nature's Call` 的 `treant_damage` 是树人攻击力，不是瞬时伤害；`Curse of the Oldgrowth` 需要树木数量。
- 是否缺少关键输入：树人攻击次数、树木数量、自然之怒跳跃次数。
- 是否需要修改模型：需要补召唤物攻击和多跳/树木数量模型。

## 技能复核
- `Sprout`：`sprout_damage: 70/130/190/250`，瞬时魔法伤害正确。
- `Teleportation`：传送和护盾/增益，不直接伤害。
- `Nature's Call`：`treant_damage: 16/25/34/43`、树人数量 2/3/4/5，是召唤物攻击力，不是 instant_fixed。
- `Curse of the Oldgrowth`：`damage_per_tree: 15`，应按附近树木数量计算，不是固定一次 15。
- `Spirit of the Forest`：`damage_per_tree_pct: 2` 等树木百分比字段，应作为高级树木数量模型。
- `Wrath of Nature`：`damage: 90/130/170`、`damage_percent_add: 10%`、`max_targets: 16`，需要按跳跃次数递增计算。

## 待办
- [x] 完成字段语义复核。
- [x] 标记树人攻击力误读。
- [ ] 修正 Nature's Call 召唤物、Oldgrowth 树木数、Wrath 多跳递增模型。
