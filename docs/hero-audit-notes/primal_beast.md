# 太古兽（Primal Beast）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：兽

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：1
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型需要修正 `Onslaught`、`Trample`、`Rock Throw` 和 `Pulverize` 的语义。
- 是否存在误计入固定爆发：存在风险。`Pulverize` 单次伤害不能代表全程；`Trample` 不是简单固定值。
- 是否缺少关键输入：缺少碰撞/践踏/粉碎命中次数、攻击伤害。
- 是否需要修改模型：需要。

## 技能复核

### Onslaught
- 中文名：突
- 当前模型：implemented / stack_scaling
- 本地 rawAttributes：`knockback_damage=75/170/265/360`
- Dotabuff 对照：冲撞命中造成物理伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`hit_count`
- 人工判断：当前 `stack_scaling` 语义错误。它是冲撞命中伤害，不是叠层伤害。
- 问题记录：
  - 多目标可多次命中，但单目标通常按一次碰撞。
- 修正建议：
  - 改为 collision/instant physical，允许命中次数。

### Trample
- 中文名：践踏
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`base_damage=15/30/45/60`、`attack_damage=35%`、`duration=5.5`
- Dotabuff 对照：移动期间多次践踏，伤害由基础值加攻击伤害百分比构成。
- 是否计入固定爆发：否，按触发次数计算
- 需要输入：`trample_count`、`hero_attack_damage`
- 人工判断：方向不完整。不是纯 DPS 字段，而是每次践踏的基础 + 攻击伤害缩放。
- 问题记录：
  - 缺攻击伤害和触发次数会严重失真。
- 修正建议：
  - 建为 repeated_hit + attack_damage_pct。

### Uproar
- 中文名：咆哮
- 当前模型：reference_only
- Dotabuff 对照：叠层提供攻击伤害/护甲/减速等效果，不直接造成固定伤害。
- 是否计入固定爆发：否
- 需要输入：`stack_count`
- 人工判断：作为参考正确。
- 问题记录：
  - 会影响后续普攻和 Trample 的攻击伤害来源。
- 修正建议：
  - 后续进入 buff/stack modifier。

### Rock Throw
- 中文名：投掷巨石
- 当前模型：implemented / stack_scaling
- 本地 rawAttributes：`base_damage=325`
- Dotabuff 对照：投掷命中造成物理伤害。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：当前 stack_scaling 语义错误，应是瞬时固定伤害。
- 问题记录：
  - 没有叠层关系。
- 修正建议：
  - 改为 `instant_fixed`，`damageKey: base_damage`。

### Pulverize
- 中文名：粉碎
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=100/175/250`、`interval=0.75`、`channel_time=2.3`、`bonus_damage_per_hit=20/40/60`
- Dotabuff 对照：持续控制并按间隔造成多次伤害。
- 是否计入固定爆发：否，按命中波数计算
- 需要输入：`pulse_count` 或 `channel_duration`
- 人工判断：当前只算一次会低估；默认打满也需要明确为理论值。
- 问题记录：
  - 多波伤害没有建模。
- 修正建议：
  - 改为 repeated_tick，公式为 `每波伤害 * 波数 + 额外每波伤害`。

### Colossal
- 中文名：巨兽
- 当前模型：ignored
- Dotabuff 对照：体型/状态类先天，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。
