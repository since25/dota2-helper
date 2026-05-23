module.exports = {
  "hero": "Pangolier",
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
    "Swashbuckle": {
      "status": "implemented",
      "model": "repeated_trigger",
      "damageKey": "damage",
      "triggerCountInput": "strike_count",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "strike_count"
      ],
      "reason": "每次刺击独立造成伤害，实际总量取决于命中刺击次数。"
    },
    "Shield Crash": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Lucky Shot": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "armor",
      "semanticType": "modifier.armor_reduction.flat",
      "affects": "physical_damage",
      "stackGroup": "armor_reduction",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Roll Up": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Rolling Thunder": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "dmg",
      "semanticType": "damage.move_speed_scaling",
      "requiredInputs": [
        "collision_count"
      ],
      "conditionInputs": [
        "collision_count"
      ],
      "reason": "滚动碰撞可多次命中，实际总量取决于碰撞次数。"
    },
    "Stop Rolling": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "End Roll Up": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Fortune Favors the Bold": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
