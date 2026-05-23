# 潮汐猎人（Tidehunter）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：潮汐

## 模型概览
- 技能条目数：6
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 暂不支持项：1
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：`Gush`、`Anchor Smash`、`Ravage` 方向正确，但 `Ravage`/Storm Hammer 类同样需确认 raw damage 数组读取。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：锚击攻击伤害、巨浪减甲是否应用到后续物理伤害。
- 是否需要修改模型：需要小幅修正。

## 技能复核

### Leviathan's Catch
- 中文名：利维坦的渔获
- 当前模型：缺失
- Dotabuff 对照：comparison 标记 missing。
- 是否计入固定爆发：待确认
- 需要输入：待确认
- 人工判断：需要补数据来源。
- 问题记录：
  - 当前缺少技能字段。
- 修正建议：
  - 单独解析该技能。

### Gush
- 中文名：巨浪
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`gush_damage=100/160/220/280`、`negative_armor=3/4/5/6`
- Dotabuff 对照：魔法伤害、减速、减甲。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：伤害正确，减甲应作为后续物理修正。
- 问题记录：
  - 护甲降低不是伤害。
- 修正建议：
  - 接入 armor modifier。

### Kraken Shell
- 中文名：海妖外壳
- 当前模型：reference_only
- Dotabuff 对照：伤害格挡和强驱散，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - `damage_reduction` 不是对敌伤害。
- 修正建议：
  - 保留为防御参考。

### Anchor Smash
- 中文名：锚击
- 当前模型：implemented / attack_modifier
- 本地 rawAttributes：`attack_damage=50/100/150/200`
- Dotabuff 对照：一次物理攻击并附加攻击力加成，降低敌方攻击力。
- 是否计入固定爆发：有条件计入
- 需要输入：`hero_attack_damage`
- 人工判断：方向正确。
- 问题记录：
  - 需要和减甲状态联动。
- 修正建议：
  - 保持 attack modifier。

### Dead in the Water
- 中文名：重如铁锚
- 当前模型：reference_only
- 本地 raw damage：0
- Dotabuff 对照：限制位移/拖拽，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 魔法标签不代表有伤害。
- 修正建议：
  - 保留控制参考。

### Ravage
- 中文名：毁灭
- 当前模型：implemented / instant_fixed
- 本地 raw damage：275/375/475
- Dotabuff 对照：范围魔法伤害并眩晕。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确，但需确认 damageKey `dmg` 能读 raw 数组。
- 问题记录：
  - Dotabuff 页面没有展示伤害字段，raw 有 damage 数组。
- 修正建议：
  - 标准化 raw damage 读取。
