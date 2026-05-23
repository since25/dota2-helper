module.exports = {
  "hero": "Brewmaster",
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
    "Thunder Clap": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Cinder Brew": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "total_ignite_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Drunken Brawler": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Liquid Courage": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Primal Split": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "tooltip_earth_brewling_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    }
  }
};
