module.exports = {
  "hero": "Juggernaut",
  "review": {
    "status": "reviewed",
    "reviewer": "local-bulk-semantic-pass",
    "updatedAt": "2026-05-23",
    "notes": [
      "Promoted from the local semantic model after Dotabuff snapshot presence and semantic audit coverage checks.",
      "High-variance mechanics remain reference_only or state_scaling and require explicit combat inputs before total damage calculation."
    ]
  },
  "abilities": {
    "Blade Fury": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "blade_fury_damage",
      "durationKey": "duration",
      "tickIntervalKey": "blade_fury_damage_tick",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Healing Ward": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Blade Dance": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "blade_dance_crit_chance",
      "semanticType": "modifier.crit.chance",
      "affects": "physical_damage",
      "stackGroup": "critical_strike",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Swiftslash": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Bladeform": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Omnislash": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
