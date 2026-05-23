module.exports = {
  hero: 'Phantom Assassin',
  abilities: {
    'Stifling Dagger': {
      status: 'implemented',
      model: 'attack_modifier',
      bonusDamageKey: 'base_damage',
      attackFactorKey: 'attack_factor_tooltip',
      semanticType: 'damage.attack_bonus',
      conditionInputs: ['hero_attack_damage'],
      formula: 'baseDamage + attackDamage * attackFactorPct',
      defaultIncluded: false
    },
    'Phantom Strike': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'bonus_attack_speed',
      semanticType: 'modifier.attack_speed.flat',
      affects: 'attack_speed',
      stackGroup: 'attack_speed',
      reason: '攻速窗口影响普攻次数，不直接造成技能伤害。'
    },
    Blur: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'active_movespeed_bonus',
      semanticType: 'mobility.move_speed.percent',
      affects: 'positioning',
      reason: '隐身和移速影响进出场，不直接造成伤害。'
    },
    'Fan of Knives': {
      status: 'unsupported',
      model: 'state_scaling',
      valueKey: 'pct_health_damage_initial',
      semanticType: 'damage.percent_max_health',
      conditionInputs: ['enemy_max_health'],
      reason: '该技能按目标最大生命百分比造成伤害，需要敌方生命值输入。'
    },
    Immaterial: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'evasion',
      semanticType: 'defense.evasion.percent',
      affects: 'survivability',
      stackGroup: 'evasion',
      reason: '闪避影响承伤，不直接造成伤害。'
    },
    'Coup de Grace': {
      status: 'reference_only',
      model: 'chance_based',
      valueKey: 'crit_bonus',
      semanticType: 'modifier.crit.multiplier',
      damageType: 'Physical',
      affects: 'physical_damage',
      stackGroup: 'critical_strike',
      conditionInputs: ['attack_count', 'crit_chance'],
      chanceKey: 'crit_chance',
      multiplierKey: 'crit_bonus',
      reason: '暴击需要普攻次数和是否触发，当前作为概率伤害参考。'
    }
  }
};
