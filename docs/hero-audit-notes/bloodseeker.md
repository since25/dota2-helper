# 血魔（Bloodseeker）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型并确认版本数值
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：3
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型避免了把 Rupture/Bloodrage 硬算成固定爆发，这是对的；但 Blood Rite 数值与 Dotabuff 差异明显，Rupture 字段选取也不够准确。
- 是否存在误计入固定爆发：Bloodrage 和 Rupture 没有进入固定爆发，正确。
- 是否缺少关键输入：Bloodrage 需要作用时间和目标最大生命；Rupture 需要移动距离/时间、目标生命百分比和伤害上限。
- 是否需要修改模型：需要。Rupture 不应以 damage_cap_amount 作为核心 damage value；Blood Rite 需确认本地版本数值。

## 技能复核

### Bloodrage
- 中文名：血怒
- 当前模型：reference_only / state_scaling
- 字段对照：damage_pct=1.2%；duration=8；attack_speed=60/90/120/150；spell_amp=15%/20%/25%/30%
- 数据来源对照：Dotabuff 每秒最大生命值伤害 1.2%，攻速/技能增强。
- 人工判断：不计固定爆发正确；这是对受影响单位的百分比持续伤害/增益。
- 问题记录：
  - 需要 active_duration、target_max_health，并记录攻速/技能增强 reference。
- 修正建议：
  - 需要 active_duration、target_max_health，并记录攻速/技能增强 reference。

### Blood Rite
- 中文名：血祭
- 当前模型：implemented / instant_fixed
- 字段对照：本地 damage=105/175/245/315；Dotabuff 伤害 100/155/210/265
- 数据来源对照：数值存在明显版本差异。
- 人工判断：结构正确，纯粹瞬时范围伤害可计入；数值源需确认。
- 问题记录：
  - 标记版本差异，暂按本地 provider。
- 修正建议：
  - 标记版本差异，暂按本地 provider。

### Thirst
- 中文名：焦渴
- 当前模型：ignored
- 字段对照：bonus_movement_speed=10%/20%/30%/40%；visibility_threshold_pct=25%
- 数据来源对照：Dotabuff 展示移速和视野阈值。
- 人工判断：正确不作为伤害。
- 问题记录：
  - 后续机动/追击模型再处理。
- 修正建议：
  - 后续机动/追击模型再处理。

### Sanguivore
- 中文名：食血动物
- 当前模型：reference_only / debuff_reference
- 字段对照：base_heal=30；half_bonus_aoe=300
- 数据来源对照：Dotabuff 半额治疗范围 300。
- 人工判断：治疗/续航，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 可保留。

### Rupture
- 中文名：割裂
- 当前模型：reference_only / state_scaling
- 字段对照：movement_damage_pct=35%/45%/55%；hp_pct=10%；damage_cap_amount=200；duration=9/10/11
- 数据来源对照：Dotabuff 移动伤害 35%/45%/55%，生命值伤害 10%。
- 人工判断：当前 valueKey=damage_cap_amount 不应作为核心伤害值；这只是上限/限制字段。
- 问题记录：
  - 改为 distance_scaling 使用 movement_damage_pct，并加入 target_current/max_health、distance_moved、active_duration、damage_cap。
- 修正建议：
  - 改为 distance_scaling 使用 movement_damage_pct，并加入 target_current/max_health、distance_moved、active_duration、damage_cap。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
