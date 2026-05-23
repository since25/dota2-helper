# 混沌骑士（Chaos Knight）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：4
- 已实现伤害：1
- 参考项：1
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：Chaos Bolt 只用最低伤害会低估；Chaos Strike/Phantasm 尚未建模。
- 是否存在误计入固定爆发：未发现高估；Chaos Bolt 反而低估。
- 是否缺少关键输入：Chaos Bolt 需要随机/期望伤害模式；Chaos Strike 需要攻击次数和暴击概率；Phantasm 需要幻象攻击次数/持续时间。
- 是否需要修改模型：需要。补 random_range、crit、illusion 输出模型。

## 技能复核

### Chaos Bolt
- 中文名：混乱之箭
- 当前模型：implemented / instant_fixed
- 字段对照：damage_min=90/120/150/180；damage_max=155/240/325/410。
- 人工判断：当前只取最低伤害，会低估；应提供 min/max/expected 三种模式。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Reality Rift
- 中文名：实相裂隙
- 当前模型：reference_only / debuff_reference
- 字段对照：armor_reduction=4/5/6/7；pull_distance=300/350/400/450。
- 人工判断：不直接伤害，但护甲降低影响后续物理输出；当前只记录施法距离不够。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Chaos Strike
- 中文名：混沌一击
- 当前模型：ignored
- 字段对照：chance=33.33%；crit_min=120%；crit_max=140/180/220/260%；lifesteal。
- 人工判断：应作为 crit attack modifier，而不是 ignored。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Phantasm
- 中文名：混沌之军
- 当前模型：ignored
- 字段对照：images_count=1/2/3；illusion_duration=30；outgoing_damage_tooltip=100%。
- 人工判断：幻象输出是核心，需要 illusion_count、illusion_attack_count、duration。
- 问题记录：
  - 幻象输出是核心，需要 illusion_count、illusion_attack_count、duration。
- 修正建议：
  - 幻象输出是核心，需要 illusion_count、illusion_attack_count、duration。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
