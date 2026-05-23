module.exports = {
  "hero": "Pudge",
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
    "Meat Hook": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "vision_duration"
    },
    "Rot": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "rot_damage",
      "durationKey": "active_duration",
      "tickIntervalKey": "rot_tick",
      "semanticType": "damage.sustained_dps",
      "conditionInputs": [
        "active_duration"
      ],
      "defaultActiveDuration": "manual"
    },
    "Meat Shield": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_block",
      "semanticType": "defense.damage_block.flat",
      "affects": "incoming_damage",
      "reason": "伤害格挡不是对敌伤害，作为防御修正参考。"
    },
    "Flesh Heap": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Dismember": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "dismember_damage",
      "durationKey": "abilitychanneltime",
      "semanticType": "damage.sustained_dps",
      "conditionInputs": [
        "caster_strength",
        "active_duration"
      ],
      "defaultActiveDuration": "full",
      "extraComponents": [
        {
          "status": "implemented",
          "model": "attribute_scaling",
          "baseDamageKey": "dismember_damage",
          "attributeMultiplierKey": "strength_damage",
          "attributeInput": "caster_strength",
          "semanticType": "damage.attribute_scaling",
          "conditionInputs": [
            "caster_strength"
          ]
        }
      ]
    }
  }
};
