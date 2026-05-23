# 天穹守望者（Arc Warden）伤害模型复核

## 状态
- 复核状态：已复核，可用但建议补输入
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：0
- 持续伤害项：1
- 多波伤害项：0
- 普攻相关项：0

## 复核结论
- 总体判断：基础伤害字段可用，但风暴双雄带来的复制体输出尚未进入模型。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：Flux 需要目标是否孤立和作用时间；Tempest Double 需要复制体技能/普攻额外输出建模。
- 是否需要修改模型：中期建议。当前可用于单体技能伤害，但不能代表带分身的总输出。

## 技能复核

### Flux
- 中文名：乱流
- 当前模型：implemented / sustained_dps
- 字段对照：damage_per_second=15/30/45/60；duration=6；search_radius=225
- 数据来源对照：Dotabuff 每秒伤害和持续时间一致。
- 人工判断：伤害字段正确；技能只有目标附近没有友军时才有效。
- 问题记录：
  - 建议补 target_is_isolated 和 active_duration。
- 修正建议：
  - 建议补 target_is_isolated 和 active_duration。

### Magnetic Field
- 中文名：磁场
- 当前模型：reference_only / debuff_reference
- 字段对照：attack_speed_bonus=30/60/90/120；evasion_chance=100%；duration=4/5/6/7
- 数据来源对照：Dotabuff 展示攻速、闪避、持续时间。
- 人工判断：不直接造成伤害，但会影响普攻 DPS。当前只用 cast range 参考不够完整。
- 问题记录：
  - 建议改为 attack_speed/evasion/buff_duration reference。
- 修正建议：
  - 建议改为 attack_speed/evasion/buff_duration reference。

### Spark Wraith
- 中文名：闪光幽魂
- 当前模型：implemented / instant_fixed
- 字段对照：spark_damage_base=100/170/240/310；duration=16；base_activation_delay=1.5
- 数据来源对照：Dotabuff 伤害 100/170/240/310。
- 人工判断：正确，可作为单个幽魂命中伤害。
- 问题记录：
  - 如果考虑多个幽魂，需要 hit_count 输入。
- 修正建议：
  - 如果考虑多个幽魂，需要 hit_count 输入。

### Runic Infusion
- 中文名：神符灌注
- 当前模型：ignored
- 字段对照：all_attribute_bonus_per_stack=1.5
- 数据来源对照：Dotabuff 页面无直接伤害字段。
- 人工判断：正确忽略直接伤害；属性加成会间接影响普攻。
- 问题记录：
  - 后续属性/DPS模型再处理。
- 修正建议：
  - 后续属性/DPS模型再处理。

### Tempest Double
- 中文名：风暴双雄
- 当前模型：reference_only / debuff_reference
- 字段对照：duration=18/21/24；bounty_gold=70
- 数据来源对照：Dotabuff 展示复制体持续时间。
- 人工判断：不直接造成技能伤害，但复制体会复制技能、物品和普攻输出。
- 问题记录：
  - 后续需要 clone_output_multiplier 或 separate_unit 模型。
- 修正建议：
  - 后续需要 clone_output_multiplier 或 separate_unit 模型。

## 待办
- [x] 对照 Dotabuff 技能页面确认每个字段语义。
- [x] 对照本地 provider rawAttributes 确认字段 key 和数值。
- [x] 检查是否有移动速度、护甲、范围、阈值等字段被误算为伤害。
- [ ] 根据上方修正建议更新 damageModels/heroes 中的模型。
- [ ] 如修改模型，补充专项测试并重新导出审计页。
