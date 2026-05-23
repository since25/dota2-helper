# 狙击手（Sniper）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：火枪、狙击手

## 模型概览
- 技能条目数：6
- 已实现伤害：2
- 参考项：3
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：`Concussive Grenade` 和 `Assassinate` 正确，`Shrapnel`、`Headshot`、`Keen Scope` 需要补持续/概率/距离修正。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：榴霰弹作用时间、爆头触发次数、瞄准状态、攻击距离。
- 是否需要修改模型：需要。

## 技能复核

### Keen Scope
- 中文名：基恩瞄准镜
- 当前模型：ignored
- 本地 rawAttributes：`bonus_damage_for_range=1.50%`、`bonus_damage_distance=100`
- Dotabuff 对照：根据距离提供额外伤害。
- 是否计入固定爆发：否，作为距离伤害修正。
- 需要输入：`attack_distance`
- 人工判断：当前忽略偏保守。
- 问题记录：
  - 这是普攻输出修正，不是独立伤害。
- 修正建议：
  - 进入 ranged damage modifier。

### Shrapnel
- 中文名：榴霰弹
- 当前模型：reference_only / state_scaling
- 本地 rawAttributes：`shrapnel_damage=30/45/60/75`、`duration=10`
- Dotabuff 对照：区域持续魔法伤害。
- 是否计入固定爆发：否，按作用时间计算。
- 需要输入：`active_duration`
- 人工判断：当前 stack_scaling 语义错误，应是持续区域 DPS。
- 问题记录：
  - 会漏算榴霰弹对线消耗。
- 修正建议：
  - 改为 sustained_dps。

### Headshot
- 中文名：爆头
- 当前模型：reference_only
- 本地 rawAttributes：`damage=20/50/80/110`、`proc_chance=40%`
- Dotabuff 对照：普攻概率触发额外物理伤害和击退。
- 是否计入固定爆发：有条件计入
- 需要输入：`attack_count`、`proc_mode`
- 人工判断：当前应建为 proc attack modifier。
- 问题记录：
  - 不是 damage amp，而是概率额外伤害。
- 修正建议：
  - 支持确定触发和期望值两种模式。

### Take Aim
- 中文名：瞄准
- 当前模型：reference_only
- 本地 rawAttributes：`headshot_chance=100%`、`active_attack_range_bonus=75/150/225/300`
- Dotabuff 对照：主动期间爆头几率 100%，增加攻击距离。
- 是否计入固定爆发：否，修正爆头触发。
- 需要输入：`take_aim_active`
- 人工判断：正确不独立造成伤害，但会让 Headshot 确定触发。
- 问题记录：
  - 攻击距离和视野不是伤害。
- 修正建议：
  - 作为 Headshot proc modifier。

### Concussive Grenade
- 中文名：震荡手雷
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=200`
- Dotabuff 对照：瞬时魔法伤害并击退/减速。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 击退距离不是伤害。
- 修正建议：
  - 不需要修改。

### Assassinate
- 中文名：暗杀
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=300/400/500`
- Dotabuff 对照：单体魔法额外伤害。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 施法距离、弹道速度不是伤害。
- 修正建议：
  - 不需要修改。
