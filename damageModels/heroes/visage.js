module.exports = {
  "hero": "Visage",
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
    "Grave Chill": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Soul Assumption": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "soul_base_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Gravekeeper's Cloak": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_reduction",
      "semanticType": "defense.damage_reduction.percent",
      "affects": "incoming_damage",
      "reason": "减伤和最小触发伤害不是对敌伤害，作为防御修正参考。"
    },
    "Stone Form": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "stun_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Silent as the Grave": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Summon Familiars": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "familiar_attack_damage",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "hero_attack_damage",
        "attack_count"
      ],
      "defaultAttackCount": 1,
      "defaultIncluded": false
    }
  }
};
