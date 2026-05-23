# 影魔（Shadow Fiend）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：SF、影魔

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：2

## 复核结论
- 总体判断：当前模型基础方向可用，但影压连中增伤、每魂额外伤害和大招多魂线都还需要输入。
- 是否存在误计入固定爆发：未发现明显误计入，但 `Requiem of Souls` 只算单线会低估。
- 是否缺少关键输入：当前魂数、影压连中次数、大招命中魂线数、是否应用减甲/魔抗降低。
- 是否需要修改模型：需要扩展多段和状态修正。

## 技能复核

### Necromastery
- 中文名：支配死灵
- 当前模型：reference_only
- 本地 rawAttributes：`necromastery_damage_per_soul=1.35`、`necromastery_max_souls=20`
- Dotabuff 对照：每个灵魂提供攻击力。
- 是否计入固定爆发：否，作为普攻/技能修正。
- 需要输入：`current_soul_count`
- 人工判断：正确不作为直接伤害，但应修正攻击伤害和影压每魂额外伤害。
- 问题记录：
  - 魂数是 SF 所有输出判断的关键输入。
- 修正建议：
  - 统一接入 soul_count。

### Shadowraze
- 中文名：毁灭阴影
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`shadowraze_damage=85/150/215/280`、`stack_bonus_damage=35/50/65/80`、`damage_per_soul=3`
- Dotabuff 对照：三段不同距离影压，连中叠加额外伤害，每个灵魂有额外伤害。
- 是否计入固定爆发：是
- 需要输入：`raze_stack_count`、`current_soul_count`
- 人工判断：基础伤害正确，但当前未计算连中和魂数加成。
- 问题记录：
  - 三连压斩杀线会被明显低估。
- 修正建议：
  - 增加 `base + stack_bonus * previous_hits + soul_count * damage_per_soul`。

### Feast of Souls
- 中文名：灵魂盛宴
- 当前模型：reference_only
- Dotabuff 对照：攻速/移速增益，不直接造成技能伤害。
- 是否计入固定爆发：否
- 需要输入：`attack_count`
- 人工判断：正确。
- 问题记录：
  - 影响普攻窗口，但不是独立伤害。
- 修正建议：
  - 后续进入 buff/attack window。

### Presence of the Dark Lord
- 中文名：魔王降临
- 当前模型：reference_only
- 本地 rawAttributes：`presence_armor_reduction=-3/-4/-5/-6`
- Dotabuff 对照：降低护甲；Dotabuff 显示 2.5/4/5.5/7 与本地存在版本差异。
- 是否计入固定爆发：否，作为物理伤害修正。
- 需要输入：`target_in_aura`
- 人工判断：正确不作为伤害，但应接入物理减免计算。
- 问题记录：
  - 本地和 Dotabuff 数值不一致。
- 修正建议：
  - 以本地为计算源，记录版本差异。

### Requiem of Souls
- 中文名：魂之挽歌
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：damage 数组 `80/120/160`、`max_soul_release=20`、`requiem_reduction_mres=-5%/-10%/-15%`
- Dotabuff 对照：多道魂线魔法伤害，并降低魔抗/移速、恐惧。
- 是否计入固定爆发：有条件计入
- 需要输入：`line_hit_count`、`current_soul_count`
- 人工判断：当前按单条魂线计算是保守正确，但不能代表总伤害。
- 问题记录：
  - 近身大招可能多线命中，伤害与魂线数量强相关。
- 修正建议：
  - 改为 multi_line，公式为 `单线伤害 * 命中魂线数`，魔抗降低作为后续伤害修正。
