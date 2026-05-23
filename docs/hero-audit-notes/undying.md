# 不朽尸王（Undying）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：尸王

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：3
- 忽略项：0
- 暂不支持项：1
- 需要状态输入项：6
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：当前 `Decay` 和 `Soul Rip` 都需要改，尸王的关键是多单位/多层输入。
- 是否存在误计入固定爆发：存在。`Soul Rip` 每单位伤害被当成单次固定伤害会低估/误导。
- 是否缺少关键输入：命中英雄数、周围单位数、墓碑僵尸攻击次数、血肉傀儡是否生效。
- 是否需要修改模型：需要。

## 技能复核

### Ceaseless Dirge
- 中文名：挽歌犹唱
- 当前模型：缺失
- 人工判断：需要补数据后判断。

### Decay
- 中文名：腐朽
- 当前模型：reference_only / attribute_scaling
- 本地 rawAttributes：`decay_damage=20/60/100/140`、`str_steal=4`
- 人工判断：应是瞬时魔法伤害 + 力量偷取，不是属性缩放伤害。
- 修正建议：改为 instant_fixed，额外记录 strength_steal。

### Soul Rip
- 中文名：噬魂
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage_per_unit=14/26/38/50`、`max_units=10`
- 人工判断：应按有效单位数计算伤害/治疗。
- 修正建议：公式为 `damage_per_unit * unit_count`。

### Tombstone
- 中文名：墓碑
- 当前模型：reference_only
- 本地 rawAttributes：`zombie_damage_tooltip=34`、`zombie_interval=4/3.6/3.2/2.8`
- 人工判断：墓碑本体无直接爆发，伤害来自僵尸攻击。
- 修正建议：建为 summon_attack，输入 `zombie_attack_count`。

### Flesh Golem
- 中文名：血肉傀儡
- 当前模型：reference_only
- 本地 rawAttributes：`damage_amp=25%/30%/35%`
- 人工判断：伤害加深不是独立伤害，应修正后续承伤。
- 修正建议：进入 damage amplification。
