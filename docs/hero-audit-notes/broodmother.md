# 育母蜘蛛（Broodmother）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：4
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：Spawn Spiderlings 直接伤害可用，但 Spinner's Snare 缺失，多个普攻/召唤物修正未建模。
- 是否存在误计入固定爆发：未发现明显高估；主要问题是缺模型。
- 是否缺少关键输入：Insatiable Hunger、Incapacitating Bite、Spiderlings 都需要攻击次数/单位持续时间。
- 是否需要修改模型：需要。补 Spinner's Snare sustained_dps，并细化普攻修正。

## 技能复核

### Insatiable Hunger
- 中文名：极度饥渴
- 当前模型：reference_only / debuff_reference
- 字段对照：bonus_damage=40%/50%/60%/70%；lifesteal=40%/60%/80%/100%。
- 人工判断：不直接造成技能伤害；应作为 attack_damage percent 和 lifesteal reference。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Spin Web
- 中文名：织网
- 当前模型：reference_only / debuff_reference
- 字段对照：bonus_movespeed=10/20/30/40%；count=3/5/7/9。
- 人工判断：移动/区域机制，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Incapacitating Bite
- 中文名：麻痹之咬
- 当前模型：reference_only / debuff_reference
- 字段对照：attack_damage=3/6/9/12；miss_chance；slow。
- 人工判断：当前 damage_amp 语义不准确；应为 attack_bonus 或 attack_modifier。
- 问题记录：
  - 当前 damage_amp 语义不准确；应为 attack_bonus 或 attack_modifier。
- 修正建议：
  - 当前 damage_amp 语义不准确；应为 attack_bonus 或 attack_modifier。

### Spider's Milk
- 中文名：蜘蛛奶
- 当前模型：reference_only / debuff_reference
- 字段对照：kill_heal_heroes=1.9%。
- 人工判断：治疗/续航，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Spinner's Snare
- 中文名：蛛纱陷阱
- 当前模型：missing
- 字段对照：Dotabuff 每秒伤害 100，缠绕 3 秒。
- 人工判断：当前模型缺失；需要 sustained_dps 或 trap sustained 模型。
- 问题记录：
  - 当前模型缺失；需要 sustained_dps 或 trap sustained 模型。
- 修正建议：
  - 当前模型缺失；需要 sustained_dps 或 trap sustained 模型。

### Spawn Spiderlings
- 中文名：孵化蜘蛛
- 当前模型：implemented / instant_fixed
- 字段对照：damage=220/320/420；count=4/5/6；spiderling_duration=40。
- 人工判断：直接命中伤害正确；小蜘蛛后续输出未计，需要 summon 模型。
- 问题记录：
  - 直接命中伤害正确；小蜘蛛后续输出未计，需要 summon 模型。
- 修正建议：
  - 直接命中伤害正确；小蜘蛛后续输出未计，需要 summon 模型。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
