module.exports = {
  "hero": "Dragon Knight",
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
    "Breathe Fire": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "damage",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "hero_attack_damage",
        "attack_count"
      ],
      "defaultAttackCount": 1,
      "defaultIncluded": false
    },
    "Dragon Tail": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Wyrm's Wrath": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "magic_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    },
    "Fireball": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage",
      "durationKey": "duration",
      "tickIntervalKey": "burn_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Dragon Blood": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Elder Dragon Form": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "corrosive_damage_per_second",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    }
  }
};
