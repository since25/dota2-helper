# 敌法师（Anti-Mage）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：5
- 已实现伤害：0
- 参考项：5
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前方向正确，避免把法力相关伤害计入固定爆发，但 Mana Break 的输入和字段需要细化。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：Mana Break 需要目标当前/最大魔法、攻击次数和实际烧蓝量；Mana Void 需要目标已损魔法。
- 是否需要修改模型：需要。Mana Break 不能只用 target_current_mana，应表达 mana_per_hit、mana_per_hit_pct 与 percent_damage_per_burn 的组合。

## 技能复核

### Mana Break
- 中文名：法力损毁
- 当前模型：reference_only / state_scaling
- 字段对照：percent_damage_per_burn=50；mana_per_hit=25/30/35/40；mana_per_hit_pct=1.6/2.4/3.2/4
- 数据来源对照：Dotabuff 显示损毁魔法值伤害系数 60，每次攻击损毁魔法 25/30/35/40。
- 人工判断：不计固定爆发正确；但当前 requiredInputs 过少，且 Dotabuff 与本地 percent_damage_per_burn 存在 50/60 差异。
- 问题记录：
  - 补 target_max_mana、target_current_mana、attack_count；确认当前 patch 数值。
- 修正建议：
  - 补 target_max_mana、target_current_mana、attack_count；确认当前 patch 数值。

### Blink
- 中文名：闪烁
- 当前模型：reference_only / debuff_reference
- 字段对照：abilitycastrange=875/950/1025/1100
- 数据来源对照：Dotabuff 作为位移技能。
- 人工判断：正确，不造成伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

### Counterspell
- 中文名：法术反制
- 当前模型：reference_only / debuff_reference
- 字段对照：magic_resistance=14/21/28/35；duration=1.3
- 数据来源对照：Dotabuff 魔法抗性 14/21/28/35，外壳 1.3。
- 人工判断：当前用 abilitycastrange=0 做 positioning reference 不准确。
- 问题记录：
  - 建议改为 defense.magic_resistance.percent 和 spell_reflect window reference。
- 修正建议：
  - 建议改为 defense.magic_resistance.percent 和 spell_reflect window reference。

### Persecutor
- 中文名：绝人之路
- 当前模型：reference_only / debuff_reference
- 字段对照：move_slow_min=12%；move_slow_max=24%；slow_duration=0.75
- 数据来源对照：Dotabuff 最低/最高减速 12%/24%。
- 人工判断：正确，不造成伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 可保留。

### Mana Void
- 中文名：法力虚空
- 当前模型：reference_only / state_scaling
- 字段对照：mana_void_damage_per_mana=1；mana_void_aoe_radius=400/450/500
- 数据来源对照：Dotabuff 每点缺失魔法造成伤害 1。
- 人工判断：正确不计固定爆发；需要目标已损魔法。
- 问题记录：
  - 计算器应支持 target_missing_mana。
- 修正建议：
  - 计算器应支持 target_missing_mana。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
