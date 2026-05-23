# 巨牙海民（Tusk）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：海民

## 模型概览
- 技能条目数：8
- 已实现伤害：3
- 参考项：4
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：3

## 复核结论
- 总体判断：瞬时技能基本可用，但 `Tag Team`、`Walrus PUNCH!`、`Snowball` 的队友加成/普攻暴击需要补。
- 是否存在误计入固定爆发：未发现明显误计入，但 `Snowball` 只算基础伤害会低估多人雪球。
- 是否缺少关键输入：雪球卷入英雄数、Tag Team 攻击次数、神拳攻击伤害。
- 是否需要修改模型：需要。

## 技能复核

### Ice Shards
- 中文名：寒冰碎片
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`shard_damage=75/150/225/300`
- 人工判断：正确。碎片持续时间不是伤害持续时间。

### Snowball
- 中文名：雪球
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`snowball_damage=80/140/200/260`、`snowball_damage_bonus=40/65/90/115`
- 人工判断：基础伤害正确，但需要 `allied_hero_count` 计算每个英雄提升伤害和眩晕。
- 修正建议：改为 `base + ally_count * bonus`。

### Tag Team
- 中文名：摔角行家
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=25/50/75/100`
- 人工判断：当前漏算。它是光环内每次攻击附加物理伤害。
- 修正建议：建为 `attack_bonus_per_hit`，输入 `attack_count`。

### Drinking Buddies / Bitter Chill
- 中文名：酒友 / 严寒
- 当前模型：reference_only
- 人工判断：移速、护甲、攻速降低不直接造成伤害。
- 修正建议：保留为控制/防御参考。

### Walrus Kick
- 中文名：海象飞踢
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=550`
- 人工判断：正确。击退距离和减速不是伤害。

### Walrus PUNCH!
- 中文名：海象神拳！
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=60/90/120`、`crit_multiplier=200%/250%/300%`
- 人工判断：当前漏算。它是一次普攻暴击加固定额外伤害。
- 修正建议：建为 `attack_crit_bonus`，输入 `hero_attack_damage`。
