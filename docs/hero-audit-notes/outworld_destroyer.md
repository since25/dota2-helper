# 殁境神蚀者（Outworld Destroyer）伤害模型复核

## 状态
- 复核状态：已复核
- 当前模型状态：missing / empty
- 当前模型来源：manual
- 模型更新时间：2026-05-23
- 复核来源：Dotabuff zh 页面、本地 dotaconstants 字段、人工判断
- 英雄别名：OD、黑鸟

## 模型概览
- 技能条目数：5
- 已实现伤害：0
- 参考项：0
- 忽略项：0
- 暂不支持项：5
- 需要状态输入项：2
- 持续伤害项：0
- 多波伤害项：0
- 普攻相关项：1

## 复核结论
- 总体判断：当前英雄基本缺模型，需要完整补建。
- 是否存在误计入固定爆发：未发现，因为当前为空。
- 是否缺少关键输入：`Arcane Orb` 需要当前魔法值；`Sanity's Eclipse` 需要双方魔法差；`Astral Imprisonment` 可直接计算。
- 是否需要修改模型：需要，优先级高。

## 技能复核

### Arcane Orb
- 中文名：奥术天球
- 当前模型：缺失
- 本地 rawAttributes：`mana_pool_damage_pct=10/11/12/13%`、`mana_cost_percentage=20%`
- Dotabuff 对照：普攻法球，基于当前魔法值造成纯粹额外伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`caster_current_mana`、`attack_count`
- 人工判断：应建为普攻附加伤害模型。
- 问题记录：
  - 当前完全漏算 OD 的核心输出。
- 修正建议：
  - 公式方向为 `当前魔法值 * 百分比 * 攻击次数`，并标记法球/普攻相关。

### Astral Imprisonment
- 中文名：星体禁锢
- 当前模型：缺失
- 本地 rawAttributes：`damage=90/180/270/360`
- Dotabuff 对照：结束时造成范围魔法伤害并偷取魔法。
- 是否计入固定爆发：是
- 需要输入：无
- 人工判断：应建为瞬时魔法伤害。
- 问题记录：
  - 当前漏算稳定伤害。
- 修正建议：
  - 增加 `instant_fixed`，`damageKey: damage`。

### Objurgation
- 中文名：斥责
- 当前模型：缺失
- Dotabuff 对照：护盾/魔法相关增益，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：可忽略或作为资源状态参考。
- 问题记录：
  - 无直接伤害字段。
- 修正建议：
  - 先标记为 `reference_only` 或 `ignored`。

### Essence Flux
- 中文名：精气光环
- 当前模型：缺失
- Dotabuff 对照：魔法回复触发，不直接造成伤害。
- 是否计入固定爆发：否
- 需要输入：无
- 人工判断：不进入固定伤害，但会间接提高 Arcane Orb 和大招资源条件。
- 问题记录：
  - 属于资源续航，不是伤害。
- 修正建议：
  - 后续进入资源模型。

### Sanity's Eclipse
- 中文名：神智之蚀
- 当前模型：缺失
- 本地 rawAttributes：`base_damage=200/300/400`、`damage_multiplier=0.4`
- Dotabuff 对照：基于双方最大魔法值差/魔法差的范围魔法伤害。
- 是否计入固定爆发：有条件计入
- 需要输入：`caster_mana`、`target_mana`
- 人工判断：应建为状态缩放大招，不应只取基础值。
- 问题记录：
  - 当前漏算 OD 关键爆发。
- 修正建议：
  - 增加 mana difference scaling 模型，缺输入时只展示公式和基础项，不给确定总量。
