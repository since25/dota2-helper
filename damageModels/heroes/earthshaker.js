module.exports = {
  hero: 'Earthshaker',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed fissure, aftershock, and echo slam split components against Dotabuff snapshot.']
  },
  abilities: {
    Fissure: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'fissure_damage',
      durationKey: 'fissure_duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Enchant Totem': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'totem_damage_percentage',
      semanticType: 'modifier.attack_damage.percent',
      affects: 'attack_damage',
      stackGroup: 'attack_damage',
      reason: '强化图腾按下一次普攻攻击力百分比增伤，需要结合英雄当前攻击力。'
    },
    Aftershock: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'aftershock_damage',
      durationKey: 'abilityduration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Echo Slam': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'echo_slam_initial_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '回音击拆分为初始伤害和按附近单位数量变化的回音伤害。',
      extraComponents: [
        {
          status: 'reference_only',
          model: 'state_scaling',
          valueKey: 'echo_slam_echo_damage',
          semanticType: 'damage.stack_scaling',
          requiredInputs: ['nearby_unit_count'],
          conditionInputs: ['nearby_unit_count'],
          reason: '每个附近单位产生一次回音伤害，需输入附近单位数量。'
        }
      ]
    },
    Slugger: {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'projectile_body_damage_hero',
      semanticType: 'damage.percent_max_health',
      requiredInputs: ['thrown_body_target_type', 'enemy_max_health'],
      conditionInputs: ['thrown_body_target_type', 'enemy_max_health'],
      reason: '强击图腾先天效果依赖击杀后投掷单位和目标生命，不进入基础连招固定伤害。'
    }
  }
};
