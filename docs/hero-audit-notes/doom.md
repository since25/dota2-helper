# 末日使者（Doom）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：末日

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：1
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：3
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Lvl ? Pain` 当前明显误建模；`Infernal Blade` 只计固定烧灼，漏掉最大生命百分比。
- 是否缺少关键输入：`Infernal Blade` 需要目标最大生命和持续时间；持续伤害均需要实际作用时间。
- 是否需要修改模型：需要，且存在本地数据与 Dotabuff 数值不一致。

## 技能复核

### Devour
- 中文名：吞噬
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`bonus_gold: 35/70/105/140`、`creep_level: 4/5/6/6`
- Dotabuff 对照：经济/吞噬技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前不计入伤害正确。吞噬主要是经济和获得中立技能。
- 问题记录：
  - 吞噬获得的技能需要单独按被吞单位技能建模。
- 修正建议：
  - 暂不纳入英雄基础爆发。

### Scorched Earth
- 中文名：焦土
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_per_second`；`durationKey: duration`
- 本地 rawAttributes：`damage_per_second: 20/35/50/65`、`duration: 10/12/14/16`
- Dotabuff 对照：页面显示每秒伤害 20/30/40/50。
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 人工判断：模型类型正确，但数值存在版本差异。
- 问题记录：
  - 本地与 Dotabuff 不一致：35/50/65 vs 30/40/50。
- 修正建议：
  - 后续版本校准时确认以哪个来源为准；计算器应标出来源版本。

### Infernal Blade
- 中文名：阎刃
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: burn_damage`
- 本地 rawAttributes：`burn_damage: 15/30/45/60`、`burn_damage_pct: 1%/2%/3%/4%`、`burn_duration: 4`
- Dotabuff 对照：固定烧灼和最大生命百分比烧灼。
- 是否计入固定爆发：当前计入不完整
- 需要输入：`target_max_health`、`active_duration`
- 人工判断：当前模型错误/低估。阎刃不是单次固定 15/30/45/60，还包含目标最大生命百分比，且持续 4 秒。
- 问题记录：
  - `burn_damage_pct` 完全未计入。
- 修正建议：
  - 改为持续伤害组件：`(burn_damage + target_max_health * burn_damage_pct) * active_duration`，按实际规则确认是否为每秒。

### Devoured Ability
- 中文名：吞噬技能
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：无
- Dotabuff 对照：由吞噬单位决定。
- 是否计入固定爆发：否
- 需要输入：被吞单位技能
- 人工判断：正确。没有固定英雄技能字段。
- 问题记录：
  - 无。
- 修正建议：
  - 后续可做可选中立技能库。

### Doom
- 中文名：末日
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage`；`durationKey: duration`
- 本地 rawAttributes：`damage: 25/45/66`、`duration: 12/14/16`
- Dotabuff 对照：页面显示伤害 22/44/66，持续时间 12/14/16，伤害类型为纯粹。
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 人工判断：模型类型正确，但前两级数值与 Dotabuff 有差异。
- 问题记录：
  - 本地 25/45/66 与 Dotabuff 22/44/66 不一致。
- 修正建议：
  - 后续版本校准时确认来源；支持实际作用时间。

### Lvl ? Pain
- 中文名：等级痛苦
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_debuff_duration`；`durationKey: damage_debuff_duration`
- 本地 rawAttributes：`bonus_damage_pct_base: 15`、`damage_debuff_duration: 2.5`、`level_multiplier: 6`
- Dotabuff 对照：不是 Doom 常规可直接施放伤害技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前模型错误。`damage_debuff_duration` 是持续时间，不是每秒伤害。
- 问题记录：
  - 明显把时间字段误当伤害字段。
- 修正建议：
  - 从 Doom 基础伤害模型中移除或改为 reference_only，等确认来源后再处理。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 修正 `Infernal Blade` 百分比生命、`Lvl ? Pain` 误建模，并确认版本差异。
