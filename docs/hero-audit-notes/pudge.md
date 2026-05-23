# 帕吉（Pudge）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：屠夫

## 模型概览
- 技能条目数：5
- 已实现伤害：4
- 参考项：0
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：3
- 持续伤害项：2
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型有明显错误，`Rot` 和 `Meat Shield` 不能按瞬时伤害处理，`Dismember` 还缺力量系数。
- 是否存在误计入固定爆发：存在。`Meat Shield` 是伤害格挡，不是伤害；`Rot` 是持续自伤/范围伤害，不是瞬时伤害。
- 是否缺少关键输入：缺少 `rot_active_duration`、`channel_duration`、`pudge_strength`。
- 是否需要修改模型：需要。

## 技能复核

### Meat Hook
- 中文名：肉钩
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=150/220/290/360`
- Dotabuff 对照：纯粹瞬时伤害。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 视野、距离、钩速不应进入伤害。
- 修正建议：
  - 不需要修改。

### Rot
- 中文名：腐烂
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`rot_damage=30/60/90/120`、`rot_tick=0.2`
- Dotabuff 对照：每秒魔法伤害，同时对自己和敌人作用。
- 是否计入固定爆发：否，按作用时间计算。
- 需要输入：`active_duration`
- 人工判断：当前模型错误。`rot_damage` 是持续伤害速率，不是一次性伤害。
- 问题记录：
  - 会把开关型持续伤害错误显示成瞬时爆发。
- 修正建议：
  - 改为 `sustained_dps`，显式暴露作用时间。

### Meat Shield
- 中文名：肉盾
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage_block=8/14/20/26`、`duration=4/5/6/7`
- Dotabuff 对照：伤害格挡和持续时间。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：当前模型错误。伤害格挡不是对敌伤害。
- 问题记录：
  - `damage_block` 被误读为 damage，会产生不存在的输出。
- 修正建议：
  - 改为 `reference_only` 或防御模型。

### Flesh Heap
- 中文名：腐肉堆积
- 当前模型：ignored
- 本地 rawAttributes：`flesh_heap_strength_buff_amount=1.6`
- Dotabuff 对照：力量成长/堆积，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。它间接影响生命和 Dismember 力量伤害。
- 问题记录：
  - 后续若计算 Dismember，要读取当前力量而不是直接读取堆积层数。
- 修正建议：
  - 保留为属性来源参考。

### Dismember
- 中文名：肢解
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`dismember_damage=80/100/120`、`strength_damage=0.3/0.6/0.9`、`abilitychanneltime=2.75`
- Dotabuff 对照：每秒魔法伤害，并按力量追加伤害。
- 是否计入固定爆发：否，按持续施法时间计算。
- 需要输入：`channel_duration`、`pudge_strength`
- 人工判断：持续伤害方向正确，但当前只算基础 DPS 会低估。
- 问题记录：
  - 缺少力量系数；实际公式应包含 `力量 * 系数`。
- 修正建议：
  - 改为 `base_dps + strength_scaling_dps`。
