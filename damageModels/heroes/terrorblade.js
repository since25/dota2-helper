module.exports = {
  "hero": "Terrorblade",
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
    "Reflection": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Conjure Image": {
      "status": "implemented",
      "model": "summon_attack",
      "attackDamageKey": "illusion_outgoing_tooltip",
      "attackCountInput": "illusion_attack_count",
      "semanticType": "summon.attack_damage",
      "conditionInputs": [
        "illusion_attack_count",
        "hero_attack_damage"
      ],
      "reason": "幻象输出取决于幻象攻击次数和本体攻击力。"
    },
    "Metamorphosis": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Demon Zeal": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "berserk_bonus_attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Terror Wave": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "fear_duration"
    },
    "Sunder": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Dark Unity": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
