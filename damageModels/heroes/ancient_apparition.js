module.exports = {
  hero: 'Ancient Apparition',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed cold feet/vortex/ice blast sustained fields for first maintenance batch.']
  },
  abilities: {
    'Cold Feet': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'abilityduration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Ice Vortex': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'vortex_duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Chilling Touch': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Bone Chill': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'str_reduction',
      semanticType: 'damage.attribute_scaling',
      requiredInputs: ['magic_damage_instances'],
      conditionInputs: ['magic_damage_instances'],
      reason: '固定命石降低力量，不直接作为技能伤害。'
    },
    'Ice Blast': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'frostbite_duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '当前模型计入霜寒持续伤害；命中爆炸 dmg 和斩杀阈值后续拆分。'
    },
    Release: {
      status: 'ignored',
      reason: '释放冰晶爆轰的控制子技能，不直接产生额外伤害。'
    }
  }
};
