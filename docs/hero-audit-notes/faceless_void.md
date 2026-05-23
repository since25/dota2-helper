# 虚空假面（Faceless Void）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：虚空、fv

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：5
- 忽略项：0
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：基本可用，但主要输出依赖普攻次数、时间锁概率和时间结界窗口。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：`Time Dilation` 需要冷却中技能数量和作用时间；`Time Lock` 需要攻击次数/触发次数；`Chronosphere` 需要窗口内攻击次数。
- 是否需要修改模型：建议补时间膨胀持续伤害和时间锁期望值模式。

## 技能复核

### Time Walk
- 中文名：时间漫游
- 当前模型：reference_only / debuff_reference
- 字段对照：`range: 650/700/750/800`、`backtrack_duration: 2`
- 是否计入固定爆发：否
- 人工判断：正确。位移和回溯不直接造成伤害。

### Time Dilation
- 中文名：时间膨胀
- 当前模型：reference_only / state_scaling
- 字段对照：`damage_per_stack: 4/6/8/10`、`duration: 7/8/9/10`
- 是否计入固定爆发：否
- 需要输入：`cooling_ability_count`、`active_duration`
- 人工判断：方向正确。每层每秒伤害取决于目标冷却中的技能数量。
- 修正建议：实现 `damage_per_stack * stack_count * active_duration`。

### Time Lock
- 中文名：时间锁定
- 当前模型：implemented / attack_modifier
- 字段对照：`chance_pct: 12%/16%/20%/24%`、`bonus_damage: 18/22/26/30`
- 是否计入固定爆发：不应无条件；可按期望值或触发次数
- 需要输入：`attack_count`、`proc_count` 或概率模式
- 人工判断：模型方向正确，但要区分期望伤害和确定触发。

### Reverse Time Walk / Distortion Field
- 中文名：反时间漫游 / 扭曲力场
- 当前模型：reference_only
- 字段对照：反向位移窗口、弹道减速 40。
- 是否计入固定爆发：否
- 人工判断：正确。不直接造成伤害。

### Chronosphere
- 中文名：时间结界
- 当前模型：reference_only / debuff_reference
- 字段对照：`duration: 3.75/4.25/4.75`、`radius: 500`
- 是否计入固定爆发：否
- 需要输入：窗口内攻击次数/队友输出
- 人工判断：正确。结界本身无伤害，但决定普攻输出窗口。

## 待办
- [x] 完成字段语义复核。
- [x] 标记控制窗口和概率普攻字段。
- [ ] 实现时间膨胀层数伤害、时间锁期望/触发模式。
