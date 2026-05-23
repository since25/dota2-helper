module.exports = {
  "hero": "Elder Titan",
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
    "Echo Stomp": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "stomp_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "sleep_duration"
    },
    "Astral Spirit": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "pass_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "spirit_duration"
    },
    "Natural Order": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "armor_reduction_pct",
      "semanticType": "modifier.armor_reduction.flat",
      "affects": "physical_damage",
      "stackGroup": "armor_reduction",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Move Astral Spirit": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Momentum": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Earth Splitter": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Return Astral Spirit": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
