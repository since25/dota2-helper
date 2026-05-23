# 艾欧（Io）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小精灵

## 模型概览
- 技能条目数：8
- 已实现伤害：0
- 参考项：4
- 忽略项：4
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。`Spirits` 是艾欧主要直接伤害，目前只作为 conditional 参考，未进入可计算输出。
- 是否存在误计入固定爆发：未发现；当前偏保守。
- 是否缺少关键输入：幽魂命中数量、敌方类型、过载作用时间、衡势增伤状态。
- 是否需要修改模型：需要把 `Spirits` 建成多命中模型。

## 技能复核
- `Tether`：羁绊提供移动、恢复传递、敌方减速；本地 `damage=0`，不计伤害正确。
- `Spirits`：`hero_damage: 30/50/70/90`、`creep_damage: 12/18/24/30`、`spirit_amount: 5`，应按命中幽魂数量计算魔法伤害。
- `Overcharge`：`bonus_attack_speed` 与 `bonus_spell_amp` 是输出修正，不是直接伤害。
- `Spirits In/Out`：只调整幽魂距离，不额外造成伤害。
- `Relocate/Break Tether`：位移/断链技能，无直接伤害。
- `Equilibrium`：`damage_amplification` 本地 5%，Dotabuff 显示最高 4%，存在版本差异；作为伤害修正，不直接结算。

## 待办
- [x] 完成字段语义复核。
- [x] 确认没有把恢复、速度、传送字段当伤害。
- [ ] 实现 `Spirits` 多命中模型，并把 `Overcharge/Equilibrium` 接入伤害修正层。
