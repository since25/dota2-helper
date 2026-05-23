module.exports = {
  "hero": "Bristleback",
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
    "Viscous Nasal Goo": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Quill Spray": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "quill_base_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "quill_stack_duration"
    },
    "Bristleback": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "cast_range_bonus",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Hairball": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Warpath": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_per_stack",
      "semanticType": "damage.move_speed_scaling",
      "requiredInputs": [
        "move_speed"
      ],
      "conditionInputs": [
        "move_speed"
      ],
      "reason": "移动速度系数伤害需要移动速度输入，首轮模型只作为条件伤害参考。"
    },
    "Prickly": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
