# 圣堂刺客（Templar Assassin）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：TA、圣堂

## 模型概览
- 技能条目数：7
- 已实现伤害：0
- 参考项：4
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：当前模型过于保守，`Refraction`、`Meld`、`Psi Blades`、`Psionic Trap` 都应进入普攻/条件伤害模型。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：折光层数、攻击次数、是否触发隐匿攻击、陷阱蓄力。
- 是否需要修改模型：需要。

## 技能复核

### Refraction
- 中文名：折光
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=15/30/45/60`、`instances=3/4/5/6`
- Dotabuff 对照：护盾层数和攻击力加成。
- 是否计入固定爆发：否，作为普攻加成。
- 需要输入：`refraction_attack_count`
- 人工判断：当前只看护盾不完整，攻击力加成应进入普攻模型。
- 问题记录：
  - `shield_per_instance` 不是伤害。
- 修正建议：
  - 拆为 defense shield + attack bonus。

### Meld
- 中文名：隐匿
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=50/100/150/200`、`bonus_armor=-2/-4/-6/-8`
- Dotabuff 对照：下一次攻击额外物理伤害并降低护甲。
- 是否计入固定爆发：有条件计入
- 需要输入：`meld_attack`
- 人工判断：当前漏算直接额外伤害。
- 问题记录：
  - 减甲不是伤害，但 bonus_damage 是伤害。
- 修正建议：
  - 建为 attack_bonus + armor_reduction。

### Psi Blades
- 中文名：灵能之刃
- 当前模型：ignored
- 本地 rawAttributes：`attack_spill_pct=70%/80%/90%/100%`
- Dotabuff 对照：溅射纯粹伤害。
- 是否计入固定爆发：对副目标有条件计入
- 需要输入：`source_attack_damage`、`spill_target_count`
- 人工判断：当前忽略会漏副目标伤害，但不应叠到主目标。
- 问题记录：
  - 溅射是 secondary damage。
- 修正建议：
  - 建为 spill damage。

### Psionic Trap / Trap
- 中文名：灵能陷阱 / 触发陷阱
- 当前模型：reference_only / ignored
- 本地 rawAttributes：`trap_bonus_damage=200/300/400`、`trap_max_charge_duration=3.5`
- Dotabuff 对照：陷阱伤害和减速，蓄力影响效果。
- 是否计入固定爆发：有条件计入
- 需要输入：`trap_charged`
- 人工判断：当前漏算陷阱伤害。
- 问题记录：
  - `extra_damage=400` 可能来自投射/神杖，需要区分。
- 修正建议：
  - 建为 charged_trap_instant。

### Inner Peace / Psionic Projection
- 中文名：心怀安宁 / 灵能投射
- 当前模型：ignored / reference_only
- Dotabuff 对照：恢复/位移或特殊机制，不直接作为常规伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：暂不计入合理。
- 问题记录：
  - 恢复值不是伤害。
- 修正建议：
  - 保留为参考。
