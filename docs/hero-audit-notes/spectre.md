# 幽鬼（Spectre）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：幽鬼

## 模型概览
- 技能条目数：6
- 已实现伤害：1
- 参考项：2
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：3

## 复核结论
- 总体判断：当前只覆盖了 `Spectral Dagger`，漏掉了 `Desolate` 和 `Dispersion` 两个核心条件伤害。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：目标是否孤立、承受伤害来源、距离、幻象攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Desolate
- 中文名：荒芜
- 当前模型：ignored
- 本地 rawAttributes：`bonus_damage=23`、`radius=350`
- Dotabuff 对照：目标附近没有友方单位时造成额外纯粹伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`target_is_isolated`、`attack_count`
- 人工判断：当前漏算幽鬼核心单点伤害。
- 问题记录：
  - 这是普攻/幻象攻击修正，不是独立施法伤害。
- 修正建议：
  - 建为 conditional attack bonus pure。

### Spectral Dagger
- 中文名：幽鬼之刃
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=70/120/170/220`
- Dotabuff 对照：页面显示 80/120/160/200，与本地存在版本差异。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：瞬时魔法伤害方向正确，计算应以本地字段为准。
- 问题记录：
  - Dotabuff 和本地数值不一致，需要版本标注。
- 修正建议：
  - 保持 instant，记录数据源版本差异。

### Shadow Step / Haunt
- 中文名：如影随形 / 鬼影重重
- 当前模型：reference_only
- 本地 rawAttributes：幻象继承攻击力、持续时间、承伤倍率。
- Dotabuff 对照：召唤幻象追击目标。
- 是否计入固定爆发：有条件计入幻象普攻
- 需要输入：`illusion_attack_count`、`target_is_isolated`
- 人工判断：当前作为参考可以接受，但会低估幽鬼大招期间输出。
- 问题记录：
  - 幻象攻击可触发荒芜语境，需要幻象层支持。
- 修正建议：
  - 进入 illusion attack 模型。

### Dispersion
- 中文名：折射
- 当前模型：ignored
- 本地 rawAttributes：`damage_reflection_pct=8%/12%/16%/20%`、距离范围
- Dotabuff 对照：反弹承受伤害，按距离衰减。
- 是否计入固定爆发：有条件计入
- 需要输入：`incoming_damage`、`distance`
- 人工判断：不能作为主动爆发，但在承伤场景是重要反伤。
- 问题记录：
  - 需要外部伤害源输入。
- 修正建议：
  - 建为 damage_reflection model。

### Reality
- 中文名：空降
- 当前模型：ignored
- Dotabuff 对照：切换至幻象位置，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不进入伤害计算。
