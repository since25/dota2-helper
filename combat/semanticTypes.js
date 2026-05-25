const COMBAT_SEMANTIC_TYPES = new Set([
  'stat.attribute.flat',
  'stat.attack_damage.flat',
  'stat.attack_speed.flat',
  'stat.armor.flat',
  'stat.magic_resistance.percent',
  'attack.event.base_damage',
  'attack.event.bonus_damage',
  'attack.event.proc_damage',
  'attack.event.crit',
  'damage.instant',
  'damage.sustained_dps',
  'damage.percent_health',
  'modifier.armor.flat',
  'modifier.magic_resistance.multiplier',
  'modifier.damage_amp.percent',
  'modifier.spell_amp.percent',
  'window.duration.seconds',
  'condition.invisibility_break',
  'condition.active_item',
  'raw.reference'
]);

function isCombatSemanticType(type) {
  return COMBAT_SEMANTIC_TYPES.has(type);
}

module.exports = {
  COMBAT_SEMANTIC_TYPES,
  isCombatSemanticType
};
