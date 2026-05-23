const dc = require('dotaconstants');

const { classifyItem } = require('../scripts/item-scope-audit');

const INCLUDED_SCOPE = 'candidate';

function splitValues(value) {
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const numeric = Number(part);
      return Number.isFinite(numeric) ? numeric : part;
    });
}

function attrEffect(type, label, attr, extra = {}) {
  return {
    type,
    label,
    source: 'attribute',
    key: attr.key || attr.header || '',
    values: splitValues(attr.value),
    display: attr.display || '',
    ...extra
  };
}

function abilityEffect(type, label, ability, extra = {}) {
  return {
    type,
    label,
    source: 'ability',
    abilityType: ability.type || '',
    abilityName: ability.title || '',
    description: ability.description || '',
    ...extra
  };
}

function classifyAttribute(attr) {
  const key = String(attr.key || attr.header || '').toLowerCase();
  const display = String(attr.display || '').toLowerCase();

  if (!key) return attrEffect('raw.reference', '未命名原始字段', attr);

  if (key === 'damage' || key.endsWith('_damage') || key.includes('impact_damage') || key.includes('blast_damage')) {
    if (key.startsWith('bonus_') || key.includes('creep_bonus_damage')) {
      return attrEffect('modifier.attack_damage.flat', '攻击力加成', attr);
    }
    if (key.includes('chance_damage') || key.includes('chain_damage') || key.includes('static_damage')) {
      return attrEffect('damage.attack_proc', '攻击或受击触发伤害', attr);
    }
    if (key.includes('aura_damage') || key.includes('damage_over_time')) {
      return attrEffect('damage.sustained_dps', '持续每秒伤害', attr);
    }
    if (key.includes('stat_multiplier') || key.includes('int_damage_multiplier')) {
      return attrEffect('damage.attribute_scaling', '属性系数伤害', attr);
    }
    if (key.includes('silence_damage_percent')) {
      return attrEffect('modifier.damage_amp.percent', '条件伤害加深', attr);
    }
    return attrEffect('damage.instant', '瞬时伤害', attr);
  }

  if (key.includes('stat_multiplier') || key.includes('damage_multiplier') || key.includes('int_damage_multiplier')) {
    return attrEffect('damage.attribute_scaling', '属性系数伤害', attr);
  }
  if (key.includes('damage_per') || key.includes('burn_damage')) {
    return attrEffect('damage.damage_over_time', '持续伤害', attr);
  }
  if (key.includes('mana_burn')) {
    return attrEffect('damage.attack_proc', '法力燃烧或攻击触发伤害', attr);
  }
  if (key.includes('spell_amp') || key.includes('spell_damage') || key.includes('spell_lifesteal')) {
    return attrEffect('modifier.spell_amp.percent', '法术相关增幅', attr);
  }
  if (key.includes('damage_amp') || key.includes('ethereal_damage_bonus') || key.includes('resist_debuff')) {
    return attrEffect('modifier.damage_amp.percent', '伤害加深或抗性削弱', attr);
  }
  if (key.includes('armor')) {
    if (key.includes('corruption') || key.includes('negative') || key.includes('reduction')) {
      return attrEffect('modifier.armor.flat', '敌方护甲变化', attr);
    }
    return attrEffect('stat.armor', '护甲', attr);
  }
  if (key.includes('magic_resist') || key.includes('magical_armor') || key.includes('spell_resist')) {
    return attrEffect('modifier.magic_resistance.percent', '魔法抗性', attr);
  }
  if (key.includes('attack_speed')) {
    return attrEffect('modifier.attack_speed.flat', '攻击速度', attr);
  }
  if (key.includes('crit')) {
    return attrEffect('modifier.crit', '暴击', attr);
  }
  if (key.includes('strength') || key.includes('agility') || key.includes('intellect') || key.includes('all_stats') || key === 'bonus_stats') {
    return attrEffect('stat.attribute', '属性', attr);
  }
  if (key.includes('health') || key.includes('bonus_hp') || key === 'hp_regen' || key.includes('hp_regen')) {
    if (key.includes('restore') || key.includes('heal')) {
      return attrEffect('resource.restore', '生命回复或治疗', attr);
    }
    return attrEffect(key.includes('regen') ? 'stat.regen' : 'stat.health', key.includes('regen') ? '生命恢复' : '生命', attr);
  }
  if (key.includes('mana') || key.includes('mp_regen')) {
    if (key.includes('restore') || key.includes('replenish')) {
      return attrEffect('resource.restore', '魔法回复', attr);
    }
    return attrEffect(key.includes('regen') ? 'stat.regen' : 'stat.mana', key.includes('regen') ? '魔法恢复' : '魔法', attr);
  }
  if (key.includes('evasion')) {
    return attrEffect('stat.evasion', '闪避', attr);
  }
  if (key.includes('range') || key.includes('radius') || key.includes('aoe')) {
    return attrEffect('stat.range', '范围或距离', attr);
  }
  if (key.includes('cooldown') || key.includes('charge')) {
    return attrEffect('resource.cooldown', '冷却或充能', attr);
  }
  if (key.includes('slow') || key.includes('stun') || key.includes('silence') || key.includes('root') || key.includes('duration')) {
    return attrEffect('control', '控制或持续时间', attr);
  }
  if (key.includes('movement') || key.includes('move') || key.includes('speed') || key.includes('blink') || key.includes('projectile')) {
    return attrEffect('mobility', '移动、弹道或位移', attr);
  }
  if (key.includes('vision') || key.includes('sight') || key.includes('visibility')) {
    return attrEffect('vision', '视野或反隐', attr);
  }
  if (key.includes('summon') || key.includes('creep')) {
    return attrEffect('summon', '召唤物或支配单位', attr);
  }
  if (key.includes('gold') || key.includes('xp') || key.includes('bounty')) {
    return attrEffect('economy', '经济或经验', attr);
  }
  if (display.includes('damage')) {
    return attrEffect('modifier.attack_damage.flat', '攻击力加成', attr);
  }

  return attrEffect('raw.reference', '原始非伤害参考字段', attr);
}

