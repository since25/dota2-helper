module.exports = {
  "hero": "Io",
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
    "Tether": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Spirits": {
      "status": "reference_only",
      "model": "conditional",
      "valueKey": "creep_damage",
      "semanticType": "damage.death_trigger",
      "conditionInputs": [
        "trigger_condition"
      ],
      "condition": "需要触发条件成立才造成伤害。",
      "reason": "条件伤害首轮模型只作为参考，不默认计入固定爆发。"
    },
    "Overcharge": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_spell_amp",
      "semanticType": "modifier.spell_amplification.percent",
      "affects": "spell_amplification",
      "stackGroup": "spell_amplification",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Spirits In": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Spirits Out": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Relocate": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Break Tether": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Equilibrium": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_amplification",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    }
  }
};
