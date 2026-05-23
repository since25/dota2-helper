module.exports = {
  hero: 'Viper',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed sustained poison and area damage fields for first maintenance batch.']
  },
  abilities: {
    'Poison Attack': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '单层毒性攻击持续伤害；多层叠加由后续 stack 输入处理。'
    },
    Nethertoxin: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'max_damage',
      durationKey: 'duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '采用满额 DPS 作为理论上限，min_damage/max_duration 用于后续成长曲线模型。'
    },
    'Corrosive Skin': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    Nosedive: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'effect_duration',
      semanticType: 'window.debuff_duration.seconds',
      affects: 'damage_window',
      reason: '落地施加腐蚀皮肤/幽冥剧毒效果，伤害来自关联技能，避免重复计算。'
    },
    'Viper Strike': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    }
  }
};
