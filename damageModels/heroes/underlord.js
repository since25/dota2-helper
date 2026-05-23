module.exports = {
  "hero": "Underlord",
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
    "Firestorm": {
      "status": "implemented",
      "model": "multi_wave",
      "damagePerWaveKey": "wave_damage",
      "waveCountKey": "wave_count",
      "semanticType": "damage.wave"
    },
    "Pit of Malice": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "pit_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "pit_duration"
    },
    "Atrophy Aura": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Invading Force": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Fiend's Gate": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
