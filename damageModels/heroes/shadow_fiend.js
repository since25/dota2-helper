module.exports = {
  hero: 'Shadow Fiend',
  abilities: {
    Shadowraze: {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'shadowraze_damage',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '毁灭阴影的叠加增伤先作为参考，不自动叠入单次基础伤害。'
    },
    'Feast of Souls': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'bonus_attack_speed',
      semanticType: 'modifier.attack_speed.flat',
      affects: 'attack_speed',
      stackGroup: 'attack_speed',
      reason: '攻速和移速加成影响持续输出，不直接造成技能伤害。'
    },
    'Presence of the Dark Lord': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'presence_armor_reduction',
      semanticType: 'modifier.armor_reduction.flat',
      affects: 'physical_damage',
      stackGroup: 'armor_reduction',
      reason: '减甲会放大后续物理伤害，当前总量不自动串联减甲。'
    },
    'Requiem of Souls': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'dmg',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '按单条魂线命中计算，多条命中需要后续按命中线数扩展。'
    },
    Necromastery: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'necromastery_damage_per_soul',
      semanticType: 'modifier.attack_damage.flat',
      affects: 'attack_damage',
      stackGroup: 'attack_damage',
      conditionInputs: ['current_soul_count'],
      reason: '魂数提供攻击力成长，需要当前魂数作为输入。'
    }
  }
};
