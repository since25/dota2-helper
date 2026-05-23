module.exports = {
  "hero": "Bloodseeker",
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
    "Bloodrage": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_pct",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "全量结构模型：该伤害需要额外状态输入，暂作为条件伤害参考。"
    },
    "Blood Rite": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "silence_duration"
    },
    "Thirst": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Sanguivore": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "base_heal",
      "semanticType": "defense.heal.flat",
      "affects": "sustain",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Rupture": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_cap_amount",
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
