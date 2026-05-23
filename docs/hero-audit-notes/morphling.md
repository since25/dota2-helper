# 变体精灵（Morphling）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：水人

## 模型概览
- 技能条目数：7
- 已实现伤害：1
- 参考项：3
- 忽略项：3
- 需要状态输入项：4
- 普攻相关项：2

## 复核结论
- 总体判断：基本可用，但 Adaptive Strike 需要属性输入。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：敏捷/力量比例、属性变换状态、复制目标技能。
- 是否需要修改模型：建议补 Adaptive Strike 属性公式和属性变换对攻击力/血量的影响。

## 技能复核
- `Waveform`：本地 damage 数组 75/150/225/300，瞬时魔法伤害正确。
- `Adaptive Strike`：`damage_base: 50/70/90/110`，最低/最高敏捷系数 0.5 到 1/1.5/2/2.5，需要当前敏捷和属性比例。
- `Ebb and Flow`：敏捷转攻击距离/移速，力量转施法距离/减速抗性，不直接伤害。
- `Attribute Shift`：属性转换改变攻击力和生命，不直接技能伤害。
- `Morph/Morph Replicate`：复制/变形技能，不直接造成固定伤害；复制技能另行处理。

## 待办
- [x] 完成字段语义复核。
- [x] 标记属性依赖。
- [ ] 实现 Adaptive Strike 属性缩放和 Attribute Shift 状态修正。
