# 拉比克（Rubick）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：拉比克

## 模型概览
- 技能条目数：8
- 已实现伤害：1
- 参考项：4
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：基础模型可用但偏保守，`Fade Bolt` 直接伤害正确，`Arcane Supremacy` 的技能增强需要进入全局修正。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：缺少跳跃目标序号、是否应用技能增强、偷取技能本体数据。
- 是否需要修改模型：需要补技能增强和跳跃递减。

## 技能复核

### Telekinesis
- 中文名：隔空取物
- 当前模型：reference_only
- Dotabuff 对照：控制、滞空、落地眩晕，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 作用半径和投掷距离不是伤害。
- 修正建议：
  - 保留为控制窗口参考。

### Fade Bolt
- 中文名：弱化能流
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=100/175/250/325`、`jump_damage_reduction_pct=6%`
- Dotabuff 对照：魔法伤害，后续跳跃递减，并降低攻击/技能伤害。
- 是否计入固定爆发：是
- 需要输入：`jump_index` 可选
- 人工判断：首目标伤害正确，但多目标跳跃需要递减。
- 问题记录：
  - `duration=10` 是减伤持续时间，不是伤害持续时间。
- 修正建议：
  - 增加 jump reduction；减伤作为 debuff 参考。

### Arcane Supremacy
- 中文名：奥术至尊
- 当前模型：reference_only
- 本地 rawAttributes：`cast_range=60/120/180/240`、`spell_amp=11%/16%/21%/26%`
- Dotabuff 对照：施法距离和技能增强。
- 是否计入固定爆发：否，但应修正自身技能伤害。
- 需要输入：`apply_spell_amp`
- 人工判断：当前语义写成施法距离参考不完整。`spell_amp` 是伤害计算关键字段。
- 问题记录：
  - LLM 需要知道拉比克自身技能会被技能增强放大。
- 修正建议：
  - 增加全局 spell amp modifier。

### Spell Steal / Stolen Spell
- 中文名：技能窃取 / 窃取技能
- 当前模型：reference_only / ignored
- Dotabuff 对照：偷取敌方技能并降低冷却。
- 是否计入固定爆发：取决于偷到的技能
- 需要输入：`stolen_spell_model`
- 人工判断：当前不考虑偷技能细节可以接受，但不应把它列为普通数据缺口。
- 问题记录：
  - 这是动态跨英雄技能问题，只有用户指定偷到哪个技能时才计算。
- 修正建议：
  - 后续提供“选择偷取技能”入口，而不是在 Rubick 静态模型里展开全部英雄。

### Telekinesis Land
- 中文名：隔空取物落地
- 当前模型：ignored
- Dotabuff 对照：落点/范围子技能，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。

### Curiosity
- 中文名：奇心
- 当前模型：reference_only / state_scaling
- 本地 rawAttributes：`curiosity_attack_damage=1`、`curiosity_per_spell_cast=2`
- Dotabuff 对照：状态叠加类增益，不是距离伤害。
- 是否计入固定爆发：否，作为攻击力/技能修正。
- 需要输入：`curiosity_stack_count`
- 人工判断：当前 distance_scaling 语义错误。
- 问题记录：
  - 不是距离系数伤害；会误导计算器。
- 修正建议：
  - 改为 stack buff modifier。
