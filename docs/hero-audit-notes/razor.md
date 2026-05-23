# 剃刀（Razor）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：电魂

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：2
- 忽略项：0
- 暂不支持项：1
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型误把多个条件/持续效果当成瞬时伤害，尤其是 `Eye of the Storm`。
- 是否存在误计入固定爆发：存在。`Storm Surge` 是概率触发，`Eye of the Storm` 是持续多次打击。
- 是否缺少关键输入：距离、触发次数、攻击力吸取时间、大招作用时间。
- 是否需要修改模型：需要。

## 技能复核

### Unstable Current
- 中文名：不稳定电流
- 当前模型：缺失
- Dotabuff 对照：当前比较文件标记 missing，需要进一步确认是否为先天/被动效果。
- 是否计入固定爆发：待确认
- 需要输入：待确认
- 人工判断：需要补齐字段来源，但目前不应自动作为伤害。
- 问题记录：
  - 当前模型没有该技能。
- 修正建议：
  - 单独核对当前版本技能文本后建模或忽略。

### Plasma Field
- 中文名：等离子场
- 当前模型：reference_only / distance_scaling
- 本地 rawAttributes：`damage_min=35/40/45/50`、`damage_max=80/115/150/185`
- Dotabuff 对照：伤害按距离在最低和最高之间变化。
- 是否计入固定爆发：有条件计入
- 需要输入：`distance` 或选择 min/max
- 人工判断：当前作为距离缩放参考正确，但可以实现为可计算模型。
- 问题记录：
  - 没有距离时不能给唯一伤害值。
- 修正建议：
  - UI 提供最低、最高、手动距离三种模式。

### Static Link
- 中文名：静电连接
- 当前模型：reference_only
- 本地 rawAttributes：`drain_rate=6/12/18/24`、`drain_length=10`
- Dotabuff 对照：持续吸取攻击力，增加后续普攻伤害。
- 是否计入固定爆发：否
- 需要输入：`link_duration`、`attack_count`
- 人工判断：正确不作为直接伤害，但要进入普攻修正层。
- 问题记录：
  - 这是后续普攻输出的重要输入。
- 修正建议：
  - 后续建 attack_damage_buff。

### Storm Surge
- 中文名：风暴涌动
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`strike_pct_chance=20%`、`strike_target_count=3`、`strike_damage=50/90/130/170`
- Dotabuff 对照：概率触发电击。
- 是否计入固定爆发：否，除非用户选择触发。
- 需要输入：`proc_count` 或 `expected_proc`
- 人工判断：当前默认计入固定爆发不合适。
- 问题记录：
  - 会把概率被动误算成稳定爆发。
- 修正建议：
  - 改为 proc model，默认不计入或按期望值模式。

### Eye of the Storm
- 中文名：风暴之眼
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=60/75/90`、`strike_interval=0.7/0.6/0.5`、`duration=30`、`armor_reduction=1`
- Dotabuff 对照：持续期间多次物理打击并降低护甲。
- 是否计入固定爆发：否，按作用时间/打击次数计算。
- 需要输入：`active_duration` 或 `strike_count`
- 人工判断：当前模型错误。单次伤害不是总伤害。
- 问题记录：
  - 还需要把护甲降低作为物理伤害修正，而不是未知伤害。
- 修正建议：
  - 改为 repeated_strike physical，支持护甲递减。
