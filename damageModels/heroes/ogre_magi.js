module.exports = {
  "hero": "Ogre Magi",
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
    "Fireblast": {
      "status": "implemented",
      "model": "instant_fixed",
      "damageKey": "fireblast_damage",
      "semanticType": "damage.instant",
      "defaultIncluded": true,
      "durationKey": "stun_duration"
    },
    "Ignite": {
      "status": "implemented",
      "model": "sustained_dps",
      "damagePerSecondKey": "burn_damage",
      "durationKey": "duration",
      "semanticType": "damage.sustained_dps",
      "defaultActiveDuration": "full"
    },
    "Bloodlust": {
      "status": "reference_only",
      "model": "debuff_reference",
      "valueKey": "abilitycastrange",
      "semanticType": "mobility.cast_range.units",
      "affects": "positioning",
      "reason": "全量结构模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。"
    },
    "Unrefined Fireblast": {
      "status": "reference_only",
      "model": "state_scaling",
      "valueKey": "base_damage",
      "semanticType": "damage.attribute_scaling",
      "requiredInputs": [
        "hero_attribute"
      ],
      "conditionInputs": [
        "hero_attribute"
      ],
      "reason": "属性系数伤害需要英雄属性输入，首轮模型只作为条件伤害参考。"
    },
    "Fire Shield": {
      "status": "implemented",
      "model": "repeated_trigger",
      "damageKey": "damage",
      "triggerCountInput": "fireball_count",
      "semanticType": "damage.instant",
      "conditionInputs": [
        "has_aghanims_shard",
        "fireball_count"
      ],
      "defaultIncluded": false,
      "durationKey": "duration",
      "reason": "烈火护盾是隐藏的魔晶技能，只有拥有阿哈利姆魔晶并被攻击触发火球时才造成伤害；固定爆发默认不计入。"
    },
    "Multicast": {
      "status": "ignored",
      "reason": "首轮自动模型未识别到可用于伤害计算的直接数值。"
    }
  }
};
