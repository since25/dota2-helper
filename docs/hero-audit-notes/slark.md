# 斯拉克（Slark）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：小鱼人

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：2
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：`Dark Pact` 可用但语义应是短时多 pulse 总伤害；其他技能多为状态/普攻修正。
- 是否存在误计入固定爆发：未发现直接误计入。
- 是否缺少关键输入：能量转移叠层、攻击次数、Dark Pact 自伤和作用时间。
- 是否需要修改模型：需要小幅修正。

## 技能复核

### Essence Shift
- 中文名：能量转移
- 当前模型：ignored
- 本地 rawAttributes：`agi_gain=3`、`stat_loss=1`、`duration=12.5`
- Dotabuff 对照：攻击窃取属性，增加敏捷。
- 是否计入固定爆发：否，作为普攻/属性修正。
- 需要输入：`essence_stack_count`
- 人工判断：当前忽略偏保守。
- 问题记录：
  - 会间接提高普攻和护甲/攻速。
- 修正建议：
  - 后续进入 attribute buff。

### Dark Pact
- 中文名：黑暗契约
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`total_damage=75/150/225/300`、`total_pulses=10`、`pulse_duration=1`、`self_damage_pct=30`
- Dotabuff 对照：短时间内多次 pulse，总伤害为显示值。
- 是否计入固定爆发：可计入理论总量
- 需要输入：可选 `active_duration`
- 人工判断：用总伤害作为简化可以接受，但不是真正瞬时；自伤不要计为对敌伤害。
- 问题记录：
  - 对极短窗口会高估。
- 修正建议：
  - 标为 short_pulsed_total。

### Pounce
- 中文名：突袭
- 当前模型：ignored
- 本地 rawAttributes：`pounce_damage=0`、`essence_stacks=1/2/3/4`
- Dotabuff 对照：束缚并提供能量转移层数，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 魔法类型字段不代表有伤害，当前 pounce_damage 为 0。
- 修正建议：
  - 作为控制和叠层来源。

### Saltwater Shiv
- 中文名：海浪短刀
- 当前模型：reference_only
- Dotabuff 对照：回复/恢复/移速窃取，不直接造成固定伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 物理标签不等于固定物理伤害。
- 修正建议：
  - 后续作为 debuff 参考。

### Depth Shroud / Shadow Dance
- 中文名：深海护罩 / 暗影之舞
- 当前模型：reference_only / ignored
- Dotabuff 对照：生存、回血、移速，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 回血和移速不是伤害。
- 修正建议：
  - 不进入伤害计算。
