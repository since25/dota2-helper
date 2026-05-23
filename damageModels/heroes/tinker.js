module.exports = {
  hero: 'Tinker',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed laser, march, warp flare, conveyance, and rearm fields against Dotabuff snapshot.']
  },
  abilities: {
    Laser: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'laser_damage',
      durationKey: 'duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'March of the Machines': {
      status: 'implemented',
      model: 'repeated_trigger',
      damageKey: 'damage',
      triggerCountInput: 'machine_hit_count',
      semanticType: 'damage.stack_scaling',
      conditionInputs: ['machine_hit_count'],
      reason: '机械行军每个机器命中造成 damage，实际总伤害必须输入命中次数。'
    },
    'Warp Flare': {
      status: 'implemented',
      model: 'conditional_instant',
      damageKey: 'damage',
      durationKey: 'debuff_duration',
      semanticType: 'damage.instant',
      conditionInputs: ['has_aghanims_shard'],
      defaultIncluded: false,
      reason: '折跃耀光为阿哈利姆魔晶条件技能，固定爆发默认不计入。'
    },
    'Keen Conveyance': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'abilitychanneltime',
      semanticType: 'window.buff_duration.seconds',
      affects: 'mobility_timing',
      reason: '基恩载具是传送机动能力，不直接造成伤害。'
    },
    Rearm: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'abilitychanneltime',
      semanticType: 'resource.cooldown',
      affects: 'combo_reset',
      reason: '再装填重置技能和物品冷却，影响连招次数但不直接造成伤害。'
    },
    'Eureka!': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'int_per_one_cdr',
      semanticType: 'resource.cooldown',
      affects: 'cooldown_reduction',
      reason: '尤里卡提供冷却缩减换算，不直接造成伤害。'
    }
  }
};
