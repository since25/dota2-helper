# 邪影芳灵（Dark Willow）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小仙女

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：2
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Bramble Maze` 和 `Shadow Realm` 当前持续伤害建模不准确。
- 是否缺少关键输入：`Bramble Maze` 需要触发/命中次数；`Shadow Realm` 需要蓄力时间；`Bedlam` 需要攻击次数或作用时间。
- 是否需要修改模型：需要。当前会高估或错算关键输出。

## 技能复核

### Bramble Maze
- 中文名：荆棘迷宫
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_per_tick`；`durationKey: placement_duration`
- 本地 rawAttributes：`damage_per_tick: 50/55/60/65`、`placement_duration: 12`、`latch_duration: 1/1.5/2/2.5`
- Dotabuff 对照：每次伤害 50/55/60/65，缠绕持续时间 1/1.5/2/2.5。
- 是否计入固定爆发：否
- 需要输入：`hit_count` 或 `trigger_count`
- 人工判断：当前模型错误。`damage_per_tick` 在语义上是荆棘触发/缠绕造成的每次伤害，不应按 12 秒持续时间累乘。
- 问题记录：
  - `placement_duration` 是荆棘存在时间，不是对同一目标持续伤害时间。
- 修正建议：
  - 改为多次触发模型：`total = damage_per_tick * trigger_count`，默认不自动打满。

### Shadow Realm
- 中文名：暗影之境
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: max_damage_duration`；`durationKey: duration`
- 本地 rawAttributes：`damage: 120/200/280/360`、`duration: 5`、`max_damage_duration: 3`
- Dotabuff 对照：最高伤害 120/200/280/360，持续时间 5。
- 是否计入固定爆发：不应按当前方式计入
- 需要输入：`charge_duration`
- 人工判断：当前模型错误。`max_damage_duration` 是达到最高伤害所需蓄力时间，不是每秒伤害。
- 问题记录：
  - 当前 sustained_dps 会把 3 当 DPS，完全偏离技能语义。
- 修正建议：
  - 改为蓄力型瞬时伤害：按 `charge_duration / max_damage_duration` 映射到最高伤害。

### Cursed Crown
- 中文名：诅咒王冠
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`delay: 4`、`stun_duration: 1.5/1.8/2.1/2.4`、`stun_radius: 360`
- Dotabuff 对照：延迟 4，眩晕 1.5/1.8/2.1/2.4。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。该技能本身不造成伤害，是控制窗口。
- 问题记录：
  - 无。
- 修正建议：
  - 后续控制链模块可引用延迟和眩晕时间。

### Bedlam
- 中文名：作祟
- 当前模型：implemented / attack_modifier
- 当前字段：`bonusDamageKey: attack_damage`
- 本地 rawAttributes：`attack_damage: 70/120/170`、`attack_interval: 0.25`、`roaming_duration: 5.5`、`attack_targets: 1`
- Dotabuff 对照：攻击伤害 70/120/170，攻击间隔 0.25，持续 5.5。
- 是否计入固定爆发：否
- 需要输入：`attack_count` 或 `active_duration`
- 人工判断：当前方向不完整。它不是英雄普攻加成，而是宠物/技能自动攻击造成的魔法伤害。
- 问题记录：
  - `hero_attack_damage` 不应作为 Bedlam 的必要输入。
- 修正建议：
  - 改为多次技能攻击模型：`attack_damage * attack_count`，可由作用时间和攻击间隔估算上限。

### Pixie Dust
- 中文名：仙灵粉尘
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`hp_regen_amp: 20`、`mana_regen_amp: 20`
- Dotabuff 对照：无直接伤害字段。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。回复增强不是伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要进入伤害模型。

### Terrorize
- 中文名：恐吓
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`destination_status_duration: 2.8/3/3.2`
- Dotabuff 对照：恐惧持续时间 2.8/3/3.2，作用范围 450/500/550。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。控制技能，不直接造成伤害。
- 问题记录：
  - 伤害类型页面显示为魔法，但没有直接伤害字段，不能因此建模为伤害。
- 修正建议：
  - 作为控制窗口参考即可。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 修正 `Bramble Maze`、`Shadow Realm`、`Bedlam` 的模型类型。
