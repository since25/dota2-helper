module.exports = {
  "hero": "Lycan",
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
    "Summon Wolves": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "wolf_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "wolf_duration"
    },
    "Howl": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "armor",
      "semanticType": "modifier.armor_reduction.flat",
      "affects": "physical_damage",
      "stackGroup": "armor_reduction",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Feral Impulse": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Wolf Bite": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Apex Predator": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_amp",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    },
    "Shapeshift": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "crit_chance",
      "semanticType": "modifier.crit.chance",
      "affects": "physical_damage",
      "stackGroup": "critical_strike",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
