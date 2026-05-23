module.exports = {
  "hero": "Huskar",
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
    "Inner Fire": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.distance_scaling",
      "requiredInputs": [
        "distance"
      ],
      "conditionInputs": [
        "distance"
      ],
      "reason": "距离系数伤害需要距离输入，首轮模型只作为条件伤害参考。"
    },
    "Burning Spear": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "burn_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Berserker's Blood": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "maximum_attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Blood Magic": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Life Break": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "health_damage",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "最大生命百分比伤害需要目标最大生命输入，首轮模型只作为条件伤害参考。"
    }
  }
};
