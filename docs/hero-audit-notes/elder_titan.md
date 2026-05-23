# 上古巨神（Elder Titan）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：大牛、et

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：2
- 忽略项：3
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：未发现明显误计入，但 `Earth Splitter` 被 reference_only 导致核心伤害缺失。
- 是否缺少关键输入：`Earth Splitter` 需要目标最大生命；`Astral Spirit` 后续攻击力加成需要命中单位数。
- 是否需要修改模型：需要补大招百分比生命伤害，并记录 Echo Stomp 本地/Dotabuff 数值差异。

## 技能复核

### Echo Stomp
- 中文名：回音重踏
- 当前模型：implemented / instant_fixed
- 字段对照：本地 `stomp_damage: 60/100/140/180`；Dotabuff 践踏伤害 65/110/155/200，物理。
- 是否计入固定爆发：是
- 人工判断：模型类型正确，但数值和 Dotabuff 不一致。
- 问题记录：存在版本差异，需要确认当前项目数据版本。

### Astral Spirit
- 中文名：灵体游魂
- 当前模型：implemented / instant_fixed
- 字段对照：`pass_damage: 50`；Dotabuff 伤害 50，魔法。
- 是否计入固定爆发：是，按灵体穿过一次目标
- 需要输入：后续攻击力/移速增益需要命中英雄/非英雄数量
- 人工判断：穿过目标伤害正确；灵体回归后的攻击力加成尚未进入普攻模型。

### Natural Order
- 中文名：自然秩序
- 当前模型：reference_only / debuff_reference
- 字段对照：`armor_reduction_pct: 40%/60%/80%/100%`、`magic_resistance_pct: 40%/60%/80%/100%`
- 是否计入固定爆发：否
- 人工判断：正确。它是护甲/魔抗修正，不是直接伤害。
- 修正建议：纳入 armor/resistance modifier 层。

### Earth Splitter
- 中文名：裂地沟壑
- 当前模型：reference_only / debuff_reference
- 字段对照：`damage_pct: 34%/42%/50%`；Dotabuff 最大生命值伤害 34%/42%/50%，魔法。
- 是否计入固定爆发：应作为条件伤害
- 需要输入：`target_max_health`
- 人工判断：当前模型遗漏核心伤害。大招是百分比最大生命伤害，不应只作为施法距离参考。
- 修正建议：改为 percent_max_health 模型，按目标最大生命计算。

### Momentum / Move / Return Astral Spirit
- 中文名：动量/移动灵体/返回灵体
- 当前模型：ignored
- 字段对照：动量提供移速转护甲；移动/返回为控制子技能。
- 是否计入固定爆发：否
- 人工判断：正确，不直接造成伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记护甲/魔抗修正字段。
- [ ] 修正 `Earth Splitter` 百分比生命伤害；确认 `Echo Stomp` 数值版本。
