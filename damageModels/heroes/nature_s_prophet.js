module.exports = {
  "hero": "Nature's Prophet",
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
    "Sprout": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "sprout_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Teleportation": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Nature's Call": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "treant_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "treant_duration"
    },
    "Curse of the Oldgrowth": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage_per_tree",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Spirit of the Forest": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Wrath of Nature": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "kill_damage_duration"
    }
  }
};
