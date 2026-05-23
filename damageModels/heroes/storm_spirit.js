module.exports = {
  "hero": "Storm Spirit",
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
    "Static Remnant": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "static_remnant_damage_radius",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Electric Vortex": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Overload": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "overload_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Ball Lightning": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "dmg",
      "semanticType": "damage.percent_missing_mana",
      "requiredInputs": [
        "target_missing_mana"
      ],
      "conditionInputs": [
        "target_missing_mana"
      ],
      "reason": "已损魔法百分比伤害需要目标已损魔法输入，首轮模型只作为条件伤害参考。"
    },
    "Galvanized": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
