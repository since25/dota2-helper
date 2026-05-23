module.exports = {
  "hero": "Alchemist",
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
    "Acid Spray": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage",
      "durationKey": "duration",
      "tickIntervalKey": "tick_rate",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Unstable Concoction": {
      "status": "reference_only",
      "model": "conditional",
      "valueKey": "max_damage",
      "semanticType": "damage.death_trigger",
      "conditionInputs": [
        "trigger_condition"
      ],
      "condition": "需要触发条件成立才造成伤害。",
      "reason": "条件伤害首轮模型只作为参考，不默认计入固定爆发。"
    },
    "Corrosive Weaponry": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "slow_per_stack",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Berserk Potion": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Greevil's Greed": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Chemical Rage": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Unstable Concoction Throw": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "max_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    }
  }
};
