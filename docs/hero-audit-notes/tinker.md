# 修补匠（Tinker）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：TK

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：4
- 忽略项：1
- 暂不支持项：1
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：0

## 复核结论
- 总体判断：`Laser` 和 `Warp Flare` 正确，`March` 需要命中次数；`Deploy Turrets` 缺模型。
- 是否存在误计入固定爆发：未发现当前默认严重误计入。
- 是否缺少关键输入：机器命中次数、再装填带来的重复施法次数、炮塔攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Eureka!
- 中文名：尤里卡！
- 当前模型：reference_only / ignored
- Dotabuff 对照：冷却缩减机制，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确不计伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 作为 cooldown modifier。

### Laser
- 中文名：激光
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`laser_damage=75/150/225/300`
- Dotabuff 对照：纯粹瞬时伤害并致盲。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 致盲不是伤害。
- 修正建议：
  - 不需要修改。

### March of the Machines
- 中文名：机械行军
- 当前模型：reference_only / machine_hit_count
- 本地 rawAttributes：`damage=13/22/31/40`、`machines_per_sec=24`、`duration=6`
- Dotabuff 对照：每个机器命中造成魔法伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`machine_hit_count`
- 人工判断：当前 reference 方向正确；comparison 里显示 instant_fixed 是旧自动对比痕迹。
- 问题记录：
  - 不能按持续时间自动打满，需要命中数量。
- 修正建议：
  - 保持 per_hit model。

### Deploy Turrets
- 中文名：部署炮塔
- 当前模型：缺失
- Dotabuff 对照：冲击伤害、导弹伤害、炮塔持续攻击。
- 是否计入固定爆发：有条件计入
- 需要输入：`turret_attack_count`
- 人工判断：当前缺模型，需要补。
- 问题记录：
  - 新技能/版本字段未纳入本地模型。
- 修正建议：
  - 建为 impact + summon projectile attacks。

### Warp Flare
- 中文名：折跃耀光
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=150`
- Dotabuff 对照：瞬时魔法伤害并降低施法/攻击距离。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 距离降低不是伤害。
- 修正建议：
  - 不需要修改。

### Keen Conveyance / Rearm
- 中文名：基恩载具 / 再装填
- 当前模型：reference_only
- Dotabuff 对照：机动和刷新技能/物品冷却。
- 是否计入固定爆发：否
- 需要输入：`combo_cast_count`
- 人工判断：不直接伤害正确，但 Rearm 会决定连招重复次数。
- 问题记录：
  - 对计算器应作为“重复施法次数”而不是伤害。
- 修正建议：
  - 后续做 combo planner 时接入。
