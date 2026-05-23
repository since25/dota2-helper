module.exports = {
  hero: 'Crystal Maiden',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed nova, frostbite, clone, and freezing field semantics against Dotabuff snapshot.']
  },
  abilities: {
    'Crystal Nova': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'nova_damage',
      durationKey: 'duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    Frostbite: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'duration',
      tickIntervalKey: 'tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Arcane Aura': {
      status: 'ignored',
      reason: '奥术光环是回蓝和魔法恢复增幅，不直接造成伤害。'
    },
    'Crystal Clone': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'frostbite_radius',
      semanticType: 'area.radius.units',
      affects: 'area_control',
      reason: '冰晶克隆提供位移和范围控制参考，当前不作为额外伤害源。'
    },
    'Glacial Guard': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'mana_multiplier',
      semanticType: 'defense.barrier.flat',
      affects: 'survivability',
      reason: '冰川护体为护盾相关先天效果，不直接造成对敌伤害。'
    },
    'Freezing Field': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'damage',
      semanticType: 'damage.stack_scaling',
      requiredInputs: ['active_duration', 'hit_count'],
      conditionInputs: ['active_duration', 'hit_count'],
      reason: '极寒领域每次爆炸造成 damage，实际总伤害取决于持续施法时间和命中爆炸次数。'
    },
    'Stop Freezing Field': {
      status: 'ignored',
      reason: '停止持续施法的控制子技能，不产生额外伤害。'
    }
  }
};
