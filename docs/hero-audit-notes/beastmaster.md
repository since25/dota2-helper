# 兽王（Beastmaster）伤害模型复核

## 状态
- 复核状态：已复核，需修正模型
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：6
- 已实现伤害：5
- 参考项：1
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：当前模型过度把召唤物和周期性机制当作 instant_fixed，风险较高。
- 是否存在误计入固定爆发：Summon Razorback 的攻击力、Summon Raptors 的俯冲、Drums of Slom 的敲鼓都被默认计入固定爆发，可能高估。
- 是否缺少关键输入：Wild Axes 需要命中斧数；召唤物需要攻击次数/存活时间；Drums of Slom 需要触发次数。
- 是否需要修改模型：需要。召唤物相关应改为 summon/attack/state_scaling，不默认计入固定瞬时伤害。

## 技能复核

### Wild Axes
- 中文名：野性之斧
- 当前模型：implemented / instant_fixed
- 字段对照：axe_damage=40/80/120/160；damage_amp=5%/6%/7%/8%
- 数据来源对照：Dotabuff 每把飞斧伤害 40/80/120/160。
- 人工判断：数值正确，但“每把飞斧”需要 hit_count；伤害加深未建模。
- 问题记录：
  - 建议增加 axe_hit_count 和 damage_amp reference。
- 修正建议：
  - 建议增加 axe_hit_count 和 damage_amp reference。

### Summon Razorback
- 中文名：召唤刀背兽
- 当前模型：implemented / instant_fixed
- 字段对照：boar_base_damage=30/45/60/75；duration=60
- 数据来源对照：Dotabuff 显示豪猪攻击力，本地是召唤物攻击力。
- 人工判断：不应作为施法瞬间伤害默认计入。
- 问题记录：
  - 改为 summon.attack_damage，输入 boar_attack_count/active_duration。
- 修正建议：
  - 改为 summon.attack_damage，输入 boar_attack_count/active_duration。

### Summon Raptors
- 中文名：召唤猛禽
- 当前模型：implemented / instant_fixed
- 字段对照：dive_damage=60/95/130/165；hawk_count=2
- 数据来源对照：Dotabuff 俯冲伤害 60/95/130/165。
- 人工判断：俯冲是召唤物行为/触发，不是施法瞬间必定命中。
- 问题记录：
  - 改为 state_scaling，输入 dive_hit_count。
- 修正建议：
  - 改为 state_scaling，输入 dive_hit_count。

### Inner Beast
- 中文名：野性之心
- 当前模型：reference_only / debuff_reference
- 字段对照：bonus_attack_speed=7
- 数据来源对照：Dotabuff 攻击速度提升 7。
- 人工判断：正确不计固定伤害。
- 问题记录：
  - 无。
- 修正建议：
  - 可保留。

### Drums of Slom
- 中文名：斯洛姆战鼓
- 当前模型：implemented / instant_fixed
- 字段对照：base_damage=80；触发间隔/攻击次数字段存在
- 数据来源对照：Dotabuff 敲鼓伤害 70，本地为 80，且是周期/触发伤害。
- 人工判断：不应默认作为单次固定伤害；还存在版本差异。
- 问题记录：
  - 改为 state_scaling，输入 drum_hit_count；确认 70/80 差异。
- 修正建议：
  - 改为 state_scaling，输入 drum_hit_count；确认 70/80 差异。

### Primal Roar
- 中文名：原始咆哮
- 当前模型：implemented / instant_fixed
- 字段对照：damage=150/225/300；side_damage=150/225/300
- 数据来源对照：Dotabuff 伤害 150/225/300。
- 人工判断：主目标伤害正确；侧面波及可后续拆多目标。
- 问题记录：
  - 可选补 side_damage。
- 修正建议：
  - 可选补 side_damage。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
