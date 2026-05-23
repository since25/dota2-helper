module.exports = {
  "hero": "Riki",
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
    "Smoke Screen": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Blink Strike": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "bonus_damage",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "attack_count",
        "hero_attack_damage"
      ],
      "defaultAttackCount": 1,
      "defaultIncluded": false,
      "reason": "闪烁突袭附加一次攻击伤害，需结合英雄攻击力。"
    },
    "Tricks of the Trade": {
      "status": "implemented",
      "model": "attack_modifier",
      "bonusDamageKey": "attack_damage",
      "semanticType": "damage.attack_bonus",
      "conditionInputs": [
        "hero_attack_damage",
        "attack_count"
      ],
      "defaultAttackCount": 1,
      "defaultIncluded": false
    },
    "Backstab": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Cloak and Dagger": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
