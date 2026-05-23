# 裂魂人（Spirit Breaker）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：白牛

## 模型概览
- 技能条目数：6
- 已实现伤害：0
- 参考项：5
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：当前模型过于保守，`Greater Bash` 和 `Nether Strike` 应能计算，但都需要移动速度/触发条件。
- 是否存在误计入固定爆发：未发现误计入。
- 是否缺少关键输入：移动速度、是否触发重击、冲刺/大招是否保证触发、攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Empowering Haste
- 中文名：神行太保
- 当前模型：ignored
- 本地 rawAttributes：移动速度加成字段。
- Dotabuff 对照：英雄/非英雄移动速度加成。
- 是否计入固定爆发：否，作为移动速度修正。
- 需要输入：无
- 人工判断：正确不作为伤害，但会提高 Greater Bash。
- 问题记录：
  - 移动速度不是伤害。
- 修正建议：
  - 进入 move speed modifier。

### Charge of Darkness
- 中文名：暗影冲刺
- 当前模型：reference_only
- 本地 rawAttributes：`movement_speed=275/325/375/425`、`stun_duration=1.3/1.6/1.9/2.2`
- Dotabuff 对照：冲刺并触发重击语境。
- 是否计入固定爆发：不直接计入
- 需要输入：`charge_hit`
- 人工判断：当前不计直接伤害正确，但应触发 Greater Bash 计算。
- 问题记录：
  - 冲刺本体字段没有伤害。
- 修正建议：
  - 作为 guaranteed bash trigger。

### Bulldoze
- 中文名：威吓
- 当前模型：reference_only
- 本地 rawAttributes：`movement_speed=8%/12%/16%/20%`、`status_resistance=40%/50%/60%/70%`
- Dotabuff 对照：移速和状态抗性。
- 是否计入固定爆发：否，作为移速修正。
- 需要输入：`bulldoze_active`
- 人工判断：正确不作为伤害，但会影响 Greater Bash。
- 问题记录：
  - `damage_barrier=0`，不应作为护盾伤害。
- 修正建议：
  - 接入 move speed modifier。

### Greater Bash
- 中文名：巨力重击
- 当前模型：reference_only / move_speed_scaling
- 本地 rawAttributes：`chance_pct=17%`、`damage=25%/30%/35%/40%`
- Dotabuff 对照：概率触发，按移动速度比例造成魔法伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`move_speed`、`proc_mode`
- 人工判断：当前方向正确，但应实现可计算。
- 问题记录：
  - `damage` 是移动速度转伤害比例，不是固定数值。
- 修正建议：
  - 建为 move_speed_scaling proc，支持确定触发和期望值。

### Planar Pocket
- 中文名：位面空洞
- 当前模型：reference_only
- Dotabuff 对照：魔抗/转移法术等防御机制，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 魔抗不是伤害。
- 修正建议：
  - 不进入伤害计算。

### Nether Strike
- 中文名：幽冥一击
- 当前模型：reference_only / distance_scaling
- 本地 rawAttributes：`damage=150/250/350`
- Dotabuff 对照：额外魔法伤害，并通常触发重击。
- 是否计入固定爆发：是，且可附带 Greater Bash
- 需要输入：`move_speed`
- 人工判断：当前 distance_scaling 语义错误。大招额外伤害是固定值，不按距离缩放。
- 问题记录：
  - 漏算白牛大招稳定额外伤害。
- 修正建议：
  - 改为 instant_fixed + guaranteed bash。
