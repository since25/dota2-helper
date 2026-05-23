module.exports = {
  hero: 'Abaddon',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed against local Dotabuff Chinese semantic snapshot.']
  },
  abilities: {
    'Withering Mist': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'heal_reduction_pct',
      semanticType: 'defense.regen.hp_per_second',
      affects: 'enemy_healing',
      reason: '固定先天效果降低低血量敌人的生命恢复，不直接造成伤害。'
    },
    'Mist Coil': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage_heal',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '对敌释放造成 damage_heal 魔法伤害；self_damage 是自身生命代价，不计入对敌爆发。'
    },
    'Aphotic Shield': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage_absorb',
      durationKey: 'duration',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '护盾消失或破裂时对附近敌人造成等于最大吸收量的魔法伤害。'
    },
    'Curse of Avernus': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'curse_dps',
      durationKey: 'curse_duration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      conditionInputs: ['attack_count'],
      condition: '需要普攻命中目标后触发。',
      reason: '被动攻击施加 2 秒持续伤害，是否触发取决于攻击命中窗口。'
    },
    'Borrowed Time': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'window.buff_duration.seconds',
      affects: 'survivability',
      reason: '回光返照将受到伤害转化为治疗，不直接造成对敌伤害。'
    }
  }
};
