module.exports = {
  "hero": "Dark Willow",
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
    "Bramble Maze": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_tick",
      "durationKey": "placement_duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Shadow Realm": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "max_damage_duration",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Cursed Crown": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Bedlam": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "attack_damage",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "hero_attack_damage",
        "attack_count"
      ],
      "defaultAttackCount": 1,
      "defaultIncluded": false
    },
    "Pixie Dust": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Terrorize": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
