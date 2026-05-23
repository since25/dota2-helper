module.exports = {
  "hero": "Templar Assassin",
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
    "Refraction": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "shield_per_instance",
      "semanticType": "defense.barrier.flat",
      "affects": "survivability",
      "stackGroup": "barrier",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Meld": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_armor",
      "semanticType": "modifier.armor_reduction.flat",
      "affects": "physical_damage",
      "stackGroup": "armor_reduction",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Psi Blades": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Trap": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Psionic Projection": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "extra_damage",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    },
    "Psionic Trap": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "extra_damage",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    },
    "Inner Peace": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
