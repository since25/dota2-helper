# 幻影刺客（Phantom Assassin）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：PA、幻刺

## 模型概览
- 技能条目数：6
- 已实现伤害：2
- 参考项：3
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：3

## 复核结论
- 总体判断：当前模型方向基本正确，但 PA 的核心伤害必须围绕攻击伤害、攻击次数、暴击概率和目标生命值输入。
- 是否存在误计入固定爆发：未发现明显固定误计入。
- 是否缺少关键输入：缺 `hero_attack_damage`、`attack_count`、`crit_roll/expected_crit`、`target_max_health`。
- 是否需要修改模型：需要补充输入说明和百分比生命伤害模型。

## 技能复核

### Stifling Dagger
- 中文名：窒碍短匕
- 当前模型：implemented / source_damage_scaling
- 本地 rawAttributes：`base_damage=65/70/75/80%`，另有固定加成方向字段
- Dotabuff 对照：按攻击伤害百分比造成物理伤害，并可触发攻击特效。
- 是否计入固定爆发：有条件计入
- 需要输入：`hero_attack_damage`
- 人工判断：方向正确，但必须明确是普攻伤害缩放。
- 问题记录：
  - 缺攻击伤害时无法给确定数值。
- 修正建议：
  - 公式写为 `攻击伤害 * 百分比 + 固定项`，并继承物理减甲结算。

### Phantom Strike
- 中文名：幻影突袭
- 当前模型：reference_only
- Dotabuff 对照：位移和攻速窗口，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：`attack_count`
- 人工判断：正确。它影响后续普攻次数，不是独立技能伤害。
- 问题记录：
  - 对爆发窗口很重要，但不应作为 unknown 数值。
- 修正建议：
  - 后续进入攻击窗口模型。

### Blur
- 中文名：模糊
- 当前模型：reference_only
- Dotabuff 对照：闪避/隐匿/生存相关，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。

### Fan of Knives
- 中文名：刀阵旋风
- 当前模型：unsupported / percent_health
- 本地 rawAttributes：`pct_health_damage_initial=30%`
- Dotabuff 对照：按目标最大生命值造成物理伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`target_max_health`
- 人工判断：当前暂不支持可以接受，但应尽快建成百分比生命模型。
- 问题记录：
  - 漏算魔晶/特殊技能的关键百分比伤害。
- 修正建议：
  - 增加 `percent_max_health` 模型，并走物理减免。

### Immaterial
- 中文名：虚无缥缈
- 当前模型：ignored
- Dotabuff 对照：闪避/防御相关，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。

### Coup de Grace
- 中文名：恩赐解脱
- 当前模型：reference_only / crit
- 本地 rawAttributes：`crit_bonus=200/300/400%`
- Dotabuff 对照：暴击概率和暴击倍率；Dotabuff 显示 200/325/450 与本地存在版本差异。
- 是否计入固定爆发：有条件计入
- 需要输入：`attack_count`、`crit_roll` 或 `expected_crit`
- 人工判断：不能作为固定技能伤害，只能修正普攻/短匕伤害。
- 问题记录：
  - 本地与 Dotabuff 暴击倍率不一致，需要版本标记。
- 修正建议：
  - 增加 crit modifier 层，支持确定暴击和期望暴击两种模式。
