module.exports = {
  "hero": "Hoodwink",
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
    "Acorn Shot": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "acorn_shot_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "debuff_duration"
    },
    "Bushwhack": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "total_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "debuff_duration"
    },
    "Scurry": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Decoy": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Hunter's Boomerang": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_scepter"
      ],
      "defaultIncluded": false,
      "durationKey": "mark_duration",
      "reason": "猎手旋镖为阿哈利姆神杖条件技能，固定爆发默认不计入。"
    },
    "Sharpshooter": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "max_damage",
      "semanticType": "damage.distance_scaling",
      "requiredInputs": [
        "distance"
      ],
      "conditionInputs": [
        "distance"
      ],
      "reason": "距离系数伤害需要距离输入，首轮模型只作为条件伤害参考。"
    },
    "End Sharpshooter": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
