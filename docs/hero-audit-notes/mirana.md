# 米拉娜（Mirana）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 快照、本地 dotaconstants rawAttributes、当前 damage model
- 英雄别名：白虎、pom

## 模型概览
- 技能条目数：5
- 已实现伤害：1
- 参考项：4
- 需要状态输入项：4
- 多波伤害项：1
- 普攻相关项：2

## 复核结论
- 总体判断：部分可用，但 `Starstorm` 和 `Sacred Arrow` 都需要更细模型。
- 是否存在误计入固定爆发：`Starstorm` 只计主星伤害会低估；`Sacred Arrow` 不应只作为距离参考。
- 是否缺少关键输入：第二颗流星是否命中、箭飞行距离、跳跃后的普攻窗口、月之暗面增伤。
- 是否需要修改模型：建议补二段 Starstorm 和 Sacred Arrow 距离缩放。

## 技能复核
- `Starstorm`：`damage: 75/150/225/300`，第二颗流星 70%；应支持主星 + 二星命中输入。
- `Sacred Arrow`：本地 damage 数组 60/150/240/330，另有 `arrow_bonus_damage: 180`，距离影响眩晕和额外伤害，需要 distance 输入。
- `Leap`：攻速/移速增益，不直接伤害。
- `Celestial Quiver`：Dotabuff 显示额外伤害 5，但本地仅 charge/cast range，需确认来源；可作为普攻修正。
- `Moonlight Shadow`：隐身、移速和自身输出加成 9/12/15%，不直接伤害。

## 待办
- [x] 完成字段语义复核。
- [x] 标记二段流星和箭距离缩放。
- [ ] 补 Starstorm 二星、Sacred Arrow 距离伤害、Moonlight Shadow 输出修正。
