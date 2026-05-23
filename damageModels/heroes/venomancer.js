module.exports = {
  hero: 'Venomancer',
  abilities: {
    'Venomous Gale': {
      status: 'reference_only',
      model: 'conditional',
      valueKey: 'strike_damage',
      semanticType: 'damage.tick',
      condition: '初始伤害命中后按 tick 间隔持续掉血。',
      reason: '该技能包含初始伤害和每跳伤害，组合 tick 模型将在后续批次补齐。'
    },
    Snakebite: {
      status: 'reference_only',
      model: 'conditional',
      valueKey: 'base_damage',
      semanticType: 'damage.sustained_dps',
      condition: '初始伤害命中后按持续时间造成每秒伤害。',
      reason: '该技能包含初始伤害和持续伤害，组合模型将在后续批次补齐。'
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
      reason: '只计入初始伤害；最大生命百分比持续伤害暂作为后续扩展。'
    }
  }
};
