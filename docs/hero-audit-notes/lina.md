# 莉娜（Lina）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：火女

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 暂不支持项：1
- 需要状态输入项：3
- 持续伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：基本可用，但本地数值与 Dotabuff 存在多处差异。
- 是否存在误计入固定爆发：未发现明显误计入；`Slow Burn` 保持 unsupported 是安全的。
- 是否缺少关键输入：`Fiery Soul` 需要叠层和普攻窗口；`Flame Cloak` 应作为法术增强修正；`Slow Burn` 需要上游伤害事件。
- 是否需要修改模型：建议先校准版本数值，再接入法术增强/慢热追加伤害。

## 技能复核
- `Dragon Slave`：本地与 Dotabuff 均为 65/125/185/245，瞬时魔法伤害正确。
- `Light Strike Array`：本地 80/120/160/200，Dotabuff 80/125/170/215，模型类型正确但数值差异。
- `Fiery Soul`：攻速/移速叠层，不直接伤害；应影响后续普攻。
- `Flame Cloak`：`spell_amp: 35%`、魔抗 35%，是后续技能修正，不直接伤害。
- `Slow Burn`：`burn_damage_pct` 依赖目标承受伤害事件，不能单独计算固定伤害。
- `Laguna Blade`：本地 380/565/750，Dotabuff 400/580/760，瞬时魔法伤害模型正确但版本差异明显。

## 待办
- [x] 完成字段语义复核。
- [x] 标记版本差异和伤害修正字段。
- [ ] 校准 Lina 数值版本；实现 Flame Cloak/Slow Burn 的事件修正模型。
