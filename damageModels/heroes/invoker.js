module.exports = {
  "hero": "Invoker",
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
    "Quas": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Wex": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_speed_per_instance",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Exort": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "bonus_damage_per_instance",
      "semanticType": "modifier.attack_damage.flat",
      "affects": "attack_damage",
      "stackGroup": "attack_damage",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Invoked Spell": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Invoke": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Cold Snap": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "freeze_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    },
    "Ghost Walk": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Tornado": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "base_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "end_vision_duration",
      "tickIntervalKey": "twister_tick_rate"
    },
    "E.M.P.": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "damage_per_mana_pct",
      "semanticType": "damage.percent_missing_mana",
      "requiredInputs": [
        "target_missing_mana"
      ],
      "conditionInputs": [
        "target_missing_mana"
      ],
      "reason": "全量结构模型：该伤害需要额外状态输入，暂作为条件伤害参考。"
    },
    "Alacrity": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Chaos Meteor": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "main_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "end_vision_duration"
    },
    "Sun Strike": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "vision_duration"
    },
    "Forge Spirit": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "spirit_damage",
      "semanticType": "damage.attribute_scaling",
      "requiredInputs": [
        "hero_attribute"
      ],
      "conditionInputs": [
        "hero_attribute"
      ],
      "reason": "属性系数伤害需要英雄属性输入，首轮模型只作为条件伤害参考。"
    },
    "Ice Wall": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "damage_per_second",
      "durationKey": "duration",
      "tickIntervalKey": "tick_interval",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Deafening Blast": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "end_vision_duration"
    }
  }
};
