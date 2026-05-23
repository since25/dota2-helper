# Ringmaster（Ringmaster）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：missing / empty
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：马戏团长

## 模型概览
- 技能条目数：12
- 已实现伤害：0
- 参考项：0
- 忽略项：0
- 暂不支持项：12
- 需要状态输入项：5
- 持续伤害项：3
- 多波伤害项：1
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型为空，需要完整补建。
- 是否存在误计入固定爆发：未发现，因为没有模型。
- 是否缺少关键输入：蓄力程度、作用时间、目标最大生命、是否幻象、Wheel 光环持续时间。
- 是否需要修改模型：需要，优先级高。

## 技能复核

### Tame the Beasts
- 中文名：驯兽术
- 当前模型：缺失
- 本地 rawAttributes：`damage_min=50/75/100/125`、`damage_max=180/280/380/480`、`abilitychanneltime=1`
- Dotabuff 对照：蓄力/引导后造成最低到最高魔法伤害并恐惧。
- 是否计入固定爆发：有条件计入
- 需要输入：`charge_ratio`
- 人工判断：应建为蓄力缩放伤害。
- 问题记录：
  - 不能只取最低或最高作为固定值。
- 修正建议：
  - 增加 `charge_scaling`，支持 min/max/manual。

### Escape Act
- 中文名：逃生技
- 当前模型：缺失
- Dotabuff 对照：保护、移速、魔抗和减速抗性，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：应标记为防御/位移参考。
- 问题记录：
  - 魔抗加成不能被提取为伤害。
- 修正建议：
  - `reference_only`。

### Impalement Arts
- 中文名：尖刀戏
- 当前模型：缺失
- 本地 rawAttributes：`damage_impact=20/35/50/65`、`bleed_health_pct=3%/4%/5%/6%`、`bleed_duration=4`
- Dotabuff 对照：命中伤害 + 按英雄最大生命值每秒流血。
- 是否计入固定爆发：有条件计入
- 需要输入：`target_max_health`、`active_duration`
- 人工判断：应建为初始命中 + 百分比生命持续伤害。
- 问题记录：
  - 这是 Ringmaster 的关键伤害技能，当前完全漏算。
- 修正建议：
  - 增加 `impact_plus_percent_hp_dot`。

### Spotlight
- 中文名：聚光灯
- 当前模型：缺失
- 本地 rawAttributes：`illusion_percent_damage=30%`、`miss_chance=30%`、`duration=8`
- Dotabuff 对照：主要针对幻象和落空，不是常规对英雄伤害。
- 是否计入固定爆发：否，除非目标是幻象。
- 需要输入：`target_is_illusion`
- 人工判断：不应进入普通英雄爆发。
- 问题记录：
  - 幻象最大生命损失不是常规英雄伤害。
- 修正建议：
  - 建为 illusion-only conditional。

### Wheel of Wonder
- 中文名：奇观轮
- 当前模型：缺失
- 本地 rawAttributes：`aura_damage=50/75/100`、`aura_tick_interval=0.5`、`explosion_damage=300/450/600`
- Dotabuff 对照：光环持续每秒伤害，倒计时后爆炸伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`aura_active_duration`、`explosion_hit`
- 人工判断：应拆为持续光环伤害 + 条件爆炸伤害。
- 问题记录：
  - 只取爆炸会漏光环；默认光环打满也会高估。
- 修正建议：
  - 增加 `dot_plus_conditional_explosion`。

### Souvenir / 道具类技能
- 中文名：水晶球、哈哈镜、独轮车、强力水、超重派、整蛊垫等
- 当前模型：缺失
- Dotabuff 对照：大多是功能型使用物，部分可能有伤害或控制。
- 是否计入固定爆发：待逐个确认
- 需要输入：具体使用物
- 人工判断：当前比较文件只有“使用”文本，不能自动建伤害。
- 问题记录：
  - 需要从原始技能详情补字段，否则容易漏掉特殊道具效果。
- 修正建议：
  - 单独建 Ringmaster souvenir 子模型。
