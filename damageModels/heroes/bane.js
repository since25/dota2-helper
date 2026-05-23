module.exports = {
  hero: 'Bane',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed against local Dotabuff Chinese semantic snapshot.']
  },
  abilities: {
    Enfeeble: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'enfeeble_tick_damage',
      durationKey: 'duration',
      tickIntervalKey: 'damage_tick_rate',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '虚弱每秒造成纯粹伤害；减伤、治疗降低和施法距离降低不计入固定爆发。'
    },
    'Brain Sap': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'brain_sap_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    Nightmare: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'abilityduration',
      semanticType: 'window.debuff_duration.seconds',
      affects: 'disable_window',
      reason: '噩梦本身是控制窗口，不直接造成对敌爆发伤害。'
    },
    "Fiend's Grip": {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'fiend_grip_damage',
      durationKey: 'abilitychanneltime',
      tickIntervalKey: 'fiend_grip_tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      conditionInputs: ['channel_duration'],
      reason: '魔爪为持续施法伤害，实际总量取决于持续施法时间。'
    },
    'Nightmare End': {
      status: 'ignored',
      reason: '结束噩梦的控制子技能，不产生额外伤害。'
    },
    'Ichor of Nyctasha': {
      status: 'ignored',
      reason: '当前本地字段没有可用伤害数值，先不参与伤害计算。'
    }
  }
};
