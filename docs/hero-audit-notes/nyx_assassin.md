# 司夜刺客（Nyx Assassin）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：小强

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：2
- 忽略项：3
- 需要状态输入项：5
- 持续伤害项：0
- 反伤/事件伤害项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Mind Flare` 当前把持续时间当 DPS，是明显误建模；`Vendetta` 被忽略会漏核心爆发。
- 是否缺少关键输入：目标最大魔法、目标已燃魔法、反伤来源伤害、复仇是否破隐攻击。
- 是否需要修改模型：需要修正 Mind Flare、Spiked Carapace、Mana Burn、Vendetta。

## 技能复核
- `Impale`：`impale_damage: 100/160/220/280`，瞬时魔法伤害正确。
- `Mind Flare`：`max_mana_as_damage_pct: 25/30/35/40%`、`mana_burn_pct: 9/12/15/18%`、`damage_echo_pct: 15%`，依赖目标魔法和近期伤害，不是 sustained_dps。
- `Spiked Carapace`：反弹伤害 140%，需要输入受到的伤害事件；当前只做控制参考不完整。
- `Burrow`：恢复、减伤、施法距离和冷却，不直接伤害。
- `Mana Burn`：`mana_burn_pct: 12%`，应按目标魔法池/当前魔法计算，不应忽略。
- `Vendetta`：`bonus_damage: 300/400/500` 是破隐攻击额外纯粹伤害，当前忽略错误。
- `Unburrow`：子技能，无直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 Mind Flare 持续 DPS 误读。
- [ ] 实现 Mind Flare 魔法/回响、Carapace 反伤、Mana Burn、Vendetta 破隐伤害。
