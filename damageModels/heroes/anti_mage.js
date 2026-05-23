module.exports = {
  "hero": "Anti-Mage",
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
    "Mana Break": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "percent_damage_per_burn",
      "semanticType": "damage.mana_burn",
      "requiredInputs": [
        "target_current_mana",
        "attack_count"
      ],
      "conditionInputs": [
        "target_current_mana",
        "attack_count"
      ],
      "reason": "全量结构模型：该伤害需要额外状态输入，暂作为条件伤害参考。"
    },
    "Blink": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Counterspell": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Persecutor": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "move_slow_min",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Mana Void": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "mana_void_damage_per_mana",
      "semanticType": "damage.percent_missing_mana",
      "requiredInputs": [
        "target_missing_mana"
      ],
      "conditionInputs": [
        "target_missing_mana"
      ],
      "reason": "已损魔法百分比伤害需要目标已损魔法输入，首轮模型只作为条件伤害参考。"
    }
  }
};
