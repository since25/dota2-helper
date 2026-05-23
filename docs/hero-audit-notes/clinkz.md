# 克林克兹（Clinkz）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：7
- 已实现伤害：0
- 参考项：4
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前 Clinkz 模型几乎漏掉所有核心输出机制。
- 是否存在误计入固定爆发：未发现；主要是输出未建模。
- 是否缺少关键输入：Searing Arrows 需要攻击次数；Burning Barrage 需要箭矢命中数和攻击力；Burning Army/Skeleton Walk 需要召唤物数量、攻击间隔和继承攻击力。
- 是否需要修改模型：需要。补 attack_modifier、multi_projectile、summon proxy。

## 技能复核

### Strafe
- 中文名：扫射
- 当前模型：reference_only / debuff_reference
- 字段对照：attack_speed_bonus=120/160/200/240；duration=3.5；attack_range_bonus=200。
- 人工判断：应作为 attack_speed modifier，而不是 cast range。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Searing Arrows
- 中文名：灼热之箭
- 当前模型：reference_only / debuff_reference
- 字段对照：damage_bonus=20/35/50/65。
- 人工判断：核心普攻附加伤害，应改为 attack_modifier，输入 attack_count。
- 问题记录：
  - 核心普攻附加伤害，应改为 attack_modifier，输入 attack_count。
- 修正建议：
  - 核心普攻附加伤害，应改为 attack_modifier，输入 attack_count。

### Death Pact
- 中文名：死亡契约
- 当前模型：reference_only / debuff_reference
- 字段对照：health_gain=175/250/325/400；duration=45。
- 人工判断：生存/单位吞噬机制，不直接技能伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Burning Barrage
- 中文名：炽烈火雨
- 当前模型：ignored
- 字段对照：wave_count=6；damage_pct=75%；abilitychanneltime=2。
- 人工判断：核心输出技能，应为 multi_projectile/source_damage_percent，输入 hit_count 和 attack_damage。
- 问题记录:
  - 当前 ignored 会漏掉核心输出。
- 修正建议:
  - 改为 source_damage_percent 或 multi_projectile，输入 hit_count 和 attack_damage。

### Burning Army
- 中文名：烈焰之军
- 当前模型：reference_only / debuff_reference
- 字段对照：count=6；range=900；spawn_interval=0.1。
- 人工判断：召唤弓手输出未建模，需要 summon_count、attack_count。
- 问题记录：
  - 召唤弓手输出未建模，需要 summon_count、attack_count。
- 修正建议：
  - 召唤弓手输出未建模，需要 summon_count、attack_count。

### Skeleton Walk
- 中文名：骨隐步
- 当前模型：ignored
- 字段对照：skeleton_count=2/3/4；skeleton_duration=20/25/30；damage_percent=20%；attack_rate=1.6。
- 人工判断：召唤骷髅输出未建模，需要 summon proxy。
- 问题记录：
  - 召唤骷髅输出未建模，需要 summon proxy。
- 修正建议：
  - 召唤骷髅输出未建模，需要 summon proxy。

### Infernal Shred
- 中文名：地狱之裂
- 当前模型：ignored
- 字段对照：hero_stacks=3；max_armor_piercing_pct=20。
- 人工判断：护甲穿透/叠层机制，不直接伤害；可作为 armor modifier。
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
