# 编织者（Weaver）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：蚂蚁

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：4

## 复核结论
- 总体判断：`Shukuchi` 正确，`The Swarm` 和 `Geminate Attack` 需要按攻击次数处理。
- 是否存在误计入固定爆发：存在风险。`The Swarm` 当前 instant 会把甲虫攻击力当施法瞬时伤害。
- 是否缺少关键输入：甲虫攻击次数、连击攻击次数、目标护甲降低层数。
- 是否需要修改模型：需要。

## 技能复核

### Threads of Fate
- 中文名：命运之线
- 当前模型：reference_only
- 本地 rawAttributes：`damage_per_thread_hero=10%`
- 人工判断：来源伤害百分比修正，不是独立伤害。
- 修正建议：source_damage_percent。

### The Swarm
- 中文名：虫群
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=18/23/28/33`、`attack_rate`、`armor_reduction=1`
- 人工判断：当前模型错误。甲虫是持续攻击召唤物/附着物。
- 修正建议：summon_dot_attack，输入 `beetle_attack_count`。

### Shukuchi
- 中文名：缩地
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=100/130/160/190`
- 人工判断：正确。持续时间和移动速度不是伤害。

### Geminate Attack
- 中文名：连击
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=20/35/50/65`、`extra_attack=1`
- 人工判断：当前漏算额外攻击。
- 修正建议：extra_attack modifier。

### Time Lapse
- 中文名：时光倒流
- 当前模型：reference_only
- 人工判断：强驱散/回溯，不直接造成伤害。
