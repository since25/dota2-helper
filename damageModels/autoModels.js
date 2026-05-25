const { abilities, hero_abilities, heroes } = require('dotaconstants');
const { CANONICAL_HERO_NAMES } = require('../heroAliases');
const { extractAbilityDamage } = require('../damageExtractor');

function normalizeText(...parts) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function visibleAbilityRecords(heroName) {
  const hero = Object.values(heroes).find((entry) => entry.localized_name === heroName);
  if (!hero) return [];

  return (hero_abilities[hero.name]?.abilities || [])
    .map((abilityName, slotIndex) => ({ ability: abilities[abilityName], slotIndex }))
    .filter(({ ability }) => ability && ability.dname && ability.desc)
    .map(({ ability, slotIndex }) => ({ ...ability, slotIndex }));
}

function findAttr(ability, predicate) {
  return (ability.attrib || []).find((attr) => predicate(attr.key || '', attr.header || '', attr.value));
}

function findAttrKey(ability, predicate) {
  return findAttr(ability, predicate)?.key || '';
}

function attrByKey(ability, sourceKey) {
  if (sourceKey === 'dmg') {
    return { key: 'dmg', header: 'DAMAGE:', value: ability.dmg };
  }
  return (ability.attrib || []).find((attr) => attr.key === sourceKey) || null;
}

function rawValueLooksPercent(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.some((entry) => /%/.test(String(entry)));
}

function componentLooksPercentLike(ability, component) {
  const attr = attrByKey(ability, component.sourceKey || '');
  return /pct|percent|amp/i.test(normalizeText(component.sourceKey, component.label))
    || rawValueLooksPercent(attr?.value);
}

function findDurationKey(ability) {
  return findAttrKey(ability, (key, header) =>
    key === 'abilityduration'
    || key === 'duration'
    || /(^|_)duration$/.test(key)
    || /^duration/i.test(header)
  );
}

function findTickIntervalKey(ability) {
  return findAttrKey(ability, (key, header) => /tick.*rate|tick.*interval|burn_interval/i.test(`${key} ${header}`));
}

function findWaveCountKey(ability) {
  return findAttrKey(ability, (key, header) => /pulses|pulse_count|wave_count|waves/i.test(`${key} ${header}`));
}

function findAttackCountKey(ability) {
  return findAttrKey(ability, (key, header) => /attack_count|attack count/i.test(`${key} ${header}`));
}

function semanticForDamageComponent(component, ability) {
  const text = normalizeText(component.sourceKey, component.label, ability.desc);
  const percentLike = componentLooksPercentLike(ability, component);
  if (/damage_amp|damage amplification|amplification|extra damage|max damage amp/.test(text)) {
    return 'modifier.damage_amp.percent';
  }
  if (/cleave|echo attack|echo_damage|collision damage|illusion damage|damage per thread/.test(text)) {
    return 'damage.source_damage_percent';
  }
  if (/movement speed as damage|move.*speed.*damage/.test(text)) {
    return 'damage.move_speed_scaling';
  }
  if (/self_damage|self damage/.test(text)) {
    return 'resource.health_cost';
  }
  if (/health decay|aura_damage/.test(text)) {
    return 'damage.percent_max_health';
  }
  if (/mana.*burn|burn.*mana/.test(text)) return 'damage.mana_burn';
  if (/missing.*mana|mana.*missing|per.*mana/.test(text)) return 'damage.percent_missing_mana';
  if (/max.*health|health.*max|pct_health|percent.*health/.test(text)) return 'damage.percent_max_health';
  if (/missing.*health|health.*missing/.test(text)) return 'damage.percent_missing_health';
  if (/strength|agility|intelligence|attribute|per_?str|per_?agi|per_?int/.test(text)) return 'damage.attribute_scaling';
  if (/distance/.test(text)) return 'damage.distance_scaling';
  if (/stack|charge/.test(text)) return 'damage.stack_scaling';
  if (percentLike) return 'damage.source_damage_percent';

  const defaults = {
    instant_fixed: 'damage.instant',
    sustained: 'damage.sustained_dps',
    multi_wave: 'damage.wave',
    attack_sequence: 'damage.attack_sequence_proc',
    attack_modifier: 'damage.attack_bonus',
    conditional: 'damage.death_trigger',
    target_state: 'damage.stack_scaling',
    stat_scaling: 'damage.attribute_scaling'
  };
  return defaults[component.kind] || 'damage.instant';
}

