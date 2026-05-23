module.exports = {
  "hero": "Clockwerk",
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
    "Battery Assault": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Power Cogs": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage",
      "semanticType": "damage.mana_burn",
      "requiredInputs": [
        "target_current_mana",
        "attack_count"
      ],
      "conditionInputs": [
        "target_current_mana",
        "attack_count"
      ],
      "reason": "法力燃烧伤害需要目标当前魔法和攻击次数输入，首轮模型只作为条件伤害参考。"
    },
    "Rocket Flare": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration",
      "tickIntervalKey": "projectile_vision_tick_rate"
    },
    "Overclocking": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Jetpack": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Hookshot": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "ally_shield_duration"
    },
    "Armor Power": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_per_armor",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Jetpack Toggle": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
