module.exports = {
  hero: 'Leshrac',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed edict/pulse sustained fields for first maintenance batch.']
  },
  abilities: {
    'Split Earth': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'dmg',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Diabolic Edict': {
      status: 'implemented',
      model: 'multi_wave',
      damagePerWaveKey: 'damage',
      waveCountKey: 'num_explosions',
      semanticType: 'damage.wave',
      reason: '理论总量为所有爆炸都命中同一目标的上限。'
    },
    'Lightning Storm': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '单目标仅计入一次闪电伤害，弹跳总量需由命中目标数量处理。'
    },
    Nihilism: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'magic_amp',
      semanticType: 'modifier.damage_amp.percent',
      affects: 'magical_damage',
      stackGroup: 'damage_amplification',
      reason: '提高魔法伤害承受，作为独立修正项，不直接造成伤害。'
    },
    'Pulse Nova': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'damage',
      semanticType: 'damage.sustained_dps',
      requiredInputs: ['active_duration'],
      conditionInputs: ['active_duration'],
      reason: '脉冲新星为开关技能，本地没有固定持续时间，需要由作用时间输入计算。'
    }
  }
};
