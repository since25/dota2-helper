# 哈斯卡（Huskar）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：无

## 模型概览
- 技能条目数：5
- 已实现伤害：0
- 参考项：4
- 忽略项：1
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：当前较保守，没有误计入；但 `Inner Fire` 被错误标成距离缩放，导致可用瞬时伤害缺失。
- 是否缺少关键输入：`Burning Spear` 需要叠层/攻击次数和目标最大生命；`Life Break` 需要目标最大生命；狂战士之血需要当前生命百分比。
- 是否需要修改模型：需要补心炎瞬时伤害、沸血之矛叠层 DOT、牺牲百分比生命。

## 技能复核

### Inner Fire
- 中文名：心炎
- 当前模型：reference_only / state_scaling
- 字段对照：`damage: 110/180/250/320`、`health_cost: 75/100/125/150`、`disarm_duration: 1.5/2/2.5/3`
- 是否计入固定爆发：应该计入
- 需要输入：无
- 人工判断：当前模型错误。心炎是固定范围魔法伤害，不是距离缩放伤害。
- 修正建议：改为 `instant_fixed`，`damageKey: damage`；生命消耗单独记录为自损成本。

### Burning Spear
- 中文名：沸血之矛
- 当前模型：reference_only / state_scaling
- 字段对照：`burn_damage: 5/10/15/20`、`burn_damage_max_pct: 0.5%`、`duration: 9`、`max_health_cost: 2%`
- 是否计入固定爆发：不应默认固定；应按叠层和持续时间
- 需要输入：`stack_count`、`active_duration`、`target_max_health`
- 人工判断：方向正确但不完整。沸血之矛是攻击附加的可叠加持续魔法伤害，并包含最大生命百分比烧灼。
- 修正建议：DOT stack 模型：每层固定伤害 + 最大生命百分比，按作用时间累加。

### Berserker's Blood
- 中文名：狂战士之血
- 当前模型：reference_only / debuff_reference
- 字段对照：`maximum_attack_speed: 170/220/270/320`、`maximum_magic_resist: 15%/20%/25%/30%`、`hp_threshold_max: 10%`
- 是否计入固定爆发：否
- 需要输入：当前生命百分比
- 人工判断：正确不直接计伤害，但它显著改变普攻频率和生存。
- 修正建议：后续进入攻速/魔抗状态修正。

### Blood Magic
- 中文名：血魔法
- 当前模型：ignored
- 字段对照：无直接伤害字段。
- 是否计入固定爆发：否
- 人工判断：正确。

### Life Break
- 中文名：牺牲
- 当前模型：reference_only / state_scaling
- 字段对照：`health_damage: 0.32/0.38/0.44`、`health_cost_percent: 0.32/0.38/0.44`
- 是否计入固定爆发：应作为条件伤害
- 需要输入：`target_current_health` 或 `target_max_health`，并确认规则口径
- 人工判断：需要实现百分比生命伤害。它同时有自损成本，不能只记录为参考。
- 修正建议：percent_health instant 模型，并单独展示自身生命损耗。

## 待办
- [x] 完成字段语义复核。
- [x] 标记自损、叠层 DOT、百分比生命字段。
- [ ] 修正心炎、沸血之矛、牺牲模型。
