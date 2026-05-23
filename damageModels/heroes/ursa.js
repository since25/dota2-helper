module.exports = {
  "hero": "Ursa",
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
    "Earthshock": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "dmg",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "hop_duration"
    },
    "Overpower": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Fury Swipes": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_per_stack",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "attack_count",
        "stack_count",
        "hero_attack_damage"
      ],
      "conditionInputs": [
        "attack_count",
        "stack_count",
        "hero_attack_damage"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Maul": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Enrage": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
