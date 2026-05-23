# 冥界亚龙（Viper）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：毒龙

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：1
- 忽略项：0
- 暂不支持项：1
- 需要状态输入项：6
- 持续伤害项：4
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：持续伤害方向正确，但多层、成长曲线和 Predator 缺失会影响精度。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：毒性攻击层数、幽冥剧毒停留时间、腐蚀皮肤触发来源、目标当前生命/最大生命。
- 是否需要修改模型：需要。

## 技能复核

### Predator
- 中文名：掠食
- 当前模型：缺失
- Dotabuff 对照：伤害 0.25，语义需要确认。
- 人工判断：缺模型，不能贸然计入。

### Poison Attack
- 中文名：毒性攻击
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage=4/8/12/16`、`max_stacks=6`
- 人工判断：单层 DOT 正确，但应支持多层叠加和攻击次数。
- 修正建议：stacked_dot。

### Nethertoxin
- 中文名：幽冥剧毒
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`min_damage`、`max_damage`、`max_duration=4`
- 人工判断：当前用 max_damage 是理论上限，会高估刚进入区域的伤害。
- 修正建议：按停留时间从 min 到 max 成长。

### Corrosive Skin / Nosedive
- 中文名：腐蚀皮肤 / 极恶俯冲
- 当前模型：implemented / reference_only
- 人工判断：腐蚀皮肤是被攻击/受法术触发的持续伤害；Nosedive 施加关联效果，避免重复计伤害。
- 修正建议：Corrosive Skin 需要触发次数或作用时间；Nosedive 只作为施加器。

### Viper Strike
- 中文名：蝮蛇突袭
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage=70/110/150`、`duration=6`
- 人工判断：正确，按作用时间计算。
