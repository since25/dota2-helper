module.exports = {
  "hero": "Legion Commander",
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
    "Overwhelming Odds": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Press The Attack": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Moment of Courage": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "secondary_attack_damage",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "hero_attack_damage",
        "attack_count"
      ],
      "defaultAttackCount": 1,
      "defaultIncluded": false
    },
    "Outfight Them!": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Duel": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "reward_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    }
  }
};
