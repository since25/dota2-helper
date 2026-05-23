# 复仇之魂（Vengeful Spirit）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：VS

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：当前模型整体较好，主要缺口是光环/减甲对后续物理伤害的联动。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：Wave 减甲是否作用于后续攻击、光环是否作用、攻击次数。
- 是否需要修改模型：小幅增强。

## 技能复核

### Magic Missile
- 中文名：魔法箭
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`magic_missile_damage=85/170/255/340`
- 人工判断：正确。

### Wave of Terror
- 中文名：恐怖波动
- 当前模型：implemented / instant_fixed + armor reduction reference
- 本地 rawAttributes：`damage=60/80/100/120`、`armor_reduction=-3/-4/-5/-6`
- 人工判断：伤害正确，减甲应作为后续物理修正。

### Vengeance Aura / Retribution
- 中文名：复仇光环 / 恶有恶报
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_base_damage=10%/15%/20%/25%`、`bonus_damage=20`
- 人工判断：不直接造成伤害，但会修正普攻/队友伤害。
- 修正建议：进入 attack damage modifier。

### Nether Swap
- 中文名：移形换位
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=150/300/450`
- 人工判断：正确；护盾持续时间不是伤害持续时间。
