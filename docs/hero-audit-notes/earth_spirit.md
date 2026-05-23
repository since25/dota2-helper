# 大地之灵（Earth Spirit）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：土猫

## 模型概览
- 技能条目数：6
- 已实现伤害：5
- 参考项：1
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：基本可用，但 `Stone Remnant` 不应被理解为普通伤害系数。
- 是否存在误计入固定爆发：未发现明显固定爆发误计入。
- 是否缺少关键输入：`Magnetize` 需要实际作用时间/残岩刷新；`Stone Remnant` 的特殊攻击伤害字段需要确认用途。
- 是否需要修改模型：核心三小技能和魔晶伤害可用；磁化需要补残岩刷新逻辑。

## 技能复核

### Boulder Smash
- 中文名：巨石冲击
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: rock_damage`
- 本地 rawAttributes：`rock_damage: 110/180/250/320`、`duration: 1.75/2.5/3.25/4`
- Dotabuff 对照：伤害 110/180/250/320，伤害类型为魔法。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。减速和击退距离不计入伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Rolling Boulder
- 中文名：巨石翻滚
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage: 60/70/80/90`、`stun_duration: 0.3/0.5/0.7/0.9`、`rock_bonus_duration: 0.3/0.5/0.7/0.9`
- Dotabuff 对照：伤害 60/70/80/90，经过残岩有额外眩晕。
- 是否计入固定爆发：是
- 需要输入：无；控制时长可选 `used_stone`
- 人工判断：伤害字段正确。是否经过残岩主要影响距离和眩晕，不影响当前基础伤害字段。
- 问题记录：
  - 无。
- 修正建议：
  - 后续控制窗口可加入残岩加成。

### Geomagnetic Grip
- 中文名：地磁之握
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: rock_damage`
- 本地 rawAttributes：`rock_damage: 75/150/225/300`、`duration: 2.3/2.7/3.1/3.5`
- Dotabuff 对照：残岩伤害 75/150/225/300，伤害类型为魔法。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。拉扯速度和沉默持续时间不计入伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Stone Remnant
- 中文名：残岩
- 当前模型：reference_only / state_scaling
- 当前字段：`valueKey: attack_damage_per_stone`
- 本地 rawAttributes：`abilitycharges: 7`、`duration: 60`、`attack_damage_per_stone: 2.5`、`attack_damage_per_stone_used: 7.5`
- Dotabuff 对照：持续时间 60，能量点数 7。
- 是否计入固定爆发：否
- 需要输入：`stack_count`，但当前用途待确认
- 人工判断：作为伤害模型参考较可疑。残岩本体通常是其他技能的媒介，不应直接产生爆发伤害。
- 问题记录：
  - `attack_damage_per_stone` 可能是特殊命石/先天或内部字段，不能直接当技能伤害。
- 修正建议：
  - 暂保留 reference_only，不进入总伤害；后续确认字段来源。

### Enchant Remnant
- 中文名：残岩魔咒
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage: 450`、`duration: 2.4`、`aoe: 450`
- Dotabuff 对照：碎裂伤害 450，残岩持续时间 2.4。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。魔晶技能的碎裂伤害可以作为瞬时魔法伤害。
- 问题记录：
  - 该技能来源可能依赖魔晶/升级，前端应标出条件。
- 修正建议：
  - 后续在技能可用性中标记魔晶条件。

### Magnetize
- 中文名：磁化
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_per_second`；`durationKey: damage_duration`
- 本地 rawAttributes：`damage_per_second: 45/90/135`、`damage_duration: 6`、`rock_search_radius: 600`、`damage_interval: 1`
- Dotabuff 对照：每秒伤害 45/90/135，磁化持续时间 6，残岩刷新/爆炸作用范围 600。
- 是否计入固定爆发：否
- 需要输入：`active_duration`、`stone_refresh_count`
- 人工判断：基础持续伤害正确，但完整模型还要考虑残岩刷新和传播。
- 问题记录：
  - 当前只计算初始 6 秒，不处理刷新链。
- 修正建议：
  - 支持作用时间输入；高级模式再加残岩刷新次数。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 后续确认 `Stone Remnant` 特殊字段来源，并扩展磁化刷新模型。
