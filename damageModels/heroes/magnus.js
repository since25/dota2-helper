module.exports = {
  "hero": "Magnus",
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
    "Shockwave": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "shock_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "slow_duration"
    },
    "Empower": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Skewer": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "skewer_damage",
      "semanticType": "damage.move_speed_scaling",
      "requiredInputs": [
        "move_speed"
      ],
      "conditionInputs": [
        "move_speed"
      ],
      "reason": "移动速度系数伤害需要移动速度输入，首轮模型只作为条件伤害参考。"
    },
    "Horn Toss": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_shard"
      ],
      "defaultIncluded": false,
      "durationKey": "air_duration",
      "reason": "长角抛物为阿哈利姆魔晶条件技能，固定爆发默认不计入。"
    },
    "Solid Core": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
