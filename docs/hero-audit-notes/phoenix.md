# 凤凰（Phoenix）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：凤凰

## 模型概览
- 技能条目数：7
- 已实现伤害：4
- 参考项：1
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：4
- 多波伤害项：1
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型大方向可用，但 `Sun Ray` 缺最大生命百分比伤害，`Fire Spirits` 需要命中火灵数量。
- 是否存在误计入固定爆发：未发现明显瞬时误计入，但多个技能不能默认打满。
- 是否缺少关键输入：`active_duration`、`spirit_hit_count`、`target_max_health`、`phoenix_missing_health`。
- 是否需要修改模型：需要补充百分比生命和命中数量。

## 技能复核

### Icarus Dive
- 中文名：凤凰冲击
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage_per_second=20/40/60/80`、`duration=4`
- Dotabuff 对照：路径持续灼烧魔法伤害。
- 是否计入固定爆发：否
- 需要输入：`active_duration`
- 理论总量：80/160/240/320
- 人工判断：正确。需要按实际接触时间计算。
- 问题记录：
  - 默认打满可能高估。
- 修正建议：
  - 保持持续伤害，并在 UI 暴露作用时间。

### Fire Spirits / Launch Fire Spirit
- 中文名：烈火精灵 / 发射烈火精灵
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：每个火灵持续伤害字段、`spirit_count=5`
- Dotabuff 对照：多个火灵，命中后持续造成魔法伤害并降低攻速。
- 是否计入固定爆发：有条件计入
- 需要输入：`spirit_hit_count`、`active_duration`
- 人工判断：持续伤害方向正确，但必须乘以命中火灵数量。
- 问题记录：
  - 只算一个火灵会低估；默认全部命中又会高估。
- 修正建议：
  - 增加命中数量输入，默认 1 或用户手动指定。

### Sun Ray
- 中文名：烈日炙烤
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：基础每秒伤害字段、`hp_perc_damage=1.5/3/4.5/6%`
- Dotabuff 对照：每秒基础伤害加目标最大生命值百分比伤害。
- 是否计入固定爆发：否，按持续时间计算
- 需要输入：`target_max_health`、`active_duration`
- 人工判断：当前只算基础伤害不完整，会低估打肉核时的伤害。
- 问题记录：
  - 百分比生命伤害是技能核心。
- 修正建议：
  - 改为 `base_dps + target_max_health * percent_dps`。

### Dying Light
- 中文名：垂死之光
- 当前模型：reference_only / state_scaling
- Dotabuff 对照：基于凤凰缺失生命的光环/伤害或效果。
- 是否计入固定爆发：有条件计入
- 需要输入：`phoenix_missing_health`、`active_duration`
- 人工判断：当前作为参考可以接受，缺状态输入无法算确定值。
- 问题记录：
  - 需要确认当前版本字段后再实现。
- 修正建议：
  - 后续加入缺失生命缩放模型。

### Supernova
- 中文名：超新星
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage_per_sec=60/90/120`
- Dotabuff 对照：Dotabuff 显示 50/80/110，与本地存在版本差异；完成时眩晕。
- 是否计入固定爆发：否，按持续时间计算
- 需要输入：`active_duration`
- 人工判断：持续伤害模型正确，但需标记版本差异和完成眩晕。
- 问题记录：
  - 本地和 Dotabuff 数值不一致。
- 修正建议：
  - 以本地数据为计算源，同时在审核中保留差异。

### Toggle / Stop 子技能
- 中文名：停止/切换类子技能
- 当前模型：ignored
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。
