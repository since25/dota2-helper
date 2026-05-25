const fs = require('fs');
const path = require('path');
const { calculateDamageCombo } = require('../damageCalculator');
const { getItemModel } = require('../itemModels/registry');

function combatRelevantComponentIds(itemKey) {
  const model = getItemModel(itemKey);
  return (model?.effects || [])
    .filter((effect) => [
      'modifier.attack_damage.flat',
      'modifier.attack_speed.flat',
      'stat.attribute',
      'modifier.crit',
      'damage.attack_proc',
      'damage.instant'
    ].includes(effect.type))
    .map((effect, index) => `${itemKey}:${effect.type}:${effect.key || effect.abilityName || index}`);
}

function itemSelections(items) {
  return (items || []).flatMap((itemKey) => {
    const componentIds = combatRelevantComponentIds(itemKey);
    return componentIds.map((componentId) => ({
      sourceType: 'item',
      itemKey,
      componentId,
      valueMode: 'theoretical'
    }));
  });
}

async function buildEngineFixture(input) {
  const expectedLocalModel = await calculateDamageCombo({
    hero: input.hero,
    heroLevel: input.heroLevel,
    enemyArmor: input.target?.armor ?? 0,
    enemyMagicResistancePercent: input.target?.magicResistancePercent ?? 25,
    selectedComponents: [
      ...itemSelections(input.items),
      {
        sourceType: 'basic_attack',
        attackWindowMode: input.scenario?.type === 'attack_window' ? 'attack_count' : 'attack_count',
        attackCount: input.scenario?.attackCount || 1,
        forceInvisibilityBreak: input.scenario?.forceInvisibilityBreak,
        forceCritSource: input.scenario?.forceCritSource
      }
    ]
  });

  return {
    id: input.id,
    hero: input.hero,
    heroLevel: input.heroLevel,
    items: input.items || [],
    target: input.target || {},
    scenario: input.scenario || {},
    expectedLocalModel
  };
}

async function main(argv = process.argv.slice(2)) {
  const inputPath = argv[0];
  const outputPath = argv[1] || path.join('tools', 'dota-addon', 'generated', 'fixture.json');
  if (!inputPath) {
    throw new Error('Usage: node scripts/export-engine-fixture.js <scenario.json> [output.json]');
  }
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const fixture = await buildEngineFixture(input);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(fixture, null, 2));
  console.log(outputPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  buildEngineFixture,
  combatRelevantComponentIds
};
