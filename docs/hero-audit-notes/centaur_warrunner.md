# 半人马战行者（Centaur Warrunner）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：7
- 已实现伤害：1
- 参考项：4
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：Hoof Stomp 正确，但 Double Edge 和 Stampede 的核心伤害没有实现。
- 是否存在误计入固定爆发：未发现；主要是应计伤害被 reference_only。
- 是否缺少关键输入：Double Edge 需要力量；Retaliate 需要力量和触发次数；Stampede 需要力量、命中次数/踩踏次数。
- 是否需要修改模型：需要。Double Edge 应拆固定伤害 + strength scaling；Stampede 应为 attribute_scaling。

## 技能复核

### Hoof Stomp
- 中文名：马蹄践踏
- 当前模型：implemented / instant_fixed
- 字段对照：stomp_damage=70/140/210/280；stun_duration=1.6/1.8/2/2.2。
- 人工判断：正确，可计入固定魔法伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Double Edge
- 中文名：双刃剑
- 当前模型：reference_only / debuff_reference
- 字段对照：edge_damage=120/180/240/300；strength_damage=60/90/120/150%。
- 人工判断：错误：这是核心伤害技能，应计入伤害；还需要当前力量输入。
- 问题记录：
  - 错误：这是核心伤害技能，应计入伤害；还需要当前力量输入。
- 修正建议：
  - 错误：这是核心伤害技能，应计入伤害；还需要当前力量输入。

### Retaliate
- 中文名：反伤
- 当前模型：reference_only / state_scaling
- 字段对照：return_damage=15/25/35/45；return_damage_str=16/24/32/40%。
- 人工判断：方向正确，需要 hero_strength 和 trigger_count。
- 问题记录：
  - 方向正确，需要 hero_strength 和 trigger_count。
- 修正建议：
  - 方向正确，需要 hero_strength 和 trigger_count。

### Work Horse / Hitch A Ride
- 中文名：马到成功/搭便车
- 当前模型：ignored/reference_only
- 字段对照：duration/break_distance 等。
- 人工判断：机动/载人机制，不直接伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Stampede
- 中文名：奔袭冲撞
- 当前模型：reference_only / debuff_reference
- 字段对照：strength_damage=2/2.5/3；radius=105；duration=3.5/4/4.5。
- 人工判断：错误：奔袭冲撞有力量系数伤害，应建 state_scaling 而非只记录 slow。
- 问题记录：
  - 错误：奔袭冲撞有力量系数伤害，应建 state_scaling 而非只记录 slow。
- 修正建议：
  - 错误：奔袭冲撞有力量系数伤害，应建 state_scaling 而非只记录 slow。

### Horsepower
- 中文名：开足马力
- 当前模型：ignored
- 字段对照：strength_to_movement_pct=30。
- 人工判断：移速换算，不直接伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
