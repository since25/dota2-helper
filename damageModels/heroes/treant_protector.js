module.exports = {
  "hero": "Treant Protector",
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
    "Nature's Grasp": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_second",
      "durationKey": "vines_duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Leech Seed": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "leech_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Living Armor": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "damage_block_base",
      "semanticType": "defense.damage_block.flat",
      "affects": "incoming_damage",
      "reason": "伤害格挡不是对敌伤害，作为防御修正参考。"
    },
    "Eyes In The Forest": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Nature's Guise": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_damage_pct",
      "semanticType": "modifier.attack_damage.flat",
      "affects": "attack_damage",
      "stackGroup": "attack_damage",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Overgrowth": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    }
  }
};
