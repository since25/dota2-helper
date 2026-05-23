# 天涯墨客（Grimstroke）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：墨客

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：1
- 忽略项：1
- 需要状态输入项：4
- 持续伤害项：2
- 多波伤害项：2
- 普攻相关项：0

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`Ink Swell` 当前用 tick 字段建持续伤害，但实际需要按最高伤害/蓄满时间处理；`Phantom's Embrace` 漏撕裂伤害。
- 是否缺少关键输入：`Stroke of Fate` 需要命中单位数；`Phantom's Embrace` 需要是否存活到撕裂；`Ink Swell` 需要作用/蓄满时间。
- 是否需要修改模型：需要补多单位增伤、撕裂伤害和墨涌蓄力模型。

## 技能复核

### Stroke of Fate
- 中文名：绝笔
- 当前模型：implemented / instant_fixed
- 字段对照：`damage: 100/160/220/280`、`bonus_damage_per_hero: 20/40/60/80`、`bonus_damage_per_creep: 10/20/30/40`
- 是否计入固定爆发：当前只计基础伤害
- 需要输入：`hero_hit_before_target`、`creep_hit_before_target`
- 人工判断：基础伤害正确，但穿过单位增伤未计入。
- 修正建议：总伤害 = 基础 + 前序英雄/非英雄增伤。

### Phantom's Embrace
- 中文名：戾影
- 当前模型：implemented / sustained_dps
- 字段对照：`damage_per_second: 10/20/30/40`、`latch_duration: 5`、`pop_damage: 120/200/280/360`
- 是否计入固定爆发：否
- 需要输入：`active_duration`、`pop_triggered`
- 人工判断：持续伤害部分正确，但漏掉幻影存活结束后的撕裂伤害。
- 修正建议：拆成 sustained + pop instant 组件。

### Ink Swell
- 中文名：墨涌
- 当前模型：implemented / sustained_dps
- 字段对照：`max_damage: 90/180/270/360`、`damage_per_tick: 6/9/12/15`、`tick_dps_tooltip: 30/45/60/75`、`max_threshold_duration: 2.5`
- 是否计入固定爆发：否
- 需要输入：`charge_duration`
- 人工判断：当前模型不够准确。墨涌最终爆炸伤害与蓄力/接触时间相关，应以最高伤害和阈值表达。
- 修正建议：蓄力型伤害模型，按 `charge_duration / max_threshold_duration` 到 `max_damage`。

### Soulbind
- 中文名：缚魂
- 当前模型：reference_only / debuff_reference
- 字段对照：`chain_duration: 6/7/8`、`chain_latch_radius: 600`
- 是否计入固定爆发：否
- 人工判断：正确。它复制/绑定技能目标，不直接造成伤害。

### Ink Trail
- 中文名：墨痕
- 当前模型：ignored
- 字段对照：`damage_reduction: 5%`
- 是否计入固定爆发：否
- 人工判断：正确。承伤降低不是输出。

## 待办
- [x] 完成字段语义复核。
- [x] 标记多单位增伤和撕裂伤害缺口。
- [ ] 修正绝笔增伤、戾影撕裂、墨涌蓄力模型。
