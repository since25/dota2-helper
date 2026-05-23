module.exports = {
  "hero": "Mars",
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
    "Spear of Mars": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "activity_duration"
    },
    "God's Rebuke": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "crit_mult",
      "semanticType": "modifier.crit.multiplier",
      "affects": "physical_damage",
      "stackGroup": "critical_strike",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Bulwark": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Dauntless": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Arena Of Blood": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "spear_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "duration"
    }
  }
};
