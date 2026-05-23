# 军团指挥官（Legion Commander）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：军团、lc

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：1
- 忽略项：1
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：3

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Duel` 的 `reward_damage` 是胜利后永久攻击力，不是施法伤害；当前 instant_fixed 错误。
- 是否缺少关键输入：压倒性优势需要命中英雄/小兵数量；勇气之霎和决斗需要攻击次数/攻击力。
- 是否需要修改模型：需要修正 `Duel`，补压倒性优势多单位增伤。

## 技能复核
- `Overwhelming Odds`：`damage: 40/70/100/130`、`damage_per_hero`、`damage_per_unit`，当前只计基础伤害，完整伤害需要命中单位数量。
- `Press The Attack`：驱散、移速、回血，不直接造成伤害。
- `Moment of Courage`：`secondary_attack_damage: 100`、触发所需攻击次数 7/6/5/4，是反击/吸血普攻模型，不是固定技能伤害。
- `Outfight Them!`：护甲光环/增益，不直接伤害。
- `Duel`：`reward_damage: 10/20/30` 是胜利奖励攻击力，绝不能作为施法瞬时伤害；决斗内伤害来自双方普攻。

## 待办
- [x] 完成字段语义复核。
- [x] 标记决斗奖励误读。
- [ ] 修正 `Duel` 为控制窗口/普攻输出模型；补 `Overwhelming Odds` 命中单位数。
