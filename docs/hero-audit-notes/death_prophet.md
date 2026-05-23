# 死亡先知（Death Prophet）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：dp

## 模型概览
- 技能条目数：4
- 已实现伤害：2
- 参考项：2
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：基本可用。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：`Spirit Siphon` 需要连接数量/作用时间；`Exorcism` 需要恶灵命中次数。
- 是否需要修改模型：核心字段暂不需要；建议补充输入声明和缺失先天 `Witchcraft` 的记录。

## 技能复核

### Crypt Swarm
- 中文名：地穴虫群
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: damage`
- 本地 rawAttributes：`damage: 100/175/250/325`、`range: 900`
- Dotabuff 对照：伤害 100/175/250/325，伤害类型为魔法。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。标准瞬时魔法伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Silence
- 中文名：沉默魔法
- 当前模型：reference_only / debuff_reference
- 当前字段：`valueKey: abilityduration`
- 本地 rawAttributes：`abilityduration: 3.5/4/4.5/5`、`radius: 450`
- Dotabuff 对照：作用范围 450。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。沉默不造成直接伤害。
- 问题记录：
  - 本地存在 `damage_per_second: 0`，不能被提取成伤害。
- 修正建议：
  - 作为控制窗口参考即可。

### Spirit Siphon
- 中文名：吸魂巫术
- 当前模型：implemented / sustained_dps
- 当前字段：`damagePerSecondKey: damage`；`durationKey: haunt_duration`
- 本地 rawAttributes：`damage: 25/50/75/100`、`haunt_duration: 6`、`max_charges: 1/2/3/4`
- Dotabuff 对照：伤害 25/50/75/100，持续时间 6，伤害类型为魔法。
- 是否计入固定爆发：否
- 需要输入：`active_duration`、`link_count`
- 人工判断：按单条连接计算是正确的，但完整输出还要考虑充能数量和是否持续连接。
- 问题记录：
  - 当前 reason 已说明单条连接，但模型未显式声明 `link_count`。
- 修正建议：
  - 增加连接数量输入；默认按 1 条连接。

### Exorcism
- 中文名：驱使恶灵
- 当前模型：reference_only / state_scaling
- 当前字段：`valueKey: average_damage`
- 本地 rawAttributes：`spirits: 10/18/26`、`min_damage: 62`、`max_damage: 67`、`average_damage: 64`、`abilityduration: 40`
- Dotabuff 对照：恶灵数量 10/18/26，持续时间 40，伤害类型为物理。
- 是否计入固定爆发：否
- 需要输入：`spirit_hit_count`
- 人工判断：正确。大招不是简单用持续时间相乘，实际命中取决于站位和回魂路径。
- 问题记录：
  - Dotabuff 还显示先天 `Witchcraft`，本地模型未列入，但它只是移动速度加成。
- 修正建议：
  - 保留命中次数输入方向，后续可给理论上限和实战默认值。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [x] 对需要输入的技能补充计算器参数或明确不计入固定爆发。
- [ ] 后续给 `Spirit Siphon` 增加连接数量输入。
