# 风行者（Windranger）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：reviewed
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：风行

## 模型概览
- 技能条目数：7
- 已实现伤害：0
- 参考项：5
- 忽略项：2
- 暂不支持项：0
- 需要状态输入项：5
- 持续伤害项：0
- 多波伤害项：1
- 普攻相关项：3

## 复核结论
- 总体判断：当前模型过于保守且 `Powershot` 语义错误，应可直接计算。
- 是否存在误计入固定爆发：未发现。
- 是否缺少关键输入：强力击蓄力/穿透衰减、Focus Fire 攻击次数、顺风层数。
- 是否需要修改模型：需要。

## 技能复核

### Tailwind
- 中文名：一路顺风
- 当前模型：ignored
- 人工判断：移动速度加成，不直接造成伤害。

### Shackleshot
- 中文名：束缚击
- 当前模型：reference_only
- 本地 raw damage：0
- 人工判断：控制技能，不伤害。

### Powershot
- 中文名：强力击
- 当前模型：reference_only / move_speed_scaling
- 本地 rawAttributes：`powershot_damage=170/270/370/470`、`damage_reduction=15%`
- 人工判断：当前模型错误。它不是移速缩放，而是蓄力/穿透衰减魔法伤害。
- 修正建议：charged_projectile，输入 `charge_ratio`、`units_passed`。

### Windrun / Gale Force
- 中文名：风行 / 狂风之力
- 当前模型：reference_only
- 人工判断：闪避、移速、推送控制，不直接伤害。

### Focus Fire
- 中文名：集中火力
- 当前模型：reference_only
- 本地 rawAttributes：`bonus_attack_speed=350/425/500`、`focusfire_damage_reduction=-25%`
- 人工判断：普攻输出窗口核心，不是独立伤害。
- 修正建议：attack_window，输入 `attack_count`。
