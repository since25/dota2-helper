# 寒冬飞龙（Winter Wyvern）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：冰龙

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：2
- 忽略项：0
- 暂不支持项：1
- 需要状态输入项：5
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：`Splinter Blast` 正确，`Arctic Burn` 当前 damageKey 错误，`Winter's Curse` 需要敌方攻击输入。
- 是否存在误计入固定爆发：存在。`Arctic Burn` 用 `damage_duration` 当 DPS 是错误的。
- 是否缺少关键输入：目标当前生命/最大生命、攻击次数、诅咒期间敌方攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Eldwurm's Edda
- 中文名：古龙诗集
- 当前模型：缺失
- 人工判断：需要补字段后判断。

### Arctic Burn
- 中文名：严寒烧灼
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage_duration`
- 本地 rawAttributes：`percent_damage=4%/6%/8%/10%`、`damage_duration=3`
- 人工判断：当前模型错误。`damage_duration` 是烧灼持续时间，不是伤害值。
- 修正建议：按目标生命百分比计算，输入 `target_current_or_max_health` 与攻击次数。

### Splinter Blast
- 中文名：碎裂冲击
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=80/160/240/320`
- 人工判断：正确。主目标是否受伤需根据技能规则确认，通常伤害来自碎裂弹。

### Cold Embrace
- 中文名：极寒之拥
- 当前模型：reference_only
- 人工判断：治疗/物免，不直接伤害。

### Winter's Curse
- 中文名：寒冬诅咒
- 当前模型：reference_only
- 人工判断：伤害来自被诅咒周围敌人的普攻，不是技能固定伤害。
- 修正建议：输入 `attacker_count`、`attack_damage`、`attack_count`。
