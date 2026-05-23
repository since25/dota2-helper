module.exports = {
  "hero": "Lifestealer",
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
    "Rage": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Open Wounds": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "max_health_as_damage_pct",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "全量结构模型：该伤害需要额外状态输入，暂作为条件伤害参考。"
    },
    "Feast": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "hp_damage_percent",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "全量结构模型：该伤害需要额外状态输入，暂作为条件伤害参考。"
    },
    "Ghoul Frenzy": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Infest": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "dot_duration",
      "tickIntervalKey": "dot_tick_interval"
    },
    "Consume": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
