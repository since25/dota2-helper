module.exports = {
  "hero": "Medusa",
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
    "Split Shot": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage_modifier",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    },
    "Mystic Snake": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "snake_damage",
      "semanticType": "damage.percent_missing_mana",
      "requiredInputs": [
        "target_missing_mana"
      ],
      "conditionInputs": [
        "target_missing_mana"
      ],
      "reason": "已损魔法百分比伤害需要目标已损魔法输入，首轮模型只作为条件伤害参考。"
    },
    "Gorgon's Grasp": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_pers",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Cold Blooded": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Mana Shield": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_per_mana",
      "semanticType": "damage.percent_missing_mana",
      "requiredInputs": [
        "target_missing_mana"
      ],
      "conditionInputs": [
        "target_missing_mana"
      ],
      "reason": "已损魔法百分比伤害需要目标已损魔法输入，首轮模型只作为条件伤害参考。"
    },
    "Stone Gaze": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
