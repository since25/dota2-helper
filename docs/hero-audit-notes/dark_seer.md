# 黑暗贤者（Dark Seer）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：黑贤、ds

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：基本可用，但 `Wall of Replica` 只覆盖碰墙固定伤害，尚未覆盖幻象输出。
- 是否存在误计入固定爆发：未发现明显误计入；`Quick Wit` 的回复百分比和 `Surge` 的速度不应进入伤害。
- 是否缺少关键输入：`Normal Punch` 需要位移距离；`Wall of Replica` 的幻象伤害后续需要幻象攻击模型。
- 是否需要修改模型：暂不阻塞固定爆发计算；后续应扩展距离伤害和幻象输出。

## 技能复核

### Vacuum
- 中文名：真空
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage: 70/130/190/250`、`radius: 325/400/475/550`
- Dotabuff 对照：伤害 70/130/190/250，伤害类型为魔法。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。拉拢和短暂控制不是伤害，固定爆发只取 `damage`。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Ion Shell
- 中文名：离子外壳
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_per_second`；`durationKey: duration`；`tickIntervalKey: tick_interval`
- 本地 rawAttributes：`damage_per_second: 30/50/70/90`、`duration: 20/22/24/26`、`tick_interval: 0.2`
- Dotabuff 对照：每秒伤害 30/50/70/90，持续时间 20/22/24/26，伤害类型为魔法。
- 是否计入固定爆发：否
- 需要输入：建议支持 `active_duration`
- 人工判断：正确。离子外壳是持续伤害，理论总量不能默认当作瞬时爆发。
- 问题记录：
  - 需要 UI 允许设置实际作用时间。
- 修正建议：
  - 可在模型中补 `conditionInputs: ['active_duration']`。

### Surge
- 中文名：奔腾
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`duration: 3/4/5/6`、`speed_boost: 550`
- Dotabuff 对照：持续时间 3/4/5/6。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。移动速度影响追击窗口，不是伤害。
- 问题记录：
  - `speed_boost` 不可被自动提取为 unknown damage。
- 修正建议：
  - 后续可归入机动性/追击窗口参考。

### Normal Punch
- 中文名：普通一拳
- 当前模型：reference_only / state_scaling
- 当前字段：`valueKey: max_damage`
- 本地 rawAttributes：`max_damage: 400`、`max_distance: 1100`、`max_stun: 1.25`、`illusion_duration: 6`
- Dotabuff 对照：最高伤害 400、最远击退距离 350、幻象持续时间 6。
- 是否计入固定爆发：否
- 需要输入：`distance`
- 人工判断：方向正确。它是距离缩放伤害，不能在没有距离输入时当固定伤害。
- 问题记录：
  - 当前只保留最高伤害参考，未计算距离比例。
- 修正建议：
  - 后续实现 `distance_scaling`：按移动距离映射到 0 到 400。

### Quick Wit
- 中文名：才思敏捷
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`int_to_atkspd: 1`、`heal_pct: 8.5%`
- Dotabuff 对照：最大生命/魔法值回复 8.5%。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。回复和属性收益不是直接伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要进入伤害模型。

### Wall of Replica
- 中文名：复制之墙
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: wall_damage`
- 本地 rawAttributes：`wall_damage: 25/40/55`、`duration: 30`、`tooltip_outgoing: 70%/80%/90%`、`replica_damage_incoming: 100`
- Dotabuff 对照：伤害 25/40/55；幻象继承攻击力 70%/80%/90%；幻象承受伤害 200%。
- 是否计入固定爆发：是，仅碰墙伤害
- 需要输入：幻象输出需要 `illusion_attack_count`、`target_attack_damage` 或后续幻象模型
- 人工判断：当前固定碰墙伤害正确，但不是技能主要价值的完整模型。
- 问题记录：
  - 幻象输出没有进入计算。
- 修正建议：
  - 后续增加幻象伤害参考模型，避免把 30 秒持续时间当作持续 DPS。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 后续扩展 `Normal Punch` 距离缩放和 `Wall of Replica` 幻象输出。
