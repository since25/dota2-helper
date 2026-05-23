# 电炎绝手（Snapfire）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：奶奶

## 模型概览
- 技能条目数：7
- 已实现伤害：4
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：6
- 持续伤害项：2
- 多波伤害项：2
- 普攻相关项：2

## 复核结论
- 总体判断：当前模型覆盖较多，但 `Scatterblast`、`Lil' Shredder`、`Mortimer Kisses` 还需要距离、攻击次数和命中火团数。
- 是否存在误计入固定爆发：存在风险。`Mortimer Kisses` 不能只按烧灼 DPS，火团命中伤害也很关键。
- 是否缺少关键输入：距离、命中火团数、烧灼作用时间、攻击次数、护甲降低层数。
- 是否需要修改模型：需要。

## 技能复核

### Boomstick
- 中文名：猎枪
- 当前模型：reference_only
- 本地 rawAttributes：`damage_amp_max=35%`
- Dotabuff 对照：距离越近伤害增强越高。
- 是否计入固定爆发：否，作为距离伤害修正。
- 需要输入：`distance`
- 人工判断：正确不作为独立伤害。
- 问题记录：
  - 这是 Scatterblast 的修正，不是独立伤害。
- 修正建议：
  - 接入 distance amp。

### Scatterblast
- 中文名：电光石火
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=100/160/220/280`、`point_blank_dmg_bonus_pct=30`
- Dotabuff 对照：瞬时魔法伤害，近距离增强。
- 是否计入固定爆发：是
- 需要输入：`distance`
- 人工判断：基础伤害正确，但近距离 30% 加成未体现。
- 问题记录：
  - 斩杀线会低估贴脸伤害。
- 修正建议：
  - 加入 point_blank bonus。

### Firesnap Cookie
- 中文名：龙炎饼干
- 当前模型：reference_only / distance_scaling
- 本地 rawAttributes：`impact_damage=75/150/225/300`
- Dotabuff 对照：落地撞击造成魔法伤害和眩晕。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：当前 distance_scaling 语义错误。伤害是固定撞击伤害，不按距离缩放。
- 问题记录：
  - 会导致可计算技能被降级为参考项。
- 修正建议：
  - 改为 `instant_fixed`。

### Lil' Shredder
- 中文名：霹雳铁手
- 当前模型：implemented / attack_modifier
- 本地 rawAttributes：`damage=20/35/50/65`、`buffed_attacks=5`、`damage_pct=35%`、`armor_reduction_per_attack=0.5`
- Dotabuff 对照：多次攻击，每次有基础伤害/攻击伤害系数，并逐次减甲。
- 是否计入固定爆发：有条件计入
- 需要输入：`attack_count`、`hero_attack_damage`
- 人工判断：方向正确但要明确每次攻击公式和减甲叠加。
- 问题记录：
  - 单纯 bonusDamageKey 不足以表达 5 次攻击和减甲。
- 修正建议：
  - multi_attack + armor shred。

### Spit Out
- 中文名：喷吐
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`impact_radius=400`、`burn_damage=100`、`burn_ground_duration=3`
- Dotabuff 对照：落点冲击/眩晕后留下燃烧区域。
- 是否计入固定爆发：按作用时间计入
- 需要输入：`active_duration`
- 人工判断：只算烧灼不完整，需要确认是否有冲击伤害字段。
- 问题记录：
  - 当前 raw 未见独立 impact damage，不能杜撰。
- 修正建议：
  - 保留 burn DPS，标注命中冲击只提供控制。

### Mortimer Kisses
- 中文名：蜥蜴绝吻
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`projectile_count=8`、`damage_per_impact=180/270/360`、`burn_damage=60/80/100`、`burn_ground_duration=3.5`
- Dotabuff 对照：每个火团命中伤害 + 地面烧灼持续伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`projectile_hit_count`、`burn_active_duration`
- 人工判断：当前只按烧灼 DPS 会漏掉火团命中伤害。
- 问题记录：
  - 大招主要爆发来自命中火团。
- 修正建议：
  - 拆成 impact multi_hit + burn dot。
