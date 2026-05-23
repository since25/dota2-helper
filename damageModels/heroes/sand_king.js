module.exports = {
  hero: 'Sand King',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Initial manually curated model from damage model maintenance work.']
  },
  abilities: {
    Burrowstrike: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'dmg',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Sand Storm': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'sand_storm_damage',
      durationKey: 'abilityduration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    Stinger: {
      status: 'implemented',
      model: 'attack_modifier',
      bonusDamageKey: 'attack_damage',
      semanticType: 'damage.attack_bonus',
      conditionInputs: ['attack_count', 'hero_attack_damage'],
      defaultAttackCount: 1
    },
    'Caustic Finale': {
      status: 'reference_only',
      model: 'conditional',
      valueKey: 'caustic_finale_damage_flat',
      semanticType: 'damage.death_trigger',
      conditionInputs: ['target_death'],
      condition: '目标在腐尸毒持续时间内死亡才会爆炸。',
      reason: '死亡爆炸依赖目标是否阵亡，当前阶段只作为条件伤害参考。'
    },
    Epicenter: {
      status: 'implemented',
      model: 'multi_wave',
      damagePerWaveKey: 'epicenter_damage',
      waveCountKey: 'epicenter_pulses',
      semanticType: 'damage.wave'
    }
  }
};
