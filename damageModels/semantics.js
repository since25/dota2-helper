const CONTEXT_ROUTES = {
  FIXED_DAMAGE: 'fixed_damage',
  SITUATIONAL_DAMAGE: 'situational_damage',
  MODIFIER_REFERENCE: 'modifier_reference',
  RESOURCE_REFERENCE: 'resource_reference',
  IGNORED: 'ignored'
};

const CALCULATION_ROLES = {
  DIRECT_DAMAGE: 'direct_damage',
  OFFENSIVE_MODIFIER: 'offensive_modifier',
  DEFENSIVE_MODIFIER: 'defensive_modifier',
  CONTROL_WINDOW: 'control_window',
  MOBILITY_RANGE_AREA: 'mobility_range_area',
  RESOURCE_TIMING: 'resource_timing',
  SUMMON_PROXY: 'summon_proxy',
  CONDITION: 'condition'
};

const SEMANTIC_DEFINITIONS = {
  'damage.instant': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'flat',
    label: '瞬时伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.sustained_dps': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'damage_per_second',
    label: '持续每秒伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.tick': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'damage_per_tick',
    label: '每跳伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.wave': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'damage_per_wave',
    label: '每波伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.attack_bonus': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'flat',
    label: '攻击附加伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.attack_sequence_proc': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'flat',
    label: '攻击序列触发伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.percent_max_health': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'percent',
    label: '最大生命百分比伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.percent_current_health': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'percent',
    label: '当前生命百分比伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.percent_missing_health': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'percent',
    label: '已损生命百分比伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.percent_missing_mana': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'percent',
    label: '已损魔法百分比伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.percent_max_mana': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'percent',
    label: '最大魔法百分比伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.mana_burn': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'scaling',
    label: '法力燃烧伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.attribute_scaling': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'scaling',
    label: '属性系数伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.distance_scaling': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'scaling',
    label: '距离系数伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.move_speed_scaling': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'scaling',
    label: '移动速度系数伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.stack_scaling': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'scaling',
    label: '叠层系数伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.death_trigger': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'flat',
    label: '死亡触发伤害',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'damage.source_damage_percent': {
    category: CALCULATION_ROLES.DIRECT_DAMAGE,
    unit: 'percent',
    label: '来源伤害百分比',
    defaultContextRoute: CONTEXT_ROUTES.SITUATIONAL_DAMAGE
  },
  'modifier.attack_damage.flat': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'flat',
    label: '攻击力变化',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.attack_damage.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '攻击力加成',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.attack_speed.flat': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'flat',
    label: '攻击速度变化',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.base_attack_time': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'seconds',
    label: '基础攻击间隔变化',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.crit.chance': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '暴击概率',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.crit.multiplier': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '暴击倍率',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.spell_amplification.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '法术增强',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.damage_amp.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '伤害加深',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.damage_amplification.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '伤害加深',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.armor_reduction.flat': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'flat',
    label: '护甲变化',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.magic_resistance_reduction.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '魔法抗性变化',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.attribute_conversion.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '属性转换',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'modifier.projectile_speed_slow.percent': {
    category: CALCULATION_ROLES.OFFENSIVE_MODIFIER,
    unit: 'percent',
    label: '弹道速度减缓',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.armor.flat': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'flat',
    label: '护甲加成',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.magic_resistance.percent': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'percent',
    label: '魔法抗性',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.damage_reduction.percent': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'percent',
    label: '伤害减免',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.damage_block.flat': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'flat',
    label: '伤害格挡',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.evasion.percent': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'percent',
    label: '闪避',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.barrier.flat': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'flat',
    label: '护盾',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.heal.flat': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'flat',
    label: '治疗',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.heal.percent': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'percent',
    label: '百分比治疗',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.regen.hp_per_second': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'health_per_second',
    label: '生命恢复',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'defense.lifesteal.percent': {
    category: CALCULATION_ROLES.DEFENSIVE_MODIFIER,
    unit: 'percent',
    label: '吸血',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.stun.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '眩晕时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.silence.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '沉默时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.hex.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '妖术时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.taunt.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '嘲讽时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.root.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '缠绕时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.disarm.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '缴械时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.slow.move_percent': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'percent',
    label: '移动速度减缓',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'control.slow.attack_flat': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'flat',
    label: '攻击速度降低',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'window.debuff_duration.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '负面状态持续时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'window.buff_duration.seconds': {
    category: CALCULATION_ROLES.CONTROL_WINDOW,
    unit: 'seconds',
    label: '增益持续时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'mobility.move_speed.flat': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'flat',
    label: '移动速度变化',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'mobility.move_speed.percent': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'percent',
    label: '移动速度加成',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'mobility.cast_range.units': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'units',
    label: '施法距离',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'mobility.dash_range.units': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'units',
    label: '位移距离',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'area.radius.units': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'units',
    label: '作用半径',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'area.width.units': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'units',
    label: '作用宽度',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'projectile.speed.units_per_second': {
    category: CALCULATION_ROLES.MOBILITY_RANGE_AREA,
    unit: 'units_per_second',
    label: '弹道速度',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'resource.mana_cost': {
    category: CALCULATION_ROLES.RESOURCE_TIMING,
    unit: 'mana',
    label: '魔法消耗',
    defaultContextRoute: CONTEXT_ROUTES.RESOURCE_REFERENCE
  },
  'resource.mana_drain_per_second': {
    category: CALCULATION_ROLES.RESOURCE_TIMING,
    unit: 'mana_per_second',
    label: '每秒抽蓝',
    defaultContextRoute: CONTEXT_ROUTES.RESOURCE_REFERENCE
  },
  'resource.health_cost': {
    category: CALCULATION_ROLES.RESOURCE_TIMING,
    unit: 'health',
    label: '生命消耗',
    defaultContextRoute: CONTEXT_ROUTES.RESOURCE_REFERENCE
  },
  'resource.cooldown': {
    category: CALCULATION_ROLES.RESOURCE_TIMING,
    unit: 'seconds',
    label: '冷却时间',
    defaultContextRoute: CONTEXT_ROUTES.RESOURCE_REFERENCE
  },
  'resource.charge_count': {
    category: CALCULATION_ROLES.RESOURCE_TIMING,
    unit: 'count',
    label: '充能数量',
    defaultContextRoute: CONTEXT_ROUTES.RESOURCE_REFERENCE
  },
  'resource.charge_restore_time': {
    category: CALCULATION_ROLES.RESOURCE_TIMING,
    unit: 'seconds',
    label: '充能恢复时间',
    defaultContextRoute: CONTEXT_ROUTES.RESOURCE_REFERENCE
  },
  'summon.attack_damage': {
    category: CALCULATION_ROLES.SUMMON_PROXY,
    unit: 'flat',
    label: '召唤物攻击力',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'summon.attack_interval': {
    category: CALCULATION_ROLES.SUMMON_PROXY,
    unit: 'seconds',
    label: '召唤物攻击间隔',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'summon.duration': {
    category: CALCULATION_ROLES.SUMMON_PROXY,
    unit: 'seconds',
    label: '召唤物持续时间',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'summon.count': {
    category: CALCULATION_ROLES.SUMMON_PROXY,
    unit: 'count',
    label: '召唤物数量',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'summon.health': {
    category: CALCULATION_ROLES.SUMMON_PROXY,
    unit: 'health',
    label: '召唤物生命',
    defaultContextRoute: CONTEXT_ROUTES.MODIFIER_REFERENCE
  },
  'condition.requires_attack_count': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要攻击次数输入',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_target_death': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要目标死亡条件',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_target_state': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要目标状态输入',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_stack_count': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要叠层数量输入',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_hero_attribute': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要英雄属性输入',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_current_hp': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要当前生命输入',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_current_mana': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要当前魔法输入',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_position': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要位置条件',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  },
  'condition.requires_illusion_or_summon': {
    category: CALCULATION_ROLES.CONDITION,
    unit: 'condition',
    label: '需要幻象或召唤物条件',
    defaultContextRoute: CONTEXT_ROUTES.IGNORED
  }
};

const SEMANTIC_TYPES = Object.freeze(Object.keys(SEMANTIC_DEFINITIONS));
const SEMANTIC_CATEGORIES = Object.freeze([...new Set(Object.values(CALCULATION_ROLES))]);
const SEMANTIC_UNITS = Object.freeze([...new Set(Object.values(SEMANTIC_DEFINITIONS).map((definition) => definition.unit))]);

function getSemanticDefinition(type) {
  const definition = SEMANTIC_DEFINITIONS[type];
  if (!definition) throw new Error(`Unknown semantic type: ${type}`);
  return Object.freeze({ type, ...definition });
}

function routeSemanticToContext(type, options = {}) {
  const definition = getSemanticDefinition(type);
  if (type === 'damage.instant' && options.defaultIncluded) {
    return CONTEXT_ROUTES.FIXED_DAMAGE;
  }
  return definition.defaultContextRoute;
}

function formatSemanticLabel(type) {
  return getSemanticDefinition(type).label;
}

module.exports = {
  CALCULATION_ROLES,
  CONTEXT_ROUTES,
  SEMANTIC_CATEGORIES,
  SEMANTIC_TYPES,
  SEMANTIC_UNITS,
  getSemanticDefinition,
  routeSemanticToContext,
  formatSemanticLabel
};
