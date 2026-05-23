module.exports = {
  hero: 'Zeus',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed static field, arc lightning, lightning bolt, jump, hands, and ultimate fields against Dotabuff snapshot.']
  },
  abilities: {
    'Arc Lightning': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'arc_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Lightning Bolt': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'sight_duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Heavenly Jump': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    Nimbus: {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'cloud_bolt_interval',
      semanticType: 'damage.stack_scaling',
      requiredInputs: ['nimbus_bolt_count'],
      conditionInputs: ['nimbus_bolt_count'],
      reason: '雷云通过周期性雷击造成伤害，单次雷击复用雷击模型，需输入触发次数。'
    },
    'Lightning Hands': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'arc_lightning_damage_pct',
      semanticType: 'damage.source_damage_percent',
      requiredInputs: ['attack_count', 'arc_lightning_damage'],
      conditionInputs: ['attack_count', 'arc_lightning_damage'],
      reason: '霹雳之手按弧形闪电伤害百分比随普攻触发，需要输入攻击次数。'
    },
    "Thundergod's Wrath": {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'sight_duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Static Field': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'damage_health_pct',
      semanticType: 'damage.percent_current_health',
      requiredInputs: ['enemy_current_health', 'spell_hit_count'],
      conditionInputs: ['enemy_current_health', 'spell_hit_count'],
      reason: '静电场按敌方当前生命百分比结算，需要结合目标当前血量和触发次数。'
    }
  }
};
