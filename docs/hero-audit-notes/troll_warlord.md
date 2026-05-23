# 巨魔战将（Troll Warlord）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：巨魔

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：两个飞斧基础可用，但 Berserker's Rage 不应默认计入，Fervor/Battle Trance 是普攻窗口核心。
- 是否存在误计入固定爆发：存在。`Berserker's Rage` 的残废伤害是概率触发，不应默认计入。
- 是否缺少关键输入：攻击次数、触发模式、Fervor 层数、Battle Trance 是否开启。
- 是否需要修改模型：需要。

## 技能复核

### Battle Stance
- 中文名：战斗姿态
- 当前模型：reference_only
- Dotabuff 对照：切换远近战姿态，影响攻击距离/BAT/护甲。
- 是否计入固定爆发：否
- 需要输入：`stance`
- 人工判断：正确不独立伤害。
- 问题记录：
  - 姿态会影响普攻频率和技能可用状态。
- 修正建议：
  - 作为 attack mode。

### Whirling Axes (Ranged)
- 中文名：旋风飞斧（远程）
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`axe_damage=60/80/100/120`、`axe_count=5`
- Dotabuff 对照：远程飞斧魔法伤害并减速。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：基础正确。`axe_count` 表示投掷斧数量，不应乘到单目标总伤害，除非多斧可重复命中需确认。
- 问题记录：
  - 通常单目标吃一次伤害。
- 修正建议：
  - 保持 instant。

### Whirling Axes (Melee)
- 中文名：旋风飞斧（近战）
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=50/100/150/200`
- Dotabuff 对照：Dotabuff 显示 75/120/165/210，与本地存在版本差异。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：方向正确，以本地为准。
- 问题记录：
  - 版本差异需要记录。
- 修正建议：
  - 保持 instant，记录版本。

### Fervor
- 中文名：热血战魂
- 当前模型：reference_only
- 本地 rawAttributes：`attack_speed=15/20/25/30`、`max_stacks=10`
- Dotabuff 对照：叠层攻速。
- 是否计入固定爆发：否，作为普攻次数修正。
- 需要输入：`fervor_stack_count`
- 人工判断：正确。
- 问题记录：
  - 影响攻击窗口，不是独立伤害。
- 修正建议：
  - 进入 attack speed modifier。

### Berserker's Rage
- 中文名：狂战士之怒
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`maim_chance=20%`、`maim_damage=10/15/20/25`
- Dotabuff 对照：概率诱捕/残废并造成残废伤害。
- 是否计入固定爆发：否，除非触发。
- 需要输入：`proc_mode`、`attack_count`
- 人工判断：当前默认计入不合适。
- 问题记录：
  - 残废伤害是概率攻击特效。
- 修正建议：
  - 改为 proc attack modifier。

### Battle Trance
- 中文名：战斗专注
- 当前模型：reference_only
- Dotabuff 对照：攻速、吸血、移速提升。
- 是否计入固定爆发：否，作为攻击窗口修正。
- 需要输入：`battle_trance_active`
- 人工判断：正确。
- 问题记录：
  - 吸血不是伤害。
- 修正建议：
  - 进入 attack speed/lifesteal modifier。