function stateScalingInputs(semanticType) {
  const inputsBySemantic = {
    'damage.mana_burn': ['target_current_mana', 'attack_count'],
    'damage.source_damage_percent': ['source_damage', 'hit_count'],
    'damage.percent_missing_mana': ['target_missing_mana'],
    'damage.percent_max_health': ['enemy_max_health'],
    'damage.percent_current_health': ['enemy_current_health'],
    'damage.percent_missing_health': ['enemy_missing_health'],
    'damage.attribute_scaling': ['hero_attribute'],
    'damage.distance_scaling': ['distance'],
    'damage.move_speed_scaling': ['move_speed'],
    'damage.stack_scaling': ['stack_count']
  };
  return inputsBySemantic[semanticType] || ['required_state'];
}

function reasonForStateScaling(semanticType) {
  const reasonsBySemantic = {
    'damage.sustained_dps': '持续伤害需要作用时间输入，首轮模型只作为条件伤害参考。',
    'damage.wave': '多波伤害需要命中波数输入，首轮模型只作为条件伤害参考。',
    'damage.attribute_scaling': '属性系数伤害需要英雄属性输入，首轮模型只作为条件伤害参考。',
    'damage.distance_scaling': '距离系数伤害需要距离输入，首轮模型只作为条件伤害参考。',
    'damage.move_speed_scaling': '移动速度系数伤害需要移动速度输入，首轮模型只作为条件伤害参考。',
    'damage.stack_scaling': '叠层系数伤害需要叠层输入，首轮模型只作为条件伤害参考。',
    'damage.mana_burn': '法力燃烧伤害需要目标当前魔法和攻击次数输入，首轮模型只作为条件伤害参考。',
    'damage.percent_missing_mana': '已损魔法百分比伤害需要目标已损魔法输入，首轮模型只作为条件伤害参考。',
    'damage.percent_max_health': '最大生命百分比伤害需要目标最大生命输入，首轮模型只作为条件伤害参考。',
    'damage.percent_current_health': '当前生命百分比伤害需要目标当前生命输入，首轮模型只作为条件伤害参考。',
    'damage.percent_missing_health': '已损生命百分比伤害需要目标已损生命输入，首轮模型只作为条件伤害参考。',
    'damage.source_damage_percent': '来源伤害百分比需要来源伤害输入，首轮模型只作为条件伤害参考。'
  };
  return reasonsBySemantic[semanticType] || '状态/百分比缩放伤害需要额外输入，首轮模型只作为条件伤害参考。';
}

function modifierEntryForSemantic(sourceKey, semanticType) {
  const presets = {
    'modifier.damage_amp.percent': {
      affects: 'all_damage',
      stackGroup: 'damage_amplification'
    },
    'modifier.attack_damage.percent': {
      affects: 'physical_damage',
      stackGroup: 'attack_damage'
    },
    'resource.health_cost': {
      affects: 'self_resource'
    }
  };
  const preset = presets[semanticType] || { affects: 'damage_window' };
  return {
    status: 'reference_only',
    model: 'debuff_reference',
    valueKey: sourceKey,
    semanticType,
    affects: preset.affects,
    ...(preset.stackGroup ? { stackGroup: preset.stackGroup } : {}),
    reason: '首轮自动模型：该百分比/修正值不直接计入固定爆发。'
  };
}

