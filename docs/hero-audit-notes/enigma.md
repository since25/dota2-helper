# 谜团（Enigma）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：无

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Demonic Summoning` 不应把虚灵基础攻击力作为瞬时伤害；`Malefice` 只计一次会低估。
- 是否缺少关键输入：`Malefice` 需要眩晕/伤害次数；`Midnight Pulse` 需要目标当前生命和作用时间；`Black Hole` 需要实际持续施法时间。
- 是否需要修改模型：需要修正憎恶多次伤害、恶魔召唤召唤物攻击、午夜凋零百分比当前生命。

## 技能复核

### Malefice
- 中文名：憎恶
- 当前模型：implemented / instant_fixed
- 字段对照：`damage: 55/70/85/100`、`stun_instances: 3`；Dotabuff 每次伤害 55/70/85/100，眩晕次数 3。
- 是否计入固定爆发：当前只计一次，不完整
- 需要输入：`instance_count`
- 人工判断：字段正确但模型低估，应按实际触发次数累加。
- 修正建议：多段模型，默认理论 3 次。

### Demonic Summoning
- 中文名：恶魔召唤
- 当前模型：implemented / instant_fixed
- 字段对照：本地 `eidelon_base_damage: 16/27/38/49`；Dotabuff 虚灵攻击力 16/28/40/52。
- 是否计入固定爆发：否
- 需要输入：`eidolon_attack_count`
- 人工判断：当前模型错误。虚灵攻击力不是施法瞬间伤害。
- 修正建议：改为召唤物攻击模型，并确认数值版本差异。

### Midnight Pulse
- 中文名：午夜凋零
- 当前模型：reference_only / state_scaling
- 字段对照：`damage_percent: 4%/6%/8%/10%`、`duration: 9/10/11/12`、`tick_rate: 0.5`
- 是否计入固定爆发：应作为条件持续伤害
- 需要输入：`target_current_health`、`active_duration`
- 人工判断：当前 `base_damage` 参考不够准确。技能核心是当前生命百分比伤害。
- 修正建议：改为 current_health_percent sustained 模型。

### Event Horizon
- 中文名：事件视界
- 当前模型：reference_only / debuff_reference
- 字段对照：`speed_bonus: 4%`；Dotabuff 移动速度减缓 5%。
- 是否计入固定爆发：否
- 人工判断：控制/减速参考，不是伤害；存在小幅版本差异。

### Black Hole
- 中文名：黑洞
- 当前模型：implemented / sustained_dps
- 字段对照：`damage: 100/150/200`、`duration: 4`、`tick_rate: 0.1`；Dotabuff 每秒伤害一致，纯粹。
- 是否计入固定爆发：否
- 需要输入：`channel_duration`
- 人工判断：模型类型正确。实际输出取决于持续施法时间。

## 待办
- [x] 完成字段语义复核。
- [x] 标记召唤物攻击和百分比生命字段。
- [ ] 修正 `Malefice` 多段、`Demonic Summoning` 召唤物、`Midnight Pulse` 当前生命百分比模型。
