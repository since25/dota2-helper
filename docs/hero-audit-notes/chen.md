# 陈（Chen）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型并确认版本数值
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：4
- 已实现伤害：1
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：Penitence 结构正确但数值与 Dotabuff 差异；召唤/劝化单位输出未建模。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：Holy Persuasion 需要单位数量、单位攻击、持续时间；Divine Favor/Hand of God 是治疗。
- 是否需要修改模型：需要确认 Penitence 版本数值，并补劝化单位输出 reference。

## 技能复核

### Penitence
- 中文名：赎罪
- 当前模型：implemented / instant_fixed
- 字段对照：本地 damage=50/75/100/125；Dotabuff 伤害 50/100/150/200。
- 人工判断：结构正确，但数值差异明显，需要确认数据源版本。
- 问题记录：
  - 结构正确，但数值差异明显，需要确认数据源版本。
- 修正建议：
  - 结构正确，但数值差异明显，需要确认数据源版本。

### Holy Persuasion
- 中文名：神圣劝化
- 当前模型：reference_only / debuff_reference
- 字段对照：max_units=1/2/3/4；damage_bonus=0/6/12/18%；level_req=3/4/5/6。
- 人工判断：核心在被控制单位输出，应作为 summon/unit proxy，而不是 cast range。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Divine Favor
- 中文名：神力恩泽
- 当前模型：reference_only / debuff_reference
- 字段对照：heal_rate=1.5/3/4.5/6；bonus_armor=5/10/15/20；heal_amp。
- 人工判断：治疗/护甲，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Zealot
- 中文名：狂热者
- 当前模型：missing
- 字段对照：Dotabuff 无字段。
- 人工判断：若当前版本有固定先天但无伤害，暂不处理。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Hand of God
- 中文名：上帝之手
- 当前模型：reference_only / debuff_reference
- 字段对照：heal_amount=200/300/400；heal_per_second=20/30/40。
- 人工判断：全局治疗，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
