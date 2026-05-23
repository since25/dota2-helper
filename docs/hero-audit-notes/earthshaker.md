# 撼地者（Earthshaker）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小牛、es

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：基本可用，但 `Echo Slam` 和 `Enchant Totem` 需要输入才能算完整伤害。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：`Echo Slam` 需要附近单位数量；`Enchant Totem` 需要攻击力；`Slugger` 需要投掷单位类型和目标最大生命。
- 是否需要修改模型：建议扩展回音击额外回音伤害和强化图腾普攻模型。

## 技能复核

### Fissure
- 中文名：沟壑
- 当前模型：implemented / instant_fixed
- 字段对照：`fissure_damage: 100/160/220/280`；Dotabuff 伤害 100/160/220/280，魔法。
- 是否计入固定爆发：是
- 人工判断：正确。沟壑持续时间和眩晕时间不计入伤害。

### Enchant Totem
- 中文名：强化图腾
- 当前模型：reference_only / debuff_reference
- 字段对照：`totem_damage_percentage: 100%/200%/300%/400%`；Dotabuff 基础攻击力加成 100%/200%/300%/400%。
- 是否计入固定爆发：否
- 需要输入：`hero_attack_damage`、是否打出强化普攻
- 人工判断：当前 reference_only 安全，但输出模型不完整。它应作为下一次普攻的攻击力百分比增伤。
- 修正建议：改为 attack_modifier，按当前攻击力计算。

### Aftershock
- 中文名：余震
- 当前模型：implemented / instant_fixed
- 字段对照：`aftershock_damage: 65/90/115/140`；Dotabuff 伤害 65/90/115/140，魔法。
- 是否计入固定爆发：是，但应按触发次数计算
- 需要输入：`trigger_count`
- 人工判断：单次余震伤害正确。连招中多个技能会多次触发，不能只算一次或无条件算满。
- 修正建议：支持按施法次数/触发次数累加。

### Echo Slam
- 中文名：回音击
- 当前模型：implemented / instant_fixed
- 字段对照：`echo_slam_initial_damage: 100/140/180`、`echo_slam_echo_damage: 70/90/110`；Dotabuff 初始伤害和回音伤害。
- 是否计入固定爆发：当前只计初始伤害
- 需要输入：`echo_unit_count`
- 人工判断：当前低估。回音击应为初始伤害 + 附近单位回音伤害。
- 修正建议：`total = initial_damage + echo_damage * echo_unit_count`。

### Slugger
- 中文名：强击图腾
- 当前模型：reference_only / state_scaling
- 字段对照：非英雄尸体伤害 27，英雄尸体伤害 135，击飞敌人最大生命值伤害 7%。
- 是否计入固定爆发：否
- 需要输入：`thrown_body_target_type`、`enemy_max_health`
- 人工判断：正确不计入基础连招。该先天依赖击杀后投掷单位，不是常规技能爆发。

## 待办
- [x] 完成字段语义复核。
- [x] 标记非伤害字段。
- [ ] 扩展回音击单位数、余震触发次数、强化图腾普攻模型。
