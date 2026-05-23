# 维萨吉（Visage）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：死灵龙

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：3

## 复核结论
- 总体判断：`Soul Assumption` 和佣兽输出需要状态输入；`Gravekeeper's Cloak` 目前被误作伤害。
- 是否存在误计入固定爆发：存在。`minimum_damage=40` 是斗篷触发阈值，不是对敌伤害。
- 是否缺少关键输入：灵魂层数、佣兽攻击次数、石像形态命中次数。
- 是否需要修改模型：需要。

## 技能复核

### Grave Chill
- 中文名：黄泉颤抖
- 当前模型：reference_only
- 人工判断：移速/攻速吸取，不直接伤害。

### Soul Assumption
- 中文名：灵魂超度
- 当前模型：reference_only / stack_scaling
- 本地 rawAttributes：`soul_base_damage=20`、`soul_charge_damage=70`、`stack_limit=3/4/5/6`
- 人工判断：应可计算，公式为基础伤害 + 层数伤害。
- 修正建议：输入 `soul_stack_count`。

### Gravekeeper's Cloak
- 中文名：陵卫斗篷
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`minimum_damage=40`
- 人工判断：当前模型错误。最低触发伤害是防御阈值，不是对敌伤害。
- 修正建议：改为 defensive reference。

### Stone Form
- 中文名：石像形态
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`stun_damage=60/100/140`
- 人工判断：正确，但多个佣兽可各自落地，需要 `familiar_count_hit`。

### Silent as the Grave / Summon Familiars
- 中文名：静如古墓 / 召唤佣兽
- 当前模型：ignored / attack_modifier
- 人工判断：静如古墓伤害加成是修正；佣兽攻击力需要攻击次数。
- 修正建议：summon_attack + buff modifier。
