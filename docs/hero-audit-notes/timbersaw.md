# 伐木机（Timbersaw）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：伐木机

## 模型概览
- 技能条目数：7
- 已实现伤害：3
- 参考项：1
- 忽略项：3
- 暂不支持项：1
- 需要状态输入项：4
- 持续伤害项：2
- 多波伤害项：2
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型漏掉 `Whirling Death` 的可计算基础伤害，`Chakram` 也缺飞行/返回伤害。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：是否砍树、Chakram 命中过程、作用时间。
- 是否需要修改模型：需要。

## 技能复核

### Whirling Death
- 中文名：死亡旋风
- 当前模型：reference_only / attribute_scaling
- 本地 rawAttributes：`whirling_damage=75/120/165/210`、`tree_damage_scale=9/16/23/30`
- Dotabuff 对照：纯粹伤害，砍树时额外伤害并降低属性。
- 是否计入固定爆发：是
- 需要输入：`tree_cut`
- 人工判断：当前模型错误。它不是属性缩放伤害，而是基础纯粹伤害 + 砍树额外伤害。
- 问题记录：
  - Dotabuff 显示与本地基础数值不一致。
- 修正建议：
  - 改为 instant_fixed + tree_bonus。

### Timber Chain
- 中文名：伐木锯链
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=45/100/155/210`
- Dotabuff 对照：穿越路径造成纯粹伤害；Dotabuff 显示略有差异。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 本地和 Dotabuff 数值不一致。
- 修正建议：
  - 以本地为准，记录版本差异。

### Reactive Armor / Exposure Therapy
- 中文名：活性护甲 / 暴露疗法
- 当前模型：ignored
- Dotabuff 对照：护甲、回血、回魔，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 魔法标签不是对敌伤害。
- 修正建议：
  - 防御/资源层处理。

### Flamethrower
- 中文名：喷火装置
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage_per_second=70`、`duration=8`
- Dotabuff 对照：持续魔法伤害。
- 是否计入固定爆发：否，按作用时间计算。
- 需要输入：`active_duration`
- 人工判断：正确。
- 问题记录：
  - 对建筑伤害修正不用于英雄。
- 修正建议：
  - UI 暴露作用时间。

### Chakram / Return Chakram / Twisted Chakram
- 中文名：锯齿飞轮 / 收回飞轮 / 锯齿轮旋
- 当前模型：implemented / sustained_dps；Return ignored；Twisted missing
- 本地 rawAttributes：`pass_damage=100/150/200`、`damage_per_second=50/75/100`
- Dotabuff 对照：飞行命中伤害 + 停留持续伤害，返回也可命中。
- 是否计入固定爆发：有条件计入
- 需要输入：`pass_hit_count`、`active_duration`
- 人工判断：当前只算 DPS 不完整，漏飞行/返回命中。
- 问题记录：
  - pass damage 是重要爆发来源。
- 修正建议：
  - 拆为 pass_damage multi_hit + sustained_dps。
