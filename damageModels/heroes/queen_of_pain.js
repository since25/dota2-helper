module.exports = {
  hero: 'Queen of Pain',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Initial manually curated model from damage model maintenance work.']
  },
  abilities: {
    'Shadow Strike': {
      status: 'reference_only',
      model: 'conditional',
      valueKey: 'strike_damage',
      semanticType: 'damage.tick',
      condition: '先造成初始伤害，随后按 tick 间隔造成持续伤害。',
      reason: '该技能包含初始伤害和间隔伤害，组合 tick 模型将在后续批次补齐。'
    },
    Blink: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'abilitycastrange',
      semanticType: 'mobility.cast_range.units',
      affects: 'positioning',
      reason: '位移技能影响进场和逃生，不直接造成伤害。'
    },
    'Scream Of Pain': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    Succubus: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'spell_lifesteal',
      semanticType: 'defense.lifesteal.percent',
      affects: 'sustain',
      stackGroup: 'lifesteal',
      reason: '固定命石/被动提供续航，不直接造成伤害。'
    },
    'Sonic Wave': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    }
  }
};
