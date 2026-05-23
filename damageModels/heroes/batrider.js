module.exports = {
  hero: 'Batrider',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed sticky napalm, flamebreak, firefly, and lasso fields against Dotabuff snapshot.']
  },
  abilities: {
    'Sticky Napalm': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'damage',
      semanticType: 'damage.stack_scaling',
      requiredInputs: ['napalm_stack_count', 'damage_instance_count'],
      conditionInputs: ['napalm_stack_count', 'damage_instance_count'],
      reason: '粘性燃油按层数增强后续伤害，不能作为独立固定爆发直接相加。'
    },
    Flamebreak: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage_impact',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '烈焰破击包含命中伤害和后续燃烧伤害，二者拆成两个组件。',
      extraComponents: [
        {
          status: 'implemented',
          model: 'sustained_dps',
          damagePerSecondKey: 'damage_per_second',
          durationKey: 'damage_duration',
          semanticType: 'damage.sustained_dps',
          defaultActiveDuration: 'full',
          conditionInputs: ['active_duration']
        }
      ]
    },
    Firefly: {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage_per_second',
      durationKey: 'duration',
      tickIntervalKey: 'tick_interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      conditionInputs: ['active_duration'],
      reason: '火焰飞行为地面持续伤害，实际命中时间由走位决定。'
    },
    'Smoldering Resin': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'tick_attack_damage_pct',
      semanticType: 'damage.source_damage_percent',
      requiredInputs: ['attack_damage', 'tick_count'],
      conditionInputs: ['attack_damage', 'tick_count'],
      reason: '先天效果按攻击伤害百分比触发，需结合普攻伤害和触发次数。'
    },
    'Flaming Lasso': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'duration',
      tickIntervalKey: 'tick_rate',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '本地字段 damage 表示燃烧枷锁总伤害，duration/tick_rate 仅作为窗口参考。'
    }
  }
};
