# 凯（Kez）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：无

## 模型概览
- 技能条目数：10
- 已实现伤害：1
- 参考项：7
- 忽略项：2
- 需要状态输入项：6
- 持续伤害项：1
- 多波伤害项：3
- 普攻相关项：5

## 复核结论
- 总体判断：需修正模型。Kez 的大部分输出是普攻百分比、多段、叠层 DOT 或百分比生命，目前只有 `Talon Toss` 可直接用。
- 是否存在误计入固定爆发：未发现明显误计入，但多个 reference_only 导致核心伤害缺失。
- 是否缺少关键输入：攻击力、攻击次数、叠层数、目标最大生命、流派状态。
- 是否需要修改模型：需要系统性补 Kez 专属普攻/叠层模型。

## 技能复核
- `Echo Slash`：`katana_echo_damage: 70%/80%/90%/100%`、`echo_hero_damage: 20/40/60/80`、`katana_strikes: 2`，应按攻击力和两段斩击计算，不是距离缩放。
- `Grappling Claw`：位移和减速，不直接伤害。
- `Kazurai Katana`：`katana_bleed_attack_damage_pct: 3%/6%/9%/12%`、持续 7 秒，并有叠加爆发规则；需要叠层和攻击力。
- `Switch Discipline`：切换长刀/双钗改变攻击距离、BAT、敏捷转攻击、切换加成，是状态修正。
- `Raptor Dance`：`strikes: 4`、`base_damage: 30/60/90`、`max_health_damage_pct: 2.5%`，应按多段纯粹百分比生命计算。
- `Falcon Rush`：`base_echo_damage: 30%/35%/40%/45%` 是回声攻击伤害，需要攻击力和攻击次数。
- `Talon Toss`：`damage: 60/120/180/240` 是物理瞬时伤害，模型正确。
- `Shodo Sai`：暴击概率/倍率和印记眩晕，不直接固定伤害；应进入普攻概率模型。
- `Raven's Veil/Cancel`：迷烟、移速、视野和取消子技能，不直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记多段、普攻百分比、叠层 DOT、百分比生命字段。
- [ ] 修正 `Echo Slash`、`Kazurai Katana`、`Raptor Dance`、`Falcon Rush`、`Shodo Sai` 模型。
