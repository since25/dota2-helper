const { getHeroDamageProfile } = require('./damageCalculator');
const { loadChineseItemMap, localizeItemModelName } = require('./itemLocalization');

const SHOP_GROUPS = [
  { id: 'damage', label: '伤害物品', match: (component) => component.semanticType?.startsWith('damage.') },
  { id: 'modifier', label: '修正/光环', match: (component) => component.semanticType?.startsWith('modifier.') },
  { id: 'upgrade', label: '神杖/魔晶', match: (component) => component.semanticType?.startsWith('upgrade.') },
  { id: 'utility', label: '其他可选', match: () => true }
];

function round(value) {
  return Math.round(value * 100) / 100;
}

function heroAttributesAtLevel(stats, heroLevel) {
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  const strength = Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained;
  const agility = Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained;
  const intelligence = Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained;
  return {
    strength: round(strength),
    agility: round(agility),
    intelligence: round(intelligence)
  };
}

function attackDamageAtLevel(stats, heroLevel) {
  const attrs = heroAttributesAtLevel(stats, heroLevel);
  const primaryDamage = stats.primaryAttribute === 'all'
    ? (attrs.strength + attrs.agility + attrs.intelligence) * 0.7
    : { str: attrs.strength, agi: attrs.agility, int: attrs.intelligence }[stats.primaryAttribute] || 0;
  return {
    min: round(Number(stats.baseAttackMin || 0) + primaryDamage),
    max: round(Number(stats.baseAttackMax || 0) + primaryDamage)
  };
}

function heroPanel(profile, heroLevel) {
  const stats = profile.stats || {};
  const attrs = heroAttributesAtLevel(stats, heroLevel);
  const attack = attackDamageAtLevel(stats, heroLevel);
  return {
    hero: profile.hero,
    displayName: profile.displayName,
    heroLevel,
    primaryAttribute: stats.primaryAttribute,
    attackType: stats.attackType,
    attackRange: stats.attackRange,
    moveSpeed: stats.moveSpeed,
    baseMagicResistance: stats.baseMagicResistance,
    attributes: attrs,
    maxHealth: round(Number(stats.baseHealth || 120) + attrs.strength * 22),
    maxMana: round(Number(stats.baseMana || 75) + attrs.intelligence * 12),
    armor: round(Number(stats.baseArmor || 0) + attrs.agility / 6),
    attackDamage: attack,
    averageAttackDamage: round((attack.min + attack.max) / 2)
  };
}

function itemGroupFor(component) {
  return SHOP_GROUPS.find((group) => group.match(component)) || SHOP_GROUPS[SHOP_GROUPS.length - 1];
}

function hasNumericValues(component) {
  return Array.isArray(component.values) && component.values.some((value) => Number.isFinite(Number(value)));
}

function selectableItemComponent(component) {
  if (component.semanticType?.startsWith('damage.')) {
    return hasNumericValues(component);
  }
  return true;
}

function itemCards(profile, chineseItemMap = new Map()) {
  return (profile.items || [])
    .map((item) => {
      const components = (item.components || []).filter(selectableItemComponent);
      if (!components.length) return null;
      const localized = localizeItemModelName(item, chineseItemMap);
      const group = itemGroupFor(components[0]);
      return {
        key: item.key,
        name: localized.name,
        englishName: localized.englishName,
        displayName: localized.displayName,
        cost: item.cost,
        quality: item.quality,
        group: group.id,
        groupLabel: group.label,
        components
      };
    })
    .filter(Boolean)
    .sort((left, right) => (left.groupLabel.localeCompare(right.groupLabel) || left.cost - right.cost || left.name.localeCompare(right.name)));
}

async function buildCalculatorWorkbench(heroName, options = {}) {
  const heroLevel = Number(options.heroLevel || 6);
  const profile = await getHeroDamageProfile(heroName);
  const chineseItemMap = await loadChineseItemMap();
  return {
    reference: {
      project: 'devilesk/dota-hero-calculator',
      adoptedIdeas: [
        'hero-panel + skill-level + item-shop single workbench',
        'normalized attributes array as semantic middle layer',
        'shop grouping before item selection'
      ],
      notAdopted: [
        'old static dota-datafiles numbers',
        'Knockout/jQuery runtime',
        'legacy sprite pipeline'
      ]
    },
    heroPanel: heroPanel(profile, heroLevel),
    shopGroups: SHOP_GROUPS.map(({ id, label }) => ({ id, label })),
    profile: {
      ...profile,
      items: itemCards(profile, chineseItemMap)
    }
  };
}

module.exports = {
  SHOP_GROUPS,
  attackDamageAtLevel,
  buildCalculatorWorkbench,
  heroAttributesAtLevel,
  heroPanel,
  itemCards,
  selectableItemComponent
};