function stateScalingEntryForSemantic(sourceKey, semanticType) {
  return {
    status: 'reference_only',
    model: 'state_scaling',
    valueKey: sourceKey,
    semanticType,
    requiredInputs: stateScalingInputs(semanticType),
    conditionInputs: stateScalingInputs(semanticType),
    reason: reasonForStateScaling(semanticType)
  };
}

function buildEntryFromComponent(ability, component) {
  const semanticType = semanticForDamageComponent(component, ability);
  const sourceKey = component.sourceKey || 'dmg';

  if (semanticType.startsWith('modifier.') || semanticType.startsWith('resource.')) {
    return modifierEntryForSemantic(sourceKey, semanticType);
  }

  if (semanticType !== 'damage.instant' && component.kind === 'instant_fixed') {
    return stateScalingEntryForSemantic(sourceKey, semanticType);
  }

  if (component.kind === 'conditional' && semanticType !== 'damage.death_trigger') {
    return stateScalingEntryForSemantic(sourceKey, semanticType);
  }

  if (component.kind === 'instant_fixed') {
    const durationKey = findDurationKey(ability);
    const tickIntervalKey = findTickIntervalKey(ability);
    return {
      status: 'implemented',
      model: 'instant_fixed',
      damageKey: sourceKey,
      semanticType: 'damage.instant',
      defaultIncluded: true,
      ...(durationKey ? { durationKey } : {}),
      ...(tickIntervalKey ? { tickIntervalKey } : {})
    };
  }

  if (component.kind === 'sustained') {
    const durationKey = findDurationKey(ability);
    const tickIntervalKey = findTickIntervalKey(ability);
    if (!durationKey) {
      return {
        status: 'reference_only',
        model: 'state_scaling',
        valueKey: sourceKey,
        semanticType: 'damage.sustained_dps',
        requiredInputs: ['active_duration'],
        conditionInputs: ['active_duration'],
        reason: '持续伤害缺少可确认的持续时间字段，首轮模型只作为条件伤害参考。'
      };
    }
    return {
      status: 'implemented',
      model: 'sustained_dps',
      damagePerSecondKey: sourceKey,
      durationKey,
      ...(tickIntervalKey ? { tickIntervalKey } : {}),
      semanticType: 'damage.sustained_dps',
      defaultActiveDuration: 'full'
    };
  }

  if (component.kind === 'multi_wave') {
    const waveCountKey = findWaveCountKey(ability);
    if (!waveCountKey) {
      return {
        status: 'reference_only',
        model: 'state_scaling',
        valueKey: sourceKey,
        semanticType: 'damage.wave',
        requiredInputs: ['wave_count'],
        conditionInputs: ['wave_count'],
        reason: '多波伤害缺少可确认的波数字段，首轮模型只作为条件伤害参考。'
      };
    }
    return {
      status: 'implemented',
      model: 'multi_wave',
      damagePerWaveKey: sourceKey,
      waveCountKey,
      semanticType: 'damage.wave'
    };
  }

  if (component.kind === 'attack_sequence') {
    const attackCountKey = findAttackCountKey(ability);
    return {
      status: attackCountKey ? 'implemented' : 'reference_only',
      model: attackCountKey ? 'attack_sequence' : 'state_scaling',
      ...(attackCountKey
        ? { procDamageKey: sourceKey, attackCountKey }
        : { valueKey: sourceKey, requiredInputs: ['attack_count'] }),
      semanticType: 'damage.attack_sequence_proc',
      conditionInputs: ['attack_count', 'hero_attack_damage'],
      formula: '(setupAttackCount + 1) * attackDamage + procDamage',
      defaultIncluded: false,
      reason: attackCountKey ? undefined : '攻击序列缺少可确认的攻击次数字段，首轮模型只作为条件伤害参考。'
    };
  }

  if (component.kind === 'attack_modifier') {
    if (semanticType !== 'damage.attack_bonus') {
      return stateScalingEntryForSemantic(sourceKey, semanticType);
    }
    return {
      status: 'implemented',
      model: 'attack_modifier',
      bonusDamageKey: sourceKey,
      semanticType: 'damage.attack_bonus',
      conditionInputs: ['hero_attack_damage', 'attack_count'],
      defaultAttackCount: 1,
      defaultIncluded: false
    };
  }

  if (component.kind === 'conditional') {
    return {
      status: 'reference_only',
      model: 'conditional',
      valueKey: sourceKey,
      semanticType: 'damage.death_trigger',
      conditionInputs: ['trigger_condition'],
      condition: '需要触发条件成立才造成伤害。',
      reason: '条件伤害首轮模型只作为参考，不默认计入固定爆发。'
    };
  }

  if (['target_state', 'stat_scaling'].includes(component.kind) || semanticType !== 'damage.instant') {
    return {
      status: 'reference_only',
      model: 'state_scaling',
      valueKey: sourceKey,
      semanticType,
      requiredInputs: stateScalingInputs(semanticType),
      conditionInputs: stateScalingInputs(semanticType),
      reason: reasonForStateScaling(semanticType)
    };
  }

  return null;
}

