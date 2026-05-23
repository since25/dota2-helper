# 亚巴顿（Abaddon）伤害模型复核

## 状态
- 复核状态：已复核，可用但建议补条件输入
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：核心字段语义正确，未发现 self_damage 被误计入对敌伤害。
- 是否存在误计入固定爆发：Mist Coil 正确使用 damage_heal；self_damage/self_damage_enemy_target 没有计入。
- 是否缺少关键输入：Aphotic Shield 需要“护盾爆炸发生且敌人在范围内”；Curse of Avernus 需要普攻命中/作用时间。
- 是否需要修改模型：非强制；建议给 Aphotic Shield 增加 shield_explosion_occurs/target_in_radius 条件输入。

## 技能复核

### Withering Mist
- 中文名：凋零迷雾
- 当前模型：reference_only / debuff_reference
- 字段对照：heal_reduction_pct=24.5%
- 数据来源对照：Dotabuff 生命回复降低 24.5%，本地字段一致。
- 人工判断：正确。治疗/恢复降低不是伤害，不计入爆发。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

### Mist Coil
- 中文名：迷雾缠绕
- 当前模型：implemented / instant_fixed
- 字段对照：damage_heal=95/170/245/320；self_damage=40%
- 数据来源对照：Dotabuff 伤害/治疗 95/170/245/320，对自身伤害 40%。
- 人工判断：正确。对敌伤害用 damage_heal，自伤是生命代价，不计入对敌伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

### Aphotic Shield
- 中文名：无光之盾
- 当前模型：implemented / instant_fixed
- 字段对照：damage_absorb=120/150/180/210；duration=12；radius=675
- 数据来源对照：Dotabuff 全伤害护盾 120/150/180/210，爆炸范围 675。
- 人工判断：数值正确；语义上这是护盾破裂/结束时的范围伤害，不是施法瞬间必定命中。
- 问题记录：
  - 建议补条件：shield_explosion_occurs、target_in_radius。
- 修正建议：
  - 建议补条件：shield_explosion_occurs、target_in_radius。

### Curse of Avernus
- 中文名：魔霭诅咒
- 当前模型：implemented / sustained_dps
- 字段对照：curse_dps=15/25/35/45；curse_duration=2；hit_count=1
- 数据来源对照：Dotabuff 每秒伤害 15/25/35/45，持续 2 秒。
- 人工判断：正确。应作为普攻触发后的持续伤害，不应计入固定瞬时爆发。
- 问题记录：
  - 可补 active_duration/attack_count 展示。
- 修正建议：
  - 可补 active_duration/attack_count 展示。

### Borrowed Time
- 中文名：回光返照
- 当前模型：reference_only / debuff_reference
- 字段对照：duration=4/5/6；hp_threshold=400
- 数据来源对照：Dotabuff 持续时间 4/5/6，生命临界值 400。
- 人工判断：正确。生存技能，不造成对敌伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
