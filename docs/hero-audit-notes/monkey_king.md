# 齐天大圣（Monkey King）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：猴子、mk

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：1
- 忽略项：2
- 需要状态输入项：5
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Boundless Strike` 只计额外固定伤害，漏掉基于攻击力的暴击；`Tree Dance` 本身不应计伤害。
- 是否缺少关键输入：普攻攻击力、如意棒层数、猴子猴孙攻击次数/范围内停留时间。
- 是否需要修改模型：需要补普攻暴击、Jingu 和 Wukong 士兵攻击模型。

## 技能复核
- `Boundless Strike`：`strike_flat_damage: 20/40/60/80` 加 `strike_crit_mult: 120%/140%/160%/180%`，应按当前攻击力结算，不是纯 instant_fixed。
- `Tree Dance`：树舞是位移；`impact_damage_tooltip` 实际属于乾坤之跃提示，不应单独计树舞伤害。
- `Primal Spring`：`impact_damage: 110/200/290/380`，蓄力后落地魔法伤害，可用但应支持蓄力/是否满蓄。
- `Jingu Mastery`：4 次计数后提供攻击力和吸血，是核心普攻增益，当前忽略会低估。
- `Mischief`：变身/短暂无敌，不直接伤害。
- `Wukong's Command`：猴子猴孙按士兵攻击频率造成物理输出，不是施法距离参考。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 Tree Dance 伤害误读。
- [ ] 修正 Boundless Strike 攻击力暴击、Jingu、Wukong 士兵攻击模型。
