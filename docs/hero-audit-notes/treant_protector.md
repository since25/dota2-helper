# 树精卫士（Treant Protector）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：大树

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：2
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：2
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：`Nature's Grasp` 和 `Overgrowth` 正确，`Living Armor` 被误当伤害，`Leech Seed` 需要按短时持续/脉冲理解。
- 是否存在误计入固定爆发：存在。`Living Armor` 是治疗/格挡，不是对敌伤害。
- 是否缺少关键输入：作用时间、脉冲次数、是否靠树增强。
- 是否需要修改模型：需要。

## 技能复核

### Nature's Guise
- 中文名：自然蔽护
- 当前模型：reference_only
- Dotabuff 对照：移动速度/隐蔽相关，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - `attack_damage_pct=0`，不应参与伤害。
- 修正建议：
  - 保留为机动参考。

### Nature's Grasp
- 中文名：自然卷握
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage_per_second=35/50/65/80`、`vines_duration=9/10/11/12`
- Dotabuff 对照：持续魔法伤害。
- 是否计入固定爆发：否，按作用时间计算。
- 需要输入：`active_duration`
- 人工判断：正确。
- 问题记录：
  - 默认打满可能高估。
- 修正建议：
  - UI 暴露作用时间。

### Leech Seed
- 中文名：寄生种子
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`leech_damage=20/40/60/80`、`duration=0.9/1.1/1.3/1.5`、`healing_pulse_count=2`
- Dotabuff 对照：伤害转治疗，短时脉冲。
- 是否计入固定爆发：有条件计入
- 需要输入：`pulse_count`
- 人工判断：当前瞬时简化不够精确。
- 问题记录：
  - `duration` 是脉冲窗口，不是瞬时。
- 修正建议：
  - 建为 pulse damage/heal。

### Living Armor
- 中文名：活体护甲
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`heal_per_second`、`damage_block_base=60/80/100/120`
- Dotabuff 对照：治疗和伤害格挡。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前模型错误，格挡不是对敌伤害。
- 问题记录：
  - 会生成不存在的输出。
- 修正建议：
  - 改为 defensive reference。

### Eyes In The Forest
- 中文名：丛林之眼
- 当前模型：reference_only
- Dotabuff 对照：视野/树眼机制，不直接伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。

### Overgrowth
- 中文名：疯狂生长
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage=95`、`duration=3/4/5`
- Dotabuff 对照：每秒魔法伤害并缠绕。
- 是否计入固定爆发：否，按持续时间计算。
- 需要输入：`active_duration`
- 人工判断：正确。
- 问题记录：
  - 需要考虑驱散/持续时间。
- 修正建议：
  - 保持 sustained_dps。
