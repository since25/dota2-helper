# 石鳞剑士（Pangolier）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：滚滚

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型低估多段伤害，`Swashbuckle` 和 `Rolling Thunder` 需要命中次数输入。
- 是否存在误计入固定爆发：存在风险。`Swashbuckle` 如果只算一次会低估；`Rolling Thunder` 不能按单个固定值代表全程。
- 是否缺少关键输入：缺少 `strike_count`、`collision_count`、攻击伤害输入。
- 是否需要修改模型：需要。

## 技能复核

### Swashbuckle
- 中文名：虚张声势
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=35/65/95/125`、`strikes=3`
- Dotabuff 对照：多次刺击，每次造成物理伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`strike_count`
- 理论总量：105/195/285/375，公式为 `每次伤害 * 3`
- 人工判断：当前单次模型不完整。技能核心是多段命中。
- 问题记录：
  - 只取 `damage` 会漏算默认三次刺击。
- 修正建议：
  - 改为 multi_hit，默认命中次数为 3，允许用户调整。

### Shield Crash
- 中文名：甲盾冲击
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=60/120/180/240`
- Dotabuff 对照：范围物理伤害并提供减伤。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 减伤部分不进入伤害计算。
- 修正建议：
  - 不需要修改。

### Lucky Shot
- 中文名：幸运一击
- 当前模型：reference_only
- Dotabuff 对照：概率触发减速/缴械/护甲降低，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：`proc_chance`、`attack_count`
- 人工判断：作为参考正确。护甲降低会影响后续物理伤害，但不是直接伤害。
- 问题记录：
  - 后续应进入 debuff 修正层，而不是 unknown damage。
- 修正建议：
  - 暂不进入固定爆发。

### Roll Up
- 中文名：卷土重来
- 当前模型：reference_only
- Dotabuff 对照：进入滚动状态，不直接造成独立伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前参考处理可以接受。
- 问题记录：
  - 其伤害逻辑应复用 Rolling Thunder，而不是单独建伤害。
- 修正建议：
  - 先不独立计算。

### Rolling Thunder
- 中文名：地雷滚滚
- 当前模型：implemented / move_speed_scaling
- 本地 rawAttributes：`damage_pct=100%`，碰撞可重复发生
- Dotabuff 对照：滚动碰撞造成伤害并眩晕，可多次命中。
- 是否计入固定爆发：有条件计入
- 需要输入：`hero_attack_damage`、`collision_count`
- 人工判断：当前 `move_speed_scaling` 语义错误。它是重复碰撞/攻击伤害相关模型。
- 问题记录：
  - 需要攻击伤害和命中次数，不能用移动速度当伤害来源。
- 修正建议：
  - 改为 repeated_collision + attack_damage_pct 模型。

### Fortune Favors the Bold
- 中文名：勇者得运
- 当前模型：ignored
- Dotabuff 对照：概率/状态类效果，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。
