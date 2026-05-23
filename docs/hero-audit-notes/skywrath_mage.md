# 天怒法师（Skywrath Mage）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：天怒

## 模型概览
- 技能条目数：6
- 已实现伤害：2
- 参考项：3
- 忽略项：0
- 暂不支持项：1
- 需要状态输入项：3
- 持续伤害项：1
- 多波伤害项：1
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型漏算 `Arcane Bolt`，`Mystic Flare` 不能按瞬时打满表达。
- 是否存在误计入固定爆发：存在风险。`Mystic Flare` 总伤害是 2 秒区域分摊，不是瞬时必满。
- 是否缺少关键输入：智力、目标数量/分摊、作用时间、上古封印是否生效。
- 是否需要修改模型：需要。

## 技能复核

### Shield of the Scion
- 中文名：天裔之盾
- 当前模型：reference_only
- 本地 rawAttributes：`damage_barrier=13.5`
- Dotabuff 对照：护盾，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前不计伤害正确，但语义不应是 stack damage。
- 问题记录：
  - 护盾值不是伤害。
- 修正建议：
  - 改为 defense barrier reference。

### Arcane Bolt
- 中文名：奥法鹰隼
- 当前模型：reference_only / attribute_scaling
- 本地 rawAttributes：`bolt_damage=60/90/120/150`、`int_multiplier=1.5`
- Dotabuff 对照：基础魔法伤害 + 智力系数。
- 是否计入固定爆发：有条件计入
- 需要输入：`skywrath_intelligence`
- 人工判断：应建为可计算伤害。
- 问题记录：
  - 当前漏算天怒核心技能。
- 修正建议：
  - 公式为 `bolt_damage + 智力 * 1.5`。

### Concussive Shot
- 中文名：震荡光弹
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=120/180/240/300`
- Dotabuff 对照：范围魔法瞬时伤害并减速。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 减速字段不进伤害。
- 修正建议：
  - 不需要修改。

### Ancient Seal
- 中文名：上古封印
- 当前模型：reference_only
- 本地 rawAttributes：`resist_debuff=-20%/-25%/-30%/-35%`
- Dotabuff 对照：魔法伤害加深并沉默。
- 是否计入固定爆发：否，作为魔法承伤修正。
- 需要输入：`ancient_seal_active`
- 人工判断：当前不直接计伤害正确，但应接入魔法伤害修正。
- 问题记录：
  - 负数表示降低目标魔抗/加深魔法伤害。
- 修正建议：
  - 进入 magic resistance modifier。

### Staff of the Scion
- 中文名：天裔之杖
- 当前模型：缺失
- Dotabuff 对照：当前比较文件缺字段。
- 是否计入固定爆发：待确认
- 需要输入：待确认
- 人工判断：需要补源数据。
- 问题记录：
  - 当前 missing。
- 修正建议：
  - 单独抓取/解析该技能。

### Mystic Flare
- 中文名：神秘之耀
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=800/1200/1600`、`duration=2`、`damage_interval=0.1`
- Dotabuff 对照：2 秒区域总伤害，通常在范围内单位间分摊。
- 是否计入固定爆发：否，按作用时间和目标数计算。
- 需要输入：`active_duration`、`target_count`
- 人工判断：当前瞬时模型过度简化。
- 问题记录：
  - 默认 1 人吃满是理论上限，不是稳定爆发。
- 修正建议：
  - 改为 area_total_over_time，支持目标数分摊。
