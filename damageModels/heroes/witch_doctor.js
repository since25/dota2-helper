module.exports = {
  hero: 'Witch Doctor',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed cask/maledict/death ward fields for first maintenance batch.']
  },
  abilities: {
    'Paralyzing Cask': {
      status: 'implemented',
      model: 'repeated_trigger',
      damageKey: 'base_damage',
      triggerCountInput: 'bounce_count',
      bonusDamageKey: 'bounce_bonus_damage',
      semanticType: 'damage.wave',
      reason: '弹跳次数和每跳递增伤害需要运行时输入，不能默认所有弹跳命中同一目标。'
    },
    'Voodoo Restoration': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'heal',
      semanticType: 'defense.heal.flat',
      affects: 'ally_healing',
      reason: '当前数据 does_damage 为 0，仅作为治疗参考。'
    },
    Maledict: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'dmg',
      durationKey: 'abilityduration',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '当前计入每秒固定伤害；失血爆发百分比需要目标失血状态输入。'
    },
    'Voodoo Switcheroo': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'window.debuff_duration.seconds',
      affects: 'damage_window',
      reason: '临时变为死亡守卫，具体伤害复用 Death Ward。'
    },
    'Gris-Gris': {
      status: 'ignored',
      reason: '经济机制不直接造成伤害。'
    },
    'Death Ward': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'abilitychanneltime',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '按每秒一次攻击估算引导总量；攻速/弹射升级后续作为高级模型。'
    }
  }
};
