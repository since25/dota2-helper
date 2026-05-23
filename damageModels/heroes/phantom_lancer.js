module.exports = {
  "hero": "Phantom Lancer",
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
    "Spirit Lance": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "lance_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Doppelganger": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Phantom Rush": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "evasion",
      "semanticType": "defense.evasion.percent",
      "affects": "survivability",
      "stackGroup": "evasion",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Illusory Armaments": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Juxtapose": {
      "status": "implemented",
      "model": "summon_attack",
      "attackDamageKey": "tooltip_illusion_damage",
      "attackCountInput": "illusion_attack_count",
      "semanticType": "summon.attack_damage",
      "conditionInputs": [
        "illusion_attack_count",
        "hero_attack_damage"
      ],
      "reason": "幻象输出取决于幻象数量、攻击次数和本体攻击力。"
    }
  }
};
