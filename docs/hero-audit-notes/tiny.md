# 小小（Tiny）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：小小

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：4
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：6
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：4

## 复核结论
- 总体判断：`Avalanche`、`Toss` 基础伤害可用，但 Tree/Grow 体系大量普攻修正未计算。
- 是否存在误计入固定爆发：`Avalanche` 标为 instant 可接受但实际是 1.5 秒多 tick。
- 是否缺少关键输入：Grow 等级、抓树攻击次数、树木连掷命中次数、普攻伤害。
- 是否需要修改模型：需要。

## 技能复核

### Avalanche
- 中文名：山崩
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`avalanche_damage=90/180/270/360`、`tick_count=5`
- Dotabuff 对照：1.5 秒内多 tick 魔法总伤害。
- 是否计入固定爆发：可计入理论总量
- 需要输入：可选 `active_duration`
- 人工判断：总量正确，但不是瞬时。
- 问题记录：
  - 极短窗口或走出范围时不能默认全吃。
- 修正建议：
  - 标为 short_tick_total。

### Toss
- 中文名：投掷
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`toss_damage=90/180/270/360`
- Dotabuff 对照：魔法伤害。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：基础正确。
- 问题记录：
  - Grow 会提供投掷额外伤害，需要联动。
- 修正建议：
  - 加入 Grow toss_bonus_damage。

### Tree Grab / Tree Throw / Tree Volley
- 中文名：抓树 / 扔树 / 树木连掷
- 当前模型：reference_only
- 本地 rawAttributes：抓树 `bonus_damage=10/20/30/40`、攻击次数；Tree Volley `interval=0.5`、`abilitychanneltime=2.5`
- Dotabuff 对照：物理攻击修正、投掷树木和多次连掷。
- 是否计入固定爆发：有条件计入
- 需要输入：`hero_attack_damage`、`attack_count`、`tree_hit_count`
- 人工判断：当前漏算树体系伤害。
- 问题记录：
  - 不应把施法距离作为语义。
- 修正建议：
  - 建为 attack_bonus、tree_throw、tree_volley multi_hit。

### Grow
- 中文名：长大
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=55/110/165`、`toss_bonus_damage=50/175/300`
- Dotabuff 对照：攻击力提升、投掷额外伤害、攻速降低。
- 是否计入固定爆发：否，作为普攻/Toss 修正。
- 需要输入：`grow_level`
- 人工判断：当前只引用攻速降低不完整。
- 问题记录：
  - Grow 是 Tiny 伤害核心修正。
- 修正建议：
  - 接入 attack_damage 和 toss_bonus。

### Insurmountable
- 中文名：不可逾越
- 当前模型：ignored
- Dotabuff 对照：力量转抗性，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 抗性不是伤害。
- 修正建议：
  - 不进入伤害计算。
