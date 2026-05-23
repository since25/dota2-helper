# 术士（Warlock）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：术士

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：2
- 忽略项：1
- 暂不支持项：0
- 需要状态输入项：6
- 持续伤害项：2
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：`Shadow Word` 和 `Upheaval` 需要按持续时间，`Fatal Bonds` 和地狱火需要外部伤害/攻击次数。
- 是否存在误计入固定爆发：`Shadow Word` 若按 instant 会错误；当前应确认实际模型是持续。
- 是否缺少关键输入：连接目标数、外部伤害、暗言术作用时间、剧变引导时间、地狱火攻击次数。
- 是否需要修改模型：需要。

## 技能复核

### Fatal Bonds
- 中文名：致命连接
- 当前模型：reference_only
- 本地 rawAttributes：`damage_share_percentage=15%/18%/21%/24%`
- 人工判断：不是独立伤害，按外部伤害共享。
- 修正建议：damage_share modifier。

### Shadow Word
- 中文名：暗言术
- 当前模型：implemented
- 本地 rawAttributes：`damage=15/25/35/45`、`duration=10`、`tick_interval=0.5`
- 人工判断：应为持续治疗/伤害，不是瞬时。
- 修正建议：sustained_dps 或 tick 模型。

### Upheaval
- 中文名：剧变
- 当前模型：implemented / sustained_dps
- 本地 rawAttributes：`damage_per_second=10`、`max_damage=35/60/85/110`
- 人工判断：方向正确，但伤害随引导成长到最高伤害，需要曲线模型。
- 修正建议：ramping_dps。

### Eldritch Summoning
- 中文名：邪术召唤
- 当前模型：ignored
- 本地 rawAttributes：`imp_explode=20`
- 人工判断：当前忽略会漏小鬼爆炸。
- 修正建议：summon_explosion，输入小鬼数量。

### Chaotic Offering
- 中文名：混乱之祭
- 当前模型：reference_only
- 本地 rawAttributes：地狱火攻击力 100/150/200，范围眩晕。
- 人工判断：落地冲击主要是控制，后续伤害来自地狱火攻击。
- 修正建议：summon_attack，输入 golem_attack_count。
