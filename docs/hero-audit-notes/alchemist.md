# 炼金术士（Alchemist）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：4
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型存在关键问题，不能直接作为最终伤害模型。
- 是否存在误计入固定爆发：Unstable Concoction Throw 以 max_damage 默认计入固定爆发，容易高估；主技能和投掷子技能也有重复表达风险。
- 是否缺少关键输入：Unstable Concoction 需要蓄力时间；Acid Spray 需要作用时间和目标停留时间；Corrosive Weaponry 需要攻击次数/层数。
- 是否需要修改模型：需要。建议把 Unstable Concoction/Throw 合并为一个 state_scaling 或 charged_damage 模型。

## 技能复核

### Acid Spray
- 中文名：酸性喷雾
- 当前模型：implemented / sustained_dps
- 字段对照：damage=25/30/35/40；duration=15；tick_rate=1；armor_reduction=3/4/5/6
- 数据来源对照：Dotabuff 每秒伤害 25/30/35/40，持续 15，护甲削弱 3/4/5/6。
- 人工判断：伤害字段正确；护甲降低应作为额外修正项，目前模型只保留伤害。
- 问题记录：
  - 建议额外组件记录 armor_reduction，不计入固定伤害。
- 修正建议：
  - 建议额外组件记录 armor_reduction，不计入固定伤害。

### Unstable Concoction
- 中文名：不稳定化合物
- 当前模型：reference_only / conditional
- 字段对照：max_damage=150/220/290/360；brew_time=5；min_damage=0
- 数据来源对照：Dotabuff 最大伤害 150/220/290/360，最长眩晕 1.7/2.2/2.7/3.2。
- 人工判断：当前 reference_only 合理，但子技能又把 max_damage 计入 fixed，存在重复/高估风险。
- 问题记录：
  - 需要按蓄力时间计算：damage = f(charge_time)，不要默认 max_damage。
- 修正建议：
  - 需要按蓄力时间计算：damage = f(charge_time)，不要默认 max_damage。

### Unstable Concoction Throw
- 中文名：不稳定化合物投掷
- 当前模型：implemented / instant_fixed
- 字段对照：max_damage=150/220/290/360
- 数据来源对照：Dotabuff 页面不作为独立英雄技能展示。
- 人工判断：不建议默认计入固定爆发；它只是投掷阶段，不代表一定满蓄力。
- 问题记录：
  - 改为 ignored 或与主技能合并。
- 修正建议：
  - 改为 ignored 或与主技能合并。

### Corrosive Weaponry
- 中文名：腐蚀兵械
- 当前模型：reference_only / debuff_reference
- 字段对照：slow_per_stack=2.5/3/3.5/4；attack_dmg_per_stack=2.5/3/3.5/4
- 数据来源对照：Dotabuff 每层减速、每层降低基础攻击力。
- 人工判断：正确不计伤害，但当前只记录 slow_per_stack，漏了 attack_dmg_per_stack。
- 问题记录：
  - 建议额外记录攻击力降低为 modifier.attack_damage.percent。
- 修正建议：
  - 建议额外记录攻击力降低为 modifier.attack_damage.percent。

### Berserk Potion
- 中文名：狂暴药剂
- 当前模型：reference_only / debuff_reference
- 字段对照：attack_speed=50；hp_regen=40；move_speed=30；duration=15
- 数据来源对照：Dotabuff 攻速 50、生命恢复 40、移速 30。
- 人工判断：当前用 abilitycastrange 作为定位参考不够准确；它实际是增益。
- 问题记录：
  - 建议改成 attack_speed/hp_regen/move_speed reference。
- 修正建议：
  - 建议改成 attack_speed/hp_regen/move_speed reference。

### Greevil's Greed
- 中文名：贪魔的贪婪
- 当前模型：reference_only / debuff_reference
- 字段对照：bonus_gold 等经济字段；scepter_bonus_damage=25
- 数据来源对照：Dotabuff 展示经济奖励，不是伤害技能。
- 人工判断：不计入伤害正确；如果考虑神杖赠送加成，需要单独处理 scepter_bonus_damage。
- 问题记录：
  - 当前可暂不改。
- 修正建议：
  - 当前可暂不改。

### Chemical Rage
- 中文名：化学狂暴
- 当前模型：ignored
- 字段对照：base_attack_time=1.2/1.1/1；bonus_health_regen=60/90/120；bonus_movespeed=20/30/40
- 数据来源对照：Dotabuff 展示 BAT、恢复、移速。
- 人工判断：不直接造成伤害，但会影响普攻 DPS。
- 问题记录：
  - 后续普攻模型可接入 base_attack_time。
- 修正建议：
  - 后续普攻模型可接入 base_attack_time。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
