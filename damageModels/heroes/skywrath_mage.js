module.exports = {
  "hero": "Skywrath Mage",
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
    "Arcane Bolt": {
      "status": "implemented",
      "model": "attribute_scaling",
      "baseDamageKey": "bolt_damage",
      "attributeMultiplierKey": "int_multiplier",
      "attributeInput": "caster_intelligence",
      "semanticType": "damage.attribute_scaling",
      "conditionInputs": [
        "caster_intelligence"
      ],
      "reason": "奥法鹰隼为基础伤害加智力系数，需要施法者智力输入。"
    },
    "Concussive Shot": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "slow_duration"
    },
    "Ancient Seal": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Shield of the Scion": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_barrier",
      "semanticType": "defense.barrier.flat",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Mystic Flare": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    }
  }
};
