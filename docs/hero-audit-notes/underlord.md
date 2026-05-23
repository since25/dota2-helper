# 孽主（Underlord）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：大屁股

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：1
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：`Firestorm` 方向正确但缺最大生命百分比烧灼；`Pit of Malice` 应按触发次数，不是单次固定。
- 是否存在误计入固定爆发：`Pit of Malice` 默认计入单次可接受，但全程多次触发需输入。
- 是否缺少关键输入：Firestorm 波数、烧灼作用时间、目标最大生命、Pit 触发次数。
- 是否需要修改模型：需要。

## 技能复核

### Firestorm
- 中文名：火焰风暴
- 当前模型：implemented / multi_wave
- 本地 rawAttributes：`wave_damage=30/55/80/105`、`wave_count=6`、`burn_damage=1.5%/2%/2.5%/3%`
- 人工判断：波次伤害正确，但缺最大生命值烧灼。
- 修正建议：公式为 `wave_damage * wave_count + target_max_health * burn_pct * burn_duration`，允许调整波数和作用时间。

### Pit of Malice
- 中文名：怨念深渊
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`pit_damage=20/30/40/50`、`pit_interval=3.6`、`pit_duration=12`
- 人工判断：一次控制伤害正确，但全程可多次触发。
- 修正建议：改为 repeated_trigger，输入 `trigger_count`。

### Atrophy Aura
- 中文名：衰退光环
- 当前模型：ignored
- 本地 rawAttributes：`bonus_damage_from_hero=30/35/40/45`
- 人工判断：不是独立伤害，但会提供攻击力。
- 修正建议：进入 attack_damage_buff。

### Invading Force / Fiend's Gate
- 中文名：侵略大军 / 恶魔之扉
- 当前模型：ignored / reference_only
- 人工判断：承伤降低、移速、传送门不直接伤害。
- 修正建议：保留为战场/机动参考。
