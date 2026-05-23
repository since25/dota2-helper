module.exports = {
  "hero": "Snapfire",
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
    "Scatterblast": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "debuff_duration"
    },
    "Firesnap Cookie": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "impact_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "conditionInputs": [
        "impact_hit"
      ],
      "reason": "曲奇撞击是固定伤害，不按距离缩放。"
    },
    "Lil' Shredder": {
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
    "Gobble Up": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Spit Out": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "burn_damage",
      "durationKey": "burn_ground_duration",
      "tickIntervalKey": "burn_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Mortimer Kisses": {
      "status": "implemented",
      "model": "repeated_trigger",
      "damageKey": "damage_per_impact",
      "triggerCountInput": "kiss_impact_count",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "kiss_impact_count"
      ],
      "reason": "火团直接命中按命中次数计算；地面燃烧作为额外持续组件。",
      "extraComponents": [
        {
          "status": "implemented",
          "model": "sustained_dps",
          "damagePerSecondKey": "burn_damage",
          "durationKey": "burn_ground_duration",
          "tickIntervalKey": "burn_interval",
          "semanticType": "damage.sustained_dps",
          "defaultActiveDuration": "full"
        }
      ]
    },
    "Boomstick": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_amp_max",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    }
  }
};
