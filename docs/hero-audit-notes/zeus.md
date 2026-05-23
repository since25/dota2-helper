# 宙斯（Zeus）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：宙斯

## 模型概览
- 技能条目数：7
- 已实现伤害：4
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：2
- 普攻相关项：1

## 复核结论
- 总体判断：基础直伤技能正确，核心缺口是 `Static Field` 当前生命百分比触发和 `Nimbus`/`Lightning Hands` 触发次数。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：目标当前生命、法术命中次数、雷云雷击次数、普攻次数。
- 是否需要修改模型：需要增强。

## 技能复核

### Static Field
- 中文名：静电场
- 当前模型：reference_only
- 本地 rawAttributes：`damage_health_pct=3.45`
- 人工判断：按敌方当前生命百分比触发，不是固定伤害。
- 修正建议：percent_current_health，输入 `enemy_current_health` 和 `spell_hit_count`。

### Arc Lightning
- 中文名：弧形闪电
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`arc_damage=105/130/155/180`
- 人工判断：单目标伤害正确；跳跃次数不是对同一目标倍数。

### Lightning Bolt
- 中文名：雷击
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=140/220/300/380`
- 人工判断：正确。

### Heavenly Jump
- 中文名：神圣一跳
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=25/50/75/100`
- 人工判断：正确。跳跃距离、减速、攻速降低不是伤害。

### Nimbus
- 中文名：雷云
- 当前模型：reference_only
- 本地 rawAttributes：`cloud_bolt_interval=2.5`
- 人工判断：雷云通过周期性雷击造成伤害，应复用 Lightning Bolt。
- 修正建议：输入 `nimbus_bolt_count`。

### Lightning Hands
- 中文名：霹雳之手
- 当前模型：reference_only
- 本地 rawAttributes：`arc_lightning_damage_pct=50`
- 人工判断：普攻触发弧形闪电百分比伤害。
- 修正建议：attack_proc，输入 `attack_count`。

### Thundergod's Wrath
- 中文名：雷神之怒
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`damage=300/475/650`
- 人工判断：正确。
