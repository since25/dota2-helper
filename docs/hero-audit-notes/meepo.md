# 米波（Meepo）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：地卜师

## 模型概览
- 技能条目数：7
- 已实现伤害：2
- 参考项：2
- 忽略项：3
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：需修正模型。
- 是否存在误计入固定爆发：`MegaMeepo` 当前把 `damage_distribution_duration` 当 DPS 字段是错误的。
- 是否缺少关键输入：Poof 需要施放米波数量；Ransack 需要攻击次数；MegaMeepo Fling 缺失。
- 是否需要修改模型：需要补米波数量、多单位同步施法和 MegaMeepo 投掷。

## 技能复核
- `Earthbind`：控制/缠绕，不直接伤害。
- `Poof`：`poof_damage: 50/80/110/140` 是单个忽悠魔法伤害；完整爆发取决于有几个 Meepo 同时命中。
- `Ransack`：Dotabuff 显示纯粹伤害/生命窃取，本地 `health_steal_heroes: 9/12/15/18`，应作为普攻附加，不应忽略。
- `Dig`：回血和弱驱散，不直接伤害。
- `MegaMeepo`：本体字段是合体持续/伤害分摊，不是持续 DPS；`MegaMeepo Fling` 225 魔法伤害缺失。
- `Divided We Stand`：克隆体数量决定整体输出，应作为 Meepo 数量输入。
- `Geomancy`：地形回复/减速，不直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记 MegaMeepo DPS 误读。
- [ ] 实现 Poof 多米波、Ransack 普攻附加、MegaMeepo Fling 模型。
