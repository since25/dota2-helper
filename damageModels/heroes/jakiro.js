module.exports = {
  hero: 'Jakiro',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed sustained/tick fields for first maintenance batch.']
  },
  abilities: {
    'Dual Breath': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'burn_damage',
      durationKey: 'abilityduration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '火焰部分为持续伤害；冰减速字段仅作为控制效果。'
    },
    'Ice Path': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Liquid Fire': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'abilityduration',
      tickIntervalKey: 'tick_rate',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Liquid Frost': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'duration',
      tickIntervalKey: 'tick_rate',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '当前模型计入命中伤害；后续可把易伤 bonus_instance_damage_from_other_abilities 作为修正项。'
    },
    'Double Trouble': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'attack_damage_reduction',
      semanticType: 'modifier.attack_damage.percent',
      affects: 'attack_damage',
      stackGroup: 'attack_damage',
      reason: '固定命石影响普攻输出，不直接作为技能爆发伤害。'
    },
    Macropyre: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'duration',
      tickIntervalKey: 'burn_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    }
  }
};
