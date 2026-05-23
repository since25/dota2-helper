# 暗影恶魔（Shadow Demon）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：毒狗、SD

## 模型概览
- 技能条目数：7
- 已实现伤害：3
- 参考项：2
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型有多处语义错误，`Disruption` 和 `Demonic Cleanse` 不应作为固定对敌伤害。
- 是否存在误计入固定爆发：存在。`Disruption` 生成幻象，不是直接伤害；`Demonic Cleanse` 是治疗/净愈，不是伤害。
- 是否缺少关键输入：暗影毒层数、释放时机、散播承伤来源、幻象攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Menace
- 中文名：威胁
- 当前模型：ignored
- 本地 rawAttributes：`stack=1.9%`
- Dotabuff 对照：伤害加深。
- 是否计入固定爆发：否，作为承伤修正。
- 需要输入：`stack_count`
- 人工判断：当前忽略可以接受，但后续应进入 damage amplification。
- 问题记录：
  - 不应提取成独立伤害。
- 修正建议：
  - 后续 modifier 层处理。

### Disruption
- 中文名：崩裂禁锢
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`illusion_flat_damage=20/35/50/65`、`illusion_outgoing_tooltip=20%/30%/40%/50%`
- Dotabuff 对照：禁锢后生成幻象，幻象继承攻击力并有额外基础攻击力。
- 是否计入固定爆发：否，除非计算幻象普攻。
- 需要输入：`illusion_attack_count`、`target_attack_damage`
- 人工判断：当前模型错误。`illusion_flat_damage` 是幻象攻击力相关，不是施法瞬时伤害。
- 问题记录：
  - 会产生不存在的直接伤害。
- 修正建议：
  - 改为 illusion summon/attack 模型。

### Disseminate
- 中文名：散播
- 当前模型：reference_only
- 本地 rawAttributes：`damage_reflection_pct=16%/24%/32%/40%`
- Dotabuff 对照：目标受到伤害时共享一定比例给周围单位。
- 是否计入固定爆发：有条件计入
- 需要输入：`source_damage_taken`
- 人工判断：不能作为独立固定伤害，应按外部伤害源计算。
- 问题记录：
  - 缺外部伤害输入。
- 修正建议：
  - 建为 damage_share modifier。

### Shadow Poison
- 中文名：暗影剧毒
- 当前模型：reference_only / state_scaling
- 本地 rawAttributes：`stack_damage=24/36/48/60`、`max_multiply_stacks=5`、`hit_damage=24/36/48/60`
- Dotabuff 对照：命中造成直接伤害，叠层释放造成递增伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`stack_count`、`release`
- 人工判断：当前只作为参考不够。该技能需要命中伤害 + 释放叠层模型。
- 问题记录：
  - `Shadow Poison Release` 本身无字段，但释放伤害依赖 Shadow Poison 层数。
- 修正建议：
  - 建立 stack release 模型，释放技能作为触发器。

### Demonic Cleanse
- 中文名：邪恶净愈
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`purge_damage=450`
- Dotabuff 对照：净愈治疗 450，不是对敌伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前模型错误。
- 问题记录：
  - `purge_damage` 在 Cleanse 上语义是治疗/净愈，不应对敌计伤害。
- 修正建议：
  - 改为 healing/reference。

### Demonic Purge
- 中文名：邪恶净化
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`purge_damage=300/450/600`、`abilityduration=5`
- Dotabuff 对照：魔法伤害并强减速/驱散。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 持续时间是减速持续时间，不是伤害持续时间。
- 修正建议：
  - 保持 instant，duration 只作为 debuff。
