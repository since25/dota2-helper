module.exports = {
  hero: 'Lich',
  review: {
    status: 'reviewed',
    reviewer: 'local',
    updatedAt: '2026-05-23',
    notes: ['Reviewed frost blast, frost shield, and chain frost fields against Dotabuff snapshot.']
  },
  abilities: {
    'Frost Blast': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'abilityduration',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '寒霜爆发主目标同时受到直接命中 damage 和范围爆炸 aoe_damage。',
      extraComponents: [
        {
          status: 'implemented',
          model: 'instant_fixed',
          damageKey: 'aoe_damage',
          semanticType: 'damage.instant',
          defaultIncluded: true,
          reason: '寒霜爆发主目标也会承受范围爆炸伤害。'
        }
      ]
    },
    'Frost Shield': {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: 'damage',
      durationKey: 'duration',
      tickIntervalKey: 'interval',
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full',
      conditionInputs: ['active_duration'],
      reason: '冰霜魔盾每秒对周围敌人造成伤害，实际总量取决于贴近时间。'
    },
    'Sinister Gaze': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'channel_duration',
      semanticType: 'window.debuff_duration.seconds',
      affects: 'disable_window',
      reason: '阴邪凝视为持续控制和抽蓝，不直接造成伤害。'
    },
    'Ice Spire': {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'duration',
      semanticType: 'summon.duration',
      affects: 'area_control',
      reason: '寒冰尖柱本身不直接造成伤害。'
    },
    Sacrifice: {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: 'active_mana_restore_pct_of_health',
      semanticType: 'resource.mana_drain_per_second',
      affects: 'resource_timing',
      reason: '献身提供资源转换，不直接造成伤害。'
    },
    'Chain Frost': {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: 'damage',
      durationKey: 'slow_duration',
      semanticType: 'damage.instant',
      defaultIncluded: true,
      reason: '连环霜冻单次弹跳伤害为 damage；多次弹跳总量需要结合命中次数。'
    }
  }
};
