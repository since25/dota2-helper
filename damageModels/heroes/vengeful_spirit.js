module.exports = {
  hero: 'Vengeful Spirit',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed missile, wave armor reduction, aura, and swap fields against Dotabuff snapshot.']
  },
  abilities: {
    'Magic Missile': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'magic_missile_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Wave of Terror': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'vision_duration',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      extraComponents: [
        {
          status: 'reference_only',
          model: 'debuff_reference',
          valueKey: 'armor_reduction',
          semanticType: 'modifier.armor_reduction.flat',
          affects: 'enemy_armor',
          stackGroup: 'armor_reduction',
          reason: '恐怖波动护甲降低影响后续物理伤害，作为修正项参考。'
        }
      ]
    },
    'Vengeance Aura': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'bonus_base_damage',
      semanticType: 'modifier.attack_damage.percent',
      affects: 'ally_attack_damage',
      stackGroup: 'attack_damage',
      reason: '复仇光环提供攻击力加成，不是独立技能伤害。'
    },
    Retribution: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'bonus_damage',
      semanticType: 'modifier.attack_damage.flat',
      affects: 'attack_damage',
      stackGroup: 'attack_damage',
      reason: '恶有恶报提供攻击力参考，不直接作为技能爆发。'
    },
    'Nether Swap': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'damage_reduction_duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    }
  }
};
