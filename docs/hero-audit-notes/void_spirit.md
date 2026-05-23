# 虚无之灵（Void Spirit）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：紫猫

## 模型概览
- 技能条目数：5
- 已实现伤害：4
- 参考项：0
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：1

## 复核结论
- 总体判断：基础技能模型较好，但 `Astral Step` 取错字段，`Intrinsic Edge` 应作为属性伤害修正。
- 是否存在误计入固定爆发：存在。`Astral Step` 当前取 `pop_damage_delay=1.25` 不是伤害。
- 是否缺少关键输入：Astral Step 命中次数、Intrinsic Edge 属性输入。
- 是否需要修改模型：需要。

## 技能复核

### Aether Remnant
- 中文名：残阴
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`impact_damage=90/140/190/240`
- 人工判断：正确。`pull_duration` 是控制时间。

### Dissimilate
- 中文名：异化
- 当前模型：implemented / instant_fixed
- 本地 raw damage：120/200/280/360
- 人工判断：正确，但需确认 `dmg` 读取 raw damage 数组。

### Resonant Pulse
- 中文名：共鸣脉冲
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=60/110/160/210`
- 人工判断：正确。护盾字段不是伤害。

### Intrinsic Edge
- 中文名：内在锋芒
- 当前模型：ignored
- 本地 rawAttributes：`secondary_stat_bonus_pct=30`、`damage_stat_bonus_pct=15`
- 人工判断：不是独立伤害，但会按属性修正输出。
- 修正建议：进入 attribute damage modifier。

### Astral Step
- 中文名：星体游魂
- 当前模型：implemented / instant_fixed
- 当前字段：`damageKey: pop_damage_delay`
- 本地 rawAttributes：`pop_damage_delay=1.25`、`pop_damage=130/230/330`
- 人工判断：当前模型错误，取了延迟时间而不是伤害。
- 修正建议：改为 `damageKey: pop_damage`，支持 `charge_hit_count`。
