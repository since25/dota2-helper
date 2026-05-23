# 远古冰魄（Ancient Apparition）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：1
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：3
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：基础持续伤害字段多数正确，但 Ice Blast 漏掉命中爆炸伤害。
- 是否存在误计入固定爆发：未发现明显非伤害误计入。
- 是否缺少关键输入：Cold Feet 需要目标是否离开范围；Ice Blast 需要命中爆炸伤害、持续时间和斩杀阈值分开表达。
- 是否需要修改模型：需要。Ice Blast 应拆成 instant_fixed(dmg) + sustained_dps(damage_per_second) + kill_pct reference。

## 技能复核

### Cold Feet
- 中文名：寒霜之足
- 当前模型：implemented / sustained_dps
- 字段对照：damage_per_second=20/40/60/80；abilityduration=4；break_distance=725/750/775/800
- 数据来源对照：Dotabuff 每秒伤害 20/40/60/80，失效距离 725/750/775/800。
- 人工判断：伤害字段正确；是否打满取决于目标是否脱离失效距离。
- 问题记录：
  - 建议补 active_duration 和 target_breaks_distance 条件。
- 修正建议：
  - 建议补 active_duration 和 target_breaks_distance 条件。

### Ice Vortex
- 中文名：冰霜漩涡
- 当前模型：implemented / sustained_dps
- 字段对照：damage_per_second=10/20/30/40；vortex_duration=6/8/10/12；spell_resist_pct=-16/-19/-22/-25
- 数据来源对照：Dotabuff 每秒伤害、持续时间、魔法伤害加深一致。
- 人工判断：伤害字段正确；魔法伤害加深未作为 modifier 组件保留。
- 问题记录：
  - 建议补 spell_resist_pct 为 magic resistance reduction reference。
- 修正建议：
  - 建议补 spell_resist_pct 为 magic resistance reduction reference。

### Chilling Touch
- 中文名：极寒之触
- 当前模型：implemented / instant_fixed
- 字段对照：damage=30/60/90/120
- 数据来源对照：Dotabuff 伤害 30/60/90/120。
- 人工判断：正确，可计入固定爆发。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

### Bone Chill
- 中文名：刺骨严寒
- 当前模型：reference_only / state_scaling
- 字段对照：str_reduction=.1；tooltip_scepter_bonus=0.3；duration=4
- 数据来源对照：Dotabuff 力量降低显示 0.2，本地 raw 为 .1，存在版本/字段解释差异。
- 人工判断：不直接作为伤害正确；但数值来源需要确认。
- 问题记录：
  - 标记版本差异，后续对 patch/source。
- 修正建议：
  - 标记版本差异，后续对 patch/source。

### Ice Blast
- 中文名：冰晶爆轰
- 当前模型：implemented / sustained_dps
- 字段对照：dmg=250/325/400；damage_per_second=12/24/36；frostbite_duration=10/11/12；kill_pct=12/13/14
- 数据来源对照：Dotabuff 页面显示持续伤害和斩杀阈值；本地还提供命中爆炸 dmg。
- 人工判断：当前模型只计霜寒持续伤害，漏了命中爆炸伤害。
- 问题记录：
  - 需要增加 instant_fixed 组件 damageKey=dmg，并把 kill_pct 作为斩杀阈值 reference。
- 修正建议：
  - 需要增加 instant_fixed 组件 damageKey=dmg，并把 kill_pct 作为斩杀阈值 reference。

### Release
- 中文名：释放冰晶爆轰
- 当前模型：ignored
- 字段对照：无
- 数据来源对照：控制子技能。
- 人工判断：正确忽略。
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
