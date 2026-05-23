# 冥魂大帝（Wraith King）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：骷髅王

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：4
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：6
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：`Wraithfire Blast` 当前漏初始伤害，骷髅和暴击需要攻击次数。
- 是否存在误计入固定爆发：存在。只用 DOT 会低估；骷髅不能按叠层固定伤害。
- 是否缺少关键输入：骷髅数量/攻击次数、暴击是否触发、攻击伤害。
- 是否需要修改模型：需要。

## 技能复核

### Wraithfire Blast
- 中文名：冥火爆击
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage=80/100/120/140`、`blast_dot_damage=20/40/60/80`、`blast_dot_duration=2`
- 人工判断：当前只算持续伤害不完整，应加初始伤害。
- 修正建议：initial + dot。

### Bone Guard
- 中文名：白骨护卫
- 当前模型：reference_only / stack_scaling
- 本地 rawAttributes：`skeleton_damage_tooltip=34/39/43/49`、`max_skeleton_charges=2/4/6/8`
- 人工判断：召唤骷髅攻击，不是叠层直接伤害。
- 修正建议：summon_attack，输入 `skeleton_count` 和 `attack_count`。

### Mortal Strike
- 中文名：本命一击
- 当前模型：reference_only
- 本地 rawAttributes：`crit_mult=160%/200%/240%/280%`
- 人工判断：暴击修正，需攻击伤害和触发模式。
- 修正建议：crit modifier。

### Vampiric Spirit / Reincarnation
- 中文名：吸血灵魂 / 绝冥再生
- 当前模型：reference_only
- 人工判断：吸血、攻速、复活减速、骷髅生成都不是直接固定伤害。
- 修正建议：进入召唤/攻击窗口/控制参考。
