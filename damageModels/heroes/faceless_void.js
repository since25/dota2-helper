module.exports = {
  hero: 'Faceless Void',
  abilities: {
    'Time Walk': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'range',
      semanticType: 'mobility.dash_range.units',
      affects: 'positioning',
      reason: '位移和回溯影响进出场，不直接造成伤害。'
    },
    'Time Dilation': {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: 'damage_per_stack',
      semanticType: 'damage.stack_scaling',
      conditionInputs: ['cooling_ability_count', 'active_duration'],
      requiredInputs: ['目标冷却中的技能数量', '实际作用时间'],
      reason: '每层每秒伤害依赖敌方当前技能冷却数量。'
    },
    'Time Lock': {
      status: 'implemented',
      model: 'attack_modifier',
      bonusDamageKey: 'bonus_damage',
      procChanceKey: 'chance_pct',
      semanticType: 'damage.attack_bonus',
      conditionInputs: ['attack_count', 'proc_chance'],
      defaultAttackCount: 1,
      reason: '按一次时间锁定触发的额外伤害计算，触发概率作为参考。'
    },
    'Reverse Time Walk': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'buff_duration',
      semanticType: 'window.buff_duration.seconds',
      affects: 'positioning',
      reason: '反向位移不直接造成伤害。'
    },
    'Distortion Field': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'attack_projectile_slow',
      semanticType: 'modifier.projectile_speed_slow.percent',
      affects: 'survivability',
      stackGroup: 'projectile_speed_slow',
      reason: '弹道减速影响承伤，不直接造成伤害。'
    },
    Chronosphere: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'control.stun.seconds',
      affects: 'disable_window',
      reason: '控制窗口决定普攻和队友输出时间，本身不直接造成伤害。'
    }
  }
};
