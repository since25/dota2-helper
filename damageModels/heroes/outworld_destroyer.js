module.exports = {
  "hero": "Outworld Destroyer",
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
    "Arcane Orb": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "mana_pool_damage_pct",
      "semanticType": "damage.percent_max_mana",
      "requiredInputs": [
        "caster_current_mana",
        "attack_count"
      ],
      "conditionInputs": [
        "caster_current_mana",
        "attack_count"
      ],
      "reason": "奥术天球按施法者当前/最大魔法池百分比随攻击结算，需要魔法值和攻击次数输入。"
    },
    "Astral Imprisonment": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "prison_duration"
    },
    "Objurgation": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "barrier_flat",
      "semanticType": "defense.barrier.flat",
      "affects": "survivability",
      "reason": "护盾不直接造成伤害。"
    },
    "Essence Flux": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "mana_restore",
      "semanticType": "resource.mana_cost",
      "affects": "resource_sustain",
      "reason": "回蓝机制影响续航，不直接造成伤害。"
    },
    "Sanity's Eclipse": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_multiplier",
      "semanticType": "damage.attribute_scaling",
      "requiredInputs": [
        "caster_current_mana",
        "target_current_mana"
      ],
      "conditionInputs": [
        "caster_current_mana",
        "target_current_mana"
      ],
      "reason": "神智之蚀伤害取决于双方魔法差，需要运行时魔法值输入。"
    }
  }
};
