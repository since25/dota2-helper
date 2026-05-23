module.exports = {
  "hero": "Ember Spirit",
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
    "Searing Chains": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_second",
      "durationKey": "duration",
      "tickIntervalKey": "tick_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Sleight of Fist": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Flame Guard": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_second",
      "durationKey": "duration",
      "tickIntervalKey": "tick_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Activate Fire Remnant": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    },
    "Immolation": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.sustained_dps",
      "requiredInputs": [
        "active_duration"
      ],
      "conditionInputs": [
        "active_duration"
      ],
      "reason": "持续伤害缺少可确认的持续时间字段，首轮模型只作为条件伤害参考。"
    },
    "Fire Remnant": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    }
  }
};
