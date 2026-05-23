# 斯拉达（Slardar）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：大鱼人

## 模型概览
- 技能条目数：5
- 已实现伤害：2
- 参考项：3
- 忽略项：0
- 暂不支持项：0
- 需要状态输入项：4
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：3

## 复核结论
- 总体判断：当前模型方向较好，已避免把水中攻击力和减甲当 unknown 伤害，但需要把被动三次攻击触发建清楚。
- 是否存在误计入固定爆发：未发现当前文件误计入，但自动抽取历史上容易误读 `river_damage_pct` 和 `armor_reduction`。
- 是否缺少关键输入：攻击次数、是否在水中、是否挂上侵蚀雾霭。
- 是否需要修改模型：需要补物理修正链路。

## 技能复核

### Seaborn Sentinel
- 中文名：汪洋前哨
- 当前模型：reference_only
- 本地 rawAttributes：`river_damage_pct=11.4%`
- Dotabuff 对照：水中攻击力加成、移速、护甲、回血。
- 是否计入固定爆发：否，作为攻击力修正。
- 需要输入：`in_water`
- 人工判断：正确不作为独立伤害。
- 问题记录：
  - `11.4%` 不能抽成 unknown damage。
- 修正建议：
  - 进入 attack damage modifier。

### Guardian Sprint
- 中文名：守卫冲刺
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_speed=10%/18%/26%/34%`
- Dotabuff 对照：移动速度增益。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 移动速度不应当伤害。
- 修正建议：
  - 不进入伤害计算。

### Slithereen Crush
- 中文名：鱼人碎击
- 当前模型：implemented / instant_fixed
- 本地 rawAttributes：`crush_damage=75/150/225/300`
- Dotabuff 对照：范围物理瞬时伤害并眩晕/减速。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：正确。
- 问题记录：
  - 水洼持续时间不是伤害持续时间。
- 修正建议：
  - 不需要修改。

### Bash of the Deep
- 中文名：深海重击
- 当前模型：implemented / attack_sequence
- 本地 rawAttributes：`bonus_damage=35/90/145/200`、`attack_count=3`
- Dotabuff 对照：每第 3 次攻击触发额外物理伤害和眩晕。
- 是否计入固定爆发：有条件计入
- 需要输入：`attack_count`
- 人工判断：方向正确。三次普通攻击后触发一次被动，示例应表达为 `3 次普攻 + 1 次重击额外伤害`。
- 问题记录：
  - 不能把被动当每次攻击都触发。
- 修正建议：
  - 保持 attack_sequence，UI 展示触发次数。

### Corrosive Haze
- 中文名：侵蚀雾霭
- 当前模型：reference_only
- 本地 rawAttributes：`armor_reduction=-10/-15/-20`
- Dotabuff 对照：降低护甲并提供视野/水迹。
- 是否计入固定爆发：否，作为物理伤害修正。
- 需要输入：`corrosive_haze_active`
- 人工判断：正确。减甲不是伤害，但会提高后续物理伤害。
- 问题记录：
  - `-10` 不能抽成 unknown damage。
- 修正建议：
  - 接入 armor modifier，与暗灭、强袭等同层处理。
