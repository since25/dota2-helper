# 赏金猎人（Bounty Hunter）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：6
- 已实现伤害：0
- 参考项：5
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型漏掉 Shuriken Toss 和 Jinada 的核心伤害，不能作为最终伤害模型。
- 是否存在误计入固定爆发：未发现；主要问题是应计伤害被 reference_only。
- 是否缺少关键输入：Jinada 需要攻击次数；Track 的伤害加深需要作为后续伤害修正。
- 是否需要修改模型：需要。Shuriken Toss 应为 instant_fixed，Jinada 应为 attack_modifier。

## 技能复核

### Shuriken Toss
- 中文名：投掷飞镖
- 当前模型：reference_only / debuff_reference
- 字段对照：本地 bonus_damage=100/170/240/310；Dotabuff 伤害 100/170/240/310。
- 人工判断：应改为 implemented / instant_fixed，damageKey=bonus_damage；当前只记录 cast_range 是错误遗漏。
- 问题记录：
  - 应改为 implemented / instant_fixed，damageKey=bonus_damage；当前只记录 cast_range 是错误遗漏。
- 修正建议：
  - 应改为 implemented / instant_fixed，damageKey=bonus_damage；当前只记录 cast_range 是错误遗漏。

### Jinada
- 中文名：忍术
- 当前模型：reference_only / debuff_reference
- 字段对照：本地 bonus_damage=70/105/140/175；Dotabuff 攻击力加成 70/105/140/175。
- 人工判断：应改为 attack_modifier 或 attack_sequence，输入 attack_count；当前 abilitycastrange reference 漏了核心伤害。
- 问题记录：
  - 应改为 attack_modifier 或 attack_sequence，输入 attack_count；当前 abilitycastrange reference 漏了核心伤害。
- 修正建议：
  - 应改为 attack_modifier 或 attack_sequence，输入 attack_count；当前 abilitycastrange reference 漏了核心伤害。

### Shadow Walk
- 中文名：暗影步
- 当前模型：reference_only / debuff_reference
- 字段对照：stun_duration=1/1.2/1.4/1.6；duration=20/25/30/35。
- 人工判断：正确不计直接伤害；可作为控制窗口。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Friendly Shadow
- 中文名：暗影情谊
- 当前模型：reference_only / debuff_reference
- 字段对照：abilitycastrange=650。
- 人工判断：辅助隐身，不是伤害；可保留。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Big Game Hunter
- 中文名：职业猎人
- 当前模型：ignored
- 字段对照：kill_assist_gold_bonus_percent=15。
- 人工判断：经济收益，不是伤害；忽略合理。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Track
- 中文名：追踪术
- 当前模型：reference_only / debuff_reference
- 字段对照：target_damage_amp=8%/12%/16%；duration=25。
- 人工判断：正确不直接计入固定爆发；应作为 damage_amp modifier 影响后续伤害。
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
