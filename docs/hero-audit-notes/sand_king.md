# 沙王（Sand King）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：沙王

## 模型概览
- 技能条目数：5
- 已实现伤害：4
- 参考项：1
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型整体方向较好，已覆盖沙尘暴和地震，但需要修正 `Burrowstrike` 字段与 `Stinger`/`Caustic Finale` 条件。
- 是否存在误计入固定爆发：`Caustic Finale` 未误计入；`Stinger` 需要确认是否默认触发。
- 是否缺少关键输入：沙尘暴作用时间、尾刺攻击次数、腐尸毒是否死亡触发、地震命中波数。
- 是否需要修改模型：需要小幅修正。

## 技能复核

### Burrowstrike
- 中文名：掘地穿刺
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: dmg`
- 本地 rawAttributes：damage 数组为 `80/150/220/290`
- Dotabuff 对照：单次魔法伤害并眩晕。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：语义正确，但字段应确认 resolver 能正确读取 `damage` 数组而不是不存在的 `dmg`。
- 问题记录：
  - 之前出现过数值异常，可能来自字段读取失败。
- 修正建议：
  - 统一使用 raw damage 数组或显式 `damageKey: damage`。

### Sand Storm
- 中文名：沙尘暴
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`sand_storm_damage=30/50/70/90`、`abilityduration=16/20/24/28`
- Dotabuff 对照：每秒魔法伤害。
- 是否计入固定爆发：否，按作用时间计算。
- 需要输入：`active_duration`
- 人工判断：正确。
- 问题记录：
  - 默认打满会高估对线短换血。
- 修正建议：
  - 保持持续伤害，UI 暴露作用时间。

### Stinger
- 中文名：尾刺
- 当前模型：implemented / attack_modifier
- 本地 rawAttributes：`attack_damage=50/75/100/125`
- Dotabuff 对照：攻击附加物理伤害和减速。
- 是否计入固定爆发：有条件计入
- 需要输入：`attack_count`
- 人工判断：方向正确，需要明确按攻击次数计算。
- 问题记录：
  - 不能把一次攻击加成当作全程总伤害。
- 修正建议：
  - 保持 attack modifier，默认攻击次数由用户设定。

### Caustic Finale
- 中文名：腐尸毒
- 当前模型：reference_only / conditional
- 本地 rawAttributes：`caustic_finale_damage_flat=17`、`caustic_finale_damage_pct=2.5%`
- Dotabuff 对照：目标死亡时爆炸，含基础伤害和最大生命值百分比。
- 是否计入固定爆发：否，除非目标死亡触发。
- 需要输入：`target_death`、`target_max_health`
- 人工判断：作为条件伤害正确，但字段应包含百分比生命。
- 问题记录：
  - 只记录 flat 会漏掉百分比伤害。
- 修正建议：
  - 条件触发时公式为 `17 + 目标最大生命 * 2.5%`。

### Epicenter
- 中文名：地震
- 当前模型：implemented / multi_wave
- 本地 rawAttributes：`epicenter_pulses=12/16/20`、`epicenter_damage=60/70/80`
- Dotabuff 对照：多波魔法伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`wave_count` 或默认理论打满
- 理论总量：720/1120/1600
- 人工判断：正确。需要在 UI 里可调整实际命中波数。
- 问题记录：
  - 对线场景通常不会吃满全部波。
- 修正建议：
  - 保持 multi_wave，暴露波数输入。
