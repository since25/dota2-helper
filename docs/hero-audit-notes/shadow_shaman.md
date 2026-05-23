# 暗影萨满（Shadow Shaman）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：小Y

## 模型概览
- 技能条目数：6
- 已实现伤害：4
- 参考项：1
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：1
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：`Ether Shock` 正确，但 `Shackles`、`Urnaconda`、`Mass Serpent Ward` 都不能简单按瞬时固定伤害理解。
- 是否存在误计入固定爆发：存在。守卫攻击力、持续时间、枷锁总伤害都需要按持续/攻击次数处理。
- 是否缺少关键输入：枷锁实际引导时间、蛇棒攻击次数、巨蟒命中/攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Ether Shock
- 中文名：苍穹震击
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=125/190/255/320`
- Dotabuff 对照：多目标瞬时魔法伤害。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 目标数不是单目标伤害倍率。
- 修正建议：
  - 不需要修改。

### Hex
- 中文名：妖术
- 当前模型：reference_only
- Dotabuff 对照：控制，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 持续时间是控制窗口。
- 修正建议：
  - 保留为控制参考。

### Shackles
- 中文名：枷锁
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`total_damage=100/160/220/280`、`abilitychanneltime=2.4/3/3.6/4.2`、`tick_interval=0.1`
- Dotabuff 对照：持续施法，总伤害/治疗为完整引导总量。
- 是否计入固定爆发：否，按引导时间计算。
- 需要输入：`channel_duration`
- 人工判断：当前瞬时模型不准确。`total_damage` 是打满总量，不是开局瞬间伤害。
- 问题记录：
  - 实战经常被打断，默认打满会高估。
- 修正建议：
  - 改为 channel_total_damage，按 `实际持续 / 最大持续` 缩放。

### Fowl Play
- 中文名：禽戏
- 当前模型：ignored
- Dotabuff 对照：强驱散/保命/小鸡状态，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 移速和无敌时间不是伤害。
- 修正建议：
  - 不进入伤害计算。

### Urnaconda
- 中文名：巨蟒之瓮
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`impact_damage=275`、`ward_duration=15`
- Dotabuff 对照：命中伤害 + 后续守卫/巨蟒行为。
- 是否计入固定爆发：命中伤害可计入；后续需攻击次数。
- 需要输入：`ward_attack_count`
- 人工判断：当前只算命中伤害不完整。
- 问题记录：
  - 持续时间不是伤害持续时间。
- 修正建议：
  - 拆成 impact instant + summon attacks。

### Mass Serpent Ward
- 中文名：群蛇守卫
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`ward_count=10`、`ward_damage_tooltip=50/85/120`、`duration=45`
- Dotabuff 对照：召唤蛇棒，蛇棒普攻造成物理伤害。
- 是否计入固定爆发：否，按蛇棒攻击次数计算。
- 需要输入：`ward_attack_count`
- 人工判断：当前瞬时模型错误。`ward_damage_tooltip` 是单次攻击力。
- 问题记录：
  - 会把蛇棒攻击力误作一次施法伤害。
- 修正建议：
  - 建为 summon_attack 模型。
