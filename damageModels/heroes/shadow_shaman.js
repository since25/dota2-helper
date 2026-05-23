module.exports = {
  "hero": "Shadow Shaman",
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
    "Ether Shock": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    },
    "Hex": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Shackles": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "total_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "ward_linger_duration",
      "tickIntervalKey": "tick_interval"
    },
    "Fowl Play": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Urnaconda": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "impact_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "ward_duration"
    },
    "Mass Serpent Ward": {
      "status": "implemented",
      "model": "summon_attack",
      "attackDamageKey": "ward_damage_tooltip",
      "attackCountInput": "ward_attack_count",
      "semanticType": "summon.attack_damage",
      "conditionInputs": [
        "ward_attack_count"
      ],
      "reason": "守卫攻击伤害需要输入实际攻击次数。"
    }
  }
};
