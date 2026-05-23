# 沉默术士（Silencer）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：沉默

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：2
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型漏掉了多个关键条件伤害，`Arcane Curse`、`Glaives`、`Last Word` 都需要重新表达。
- 是否存在误计入固定爆发：存在。`Arcane Curse` 的 `damage` 是周期/持续伤害，不是瞬时总伤害。
- 是否缺少关键输入：作用时间、智力、双方智力差、沉默状态、攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Suffer In Silence
- 中文名：默默受苦
- 当前模型：ignored
- 本地 rawAttributes：`damage_pct=5%`
- Dotabuff 对照：沉默单位相关百分比伤害/效果。
- 是否计入固定爆发：有条件计入
- 需要输入：`target_silenced`、百分比语义确认
- 人工判断：当前忽略偏保守，但不能直接当固定伤害。
- 问题记录：
  - 需要确认该 5% 是当前生命、最大生命还是伤害加成。
- 修正建议：
  - 单独核对后进入 conditional modifier。

### Arcane Curse
- 中文名：奥术诅咒
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`application_damage=20/40/60/80`、`damage=16/24/32/40`、`duration=6`
- Dotabuff 对照：初始伤害 + 持续魔法伤害，施法会延长惩罚。
- 是否计入固定爆发：初始伤害计入；持续按时间计入。
- 需要输入：`active_duration`、`penalty_duration`
- 人工判断：当前模型错误，只取 `damage` 会漏初始伤害并误作瞬时。
- 问题记录：
  - 需要 initial + dot 模型。
- 修正建议：
  - 公式为 `application_damage + damage_per_second * 实际持续时间`。

### Glaives of Wisdom
- 中文名：智慧之刃
- 当前模型：reference_only
- 本地 rawAttributes：`intellect_damage_pct=35%/50%/65%/80%`
- Dotabuff 对照：按智力造成魔法额外伤害，并窃取智力。
- 是否计入固定爆发：有条件计入
- 需要输入：`silencer_intelligence`、`attack_count`
- 人工判断：当前漏算普攻法球伤害。
- 问题记录：
  - 这是沉默主要输出来源之一。
- 修正建议：
  - 建为 attack_modifier，公式为 `智力 * 百分比 * 攻击次数`。

### Last Word
- 中文名：遗言
- 当前模型：reference_only
- 本地 rawAttributes：`damage=120/160/200/240`、`int_multiplier=1/1.5/2/2.5`
- Dotabuff 对照：基础魔法伤害 + 智力差倍数。
- 是否计入固定爆发：有条件计入
- 需要输入：`caster_intelligence`、`target_intelligence`
- 人工判断：当前 reference_only 不完整，应可计算。
- 问题记录：
  - 不是 damage amp，而是直接伤害。
- 修正建议：
  - 建为 `base + intelligence_difference * multiplier`。

### Global Silence
- 中文名：全领域静默
- 当前模型：ignored
- Dotabuff 对照：全图沉默，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 持续时间只影响控制窗口。
- 修正建议：
  - 不进入伤害计算。
