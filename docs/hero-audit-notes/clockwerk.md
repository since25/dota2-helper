# 发条技师（Clockwerk）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：8
- 已实现伤害：2
- 参考项：4
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：Rocket Flare/Hookshot 正确，Battery Assault/Power Cogs 需要更精确的多次触发模型。
- 是否存在误计入固定爆发：未发现；但 Power Cogs 被标成 mana_burn 语义不完整。
- 是否缺少关键输入：Battery Assault 需要命中次数；Power Cogs 需要齿轮触发次数、伤害和烧蓝分开；Overclocking 会修改多个技能。
- 是否需要修改模型：需要。Power Cogs 应拆 damage 和 mana_burn；Battery Assault 用 hit_count。

## 技能复核

### Battery Assault
- 中文名：弹幕冲击
- 当前模型：reference_only / state_scaling
- 字段对照：damage=20/45/70/95；duration=10.5；interval=0.7。
- 人工判断：方向正确，但 requiredInputs 应是 hit_count/active_duration，而不是 generic stack_count。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Power Cogs
- 中文名：能量齿轮
- 当前模型：reference_only / state_scaling
- 字段对照：damage=50/125/200/275；mana_burn=35/75/115/155；mana_burn_as_damage_pct=50。
- 人工判断：应拆成固定触发伤害和魔法损失，不应只用 damage.mana_burn。
- 问题记录：
  - 应拆成固定触发伤害和魔法损失，不应只用 damage.mana_burn。
- 修正建议：
  - 应拆成固定触发伤害和魔法损失，不应只用 damage.mana_burn。

### Rocket Flare
- 中文名：照明火箭
- 当前模型：implemented / instant_fixed
- 字段对照：damage=80/120/160/200；radius=600。
- 人工判断：正确，可计入固定魔法伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Overclocking
- 中文名：超速运转
- 当前模型：reference_only / debuff_reference
- 字段对照：rocket_flare_damage_pct=35%；rocket_flare_rockets=2；hookshot bonus 等。
- 人工判断：它会增强多个技能，当前 attack_speed reference 不准确。
- 问题记录：
  - 它会增强多个技能，当前 attack_speed reference 不准确。
- 修正建议：
  - 它会增强多个技能，当前 attack_speed reference 不准确。

### Jetpack
- 中文名：喷气背包
- 当前模型：ignored
- 字段对照：bonus_speed=20%；duration=6。
- 人工判断：机动，不直接伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Hookshot
- 中文名：发射钩爪
- 当前模型：implemented / instant_fixed
- 字段对照：damage=75/175/275；duration=1.2/1.4/1.6。
- 人工判断：正确，可计入固定伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Armor Power
- 中文名：装甲力量
- 当前模型：reference_only / state_scaling
- 字段对照：damage_per_armor=0.25。
- 人工判断：依赖护甲/装备输入，作为 state_scaling 合理。
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
