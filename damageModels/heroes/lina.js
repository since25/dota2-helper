module.exports = {
  hero: 'Lina',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Initial manually curated model from damage model maintenance work.']
  },
  abilities: {
    'Dragon Slave': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'dragon_slave_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Light Strike Array': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'light_strike_array_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Fiery Soul': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'fiery_soul_attack_speed_bonus',
      semanticType: 'modifier.attack_speed.flat',
      affects: 'attack_speed',
      stackGroup: 'attack_speed',
      reason: '攻速叠层影响后续普攻，不直接作为技能爆发伤害。'
    },
    'Flame Cloak': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'spell_amp',
      semanticType: 'modifier.spell_amplification.percent',
      affects: 'spell_amplification',
      stackGroup: 'spell_amplification',
      reason: '法术增强会放大后续技能，当前总量不自动串联增伤。'
    },
    'Slow Burn': {
      status: 'unsupported',
      model: 'state_scaling',
      valueKey: 'burn_damage_pct',
      semanticType: 'damage.source_damage_percent',
      conditionInputs: ['source_damage', 'burn_duration'],
      reason: '该技能按目标承受伤害比例追加燃烧，需要上游伤害事件作为输入。'
    },
    'Laguna Blade': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    }
  }
};
