# 戴泽（Dazzle）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：无

## 模型概览
- 技能条目数：6
- 已实现伤害：2
- 参考项：2
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：0

## 复核结论
- 总体判断：基本可用，但 `Shadow Wave` 的总伤害依赖目标数量，当前仅覆盖单次波及伤害。
- 是否存在误计入固定爆发：未发现。`Weave` 的护甲变化未被误计入伤害。
- 是否缺少关键输入：`Poison Touch` 需要作用时间/攻击延长；`Shadow Wave` 需要命中敌人数量。
- 是否需要修改模型：建议补充输入声明和护甲变化参考，不急于改核心字段。

## 技能复核

### Poison Touch
- 中文名：剧毒之触
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage`；`durationKey: duration`
- 本地 rawAttributes：`damage: 16/28/40/52`、`duration: 3.5/5/6.5/8`、`targets: 2/4/6/8`、`bonus_slow: -2%/-2.5%/-3%/-3.5%`
- Dotabuff 对照：每秒伤害 16/28/40/52，持续时间 3.5/5/6.5/8，伤害类型为物理。
- 是否计入固定爆发：否
- 需要输入：`active_duration`，后续可加 `attack_extend_count`
- 人工判断：基本正确。它是持续物理伤害，默认打满只是理论上限。
- 问题记录：
  - 攻击延长/加深减速细节尚未进入模型。
- 修正建议：
  - 增加显式 `conditionInputs: ['active_duration']`，后续扩展攻击延长。

### Shallow Grave
- 中文名：薄葬
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`duration: 4/4.5/5/5.5`、`heal_amplify: 3%/5%/7%/9%`
- Dotabuff 对照：持续时间 4/4.5/5/5.5，每缺失 10% 生命增强治疗 3%/5%/7%/9%。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。生存技能，不造成对敌伤害。
- 问题记录：
  - 治疗增强不能进入伤害。
- 修正建议：
  - 后续可作为生存/治疗模块参考。

### Shadow Wave
- 中文名：暗影波
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage: 85/105/125/145`、`damage_radius: 185`、`max_targets: 3/4/5/6`
- Dotabuff 对照：伤害 85/105/125/145，最大治疗目标数 4/5/6/7，伤害类型为物理。
- 是否计入固定爆发：是，按单次伤害
- 需要输入：`enemy_hit_count` 或相邻治疗目标数量
- 人工判断：单目标字段正确，但总伤害依赖波及次数。若多个友方贴近同一敌人，伤害可叠加。
- 问题记录：
  - 当前模型没有表达多目标/多跳命中。
- 修正建议：
  - 后续改为 `damage * enemy_hit_count`，默认 1。

### Weave
- 中文名：编织
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`armor_change: 1`、`duration: 6.9`
- Dotabuff 对照：每次叠加改变护甲 1，持续时间 6.9。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前不计伤害正确，但它会改变后续物理伤害，应作为护甲修正参考。
- 问题记录：
  - 护甲变化不是直接伤害，不能作为 unknown damage。
- 修正建议：
  - 后续纳入 armor_modifier 语义层。

### Nothl Projection
- 中文名：虚无投影
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`poison_touch_hex: 1.4/1.6/1.8`、`shallow_grave_heal: 225/300/375`、`shadow_wave_cdr: 30%/40%/50%`
- Dotabuff 对照：妖术持续时间、薄葬治疗、暗影波冷却减少。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。它改变技能施放窗口和辅助收益，不直接造成伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 后续作为技能增强参考。

### End Projection
- 中文名：终止投影
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：无
- Dotabuff 对照：结束投影子技能。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 后续补 `Shadow Wave` 多目标和 `Weave` 护甲修正。