function referenceRuleEntry(ability) {
  const rules = [
    {
      semanticType: 'damage.mana_burn',
      affects: 'mana_pressure',
      model: 'state_scaling',
      requiredInputs: ['target_current_mana', 'attack_count'],
      conditionInputs: ['target_current_mana', 'attack_count'],
      pattern: /percent_damage_per_burn|mana burned as damage/
    },
    {
      semanticType: 'damage.percent_missing_mana',
      model: 'state_scaling',
      requiredInputs: ['target_missing_mana'],
      conditionInputs: ['target_missing_mana'],
      pattern: /damage_per.*mana|mana.*missing|missing.*mana|mana_void_damage/
    },
    {
      semanticType: 'damage.percent_max_health',
      model: 'state_scaling',
      requiredInputs: ['enemy_max_health'],
      conditionInputs: ['enemy_max_health'],
      pattern: /max.*health.*damage|pct_health_damage|health_damage_pct/
    },
    {
      semanticType: 'mobility.cast_range.units',
      affects: 'positioning',
      pattern: /^abilitycastrange\b|cast range/
    },
    {
      semanticType: 'control.stun.seconds',
      affects: 'disable_window',
      pattern: /stun.*duration|duration.*stun|ministun/
    },
    {
      semanticType: 'control.silence.seconds',
      affects: 'disable_window',
      pattern: /silence.*duration/
    },
    {
      semanticType: 'control.slow.move_percent',
      affects: 'positioning',
      pattern: /move.*slow|movement.*slow|movespeed.*slow/
    },
    {
      semanticType: 'modifier.armor_reduction.flat',
      affects: 'physical_damage',
      stackGroup: 'armor_reduction',
      pattern: /armor.*reduction|reduction.*armor/
    },
    {
      semanticType: 'modifier.magic_resistance_reduction.percent',
      affects: 'magical_damage',
      stackGroup: 'magic_resistance_reduction',
      pattern: /magic.*resist.*reduction|resist.*reduction/
    },
    {
      semanticType: 'modifier.spell_amplification.percent',
      affects: 'spell_amplification',
      stackGroup: 'spell_amplification',
      pattern: /spell_amp|spell amplification/
    },
    {
      semanticType: 'modifier.attack_speed.flat',
      affects: 'attack_speed',
      stackGroup: 'attack_speed',
      pattern: /attack_speed|attack speed|attackspeed/
    },
    {
      semanticType: 'modifier.attack_damage.flat',
      affects: 'attack_damage',
      stackGroup: 'attack_damage',
      pattern: /attack.*damage|damage.*attack/
    },
    {
      semanticType: 'modifier.crit.chance',
      affects: 'physical_damage',
      stackGroup: 'critical_strike',
      pattern: /crit.*chance|chance.*crit/
    },
    {
      semanticType: 'modifier.crit.multiplier',
      affects: 'physical_damage',
      stackGroup: 'critical_strike',
      pattern: /crit.*damage|critical damage|crit_bonus/
    },
    {
      semanticType: 'defense.evasion.percent',
      affects: 'survivability',
      stackGroup: 'evasion',
      pattern: /evasion/
    },
    {
      semanticType: 'defense.heal.flat',
      affects: 'sustain',
      pattern: /^heal$| heal:|healing/
    },
    {
      semanticType: 'defense.barrier.flat',
      affects: 'survivability',
      stackGroup: 'barrier',
      pattern: /barrier|shield/
    },
    {
      semanticType: 'summon.attack_damage',
      affects: 'summon_attack_damage',
      conditionInputs: ['summon_attack_count', 'summon_active_duration'],
      pattern: /ward.*damage|summon.*damage|unit.*damage/
    }
  ];

  for (const rule of rules) {
    const attr = findAttr(ability, (key, header) => rule.pattern.test(normalizeText(key, header)));
    if (!attr?.key) continue;

    if (rule.model === 'state_scaling') {
      return {
        status: 'reference_only',
        model: 'state_scaling',
        valueKey: attr.key,
        semanticType: rule.semanticType,
        requiredInputs: rule.requiredInputs || ['required_state'],
        conditionInputs: rule.conditionInputs || rule.requiredInputs || ['required_state'],
        reason: '首轮自动模型：该伤害需要额外状态输入，暂作为条件伤害参考。'
      };
    }

    return {
      status: 'reference_only',
      model: 'debuff_reference',
      valueKey: attr.key,
      semanticType: rule.semanticType,
      affects: rule.affects,
      ...(rule.stackGroup ? { stackGroup: rule.stackGroup } : {}),
      ...(rule.conditionInputs ? { conditionInputs: rule.conditionInputs } : {}),
      reason: '首轮自动模型：该数值影响伤害窗口或修正，但不直接计入固定爆发。'
    };
  }

  return {
    status: 'ignored',
    reason: '首轮自动模型未识别到可用于伤害计算的直接数值。'
  };
}

