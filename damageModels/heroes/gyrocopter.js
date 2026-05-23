module.exports = {
  "hero": "Gyrocopter",
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
    "Rocket Barrage": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "rocket_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "barrage_duration"
    },
    "Homing Missile": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "hit_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Flak Cannon": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Afterburner": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Call Down": {
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
    }
  }
};
