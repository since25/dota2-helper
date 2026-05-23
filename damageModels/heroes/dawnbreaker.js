module.exports = {
  "hero": "Dawnbreaker",
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
    "Starbreaker": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "swipe_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Celestial Hammer": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "burn_damage",
      "durationKey": "flare_debuff_duration",
      "tickIntervalKey": "burn_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Converge": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Break of Dawn": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Solar Guardian": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "base_damage",
      "durationKey": "land_stun_duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    }
  }
};
