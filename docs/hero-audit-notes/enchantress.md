# 魅惑魔女（Enchantress）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小鹿

## 模型概览
- 技能条目数：7
- 已实现伤害：1
- 参考项：3
- 忽略项：3
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Enchant` 的 `enchant_damage` 是被魅惑单位攻击力加成，不应作为瞬时伤害。
- 是否缺少关键输入：`Impetus` 需要攻击距离和攻击次数；`Little Friends` 需要友方/单位攻击模型。
- 是否需要修改模型：需要，尤其是推进和魅惑的语义。

## 技能复核

### Impetus
- 中文名：推进
- 当前模型：reference_only / state_scaling
- 字段对照：`distance_damage_pct: 5%/10%/15%/20%`、`distance_cap: 1750`；Dotabuff 距离伤害加成一致，纯粹。
- 是否计入固定爆发：应作为条件普攻伤害
- 需要输入：`distance`、`attack_count`
- 人工判断：当前 `illusion_damage_multiplier` 字段选择不对。推进按距离产生额外纯粹伤害，不是来源伤害百分比。
- 修正建议：改为 distance_scaling attack_modifier。

### Enchant
- 中文名：魅惑
- 当前模型：implemented / instant_fixed
- 字段对照：`enchant_damage: 0/20/40/60`、`enchant_health: 150/250/350/450`、`slow_duration: 3.5/4/4.5/5`
- 是否计入固定爆发：否
- 人工判断：当前模型错误。`enchant_damage` 是被控制单位的攻击力加成，不是对敌瞬时伤害。
- 修正建议：改为 summon/controlled_unit modifier 或 reference_only。

### Nature's Attendants
- 中文名：自然之助
- 当前模型：ignored
- 字段对照：`heal: 4/8/12/16`、`heal_duration: 7/9/11/13`
- 是否计入固定爆发：否
- 人工判断：正确。治疗技能，不造成伤害。

### Sproink
- 中文名：跃动
- 当前模型：ignored
- 字段对照：`attack_targets: 2`、`bonus_attack_range: 100`
- 是否计入固定爆发：否
- 需要输入：攻击力和目标数
- 人工判断：不直接造成伤害，但会触发攻击/推进，后续可作为攻击动作模型。

### Little Friends
- 中文名：密友
- 当前模型：reference_only / debuff_reference
- 字段对照：`bonus_attack_speed: 70`、`root_base_duration: 2`、`root_per_target: 0.5`
- 是否计入固定爆发：否
- 人工判断：本身不直接伤害，但会让单位攻击目标，完整输出依赖周围单位攻击。

### Untouchable / Rabble-Rouser
- 中文名：不可侵犯 / 煽动野怪
- 当前模型：reference_only / ignored
- 字段对照：不可侵犯降低攻速 110/160/210；煽动野怪无直接字段。
- 是否计入固定爆发：否
- 人工判断：正确，不进入直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记治疗、攻速、控制类字段。
- [ ] 修正 `Impetus` 距离伤害与 `Enchant` 攻击力加成语义。
