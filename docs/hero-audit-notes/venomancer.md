# 剧毒术士（Venomancer）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：剧毒

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：6
- 持续伤害项：4
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：方向较好，但 `Venomous Gale`、`Snakebite`、`Noxious Plague` 都需要初始伤害 + 持续伤害复合模型。
- 是否存在误计入固定爆发：`Noxious Plague` 只算初始伤害会低估；`Snakebite` 当前 tick 数值与 Dotabuff 不一致。
- 是否缺少关键输入：作用时间、扩散次数、守卫攻击次数、目标最大生命。
- 是否需要修改模型：需要。

## 技能复核

### Poison Sting
- 中文名：毒刺
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage=9`、`duration=4.5`
- 人工判断：正确，按实际作用时间计算。

### Venomous Gale
- 中文名：瘴气
- 当前模型：reference_only / conditional
- 本地 rawAttributes：`strike_damage=25/50/75/100`、`tick_damage=10/40/70/100`、`tick_interval=3`、`duration=15`
- 人工判断：应建为初始伤害 + tick 伤害。
- 修正建议：`initial_plus_ticks`。

### Snakebite
- 中文名：毒蛇撕咬
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`base_damage=40/60/80/100`、`tick_damage=20/25/30/35`、`duration=6`
- 人工判断：当前只算持续伤害不完整，且 Dotabuff 每秒伤害数值不同。
- 修正建议：补 initial damage，并记录版本差异。

### Plague Ward
- 中文名：瘟疫守卫
- 当前模型：reference_only
- 本地 rawAttributes：`ward_damage_tooltip=16/24/32/40`
- 人工判断：召唤物普攻伤害，需要攻击次数/存活时间。
- 修正建议：summon_attack。

### Noxious Plague
- 中文名：恶性瘟疫
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`impact_damage=150/200/250`、`damage_per_second=2%/3%/4%`
- 人工判断：只算初始伤害不完整，最大生命百分比 DOT 是关键。
- 修正建议：initial + percent_max_health_dot + spread_count。
