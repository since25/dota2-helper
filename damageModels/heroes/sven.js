module.exports = {
  "hero": "Sven",
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
    "Storm Hammer": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "dmg",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "bolt_stun_duration"
    },
    "Great Cleave": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "great_cleave_damage",
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
    "Warcry": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "God's Strength": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    },
    "Wrath of God": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
