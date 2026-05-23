module.exports = {
  "hero": "Enchantress",
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
    "Impetus": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "illusion_damage_multiplier",
      "semanticType": "damage.source_damage_percent",
      "requiredInputs": [
        "source_damage",
        "hit_count"
      ],
      "conditionInputs": [
        "source_damage",
        "hit_count"
      ],
      "reason": "来源伤害百分比需要来源伤害输入，首轮模型只作为条件伤害参考。"
    },
    "Enchant": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "enchant_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "slow_duration"
    },
    "Nature's Attendants": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Sproink": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Little Friends": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Untouchable": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "slow_attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Rabble-Rouser": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
