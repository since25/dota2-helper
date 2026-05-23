module.exports = {
  "hero": "Primal Beast",
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
    "Onslaught": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "knockback_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Trample": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "attack_damage",
      "semanticType": "damage.source_damage_percent",
      "requiredInputs": [
        "source_damage",
        "hit_count"
      ],
      "conditionInputs": [
        "source_damage",
        "hit_count"
      ],
      "reason": "来源伤害百分比需要来源伤害输入，首轮模型只作为条件伤害参考。"
    },
    "Uproar": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_limit",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Rock Throw": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "base_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Begin Onslaught": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Pulverize": {
      "status": "implemented",
      "model": "repeated_trigger",
      "damageKey": "damage",
      "triggerCountInput": "pulse_count",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "pulse_count"
      ],
      "reason": "按实际砸地脉冲次数计算，不能默认打满。"
    }
  }
};
