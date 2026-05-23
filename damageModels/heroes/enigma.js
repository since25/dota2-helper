module.exports = {
  "hero": "Enigma",
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
    "Malefice": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration",
      "tickIntervalKey": "tick_rate"
    },
    "Demonic Summoning": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "eidelon_base_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "abilityduration"
    },
    "Midnight Pulse": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "base_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Event Horizon": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "speed_bonus",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Black Hole": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage",
      "durationKey": "duration",
      "tickIntervalKey": "tick_rate",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    }
  }
};
