# 森海飞霞（Hoodwink）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：松鼠

## 模型概览
- 技能条目数：7
- 已实现伤害：3
- 参考项：3
- 忽略项：1
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：部分可用，但 `Acorn Shot` 和 `Sharpshooter` 需要更细模型。
- 是否存在误计入固定爆发：`Acorn Shot` 只计额外伤害会漏基础攻击力百分比；`Sharpshooter` 作为距离缩放不如蓄力缩放准确。
- 是否缺少关键输入：爆栗需要攻击力/弹射次数；一箭穿心需要蓄力时间；诱捕/魔晶诱饵需条件。
- 是否需要修改模型：建议补爆栗普攻百分比和一箭穿心蓄力模型。

## 技能复核

### Acorn Shot
- 中文名：爆栗出击
- 当前模型：implemented / instant_fixed
- 字段对照：`acorn_shot_damage: 45/90/135/180`、`base_damage_pct: 80%`、`bounce_count: 2/3/4/5`
- 是否计入固定爆发：当前只计额外伤害，不完整
- 需要输入：`hero_attack_damage`、`hit_count`
- 人工判断：模型低估。爆栗包含基础攻击力百分比和额外伤害，并可弹射。
- 修正建议：攻击型 projectile 模型：每次命中 = 攻击力 * 80% + 额外伤害。

### Bushwhack
- 中文名：野地奇袭
- 当前模型：implemented / instant_fixed
- 字段对照：`total_damage: 90/180/270/360`、`debuff_duration: 1.5/1.7/1.9/2.1`
- 是否计入固定爆发：是
- 人工判断：正确。总伤害字段可直接使用。

### Scurry
- 中文名：密林奔走
- 当前模型：reference_only / debuff_reference
- 字段对照：移速加成 20%/25%/30%/35%，持续 3.5/4/4.5/5。
- 是否计入固定爆发：否
- 人工判断：正确。机动技能，不是伤害。

### Decoy
- 中文名：诱敌奇术
- 当前模型：reference_only / debuff_reference
- 字段对照：`sharpshooter_damage_pct: 60%`、诱饵爆炸眩晕。
- 是否计入固定爆发：否
- 需要输入：是否诱饵触发、一箭穿心等级
- 人工判断：当前不直接计入可以接受；后续应关联一箭穿心百分比伤害。

### Hunter's Boomerang
- 中文名：猎手旋镖
- 当前模型：implemented / instant_fixed
- 字段对照：`damage: 200`、`mark_duration: 7`、`spell_amp: 20%`
- 是否计入固定爆发：是
- 人工判断：伤害字段正确。标记增伤属于后续伤害修正。

### Sharpshooter
- 中文名：一箭穿心
- 当前模型：reference_only / state_scaling
- 字段对照：`max_damage: 600/975/1350`、`max_charge_time: 3`
- 是否计入固定爆发：应作为条件伤害
- 需要输入：`charge_duration`
- 人工判断：当前 distance_scaling 语义不准确。它是蓄力达到最高伤害，不是距离决定伤害。
- 修正建议：改为 charge_scaling instant 模型。

### End Sharpshooter
- 中文名：终止一箭穿心
- 当前模型：ignored
- 人工判断：正确。子技能不额外造成伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记攻击百分比、弹射和蓄力字段。
- [ ] 修正爆栗出击和一箭穿心模型；后续关联诱饵伤害百分比。
