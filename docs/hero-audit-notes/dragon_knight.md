# 龙骑士（Dragon Knight）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：龙骑、dk

## 模型概览
- 技能条目数：6
- 已实现伤害：5
- 参考项：0
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：2
- 多波伤害项：0
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Wyrm's Wrath` 和 `Elder Dragon Form` 不应作为无条件瞬时/持续施法伤害；`Breathe Fire` 当前被错误建成普攻修正。
- 是否缺少关键输入：龙形态腐蚀伤害需要攻击次数/命中目标；火球需要作用时间。
- 是否需要修改模型：需要，尤其是 `Breathe Fire` 应改成瞬时魔法伤害。

## 技能复核

### Breathe Fire
- 中文名：火焰气息
- 当前模型：implemented / attack_modifier
- 当前字段：`bonusDamageKey: damage`
- 本地 rawAttributes：`damage: 80/160/240/320`、`reduction: 20%/24%/28%/32%`、`duration: 11`
- Dotabuff 对照：伤害 80/160/240/320，攻击力降低 20%/24%/28%/32%，伤害类型为魔法。
- 是否计入固定爆发：应该计入
- 需要输入：无
- 人工判断：当前模型错误。火焰气息是瞬时魔法伤害，不是普攻加成。
- 问题记录：
  - `hero_attack_damage` 和 `attack_count` 不应成为该技能输入。
- 修正建议：
  - 改为 `instant_fixed`，`damageKey: damage`；攻击力降低单独作为 debuff 参考。

### Dragon Tail
- 中文名：神龙摆尾
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`；`durationKey: stun_duration`
- 本地 rawAttributes：`damage: 60/90/120/150`、`stun_duration: 1.8/2/2.2/2.4`
- Dotabuff 对照：伤害 60/90/120/150，眩晕 1.8/2/2.2/2.4，伤害类型为魔法。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Wyrm's Wrath
- 中文名：飞龙之怒
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: magic_damage`
- 本地 rawAttributes：`magic_damage: 10/20/30/40`、`bonus_aoe: 25/50/75/100`
- Dotabuff 对照：魔法伤害 10/20/30/40，作用范围加成 25/50/75/100。
- 是否计入固定爆发：不应无条件计入
- 需要输入：`attack_count`
- 人工判断：当前模型可疑。该字段更像攻击附加/龙形态相关增益，不能作为单独施法瞬时伤害。
- 问题记录：
  - 作为 instant_fixed 会凭空增加一次伤害。
- 修正建议：
  - 改为 attack_modifier/reference，并由攻击次数触发。

### Fireball
- 中文名：龙炎火球
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage`；`durationKey: duration`；`tickIntervalKey: burn_interval`
- 本地 rawAttributes：`damage: 85`、`duration: 6`、`burn_interval: 0.5`
- Dotabuff 对照：每秒伤害 85，持续时间 6，伤害类型为魔法。
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 人工判断：正确。火球是区域持续伤害。
- 问题记录：
  - 需要作用时间输入，不能默认敌人吃满 6 秒。
- 修正建议：
  - 增加显式 `conditionInputs: ['active_duration']`。

### Dragon Blood
- 中文名：龙族血统
- 当前模型：ignored
- 当前字段：无
- 本地 rawAttributes：`health_regen: 2`、`armor: 2`
- Dotabuff 对照：额外生命恢复 2，护甲提升 2。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。防御属性，不是伤害。
- 问题记录：
  - 护甲提升会影响承伤，但不属于输出模型。
- 修正建议：
  - 后续进入生存/护甲模块。

### Elder Dragon Form
- 中文名：古龙形态
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: corrosive_damage_per_second`；`durationKey: duration`
- 本地 rawAttributes：`duration: 60`、`corrosive_damage_per_second: 25/25/25/35`、`ranged_splash_damage_pct: 0%/75%/75%/100%`
- Dotabuff 对照：腐蚀伤害、溅射、冰霜减速均由攻击附加。
- 是否计入固定爆发：否
- 需要输入：`attack_count`、`active_duration`、是否处于龙形态
- 人工判断：当前模型错误倾向。腐蚀伤害由攻击施加，不应按 60 秒持续时间自动结算。
- 问题记录：
  - `duration: 60` 是龙形态持续时间，不是目标承受腐蚀的持续时间。
- 修正建议：
  - 改为形态/攻击附加模型：攻击命中后才附加腐蚀 DOT。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 修正火焰气息、飞龙之怒、古龙形态的模型类型。
