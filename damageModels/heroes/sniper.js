module.exports = {
  "hero": "Sniper",
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
    "Shrapnel": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "shrapnel_damage",
      "semanticType": "damage.stack_scaling",
      "requiredInputs": [
        "stack_count"
      ],
      "conditionInputs": [
        "stack_count"
      ],
      "reason": "叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。"
    },
    "Headshot": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "damage",
      "procChanceKey": "proc_chance",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "attack_count",
        "proc_mode",
        "hero_attack_damage"
      ],
      "defaultIncluded": false,
      "reason": "爆头是概率攻击附加伤害，需输入攻击次数和触发模式。"
    },
    "Take Aim": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Concussive Grenade": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "debuff_duration"
    },
    "Keen Scope": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Assassinate": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true
    }
  }
};
