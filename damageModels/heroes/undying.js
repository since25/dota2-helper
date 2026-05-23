module.exports = {
  "hero": "Undying",
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
    "Decay": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "decay_damage",
      "semanticType": "damage.attribute_scaling",
      "requiredInputs": [
        "hero_attribute"
      ],
      "conditionInputs": [
        "hero_attribute"
      ],
      "reason": "属性系数伤害需要英雄属性输入，首轮模型只作为条件伤害参考。"
    },
    "Soul Rip": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage_per_unit",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "strength_share_duration"
    },
    "Tombstone": {
      "status": "reference_only",
      "model": "conditional",
      "valueKey": "zombie_damage_tooltip",
      "semanticType": "damage.death_trigger",
      "conditionInputs": [
        "trigger_condition"
      ],
      "condition": "需要触发条件成立才造成伤害。",
      "reason": "条件伤害首轮模型只作为参考，不默认计入固定爆发。"
    },
    "Flesh Golem": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_amp",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    }
  }
};
