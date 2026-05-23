# 痛苦女王（Queen of Pain）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：女王、QOP

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：0

## 复核结论
- 总体判断：`Scream Of Pain` 和 `Sonic Wave` 正确，`Shadow Strike` 需要补初始伤害加周期伤害模型。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：`Shadow Strike` 需要实际作用时间或 tick 数。
- 是否需要修改模型：需要补 `Shadow Strike`。

## 技能复核

### Shadow Strike
- 中文名：暗影突袭
- 当前模型：reference_only / conditional
- 本地 rawAttributes：`strike_damage=50/80/110/140`、`duration_damage=20/40/60/80`、`damage_interval=3`、`duration=16`
- Dotabuff 对照：初始魔法伤害，之后每隔一段时间造成周期伤害并减速。
- 是否计入固定爆发：初始伤害可计入；后续按作用时间计入。
- 需要输入：`active_duration`
- 人工判断：当前不完整。它不是纯条件参考，应能计算初始 + tick。
- 问题记录：
  - 只算瞬时会低估，默认打满又可能高估。
- 修正建议：
  - 增加 `initial_plus_ticks` 模型。

### Blink
- 中文名：闪烁
- 当前模型：reference_only
- Dotabuff 对照：位移技能，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。

### Scream Of Pain
- 中文名：痛苦尖叫
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=90/175/260/345`
- Dotabuff 对照：范围魔法瞬时伤害。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - `damage_reflected_to_self` 不是对敌额外伤害。
- 修正建议：
  - 不需要修改。

### Succubus
- 中文名：魅魔
- 当前模型：reference_only
- 本地 rawAttributes：`spell_lifesteal=2%`、`spell_lifesteal_close=14%`
- Dotabuff 对照：技能吸血，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 吸血不应被当作伤害。
- 修正建议：
  - 作为续航参考即可。

### Sonic Wave
- 中文名：超声冲击波
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=325/475/625`
- Dotabuff 对照：纯粹瞬时伤害并击退。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 击退距离不是伤害。
- 修正建议：
  - 不需要修改。
