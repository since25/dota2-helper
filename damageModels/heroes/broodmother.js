module.exports = {
  "hero": "Broodmother",
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
    "Insatiable Hunger": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_damage",
      "semanticType": "modifier.attack_damage.flat",
      "affects": "attack_damage",
      "stackGroup": "attack_damage",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Spin Web": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Incapacitating Bite": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_damage",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    },
    "Spider's Milk": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "kill_heal_heroes",
      "semanticType": "defense.heal.flat",
      "affects": "sustain",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Spawn Spiderlings": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "buff_duration"
    }
  }
};
