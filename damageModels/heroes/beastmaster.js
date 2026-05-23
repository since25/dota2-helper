module.exports = {
  "hero": "Beastmaster",
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
    "Wild Axes": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "axe_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Summon Razorback": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "boar_base_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Summon Raptors": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "dive_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Inner Beast": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Drums of Slom": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "base_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    },
    "Primal Roar": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    }
  }
};
