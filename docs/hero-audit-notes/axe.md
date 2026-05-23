# 斧王（Axe）伤害模型复核

## 状态
- 复核状态：已复核，可用但建议补输入
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：5
- 已实现伤害：3
- 参考项：2
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：主要伤害字段正确，Counter Helix 已避免默认计入固定爆发。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：Counter Helix 需要触发次数；Battle Hunger 需要作用时间；Culling Blade 实战还涉及斩杀阈值/击杀刷新但本地字段只给伤害。
- 是否需要修改模型：非强制；建议补 Counter Helix trigger_count。

## 技能复核

### Berserker's Call
- 中文名：狂战士之吼
- 当前模型：reference_only / debuff_reference
- 字段对照：duration=2.1/2.4/2.7/3；bonus_armor=12/13/14/15
- 数据来源对照：Dotabuff 持续时间和护甲提升一致。
- 人工判断：正确。嘲讽和护甲不是伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

### Battle Hunger
- 中文名：战斗饥渴
- 当前模型：implemented / sustained_dps
- 字段对照：damage_per_second=12/18/24/30；duration=12
- 数据来源对照：Dotabuff 每秒伤害和持续时间一致。
- 人工判断：正确。持续伤害不应作为瞬时固定爆发。
- 问题记录：
  - 建议补 active_duration。
- 修正建议：
  - 建议补 active_duration。

### Counter Helix
- 中文名：反击螺旋
- 当前模型：implemented / instant_fixed
- 字段对照：damage=100/120/140/160；trigger_attacks=7/6/5/4
- 数据来源对照：Dotabuff 伤害和所需攻击次数一致。
- 人工判断：数值正确，且 defaultIncluded=false 合理。
- 问题记录：
  - 建议改为 attack_sequence 或加 trigger_count 输入。
- 修正建议：
  - 建议改为 attack_sequence 或加 trigger_count 输入。

### Culling Blade
- 中文名：淘汰之刃
- 当前模型：implemented / instant_fixed
- 字段对照：damage=275/375/475
- 数据来源对照：Dotabuff 伤害 275/375/475。
- 人工判断：正确，可计入固定伤害；斩杀判定需要另外做血量阈值逻辑。
- 问题记录：
  - 后续可加 execute_threshold。
- 修正建议：
  - 后续可加 execute_threshold。

### One Man Army
- 中文名：一人之军
- 当前模型：reference_only / debuff_reference
- 字段对照：armor_pct_as_strength=50
- 数据来源对照：Dotabuff 无直接伤害字段。
- 人工判断：正确，不直接造成伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 无。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
