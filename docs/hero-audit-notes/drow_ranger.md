# 卓尔游侠（Drow Ranger）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小黑、dr

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：2
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：3

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Frost Arrows` 作为 instant_fixed 不准确，它是攻击附加伤害。
- 是否缺少关键输入：`Multishot`、`Marksmanship`、`Frost Arrows` 都需要攻击伤害/命中次数/触发次数。
- 是否需要修改模型：需要。当前漏掉小黑最关键的数箭齐发和射手天赋。

## 技能复核

### Frost Arrows
- 中文名：霜冻之箭
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage: 10/15/20/25`、`frost_arrows_movement_speed: -15%/-25%/-35%/-45%`
- Dotabuff 对照：额外伤害 12/18/24/30，移速减缓 15%/25%/35%/45%。
- 是否计入固定爆发：不应作为独立施法固定爆发
- 需要输入：`attack_count`
- 人工判断：当前模型类型错误，且存在版本差异。霜冻之箭是普攻附加物理伤害。
- 问题记录：
  - 本地 10/15/20/25 与 Dotabuff 12/18/24/30 不一致。
- 修正建议：
  - 改为 attack_modifier：`damage * attack_count`，并确认版本数据。

### Gust
- 中文名：狂风
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`silence_duration: 3/4/5/6`、`knockback_distance_max: 450`
- Dotabuff 对照：沉默持续时间 3/4/5/6，最大击退距离 450。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。控制/位移技能，不造成伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 作为控制窗口参考。

### Multishot
- 中文名：数箭齐发
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`wave_count: 3`、`arrow_count_per_wave: 4`、`arrow_damage_pct: 100%/120%/140%/160%`、`abilitychanneltime: 1.75`
- Dotabuff 对照：3 波，每波 4 支箭，箭矢基础伤害加成 100%/120%/140%/160%。
- 是否计入固定爆发：应作为条件输出
- 需要输入：`hero_attack_damage`、`hit_count`
- 人工判断：当前遗漏关键输出。数箭齐发是小黑最重要的爆发/消耗来源之一。
- 问题记录：
  - 多箭命中同一目标的规则需要确认，但至少应支持命中箭数输入。
- 修正建议：
  - 建模为多 projectile：`hero_attack_damage * arrow_damage_pct * hit_count`。

### Glacier
- 中文名：冰川
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilitycastrange`
- 本地 rawAttributes：`damage_bonus: 25%`、`attack_range_bonus: 200`、`shard_duration: 8`
- Dotabuff 对照：高坡额外伤害 25%，攻击距离加成 200。
- 是否计入固定爆发：否
- 需要输入：是否站在高坡、攻击次数
- 人工判断：不应作为独立伤害，但会修正普攻/数箭齐发输出。
- 问题记录：
  - 当前 reference_only 只记录施法距离不够表达伤害增益。
- 修正建议：
  - 后续归入状态增益：`damage_bonus` 影响攻击相关伤害。

### Precision Aura
- 中文名：精准光环
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`trueshot_agi_bonus: 10%`、`radius: 1200`
- Dotabuff 对照：敏捷加成 10%。
- 是否计入固定爆发：否
- 需要输入：敏捷/攻击力换算
- 人工判断：当前忽略可以接受，但最终普攻模型应纳入敏捷加成。
- 问题记录：
  - 不是直接伤害字段。
- 修正建议：
  - 后续进入属性到攻击力换算层。

### Marksmanship
- 中文名：射手天赋
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`chance: 30%/35%/40%`、`bonus_damage: 50/70/90`
- Dotabuff 对照：概率 30%/35%/40%，额外触发伤害 50/70/90。
- 是否计入固定爆发：不应默认固定；可做期望值/指定触发
- 需要输入：`attack_count`、是否按期望值或实际触发次数
- 人工判断：当前遗漏核心输出。射手天赋应进入普攻期望伤害或触发次数模型。
- 问题记录：
  - 概率触发不能无条件计入每次攻击。
- 修正建议：
  - 支持两种模式：期望值 `chance * bonus_damage * attack_count`，或手动 `proc_count * bonus_damage`。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 修正霜冻之箭、数箭齐发、冰川、射手天赋的攻击相关模型。
