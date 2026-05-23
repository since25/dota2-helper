module.exports = {
  hero: 'Axe',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Initial manually curated model from damage model maintenance work.']
  },
  abilities: {
    "Berserker's Call": {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'control.taunt.seconds',
      affects: 'disable_window',
      reason: '嘲讽和护甲影响换血窗口，不直接造成伤害。'
    },
    'Battle Hunger': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Counter Helix': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: false,
      reason: '按一次反击螺旋触发计算，触发次数需要由使用者选择。'
    },
    'Culling Blade': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'One Man Army': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'armor_pct_as_strength',
      semanticType: 'modifier.attribute_conversion.percent',
      affects: 'survivability',
      stackGroup: 'attribute_conversion',
      reason: '固定机制影响身板和输出环境，不直接造成伤害。'
    }
  }
};
