# 巫医（Witch Doctor）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：巫医

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：6
- 持续伤害项：2
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型方向较好，但 `Maledict`、`Death Ward` 和药剂弹跳都需要更精确输入。
- 是否存在误计入固定爆发：未发现严重误计入。
- 是否缺少关键输入：药剂弹跳次数、目标失血量、死亡守卫攻击次数/攻速、Switcheroo 持续时间。
- 是否需要修改模型：需要增强。

## 技能复核

### Paralyzing Cask
- 中文名：麻痹药剂
- 当前模型：implemented / multi_wave
- 本地 rawAttributes：`base_damage=55/70/85/100`、`bounces=3/4/5/6`、`bounce_bonus_damage=20`
- 人工判断：方向正确，但每跳递增伤害需要显式公式。
- 修正建议：multi_bounce ramping damage。

### Voodoo Restoration
- 中文名：巫毒疗法
- 当前模型：reference_only
- 本地 rawAttributes：`does_damage=0`
- 人工判断：治疗，不伤害。

### Maledict
- 中文名：巫蛊咒术
- 当前模型：implemented / sustained_dps
- 本地 raw damage：18/22/26/30，`bonus_damage=16%/24%/32%/40%`
- 人工判断：基础持续伤害方向正确，但核心爆发来自失血百分比。
- 修正建议：输入 `health_lost_since_cast`，计算爆发伤害。

### Voodoo Switcheroo
- 中文名：巫毒变身术
- 当前模型：reference_only
- 人工判断：短时间死亡守卫形态，伤害复用 Death Ward。

### Gris-Gris
- 中文名：驱邪护符
- 当前模型：ignored
- 人工判断：经济机制，不伤害。

### Death Ward
- 中文名：死亡守卫
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage=60/90/120`、`abilitychanneltime=8`
- 人工判断：应按守卫攻击次数计算，持续 DPS 是近似。
- 修正建议：summon_attack，输入 `ward_attack_count`。
