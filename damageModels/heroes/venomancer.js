module.exports = {
  hero: 'Venomancer',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed poison sustained fields for first maintenance batch.']
  },
  abilities: {
    'Venomous Gale': {
      status: 'implemented',
      model: 'initial_plus_ticks',
      initialDamageKey: 'strike_damage',
      tickDamageKey: 'tick_damage',
      tickIntervalKey: 'tick_interval',
      durationKey: 'duration',
      semanticType: 'damage.tick',
      reason: '计入初始命中伤害和完整持续时间内的中毒跳数。'
    },
    Snakebite: {
      status: 'implemented',
      model: 'initial_plus_ticks',
      initialDamageKey: 'base_damage',
      tickDamageKey: 'tick_damage',
      tickIntervalKey: 'damage_interval',
      durationKey: 'duration',
      semanticType: 'damage.tick',
      reason: '计入初始伤害和完整持续时间内的中毒跳数。'
    },
    'Plague Ward': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'ward_damage_tooltip',
      semanticType: 'summon.attack_damage',
      affects: 'summon_attack_damage',
      conditionInputs: ['ward_attack_count', 'ward_active_duration'],
      reason: '守卫伤害取决于召唤物存活时间和攻击次数。'
    },
    'Poison Sting': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Noxious Plague': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'impact_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '计入初始伤害；最大生命百分比持续伤害作为额外运行时组件。',
      extraComponents: [
        {
          status: 'implemented',
          model: 'percent_health_dot',
          percentDamageKey: 'damage_per_second',
          durationKey: 'debuff_duration',
          healthInput: 'target_max_health',
          semanticType: 'damage.percent_max_health',
          conditionInputs: ['target_max_health']
        }
      ]
    }
  }
};
