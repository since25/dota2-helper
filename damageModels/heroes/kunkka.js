module.exports = {
  "hero": "Kunkka",
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
    "Torrent": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "torrent_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "slow_duration",
      "tickIntervalKey": "damage_tick_interval"
    },
    "Tidebringer": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "cleave_damage",
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
    "X Marks the Spot": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Tidal Wave": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_shard"
      ],
      "defaultIncluded": false,
      "durationKey": "duration",
      "reason": "潮汐波为阿哈利姆魔晶条件技能，固定爆发默认不计入。"
    },
    "Ghostship": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "dmg",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Return": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
