# 熊战士（Ursa）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：拍拍熊

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：3
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：4

## 复核结论
- 总体判断：`Earthshock` 基础可用，但 Ursa 的主伤害来自 Fury Swipes 和 Overpower 攻击次数。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：攻击次数、怒意层数、生命值转攻击力。
- 是否需要修改模型：需要。

## 技能复核

### Maul
- 中文名：暴烈之爪
- 当前模型：ignored
- 本地 rawAttributes：`health_as_damage_pct=1.25%`
- 人工判断：当前忽略会低估普攻。
- 修正建议：接入 health_to_attack_damage。

### Earthshock
- 中文名：震撼大地
- 当前模型：implemented / instant_fixed
- 本地 raw damage：75/125/175/225
- 人工判断：正确，但需确认 `dmg` 读取 raw damage 数组。

### Overpower
- 中文名：超强力量
- 当前模型：reference_only
- 本地 rawAttributes：`max_attacks=3/4/5/6`、`attack_speed_bonus_pct=400`
- 人工判断：不是伤害，但决定短窗口攻击次数。
- 修正建议：进入 attack_window。

### Fury Swipes
- 中文名：怒意狂击
- 当前模型：reference_only / stack_scaling
- 本地 rawAttributes：`damage_per_stack=12/20/28/36`
- 人工判断：应按攻击序列叠加计算，是 Ursa 核心伤害。
- 修正建议：输入 `attack_count`，计算每次攻击的当前层数额外伤害。

### Enrage
- 中文名：激怒
- 当前模型：reference_only
- 人工判断：减伤和状态抗性不直接造成伤害。
- 修正建议：防御参考即可。
