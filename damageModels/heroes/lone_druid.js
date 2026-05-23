module.exports = {
  "hero": "Lone Druid",
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
    "Entangle": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage",
      "durationKey": "counter_duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Spirit Link": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Savage Roar": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Summon Spirit Bear": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "backlash_damage",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "最大生命百分比伤害需要目标最大生命输入，首轮模型只作为条件伤害参考。"
    },
    "True Form": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_attack_damage",
      "semanticType": "modifier.attack_damage.flat",
      "affects": "attack_damage",
      "stackGroup": "attack_damage",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
