module.exports = {
  "hero": "Tusk",
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
    "Ice Shards": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "shard_damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_shard"
      ],
      "defaultIncluded": false,
      "durationKey": "shard_duration",
      "reason": "寒冰碎片为魔晶解锁伤害项，只有拥有阿哈利姆魔晶时才计入。"
    },
    "Snowball": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "snowball_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Tag Team": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "movement_slow",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Drinking Buddies": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Walrus Kick": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_scepter"
      ],
      "defaultIncluded": false,
      "durationKey": "slow_duration",
      "reason": "海象飞踢为阿哈利姆神杖解锁技能，固定爆发默认不计入。"
    },
    "Walrus PUNCH!": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Launch Snowball": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Bitter Chill": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_speed_slow",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