function buildAutoAbilityEntry(ability) {
  const extracted = extractAbilityDamage({
    dname: ability.dname,
    dmg_type: ability.dmg_type,
    behavior: ability.behavior,
    desc: ability.desc,
    dmg: ability.dmg,
    attrib: ability.attrib || [],
    mc: ability.mc,
    cd: ability.cd
  });
  const meaningfulComponents = extracted.components.filter((entry) => {
    const values = entry.valuesByAbilityLevel || [];
    return values.length && values.some((value) => value !== 0);
  });
  const component = meaningfulComponents.find((entry) =>
    ['sustained', 'multi_wave', 'attack_sequence', 'attack_modifier'].includes(entry.kind)
  ) || meaningfulComponents.find((entry) =>
    entry.kind === 'instant_fixed'
    && !componentLooksPercentLike(ability, entry)
  ) || meaningfulComponents[0];
  const damageEntry = component ? buildEntryFromComponent(ability, component) : null;

  return damageEntry || referenceRuleEntry(ability);
}

function buildAutoHeroModel(heroName) {
  const abilityEntries = {};
  for (const ability of visibleAbilityRecords(heroName)) {
    if (!abilityEntries[ability.dname]) {
      abilityEntries[ability.dname] = buildAutoAbilityEntry(ability);
    }
  }

  return {
    hero: heroName,
    source: 'auto',
    abilities: abilityEntries
  };
}

function buildAutoHeroModels(excludedHeroes = new Set()) {
  return CANONICAL_HERO_NAMES
    .filter((heroName) => !excludedHeroes.has(heroName))
    .map(buildAutoHeroModel);
}

module.exports = {
  buildAutoAbilityEntry,
  buildAutoHeroModel,
  buildAutoHeroModels
};
