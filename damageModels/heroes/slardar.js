module.exports = {
  hero: 'Slardar',
  abilities: {
    'Guardian Sprint': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'bonus_speed',
      semanticType: 'mobility.move_speed.percent',
      modifierType: 'move_speed_pct',
      affects: 'positioning',
      reason: '移动速度影响追击和出手窗口，但不直接造成伤害。'
    },
    'Slithereen Crush': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'crush_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true
    },
    'Bash of the Deep': {
      status: 'implemented',
      model: 'attack_sequence',
      procDamageKey: 'bonus_damage',
      attackCountKey: 'attack_count',
      semanticType: 'damage.attack_sequence_proc',
      conditionInputs: ['attack_count', 'hero_attack_damage'],
      formula: 'attackCount * attackDamage + procDamage',
      defaultIncluded: true
    },
    'Seaborn Sentinel': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'river_damage_pct',
      semanticType: 'modifier.attack_damage.percent',
      modifierType: 'attack_damage_pct',
      affects: 'attack_damage',
      stackGroup: 'attack_damage',
      reason: '需要水洼、轨迹或河道状态；当前作为攻击力修正参考。'
    },
    'Corrosive Haze': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'armor_reduction',
      semanticType: 'modifier.armor_reduction.flat',
      modifierType: 'armor_reduction',
      affects: 'physical_damage',
      stackGroup: 'armor_reduction',
      reason: '减甲会放大后续物理伤害；当前不自动串联进总伤害。'
    }
  }
};
