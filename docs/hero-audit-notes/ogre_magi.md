# 食人魔魔法师（Ogre Magi）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：蓝胖

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型方向不完全可用，主要问题在 `Ignite`、`Fire Shield` 和 `Multicast`。
- 是否存在误计入固定爆发：存在。`Ignite` 被建成瞬时固定伤害，但实际是持续伤害；`Fire Shield` 只取单次火球会低估总量。
- 是否缺少关键输入：缺少 `Ignite` 实际作用时间、`Fire Shield` 命中火球数、`Unrefined Fireblast` 力量输入、`Multicast` 触发/期望次数。
- 是否需要修改模型：需要。

## 技能复核

### Fireblast
- 中文名：火焰爆轰
- 当前模型：implemented / instant_fixed
- 语义类型：damage.instant
- 当前字段：`damageKey: fireblast_damage`
- 本地 rawAttributes：`fireblast_damage=70/130/190/250`
- Dotabuff 对照：单体魔法伤害并眩晕。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。该技能是标准瞬时魔法伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Ignite
- 中文名：引燃
- 当前模型：implemented / instant_fixed
- 语义类型：damage.instant
- 当前字段：`damageKey: burn_damage`、`durationKey: duration`
- 本地 rawAttributes：`burn_damage=20/30/40/50`、`duration=5/6/7/8`
- Dotabuff 对照：持续燃烧伤害。
- 是否计入固定爆发：否，不应按瞬时伤害计入。
- 需要输入：`active_duration`
- 理论总量：100/180/280/400，公式为 `每秒伤害 * 持续时间`
- 人工判断：当前模型错误。`burn_damage` 是每秒伤害，不是一次性伤害。
- 问题记录：
  - 会明显低估打满伤害，也会在爆发列表里把持续伤害表达成瞬时伤害。
- 修正建议：
  - 改为 `sustained_dps`，使用 `damagePerSecondKey: burn_damage`、`durationKey: duration`。

### Bloodlust
- 中文名：嗜血术
- 当前模型：reference_only / debuff_reference
- 语义类型：mobility.cast_range.units
- 当前字段：`valueKey: abilitycastrange`
- Dotabuff 对照：提供攻速和移速，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：参考项方向正确，但语义类型不应写成施法距离，应该是输出窗口/攻速增益参考。
- 问题记录：
  - 攻速增益会影响普攻输出窗口，但不是固定技能伤害。
- 修正建议：
  - 后续如果做普攻 DPS，可把攻速增益作为攻击次数修正；当前伤害模型不计入。

### Unrefined Fireblast
- 中文名：未精通的火焰爆轰
- 当前模型：reference_only / state_scaling
- 语义类型：damage.attribute_scaling
- 当前字段：`valueKey: base_damage`
- 本地 rawAttributes：`base_damage=150`、`str_multiplier=1.5`
- Dotabuff 对照：基础伤害加力量倍率伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`caster_strength`
- 人工判断：当前只作为参考是保守正确的，但计算器后续应支持 `150 + 力量 * 1.5`。
- 问题记录：
  - 缺力量输入时不能准确计算。
- 修正建议：
  - 增加属性缩放模型，显式声明力量输入。

### Fire Shield
- 中文名：火盾
- 当前模型：implemented / instant_fixed
- 语义类型：damage.instant
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage=160`、`attacks=3`、`duration=25`
- Dotabuff 对照：护盾持续期间释放多次火球。
- 是否计入固定爆发：否，应按命中火球数计算。
- 需要输入：`fireball_count`
- 理论总量：最多 480，公式为 `160 * 命中火球数`
- 人工判断：当前模型不完整。只取 160 会把单个火球当成总伤害。
- 问题记录：
  - 缺少命中次数，无法表达 0 到 3 次火球。
- 修正建议：
  - 改为多波/次数模型，默认不要打满。

### Multicast
- 中文名：多重施法
- 当前模型：reference_only / proc_multiplier
- Dotabuff 对照：提供 2/3/4 倍施法概率。
- 是否计入固定爆发：否，作为施法次数修正。
- 需要输入：`multicast_roll` 或使用期望倍率
- 人工判断：当前没有进入伤害计算会低估 Ogre 的期望输出，但不应作为独立伤害。
- 问题记录：
  - 对 Fireblast、Ignite、物品爆发都有乘数影响。
- 修正建议：
  - 后续增加 cast multiplier 层，区分确定触发和期望值。
