module.exports = {
  hero: 'Tidehunter',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed gush armor reduction, anchor smash attack damage, and ravage fields against Dotabuff snapshot.']
  },
  abilities: {
    Gush: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'gush_damage',
      durationKey: 'abilityduration',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      extraComponents: [
        {
          status: 'reference_only',
          model: 'debuff_reference',
          valueKey: 'negative_armor',
          semanticType: 'modifier.armor_reduction.flat',
          affects: 'enemy_armor',
          stackGroup: 'armor_reduction',
          reason: '巨浪护甲降低影响后续物理伤害，作为修正项参考。'
        }
      ]
    },
    'Kraken Shell': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'damage_reduction',
      semanticType: 'defense.damage_block.flat',
      affects: 'survivability',
      reason: '海妖外壳提供伤害格挡和驱散，不直接造成对敌伤害。'
    },
    'Anchor Smash': {
      status: 'implemented',
      model: 'attack_modifier',
      bonusDamageKey: 'attack_damage',
      semanticType: 'damage.attack_bonus',
      conditionInputs: ['hero_attack_damage', 'attack_count'],
      reason: '锚击基于一次攻击并附加 attack_damage，需要结合英雄攻击力。'
    },
    'Dead in the Water': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'window.debuff_duration.seconds',
      affects: 'disable_window',
      reason: '重如铁锚提供位移限制，不直接造成伤害。'
    },
    Ravage: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'dmg',
      durationKey: 'duration',
      semanticType: 'damage.instant',
      defaultIncluded: true
    }
  }
};
