# 恐怖利刃（Terrorblade）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：TB

## 模型概览
- 技能条目数：7
- 已实现伤害：1
- 参考项：3
- 忽略项：3
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：5

## 复核结论
- 总体判断：当前只计算 `Terror Wave`，对 TB 这种幻象/普攻核心英雄严重低估。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：幻象攻击次数、魔化状态、攻击伤害、是否在 Dark Unity 范围内。
- 是否需要修改模型：需要补幻象与普攻增益。

## 技能复核

### Dark Unity
- 中文名：暗黑团结
- 当前模型：ignored
- 本地 rawAttributes：`inside_radius_bonus_damage_pct=60%`
- Dotabuff 对照：范围内伤害加成。
- 是否计入固定爆发：否，作为攻击/幻象伤害修正。
- 需要输入：`inside_radius`
- 人工判断：当前忽略会低估。
- 问题记录：
  - 不是独立伤害，是伤害加成。
- 修正建议：
  - 进入 damage modifier。

### Reflection / Conjure Image
- 中文名：倒影 / 惑幻
- 当前模型：reference_only / ignored
- 本地 rawAttributes：幻象继承攻击力 30%-75%、25%-40% 等。
- Dotabuff 对照：生成敌方倒影或自身幻象。
- 是否计入固定爆发：有条件计入幻象普攻
- 需要输入：`illusion_attack_count`
- 人工判断：当前只作参考可以接受，但不能代表完整输出。
- 问题记录：
  - 需要统一幻象输出模型。
- 修正建议：
  - 接入 illusion attack。

### Metamorphosis
- 中文名：魔化
- 当前模型：ignored
- 本地 rawAttributes：`bonus_damage=20/40/60/80`、攻击距离和 BAT 修正
- Dotabuff 对照：形态转换，提供攻击力和远程攻击。
- 是否计入固定爆发：否，作为普攻修正。
- 需要输入：`metamorphosis_active`、`attack_count`
- 人工判断：当前忽略会严重低估 TB 爆发窗口。
- 问题记录：
  - 物理标签表示攻击形态，不是独立技能伤害。
- 修正建议：
  - 建为 attack buff。

### Demon Zeal
- 中文名：狂魔
- 当前模型：reference_only
- Dotabuff 对照：攻速/移速/回血，消耗当前生命。
- 是否计入固定爆发：否，作为攻击窗口修正。
- 需要输入：`attack_count`
- 人工判断：正确不作为伤害。
- 问题记录：
  - 生命消耗不是对敌伤害。
- 修正建议：
  - 进入 attack speed modifier。

### Terror Wave
- 中文名：怵潮
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=200`
- Dotabuff 对照：魔法瞬时伤害并恐惧，附带魔化持续时间。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 魔化持续时间是后续状态，不是伤害持续时间。
- 修正建议：
  - 不需要修改。

### Sunder
- 中文名：魂断
- 当前模型：reference_only
- Dotabuff 对照：交换生命百分比，带最低生命限制。
- 是否计入固定爆发：否
- 需要输入：双方当前生命
- 人工判断：不是常规伤害，但对斩杀/救命决策重要。
- 问题记录：
  - 不应按固定伤害计算。
- 修正建议：
  - 后续做 life_swap 特殊模型。
