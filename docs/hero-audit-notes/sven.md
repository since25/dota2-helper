# 斯温（Sven）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：流浪剑客

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：1
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：4

## 复核结论
- 总体判断：`Storm Hammer` 可用，但 Sven 的主要伤害来自普攻增益，当前 `God's Strength`、`Wrath of God` 被忽略会严重低估。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：攻击伤害、力量、攻击次数、是否开启大招。
- 是否需要修改模型：需要补普攻修正。

## 技能复核

### Storm Hammer
- 中文名：风暴之拳
- 当前模型：implemented / instant_fixed
- 本地 raw damage：80/160/240/320
- Dotabuff 对照：魔法瞬时伤害并眩晕。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确，但字段 `dmg` 应确认 resolver 能读取 raw damage 数组。
- 问题记录：
  - Dotabuff 页面未列伤害字段，但 raw 有 damage 数组。
- 修正建议：
  - 显式使用 raw damage 数组或标准化 damageKey。

### Great Cleave
- 中文名：巨力挥舞
- 当前模型：reference_only
- 本地 rawAttributes：`great_cleave_damage=60%/70%/80%/90%`
- Dotabuff 对照：分裂伤害比例。
- 是否计入固定爆发：有条件计入
- 需要输入：`source_attack_damage`、`cleave_target_count`
- 人工判断：正确作为条件参考，不是单体直接伤害。
- 问题记录：
  - 只影响周围目标，不应叠到主目标伤害。
- 修正建议：
  - 建为 cleave secondary damage。

### Warcry
- 中文名：战吼
- 当前模型：ignored
- Dotabuff 对照：移速/护甲增益，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 护甲、移速不是伤害。
- 修正建议：
  - 不进入伤害计算。

### God's Strength
- 中文名：神之力量
- 当前模型：ignored
- 本地 rawAttributes：`gods_strength_damage=110%/150%/190%`
- Dotabuff 对照：攻击力百分比加成。
- 是否计入固定爆发：否，作为普攻修正。
- 需要输入：`hero_attack_damage`、`attack_count`
- 人工判断：当前忽略会严重低估 Sven。
- 问题记录：
  - 不是独立技能伤害，但影响所有普攻/分裂。
- 修正建议：
  - 建为 attack damage multiplier。

### Wrath of God
- 中文名：神之愤怒
- 当前模型：ignored
- 本地 rawAttributes：`bonus_damage_per_str=0.08`
- Dotabuff 对照：每点力量提供攻击力。
- 是否计入固定爆发：否，作为属性转攻击力修正。
- 需要输入：`sven_strength`
- 人工判断：当前忽略偏保守。
- 问题记录：
  - 会影响普攻和大招后的斩杀线。
- 修正建议：
  - 接入 strength_to_damage modifier。
