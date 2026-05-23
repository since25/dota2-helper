# 酒仙（Brewmaster）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
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
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：Thunder Clap/Cinder Brew 基础字段可用，但 Primal Split 被错误当作瞬时伤害。
- 是否存在误计入固定爆发：Primal Split 的大地战士攻击力被默认计入 fixed instant，属于高估。
- 是否缺少关键输入：Cinder Brew 需要是否点燃/作用时间；Primal Split 需要召唤物攻击次数/持续时间。
- 是否需要修改模型：需要。Primal Split 应改为 summon/unit proxy，不进入固定爆发。

## 技能复核

### Thunder Clap
- 中文名：雷霆一击
- 当前模型：implemented / instant_fixed
- 字段对照：damage=80/160/240/320；duration=4。
- 人工判断：正确，可计入固定瞬时魔法伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Cinder Brew
- 中文名：余烬佳酿
- 当前模型：implemented / instant_fixed
- 字段对照：total_ignite_damage=80/160/240/320；barrel_impact_damage=40/70/100/130。
- 人工判断：总燃烧伤害字段正确，但需要点燃条件；酒桶撞击伤害可作为额外组件。
- 问题记录：
  - 总燃烧伤害字段正确，但需要点燃条件；酒桶撞击伤害可作为额外组件。
- 修正建议：
  - 总燃烧伤害字段正确，但需要点燃条件；酒桶撞击伤害可作为额外组件。

### Drunken Brawler
- 中文名：醉拳
- 当前模型：reference_only / debuff_reference
- 字段对照：crit_chance=20%；crit_multiplier=120/140/160/180%；attack_speed=10/20/30/40。
- 人工判断：不应作为固定伤害；但暴击/攻速是普攻 DPS 修正，应后续建模。
- 问题记录：
  - 不应作为固定伤害；但暴击/攻速是普攻 DPS 修正，应后续建模。
- 修正建议：
  - 不应作为固定伤害；但暴击/攻速是普攻 DPS 修正，应后续建模。

### Liquid Courage
- 中文名：壮胆酒
- 当前模型：reference_only / debuff_reference
- 字段对照：status_resist=10%；min/max speed。
- 人工判断：生存/移速机制，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Primal Split
- 中文名：元素分离
- 当前模型：implemented / instant_fixed
- 字段对照：tooltip_earth_brewling_damage=35/70/105/140；另有 storm/fire 攻击力。
- 人工判断：错误：这些是召唤单位攻击力，不是施法瞬间伤害。应改为 summon.attack_damage，并需要 brewling_attack_count/active_duration。
- 问题记录：
  - 错误：这些是召唤单位攻击力，不是施法瞬间伤害。应改为 summon.attack_damage，并需要 brewling_attack_count/active_duration。
- 修正建议：
  - 错误：这些是召唤单位攻击力，不是施法瞬间伤害。应改为 summon.attack_damage，并需要 brewling_attack_count/active_duration。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
