module.exports = {
  hero: 'Phoenix',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed burn/channel/supernova tick fields for first maintenance batch.']
  },
  abilities: {
    'Icarus Dive': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'burn_duration',
      tickIntervalKey: 'burn_tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Fire Spirits': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'duration',
      tickIntervalKey: 'tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '按单个火精灵命中计算；多个火精灵叠加后续由命中次数输入处理。'
    },
    'Sun Ray': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'base_damage',
      durationKey: 'abilityduration',
      tickIntervalKey: 'tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '计入基础每秒伤害；最大生命百分比伤害作为额外运行时组件。',
      extraComponents: [
        {
          status: 'implemented',
          model: 'percent_health_dot',
          percentDamageKey: 'hp_perc_damage',
          durationKey: 'abilityduration',
          healthInput: 'target_max_health',
          semanticType: 'damage.percent_max_health',
          conditionInputs: ['target_max_health', 'active_duration']
        }
      ]
    },
    'Toggle Movement': {
      status: 'ignored',
      reason: '该技能仅切换烈日炙烤移动模式，不直接产生伤害。'
    },
    'Dying Light': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'damage_pct',
      semanticType: 'damage.percent_missing_health',
      requiredInputs: ['hero_missing_health', 'active_duration'],
      conditionInputs: ['hero_missing_health', 'active_duration'],
      reason: '伤害按凤凰已损生命百分比变化，需要战斗状态输入。'
    },
    Supernova: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_sec',
      durationKey: 'abilityduration',
      tickIntervalKey: 'tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    },
    'Launch Fire Spirit': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'duration',
      tickIntervalKey: 'tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      reason: '火精灵发射子技能与 Fire Spirits 使用同一组伤害字段。'
    },
    'Stop Icarus Dive': {
      status: 'ignored',
      reason: '该技能仅停止位移，不直接产生伤害。'
    },
    'Stop Sun Ray': {
      status: 'ignored',
      reason: '该技能仅停止烈日炙烤，不直接产生伤害。'
    }
  }
};