function classifyAbility(ability) {
  const title = String(ability.title || '').toLowerCase();
  const description = String(ability.description || '').toLowerCase();
  const text = `${title} ${description}`;

  if (text.includes('aghanim') || title.includes('ability upgrade')) {
    return abilityEffect('utility.passive', '英雄专属技能升级入口', ability);
  }
  if (text.includes('damage per second') || text.includes('damage every')) {
    return abilityEffect('damage.sustained_dps', '持续伤害技能', ability);
  }
  if (text.includes('damage') && (text.includes('chance') || text.includes('attack'))) {
    return abilityEffect('damage.attack_proc', '攻击或概率触发伤害', ability);
  }
  if (text.includes('damage')) {
    return abilityEffect('damage.instant', '主动或被动伤害', ability);
  }
  if (text.includes('armor')) {
    return abilityEffect('modifier.armor.flat', '护甲变化', ability);
  }
  if (text.includes('magic') && (text.includes('vulnerable') || text.includes('resistance'))) {
    return abilityEffect('modifier.magic_resistance.percent', '魔法抗性变化', ability);
  }
  if (text.includes('slow') || text.includes('stun') || text.includes('silence') || text.includes('root')) {
    return abilityEffect('control', '控制或减速', ability);
  }
  if (ability.type === 'active' || ability.type === 'use') {
    return abilityEffect('utility.active', '主动功能', ability);
  }
  return abilityEffect('utility.passive', '被动或通用功能', ability);
}

function addUpgradeEffect(model) {
  if (model.key === 'ultimate_scepter' || model.key === 'ultimate_scepter_2') {
    model.effects.unshift({
      type: 'upgrade.aghanims_scepter',
      label: model.key === 'ultimate_scepter_2' ? '阿哈利姆福佑升级' : '阿哈利姆神杖升级',
      source: 'item_key',
      key: model.key
    });
  }
  if (model.key === 'aghanims_shard') {
    model.effects.unshift({
      type: 'upgrade.aghanims_shard',
      label: '阿哈利姆魔晶升级',
      source: 'item_key',
      key: model.key
    });
  }
  return model;
}

function buildItemModel(key, item) {
  const effects = [
    ...(item.attrib || []).map(classifyAttribute),
    ...(item.abilities || []).map(classifyAbility)
  ];

  if (effects.length === 0) {
    effects.push({
      type: 'raw.reference',
      label: '无可计算字段的商店物品',
      source: 'fallback'
    });
  }

  return addUpgradeEffect({
    key,
    name: item.dname,
    cost: Number(item.cost),
    quality: item.qual || '',
    status: 'modeled',
    components: item.components || [],
    effects,
    rawFields: (item.attrib || []).map((attr) => attr.key || attr.header).filter(Boolean),
    source: 'auto'
  });
}

function buildAutoItemModels() {
  return Object.entries(dc.items || {})
    .filter(([key, item]) => classifyItem(key, item).scope === INCLUDED_SCOPE)
    .map(([key, item]) => buildItemModel(key, item))
    .sort((left, right) => left.key.localeCompare(right.key));
}

module.exports = {
  buildAutoItemModels,
  classifyAbility,
  classifyAttribute,
  splitValues
};
