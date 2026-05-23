# 灰烬之灵（Ember Spirit）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：火猫

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：2
- 忽略项：0
- 需要状态输入项：3
- 持续伤害项：3
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：基本可用，但 `Sleight of Fist` 仍缺核心普攻伤害模型。
- 是否存在误计入固定爆发：`Fire Remnant` 和 `Activate Fire Remnant` 可能重复表达同一残焰伤害，需要避免双算。
- 是否缺少关键输入：持续伤害需要作用时间；无影拳需要攻击力和命中目标数；残焰需要命中残焰数。
- 是否需要修改模型：建议补无影拳攻击模型，并确认残焰条目去重。

## 技能复核

### Searing Chains
- 中文名：炎阳索
- 当前模型：implemented / sustained_dps
- 字段对照：`damage_per_second: 100`、`duration: 1.25/1.75/2.25/2.75`；Dotabuff 每秒伤害 100，魔法。
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 人工判断：正确。绳索数量影响目标数，不影响单目标每秒伤害。

### Sleight of Fist
- 中文名：无影拳
- 当前模型：reference_only / debuff_reference
- 字段对照：`bonus_hero_damage: 50/90/130/170`、`attack_interval: 0.25`；Dotabuff 对英雄额外伤害一致。
- 是否计入固定爆发：应作为条件普攻伤害
- 需要输入：`hero_attack_damage`、`target_count` 或 `hit_count`
- 人工判断：当前遗漏核心输出。无影拳是普攻结算加额外英雄伤害，不是单纯施法距离参考。
- 修正建议：改为 attack_sequence 模型。

### Flame Guard
- 中文名：烈火罩
- 当前模型：implemented / sustained_dps
- 字段对照：`damage_per_second: 20/30/40/50`、`duration: 12/14/16/18`、`absorb_amount: 60/140/220/300`
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 人工判断：持续伤害模型正确；护盾吸收不是输出。

### Activate Fire Remnant / Fire Remnant
- 中文名：激活残焰 / 残焰
- 当前模型：implemented / instant_fixed
- 字段对照：`damage: 100/200/300`、`radius: 450`
- 是否计入固定爆发：是，但需要避免双算
- 需要输入：`remnant_hit_count`
- 人工判断：伤害字段正确；两个条目可能是施放/激活同一套残焰逻辑，计算总伤害时应按命中残焰数，而不是两个技能各算一次。

### Immolation
- 中文名：献祭心
- 当前模型：reference_only / state_scaling
- 字段对照：`damage: 10`、`radius: 200`
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 人工判断：作为条件持续伤害合理；缺少明确持续时间，不能自动打满。

## 待办
- [x] 完成字段语义复核。
- [x] 标记持续伤害和残焰去重风险。
- [ ] 增加无影拳攻击模型；残焰按命中数量统一计算。
