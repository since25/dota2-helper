# 破晓辰星（Dawnbreaker）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：锤妹

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：0
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：2
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Solar Guardian` 当前把脉冲伤害和落地眩晕时间混成 DPS，语义错误。
- 是否缺少关键输入：`Starbreaker` 需要命中段数；`Celestial Hammer` 需要是否命中战锤和火径作用时间；`Solar Guardian` 需要脉冲次数/作用时间。
- 是否需要修改模型：需要。当前会漏算战锤命中、漏算多段挥击、错算大招。

## 技能复核

### Starbreaker
- 中文名：星破天惊
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: swipe_damage`
- 本地 rawAttributes：`swipe_damage: 25/40/55/70`、`smash_damage: 25/40/55/70`、`total_attacks: 3`
- Dotabuff 对照：挥击/撞击额外伤害 25/40/55/70，连击持续时间 1.1。
- 是否计入固定爆发：当前计入但不完整
- 需要输入：`hit_count`、是否命中终结撞击
- 人工判断：当前模型低估且结构不完整。技能包含多次挥击和最终撞击，不能只取一次 `swipe_damage`。
- 问题记录：
  - `total_attacks: 3` 和 `smash_damage` 未纳入。
- 修正建议：
  - 建模为多段物理伤害：挥击段数 * `swipe_damage` + 是否命中终结 * `smash_damage`。

### Celestial Hammer
- 中文名：上界重锤
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: burn_damage`；`durationKey: flare_debuff_duration`
- 本地 rawAttributes：`hammer_damage: 50/80/110/140`、`burn_damage: 20/30/40/50`、`flare_debuff_duration: 2.5/3/3.5/4`
- Dotabuff 对照：战锤伤害 50/80/110/140；火径每秒烧灼 20/30/40/50。
- 是否计入固定爆发：火径不计入固定瞬时；战锤命中应可计入
- 需要输入：`hammer_hit`、`active_duration`
- 人工判断：当前漏算战锤命中伤害，只保留火径持续伤害。
- 问题记录：
  - 固定爆发场景下 `hammer_damage` 是重要缺口。
- 修正建议：
  - 拆成 instant 组件和 sustained 组件。

### Converge
- 中文名：汇合
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：无
- Dotabuff 对照：回收战锤的子技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。该子技能不额外提供独立伤害字段。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Break of Dawn
- 中文名：辰星破晓
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`max_dmg_pct: 10%`、`max_vision_pct: 20%`
- Dotabuff 对照：最高攻击力提升 8%，最高视野提升 20%。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前忽略可以接受，但存在版本/字段差异，需要后续确认。
- 问题记录：
  - 本地 `max_dmg_pct: 10%` 与 Dotabuff 8% 不一致。
- 修正建议：
  - 作为版本差异记录；若纳入普攻模型，应作为攻击力增益而非直接伤害。

### Solar Guardian
- 中文名：天光现世
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: base_damage`；`durationKey: land_stun_duration`
- 本地 rawAttributes：`base_damage: 30/50/70`、`pulse_interval: 0.5`、`land_damage: 130/160/190`、`land_stun_duration: 1.4/1.6/1.8`
- Dotabuff 对照：每次脉冲伤害 30/50/70，落地伤害 130/160/190，滞空时间 0.8。
- 是否计入固定爆发：不应按当前方式计入
- 需要输入：`pulse_count` 或 `active_duration`，以及是否命中落地
- 人工判断：当前模型错误。`base_damage` 是每次脉冲伤害，不是每秒伤害；`land_stun_duration` 也不是伤害持续时间。
- 问题记录：
  - 大招应拆成脉冲伤害和落地伤害。
- 修正建议：
  - `total = base_damage * pulse_count + land_damage`，脉冲次数由作用时间和 `pulse_interval` 决定。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 修正多段、火径、脉冲和落地伤害模型。
