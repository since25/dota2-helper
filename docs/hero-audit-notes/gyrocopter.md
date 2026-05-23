# 矮人直升机（Gyrocopter）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：飞机

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：1
- 忽略项：2
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Rocket Barrage` 当前只算单枚火箭，严重低估；`Call Down` 不应只作为距离缩放参考。
- 是否缺少关键输入：火箭弹幕需要命中火箭数/作用时间；高射火炮需要攻击次数；召唤飞弹需要命中导弹次数。
- 是否需要修改模型：需要补多段火箭和多枚导弹模型。

## 技能复核

### Rocket Barrage
- 中文名：火箭弹幕
- 当前模型：implemented / instant_fixed
- 字段对照：`rocket_damage: 8/14/20/26`、`rockets_per_second: 10`、`barrage_duration: 3`
- 是否计入固定爆发：当前只计单枚，不完整
- 需要输入：`rocket_hit_count` 或 `active_duration`
- 人工判断：当前模型错误/低估。总伤害应按命中火箭数量累加，理论上 10 枚/秒持续 3 秒。
- 修正建议：多段随机命中模型，至少支持手动火箭命中数。

### Homing Missile
- 中文名：追踪导弹
- 当前模型：implemented / instant_fixed
- 字段对照：`hit_damage: 90/180/270/360`、`stun_duration: 1.3/1.7/2.1/2.5`
- 是否计入固定爆发：是
- 人工判断：正确。摧毁次数和飞行时间不是伤害。

### Flak Cannon
- 中文名：高射火炮
- 当前模型：ignored
- 字段对照：`max_attacks: 4/5/6/7`、`radius: 1250`
- 是否计入固定爆发：否
- 需要输入：`hero_attack_damage`、`attack_count`、目标数量
- 人工判断：当前忽略会漏掉核心物理输出，但它依赖普攻模型。
- 修正建议：进入 attack_multi_target 模型。

### Afterburner
- 中文名：加力燃烧器
- 当前模型：ignored
- 字段对照：移动速度相关字段。
- 是否计入固定爆发：否
- 人工判断：正确，不直接造成伤害。

### Call Down
- 中文名：召唤飞弹
- 当前模型：reference_only / state_scaling
- 字段对照：`damage: 200/350/500`、`total_strikes: 3`、`strike_delay: 1`、`tracking_missile_damage: 50`
- 是否计入固定爆发：应作为条件多段伤害
- 需要输入：`strike_hit_count`
- 人工判断：当前模型不完整。召唤飞弹是多次打击，不是距离缩放伤害。
- 修正建议：多波模型，按命中导弹次数累加。

## 待办
- [x] 完成字段语义复核。
- [x] 标记多段火箭/飞弹和普攻字段。
- [ ] 修正火箭弹幕、召唤飞弹、高射火炮模型。
