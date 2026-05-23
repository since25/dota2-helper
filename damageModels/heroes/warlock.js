module.exports = {
  "hero": "Warlock",
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
    "Fatal Bonds": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Shadow Word": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage",
      "durationKey": "duration",
      "tickIntervalKey": "tick_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full",
      "reason": "对敌施放时为持续伤害；治疗场景不计入敌方伤害。"
    },
    "Upheaval": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_second",
      "durationKey": "duration",
      "tickIntervalKey": "damage_tick_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Eldritch Summoning": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Chaotic Offering": {
      "status": "implemented",
      "model": "summon_attack",
      "attackDamageKey": "golem_dmg",
      "attackCountInput": "summon_attack_count",
      "semanticType": "summon.attack_damage",
      "conditionInputs": [
        "summon_attack_count"
      ],
      "reason": "地狱火伤害取决于召唤物实际攻击次数。"
    }
  }
};
