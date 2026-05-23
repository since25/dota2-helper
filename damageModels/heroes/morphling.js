module.exports = {
  "hero": "Morphling",
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
    "Waveform": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "dmg",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    },
    "Adaptive Strike": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_base",
      "semanticType": "damage.attribute_scaling",
      "requiredInputs": [
        "hero_attribute"
      ],
      "conditionInputs": [
        "hero_attribute"
      ],
      "reason": "属性系数伤害需要英雄属性输入，首轮模型只作为条件伤害参考。"
    },
    "Ebb and Flow": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "cast_range_per_str",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Attribute Shift (Agility Gain)": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Attribute Shift (Strength Gain)": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Morph": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Morph Replicate": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
