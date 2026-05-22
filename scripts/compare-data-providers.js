const fs = require('fs');
const path = require('path');
const { getActiveDataProvider } = require('../dataProviders');

function classify(dotaconstantsValue, datawrapperValue) {
  const leftMissing = dotaconstantsValue === undefined || dotaconstantsValue === null;
  const rightMissing = datawrapperValue === undefined || datawrapperValue === null;
  if (leftMissing && rightMissing) return 'missing_both';
  if (leftMissing) return 'datawrapper_richer';
  if (rightMissing) return 'dotaconstants_only';
  if (JSON.stringify(dotaconstantsValue) === JSON.stringify(datawrapperValue)) return 'same';
  return 'conflict';
}

async function compareProviders() {
  const dotaconstants = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'dotaconstants' });
  const datawrapper = getActiveDataProvider({ DOTA_DATA_PROVIDER: 'datawrapper' });
  const fixtures = [
    { type: 'hero', name: 'Rubick' },
    { type: 'hero', name: 'Drow Ranger' },
    { type: 'hero', name: 'Queen of Pain' },
    { type: 'item', name: "Aghanim's Scepter", key: 'ultimate_scepter' },
    { type: 'item', name: "Aghanim's Shard", key: 'aghanims_shard' },
    { type: 'item', name: 'Battle Fury', key: 'bfury' }
  ];
  const differences = [];

  for (const fixture of fixtures) {
    const dotaconstantsValue = fixture.type === 'hero'
      ? await dotaconstants.getHeroDetails(fixture.name)
      : await dotaconstants.getItemDetails(fixture.key);
    const datawrapperValue = fixture.type === 'hero'
      ? await datawrapper.getHeroDetails(fixture.name)
      : await datawrapper.getItemDetails(fixture.key);

    differences.push({
      fixture: fixture.name,
      type: fixture.type,
      classification: classify(dotaconstantsValue, datawrapperValue),
      dotaconstantsSummary: dotaconstantsValue ? Object.keys(dotaconstantsValue).sort() : null,
      datawrapperSummary: datawrapperValue ? Object.keys(datawrapperValue).sort() : null
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    fixtures,
    differences
  };
}

async function main() {
  const report = await compareProviders();
  const outPath = path.join(process.cwd(), 'test-runs', `${new Date().toISOString().replace(/[:.]/g, '-')}-provider-comparison.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...report, artifactPath: outPath }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  classify,
  compareProviders
};
