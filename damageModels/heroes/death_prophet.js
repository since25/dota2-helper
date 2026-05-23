module.exports = {
  hero: 'Death Prophet',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed siphon/exorcism sustained fields for first maintenance batch.']
  },
  abilities: {
    'Crypt Swarm': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    Silence: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'abilityduration',
      semanticType: 'control.silence.seconds',
      affects: 'disable_window',
      reason: '沉默不直接造成伤害。'
    },
    'Spirit Siphon': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'haunt_duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '按单条吸魂巫术连接计算；多充能叠加后续由次数输入处理。'
    },
    Exorcism: {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'average_damage',
      semanticType: 'damage.attack_bonus',
      requiredInputs: ['spirit_hit_count'],
      conditionInputs: ['spirit_hit_count'],
      reason: '驱使恶灵命中次数由站位、距离和回魂路径决定，不能直接用持续时间相乘。'
    }
  }
};
