# 工程师（Techies）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：炸弹人

## 模型概览
- 技能条目数：8
- 已实现伤害：2
- 参考项：5
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：3
- 普攻相关项：0

## 复核结论
- 总体判断：多个技能被错误识别为移动速度/百分比模型，实际多数是固定魔法伤害或最大魔法值缩放。
- 是否存在误计入固定爆发：存在。`Minefield Sign` 是神杖/移动触发条件，不应默认计入。
- 是否缺少关键输入：触发条件、目标最大魔法、地雷数量、是否神杖。
- 是否需要修改模型：需要。

## 技能复核

### Sticky Bomb
- 中文名：粘性炸弹
- 当前模型：reference_only / move_speed_scaling
- 本地 rawAttributes：`damage=95/170/245/320`
- Dotabuff 对照：延迟后固定魔法爆炸伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`bomb_attached_or_hit`
- 人工判断：当前模型错误，不是移动速度缩放。
- 问题记录：
  - 移速字段是减速，不是伤害系数。
- 修正建议：
  - 改为 delayed_instant。

### Reactive Tazer
- 中文名：活性电击
- 当前模型：reference_only / move_speed_scaling
- 本地 rawAttributes：`damage=60/110/160/210`
- Dotabuff 对照：爆炸范围魔法伤害并缴械。
- 是否计入固定爆发：有条件计入
- 需要输入：`detonated`
- 人工判断：当前模型错误，不是移动速度缩放。
- 问题记录：
  - `bonus_ms` 是自身移速加成。
- 修正建议：
  - 改为 conditional_instant。

### Blast Off!
- 中文名：爆破起飞！
- 当前模型：reference_only / percent_max_health
- 本地 rawAttributes：`damage=200/300/400/500`、`hp_cost=20%`
- Dotabuff 对照：固定魔法伤害，自身消耗当前生命值。
- 是否计入固定爆发：是
- 需要输入：无；自伤单独展示
- 人工判断：当前模型错误。对敌不是最大生命百分比。
- 问题记录：
  - `hp_cost` 是自伤成本，不是对敌伤害。
- 修正建议：
  - 改为 instant_fixed，并记录 self_cost。

### M.A.D.
- 中文名：同归于尽
- 当前模型：reference_only / percent_missing_mana
- 本地 rawAttributes：`base_damage=50`、`max_mana_pct_as_damage=30%`
- Dotabuff 对照：基础伤害 + 最大魔法值伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`target_max_mana`
- 人工判断：当前使用“已损魔法”语义错误，应是最大魔法值。
- 问题记录：
  - 字段名明确为 max_mana_pct。
- 修正建议：
  - 改为 max_mana_scaling。

### Minefield Sign
- 中文名：雷区标识
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`scepter_move_damage=300`、`scepter_move_amt=200`
- Dotabuff 对照：神杖移动距离触发伤害。
- 是否计入固定爆发：否，除非神杖且触发。
- 需要输入：`has_scepter`、`movement_triggered`
- 人工判断：当前默认计入不合适。
- 问题记录：
  - 条件很强，不能作为稳定爆发。
- 修正建议：
  - 改为 scepter conditional。

### Proximity Mines
- 中文名：感应地雷
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=400/575/750`，Dotabuff 显示 400/550/700
- Dotabuff 对照：固定魔法爆炸伤害并降低魔抗。
- 是否计入固定爆发：有条件计入
- 需要输入：`mine_count`
- 人工判断：单颗地雷伤害方向正确，但需要数量输入，并记录版本差异。
- 问题记录：
  - 多雷叠加必须按地雷数量计算。
- 修正建议：
  - multi_instance mine model。
