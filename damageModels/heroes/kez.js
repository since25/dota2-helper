module.exports = {
  "hero": "Kez",
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
    "Echo Slash": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "echo_hero_damage",
      "semanticType": "damage.distance_scaling",
      "requiredInputs": [
        "distance"
      ],
      "conditionInputs": [
        "distance"
      ],
      "reason": "距离系数伤害需要距离输入，首轮模型只作为条件伤害参考。"
    },
    "Grappling Claw": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Kazurai Katana": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Switch Discipline": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Raptor Dance": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "base_damage",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "最大生命百分比伤害需要目标最大生命输入，首轮模型只作为条件伤害参考。"
    },
    "Falcon Rush": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "base_echo_damage",
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
    "Talon Toss": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "silence_duration"
    },
    "Shodo Sai": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "stun_duration",
      "semanticType": "control.stun.seconds",
      "affects": "disable_window",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Raven's Veil": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Cancel": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
