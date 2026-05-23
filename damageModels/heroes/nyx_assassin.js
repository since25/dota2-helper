module.exports = {
  "hero": "Nyx Assassin",
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
    "Impale": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "impale_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Mind Flare": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_echo_duration",
      "durationKey": "damage_echo_duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Spiked Carapace": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "stun_duration",
      "semanticType": "control.stun.seconds",
      "affects": "disable_window",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Burrow": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "cast_range",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Mana Burn": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Vendetta": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Unburrow": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
