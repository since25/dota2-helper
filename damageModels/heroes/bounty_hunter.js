module.exports = {
  "hero": "Bounty Hunter",
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
    "Shuriken Toss": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "cast_range",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Jinada": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Shadow Walk": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "stun_duration",
      "semanticType": "control.stun.seconds",
      "affects": "disable_window",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Friendly Shadow": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Big Game Hunter": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Track": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "target_damage_amp",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    }
  }
};
