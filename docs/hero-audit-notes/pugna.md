# 帕格纳（Pugna）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：骨法

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：3
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型存在关键字段取错，`Nether Blast` 用了建筑伤害系数字段而不是爆轰伤害。
- 是否存在误计入固定爆发：存在。`structure_damage_mod=65` 不是对英雄伤害；`Nether Ward` 和 `Life Drain` 还未正确计算。
- 是否缺少关键输入：缺 `mana_spent`、`channel_duration`、`decrepify_active`。
- 是否需要修改模型：需要。

## 技能复核

### Nether Blast
- 中文名：幽冥爆轰
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: structure_damage_mod`
- 本地 rawAttributes：`blast_damage=95/170/245/320`、`structure_damage_mod=65`
- Dotabuff 对照：爆轰伤害 95/170/245/320；建筑伤害是修正项。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：当前模型错误，取错字段。
- 问题记录：
  - 对英雄应使用 `blast_damage`，不是 `structure_damage_mod`。
- 修正建议：
  - 改为 `damageKey: blast_damage`；建筑修正单独记录。

### Decrepify
- 中文名：衰老
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_spell_damage_pct=-20%/-30%/-40%/-50%`、`abilityduration=3.5`
- Dotabuff 对照：敌方受到魔法伤害加深，友军治疗增强。
- 是否计入固定爆发：否，作为魔法伤害修正。
- 需要输入：`decrepify_active`
- 人工判断：当前不直接计伤害正确，但语义应是 magic damage amplification。
- 问题记录：
  - 负号字段表示承伤加深，容易被误解为减伤。
- 修正建议：
  - 进入 modifier 层，修正 Pugna 自身和队友魔法伤害。

### Nether Ward
- 中文名：幽冥守卫
- 当前模型：reference_only / state_scaling
- 本地 rawAttributes：`base_damage=50/70/90/110`、`mana_multiplier=1/1.2/1.4/1.6`
- Dotabuff 对照：敌方施法时按耗蓝造成魔法伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`enemy_mana_spent`
- 人工判断：当前 stack_scaling 语义不准确。它不是叠层，是耗蓝触发。
- 问题记录：
  - 需要敌方具体施法耗蓝，不能给固定爆发。
- 修正建议：
  - 改为 mana_spent_trigger 模型。

### Oblivion Savant
- 中文名：湮灭专家
- 当前模型：ignored
- 本地 rawAttributes：`tower_scale=1.5`
- Dotabuff 对照：偏建筑/机制修正，不直接对英雄造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入英雄伤害计算。

### Life Drain
- 中文名：生命汲取
- 当前模型：reference_only
- 本地 rawAttributes：`health_drain=150/250/350`、`tick_rate=0.25`、`abilitychanneltime=10`
- Dotabuff 对照：持续汲取敌人生命或治疗友军。
- 是否计入固定爆发：否，按持续施法时间计算。
- 需要输入：`channel_duration`
- 人工判断：当前模型不完整，应作为持续魔法伤害/治疗处理。
- 问题记录：
  - 完全漏算 Pugna 大招伤害。
- 修正建议：
  - 改为 `sustained_dps`，使用 `health_drain` 和 `channel_duration`。
