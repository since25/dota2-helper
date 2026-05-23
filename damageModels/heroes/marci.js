module.exports = {
  "hero": "Marci",
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
    "Dispose": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "impact_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "air_duration"
    },
    "Rebound": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "impact_damage",
      "semanticType": "damage.distance_scaling",
      "requiredInputs": [
        "distance"
      ],
      "conditionInputs": [
        "distance"
      ],
      "reason": "距离系数伤害需要距离输入，首轮模型只作为条件伤害参考。"
    },
    "Bodyguard": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Special Delivery": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Unleash": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "pulse_damage",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    }
  }
};
