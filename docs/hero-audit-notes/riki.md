# 力丸（Riki）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：隐刺

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：2
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：当前模型漏掉 `Backstab` 和 `Blink Strike` 伤害，`Tricks of the Trade` 也需要攻击伤害/攻击次数。
- 是否存在误计入固定爆发：未发现明显误计入。
- 是否缺少关键输入：缺敏捷、背刺角度、攻击伤害、攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Backstab
- 中文名：背刺
- 当前模型：ignored
- 本地 rawAttributes：`damage_multiplier=0.55`
- Dotabuff 对照：敏捷系数 0.55，背后攻击造成额外物理伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`hero_agility`、`is_behind_target`、`attack_count`
- 人工判断：当前漏算 Riki 的核心伤害。
- 问题记录：
  - 背刺是普攻修正，不是独立技能。
- 修正建议：
  - 增加 backstab attack modifier。

### Smoke Screen
- 中文名：烟幕
- 当前模型：reference_only
- Dotabuff 对照：沉默、落空、范围控制，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 落空概率不是伤害。
- 修正建议：
  - 作为控制/命中率参考。

### Blink Strike
- 中文名：闪烁突袭
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_damage=15/30/45/60`
- Dotabuff 对照：位移到目标背后并造成额外物理伤害。
- 是否计入固定爆发：是
- 需要输入：可选 `hero_attack_damage`，用于合并普攻总伤害
- 人工判断：当前漏算额外伤害。
- 问题记录：
  - 该技能至少应计算 `bonus_damage`，并通常触发一次普攻/背刺语境。
- 修正建议：
  - 增加 instant/attack modifier 组合模型。

### Tricks of the Trade
- 中文名：绝杀秘技
- 当前模型：implemented / attack_modifier
- 本地 rawAttributes：`attack_count=4`、`attack_damage=25/50/75/100`、`abilitychanneltime=2`
- Dotabuff 对照：短时间内攻击多次，攻击伤害为百分比/修正值。
- 是否计入固定爆发：有条件计入
- 需要输入：`hero_attack_damage`、`attack_count`
- 人工判断：方向正确，但需要确认 `attack_damage` 是百分比还是固定显示语义。
- 问题记录：
  - 当前字段名容易被误解为固定额外伤害。
- 修正建议：
  - 明确公式，并叠加 Backstab 条件。

### Cloak and Dagger
- 中文名：刀光谍影
- 当前模型：ignored
- Dotabuff 对照：隐身、经验奖励，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 经验奖励不是伤害。
- 修正建议：
  - 不进入伤害计算。
