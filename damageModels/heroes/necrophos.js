module.exports = {
  "hero": "Necrophos",
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
    "Death Pulse": {
      "status": "reference_only",
      "model": "conditional",
      "valueKey": "dmg",
      "semanticType": "damage.death_trigger",
      "conditionInputs": [
        "trigger_condition"
      ],
      "condition": "需要触发条件成立才造成伤害。",
      "reason": "条件伤害首轮模型只作为参考，不默认计入固定爆发。"
    },
    "Ghost Shroud": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "movement_speed",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Heartstopper Aura": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "aura_damage",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "最大生命百分比伤害需要目标最大生命输入，首轮模型只作为条件伤害参考。"
    },
    "Death Seeker": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Sadist": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_spell_amp",
      "semanticType": "modifier.spell_amplification.percent",
      "affects": "spell_amplification",
      "stackGroup": "spell_amplification",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Reaper's Scythe": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_per_health",
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
