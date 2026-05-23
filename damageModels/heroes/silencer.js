module.exports = {
  "hero": "Silencer",
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
    "Arcane Curse": {
      "status": "implemented",
      "model": "initial_plus_dot",
      "initialDamageKey": "application_damage",
      "damagePerSecondKey": "damage",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultIncluded": true,
      "reason": "计入施加伤害和基础持续伤害；惩罚延长由后续条件输入处理。"
    },
    "Glaives of Wisdom": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Last Word": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    },
    "Suffer In Silence": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Global Silence": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
