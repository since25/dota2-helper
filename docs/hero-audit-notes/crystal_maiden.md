# 水晶室女（Crystal Maiden）伤害模型复核

## 状态
- 复核状态：已复核，可用但建议补输入
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：3
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：1
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：当前模型比自动模型更安全，Freezing Field 已避免被当作单次固定伤害。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：Freezing Field 需要命中爆炸次数/持续施法时间；Frostbite 需要作用时间。
- 是否需要修改模型：非强制；可补 Crystal Clone 的 frostbite_radius 字段展示，以及 Freezing Field hit_count UI。

## 技能复核

### Crystal Nova
- 中文名：冰霜新星
- 当前模型：implemented / instant_fixed
- 字段对照：nova_damage=110/160/210/260；duration=4。
- 人工判断：正确，可计入固定魔法伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Frostbite
- 中文名：冰封禁制
- 当前模型：implemented / sustained_dps
- 字段对照：damage_per_second=100；duration=1.5/2/2.5/3；tick_interval=0.25。
- 人工判断：正确，持续伤害；需要作用时间控制。
- 问题记录：
  - 正确，持续伤害；需要作用时间控制。
- 修正建议：
  - 正确，持续伤害；需要作用时间控制。

### Arcane Aura
- 中文名：奥术光环
- 当前模型：ignored
- 字段对照：mana regen/amp。
- 人工判断：资源恢复，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Crystal Clone
- 中文名：冰晶克隆
- 当前模型：reference_only / debuff_reference
- 字段对照：hop_distance=275；clone_duration=5；frostbite_radius=450。
- 人工判断：控制/位移，不直接伤害；当前 area reference 可用。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Glacial Guard
- 中文名：冰川护体
- 当前模型：reference_only / debuff_reference
- 字段对照：mana_multiplier=30%；barrier_duration=8。
- 人工判断：护盾，不计伤害正确。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Freezing Field
- 中文名：极寒领域
- 当前模型：reference_only / state_scaling
- 字段对照：damage=110/180/250；abilityduration=10；explosion_interval=0.1。
- 人工判断：正确不计固定瞬时；总伤害必须由 hit_count/active_duration 决定。
- 问题记录：
  - 无。
- 修正建议：
  - 不需要修改。

### Stop Freezing Field
- 中文名：停止极寒领域
- 当前模型：ignored
- 字段对照：无。
- 人工判断：停止持续施法的子技能，忽略正确。
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
