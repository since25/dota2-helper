module.exports = {
  "hero": "Earth Spirit",
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
    "Boulder Smash": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "rock_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Rolling Boulder": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Geomagnetic Grip": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "rock_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Stone Remnant": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "attack_damage_per_stone",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Enchant Remnant": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_shard"
      ],
      "defaultIncluded": false,
      "durationKey": "duration",
      "reason": "残岩魔咒为阿哈利姆魔晶条件技能，固定爆发默认不计入。"
    },
    "Magnetize": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_second",
      "durationKey": "damage_duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    }
  }
};
