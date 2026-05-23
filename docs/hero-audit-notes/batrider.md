# 蝙蝠骑士（Batrider）伤害模型复核

## 状态
- 复核状态：已复核，需确认版本数值
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
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：模型结构正确，能区分燃油层数、冲击伤害和持续灼烧；但本地字段与 Dotabuff 快照有明显数值差异。
- 是否存在误计入固定爆发：未发现 Sticky Napalm 层数被直接加进固定爆发。
- 是否缺少关键输入：Sticky Napalm 需要层数和伤害实例数；Firefly 需要实际停留时间；Smoldering Resin 需要攻击伤害和跳数。
- 是否需要修改模型：结构暂可用；需要确认数据源版本，尤其 Firefly 和 Flaming Lasso 数值。

## 技能复核

### Sticky Napalm
- 中文名：粘性燃油
- 当前模型：reference_only / state_scaling
- 字段对照：damage=2.5/5/7.5/10；application_damage=5/10/15/20；stacks_per_cast=2
- 数据来源对照：Dotabuff 每次叠加伤害 2.5/5/7.5/10，施加时伤害 5/10/15/20。
- 人工判断：正确不计固定爆发；需要层数和触发次数。
- 问题记录：
  - 后续计算器支持 napalm_stack_count、damage_instance_count。
- 修正建议：
  - 后续计算器支持 napalm_stack_count、damage_instance_count。

### Flamebreak
- 中文名：烈焰破击
- 当前模型：implemented / instant_fixed + sustained_dps
- 字段对照：damage_impact=25/50/75/100；damage_per_second=25/30/35/40；damage_duration=2/3/4/5
- 数据来源对照：Dotabuff 冲击伤害、每秒伤害、持续时间一致。
- 人工判断：正确，已拆分命中和燃烧。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

### Firefly
- 中文名：火焰飞行
- 当前模型：implemented / sustained_dps
- 字段对照：本地 damage_per_second=25/50/75/100；Dotabuff 显示 20/40/60/80
- 数据来源对照：存在版本差异。
- 人工判断：结构正确，但数值需要确认以本地 patch 为准还是 Dotabuff 快照为准。
- 问题记录：
  - 标记版本差异。
- 修正建议：
  - 标记版本差异。

### Smoldering Resin
- 中文名：闷烧树脂
- 当前模型：reference_only / state_scaling
- 字段对照：tick_attack_damage_pct=20；total_ticks=2
- 数据来源对照：Dotabuff comparison 未抽到字段，本地有百分比字段。
- 人工判断：正确不计固定爆发。
- 问题记录：
  - 后续需要 attack_damage 和 tick_count。
- 修正建议：
  - 后续需要 attack_damage 和 tick_count。

### Flaming Lasso
- 中文名：燃烧枷锁
- 当前模型：implemented / instant_fixed
- 字段对照：本地 damage=200/350/500；Dotabuff 总伤害 125/250/375
- 数据来源对照：存在版本差异。
- 人工判断：如果以本地 provider 为准，当前模型可用；若以 Dotabuff 快照为准则需改数值源。
- 问题记录：
  - 标记版本差异，暂不改模型。
- 修正建议：
  - 标记版本差异，暂不改模型。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
