module.exports = {
  "hero": "Techies",
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
    "Sticky Bomb": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.move_speed_scaling",
      "requiredInputs": [
        "move_speed"
      ],
      "conditionInputs": [
        "move_speed"
      ],
      "reason": "移动速度系数伤害需要移动速度输入，首轮模型只作为条件伤害参考。"
    },
    "Reactive Tazer": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.move_speed_scaling",
      "requiredInputs": [
        "move_speed"
      ],
      "conditionInputs": [
        "move_speed"
      ],
      "reason": "移动速度系数伤害需要移动速度输入，首轮模型只作为条件伤害参考。"
    },
    "Blast Off!": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.percent_max_health",
      "requiredInputs": [
        "enemy_max_health"
      ],
      "conditionInputs": [
        "enemy_max_health"
      ],
      "reason": "最大生命百分比伤害需要目标最大生命输入，首轮模型只作为条件伤害参考。"
    },
    "M.A.D.": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "base_damage",
      "semanticType": "damage.percent_max_mana",
      "requiredInputs": [
        "target_max_mana"
      ],
      "conditionInputs": [
        "target_max_mana"
      ],
      "reason": "M.A.D. 包含基础伤害和目标最大魔法百分比伤害，需要目标最大魔法输入。"
    },
    "Minefield Sign": {
      "status": "implemented",
      "model": "repeated_trigger",
      "damageKey": "scepter_move_damage",
      "triggerCountInput": "movement_trigger_count",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_scepter",
        "movement_trigger_count"
      ],
      "defaultIncluded": false,
      "durationKey": "minefield_duration",
      "reason": "雷区标识的 scepter_move_damage 是神杖雷区内移动触发伤害，需要神杖和触发次数，固定爆发默认不计入。"
    },
    "Proximity Mines": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "burn_duration"
    },
    "Detonate Tazer": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Detonate M.A.D.": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
