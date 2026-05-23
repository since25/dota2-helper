module.exports = {
  "hero": "Void Spirit",
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
    "Aether Remnant": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "impact_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "pull_duration",
      "tickIntervalKey": "damage_tick_rate"
    },
    "Dissimilate": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "dmg",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "phase_duration"
    },
    "Resonant Pulse": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "buff_duration"
    },
    "Intrinsic Edge": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Astral Step": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "pop_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "conditionInputs": [
        "charge_hit_count"
      ]
    }
  }
};
