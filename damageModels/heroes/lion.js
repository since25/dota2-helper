module.exports = {
  hero: 'Lion',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Initial manually curated model from damage model maintenance work.']
  },
  abilities: {
    'Earth Spike': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    Hex: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'control.hex.seconds',
      affects: 'disable_window',
      reason: '控制时间影响接技能窗口，但不直接造成伤害。'
    },
    'Mana Drain': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'mana_per_second',
      semanticType: 'resource.mana_drain_per_second',
      affects: 'mana_pressure',
      reason: '当前只记录抽蓝/减速，不计为生命伤害。'
    },
    'To Hell and Back': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'spell_amp',
      semanticType: 'modifier.spell_amplification.percent',
      affects: 'spell_amplification',
      stackGroup: 'spell_amplification',
      reason: '固定机制会影响法术强度，但当前伤害总量不自动串联增伤。'
    },
    'Finger of Death': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    }
  }
};
