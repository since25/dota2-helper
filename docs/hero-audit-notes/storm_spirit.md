# 风暴之灵（Storm Spirit）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：蓝猫

## 模型概览
- 技能条目数：5
- 已实现伤害：0
- 参考项：4
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型过于保守，`Static Remnant`、`Overload`、`Ball Lightning` 都应实现可计算模型。
- 是否存在误计入固定爆发：未发现误计入。
- 是否缺少关键输入：飞行距离、魔法消耗、超负荷攻击次数、残影命中次数。
- 是否需要修改模型：需要。

## 技能复核

### Galvanized
- 中文名：通电
- 当前模型：ignored
- Dotabuff 对照：击杀/死亡相关魔法或充能机制，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前忽略可以接受。
- 问题记录：
  - 作用范围不是伤害。
- 修正建议：
  - 作为资源成长参考。

### Static Remnant
- 中文名：残影
- 当前模型：reference_only / stack_scaling
- 本地 rawAttributes：`static_remnant_damage=100/160/220/280`
- Dotabuff 对照：残影被触发时造成范围魔法伤害。
- 是否计入固定爆发：是
- 需要输入：`remnant_hit_count` 可选
- 人工判断：当前 stack_scaling 语义错误，应为瞬时范围伤害。
- 问题记录：
  - 当前漏算蓝猫基础爆发技能。
- 修正建议：
  - 改为 instant_fixed 或 multi_hit。

### Electric Vortex
- 中文名：电子涡流
- 当前模型：reference_only
- Dotabuff 对照：牵引控制，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 牵引距离不是伤害。
- 修正建议：
  - 保留控制窗口。

### Overload
- 中文名：超负荷
- 当前模型：reference_only / stack_scaling
- 本地 rawAttributes：`overload_damage=25/50/75/100`
- Dotabuff 对照：施法后下一次攻击造成范围魔法伤害并减速。
- 是否计入固定爆发：有条件计入
- 需要输入：`overload_attack_count`
- 人工判断：当前 stack_scaling 语义不准确。它是攻击触发额外伤害。
- 问题记录：
  - 需要知道触发几次超负荷攻击。
- 修正建议：
  - 建为 spell_charge_attack_proc。

### Ball Lightning
- 中文名：球状闪电
- 当前模型：reference_only / percent_missing_mana
- 本地 raw damage：`6/10/14`，另有飞行消耗和速度字段。
- Dotabuff 对照：飞行路径造成魔法伤害，和飞行距离/魔法消耗相关。
- 是否计入固定爆发：有条件计入
- 需要输入：`travel_distance`
- 人工判断：当前 percent_missing_mana 语义错误。蓝猫飞行伤害不是目标已损魔法百分比。
- 问题记录：
  - 需要按飞行距离或消耗计算，不能用目标缺蓝。
- 修正建议：
  - 建为 distance_travel_damage，结合 100 距离魔法消耗与伤害字段。
