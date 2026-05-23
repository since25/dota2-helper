# 干扰者（Disruptor）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：萨尔

## 模型概览
- 技能条目数：6
- 已实现伤害：2
- 参考项：3
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：0

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：当前已避免把 `damage_threshold: 250` 当伤害，但 `Thunder Strike` 和 `Static Storm` 仍需更细模型。
- 是否缺少关键输入：`Thunder Strike` 需要打击次数；`Glimpse` 需要距离；`Static Storm` 需要作用时间/脉冲或渐强曲线。
- 是否需要修改模型：需要。尤其要保持电磁排斥阈值不计入伤害。

## 技能复核

### Thunder Strike
- 中文名：雷霆之击
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: strike_damage`
- 本地 rawAttributes：`strike_damage: 30/60/90/120`、`strikes: 4`、`strike_interval: 2`
- Dotabuff 对照：4 次打击，每次伤害 30/60/90/120。
- 是否计入固定爆发：当前只计一次，完整输出不应这样固定
- 需要输入：`strike_count` 或 `active_duration`
- 人工判断：当前模型低估总伤害。`strike_damage` 是每次雷击伤害，总量通常为每次伤害乘以实际命中次数。
- 问题记录：
  - `slow_duration` 不是伤害持续时间。
- 修正建议：
  - 改为多波模型，默认可显示 1 次和理论 4 次。

### Glimpse
- 中文名：恶念瞥视
- 当前模型：reference_only / state_scaling
- 当前字段：`valueKey: min_damage`
- 本地 rawAttributes：`min_damage: 25`、`max_damage: 100/160/220/280`、`damage_to_distance_pct: 20%/25%/30%/35%`
- Dotabuff 对照：距离相关伤害。
- 是否计入固定爆发：否
- 需要输入：`distance`
- 人工判断：方向正确。距离缩放伤害不能在没有距离输入时作为固定爆发。
- 问题记录：
  - 当前只引用 `min_damage`，表达不完整。
- 修正建议：
  - 后续实现距离到伤害的映射，并设置上限 `max_damage`。

### Kinetic Field
- 中文名：动能力场
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`duration: 2.6/3.2/3.8/4.4`、`damage_per_second: 0`
- Dotabuff 对照：控制/围栏技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。没有直接伤害。
- 问题记录：
  - `damage_per_second: 0` 不能进入伤害模型。
- 修正建议：
  - 作为控制窗口/站位参考。

### Kinetic Fence
- 中文名：动能栅栏
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`duration: 4.4`、`damage_per_second: 0`
- Dotabuff 对照：控制/阻隔技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。没有直接伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要进入伤害计算。

### Electromagnetic Repulsion
- 中文名：电磁排斥
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`damage_threshold: 250`、`effect_radius: 400`、`damage_per_int: 1.5`
- Dotabuff 对照：受到 400 范围内任意来源 250 点伤害后，对附近敌人造成 1.5 倍智力伤害并击退。
- 是否计入固定爆发：否
- 需要输入：`intelligence`、触发次数、是否达到阈值
- 人工判断：当前忽略比误算安全。`damage_threshold: 250` 是触发阈值，不是伤害。
- 问题记录：
  - 之前 LLM 曾把 250 错当作未知伤害，必须明确禁止。
- 修正建议：
  - 后续建模为触发型智力缩放伤害：`intelligence * 1.5 * trigger_count`。

### Static Storm
- 中文名：静态风暴
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_max`；`durationKey: duration`
- 本地 rawAttributes：`damage_max: 200/275/350`、`pulses: 20`、`duration: 6`
- Dotabuff 对照：最大伤害/持续时间，伤害类型为魔法。
- 是否计入固定爆发：否
- 需要输入：`active_duration`，后续需要 ramp/pulse 模型
- 人工判断：当前模型不够准确。`damage_max` 更像最大每秒或总量参考，真实输出有渐强/脉冲结构，不能简单乘 6。
- 问题记录：
  - `pulses: 20` 未参与建模。
- 修正建议：
  - 后续实现脉冲/渐强模型，至少避免把最大值全程打满。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 修正雷霆之击多波、恶念瞥视距离、静态风暴渐强、电磁排斥触发模型。
