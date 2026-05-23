# 钢背兽（Bristleback）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：4
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：Quill Spray 基础伤害字段可用，但叠加伤害、鼻液减甲和战意攻击力没有正确表达。
- 是否存在误计入固定爆发：Quill Spray 只计 base damage 不算严重高估；Warpath 被标成 move_speed_scaling 不准确。
- 是否缺少关键输入：Quill Spray 需要已有叠层数；Bristleback 被动需要受到伤害阈值/触发次数。
- 是否需要修改模型：需要。补 quill_stack_damage 和 Warpath attack damage stack。

## 技能复核

### Viscous Nasal Goo
- 中文名：粘稠鼻液
- 当前模型：reference_only / debuff_reference
- 字段对照：base_armor=1.5/2/2.5/3；armor_per_stack=2/2.5/3/3.5。
- 人工判断：当前只记录 abilitycastrange，漏了护甲降低和减速；应改为 armor_reduction reference。
- 问题记录：
  - 当前只记录 abilitycastrange，漏了护甲降低和减速；应改为 armor_reduction reference。
- 修正建议：
  - 当前只记录 abilitycastrange，漏了护甲降低和减速；应改为 armor_reduction reference。

### Quill Spray
- 中文名：刺针扫射
- 当前模型：implemented / instant_fixed
- 字段对照：quill_base_damage=25/45/65/85；quill_stack_damage=30；max_damage=500。
- 人工判断：基础伤害正确，但总伤害依赖已有刺针层数，需 stack_count 输入。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Bristleback
- 中文名：钢毛后背
- 当前模型：reference_only / debuff_reference
- 字段对照：side/back damage reduction；quill_release_threshold=275/250/225/200。
- 人工判断：不是直接伤害；但达到阈值会触发刺针，需后续 trigger model。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Hairball
- 中文名：毛团
- 当前模型：reference_only / debuff_reference
- 字段对照：quill_stacks=1；goo_stacks=2；radius=700。
- 人工判断：不直接造成单独伤害，但会施加鼻液/刺针层数；需要作为 stack applier。
- 问题记录：
  - 不直接造成单独伤害，但会施加鼻液/刺针层数；需要作为 stack applier。
- 修正建议：
  - 不直接造成单独伤害，但会施加鼻液/刺针层数；需要作为 stack applier。

### Warpath
- 中文名：战意
- 当前模型：reference_only / state_scaling
- 字段对照：damage_per_stack=15/20/25；move_speed_per_stack=2/2.5/3%；max_stacks=8/10/12。
- 人工判断：当前 semanticType=damage.move_speed_scaling 不准确；这是攻击力叠加修正。
- 问题记录：
  - 当前 semanticType=damage.move_speed_scaling 不准确；这是攻击力叠加修正。
- 修正建议：
  - 当前 semanticType=damage.move_speed_scaling 不准确；这是攻击力叠加修正。

### Prickly
- 中文名：尖刺在背
- 当前模型：ignored
- 字段对照：amp_pct=4.5%。
- 人工判断：伤害/负面效果持续时间增强，不直接伤害；可作为 modifier。
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
