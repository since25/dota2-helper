module.exports = {
  "hero": "Troll Warlord",
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
    "Battle Stance": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_speed_interval",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Whirling Axes (Ranged)": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "axe_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "axe_slow_duration"
    },
    "Whirling Axes (Melee)": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "blind_duration"
    },
    "Fervor": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Berserker's Rage": {
      "status": "implemented",
      "model": "conditional_instant",
      "damageKey": "maim_damage",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "attack_count",
        "proc_mode"
      ],
      "defaultIncluded": false,
      "reason": "残废伤害是攻击概率触发，需输入攻击次数和触发模式。"
    },
    "Battle Trance": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
