# 祈求者（Invoker）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：卡尔

## 模型概览
- 技能条目数：15
- 已实现伤害：6
- 参考项：4
- 忽略项：5
- 需要状态输入项：6
- 持续伤害项：3
- 多波伤害项：2
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。当前能覆盖部分瞬时技能，但祈求者技能多为元素等级缩放、持续/多段/状态依赖，不能简单按固定伤害处理。
- 是否存在误计入固定爆发：`Chaos Meteor` 只计 `main_damage` 会漏烧灼；`Cold Snap` 只计一次冻结伤害会低估；`Tornado` 未计入 Wex 加成伤害。
- 是否缺少关键输入：元素等级、命中次数、目标缺失魔法、作用时间、熔炉精灵攻击次数。
- 是否需要修改模型：需要补元素等级口径、多段和持续组件。

## 技能复核
- `Quas/Wex/Exort`：元素属性本身不直接造成伤害；`Wex` 攻速、`Exort` 攻击力应作为状态修正，不能当技能伤害。
- `Cold Snap`：`freeze_damage: 28...108` 是每次触发伤害；当前 instant_fixed 只计一次，完整模型需要 `trigger_count`。
- `Tornado`：`base_damage: 50` 加 `wex_damage: 45...495`；当前只取 base 会明显低估。
- `E.M.P.`：`damage_per_mana_pct: 60%` 依赖目标被烧魔法量/缺失魔法，必须输入 `target_mana_burned` 或 `target_missing_mana`。
- `Alacrity`：`bonus_damage`、`bonus_attack_speed` 是普攻增益，不是直接技能伤害。
- `Chaos Meteor`：`main_damage` 按碰撞间隔触发，另有 `burn_dps` 和 `burn_duration`，应拆成多段碰撞 + 烧灼持续伤害。
- `Sun Strike`：`damage: 175...675` 是纯粹瞬时伤害，模型正确，但多人分摊规则后续应确认。
- `Forge Spirit`：召唤物攻击力、数量、持续时间都需要召唤物攻击模型。
- `Ice Wall`：`damage_per_second` 和 `duration` 方向正确，但必须输入实际作用时间。
- `Deafening Blast`：`damage: 70...470` 是瞬时魔法伤害，模型正确；缴械/击退只做控制参考。

## 待办
- [x] 完成字段语义复核。
- [x] 标记元素、状态、持续、多段字段。
- [ ] 修正 `Cold Snap` 触发次数、`Tornado` Wex 伤害、`Chaos Meteor` 多段+烧灼、`Forge Spirit` 召唤物攻击模型。
