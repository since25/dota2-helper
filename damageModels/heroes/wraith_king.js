module.exports = {
  "hero": "Wraith King",
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
    "Wraithfire Blast": {
      "status": "implemented",
      "model": "initial_plus_dot",
      "initialDamageKey": "damage",
      "damagePerSecondKey": "blast_dot_damage",
      "durationKey": "blast_dot_duration",
      "semanticType": "damage.sustained_dps",
      "reason": "计入初始伤害和持续灼烧伤害。"
    },
    "Bone Guard": {
      "status": "implemented",
      "model": "summon_attack",
      "attackDamageKey": "skeleton_damage_tooltip",
      "attackCountInput": "summon_attack_count",
      "semanticType": "summon.attack_damage",
      "conditionInputs": [
        "summon_attack_count"
      ],
      "reason": "骷髅兵输出取决于召唤物实际攻击次数。"
    },
    "Mortal Strike": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "crit_mult",
      "semanticType": "modifier.crit.multiplier",
      "affects": "physical_damage",
      "stackGroup": "critical_strike",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Vampiric Spirit": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "scepter_attack_speed",
      "semanticType": "modifier.attack_speed.flat",
      "affects": "attack_speed",
      "stackGroup": "attack_speed",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Reincarnation": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "movespeed",
      "semanticType": "control.slow.move_percent",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    }
  }
};
