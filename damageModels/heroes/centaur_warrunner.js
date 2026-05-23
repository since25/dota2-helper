module.exports = {
  "hero": "Centaur Warrunner",
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
    "Hoof Stomp": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "stomp_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Double Edge": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "edge_damage",
      "semanticType": "modifier.damage_amp.percent",
      "affects": "all_damage",
      "stackGroup": "damage_amplification",
      "reason": "全量结构模型：该百分比/修正值不直接计入固定爆发。"
    },
    "Retaliate": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "return_damage",
      "semanticType": "damage.attribute_scaling",
      "requiredInputs": [
        "hero_attribute"
      ],
      "conditionInputs": [
        "hero_attribute"
      ],
      "reason": "属性系数伤害需要英雄属性输入，首轮模型只作为条件伤害参考。"
    },
    "Work Horse": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Hitch A Ride": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Stampede": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "slow_movement_speed",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Horsepower": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
