const fs = require('fs');

function round(value) {
  return Math.round(value * 100) / 100;
}

function compareEngineResult({ fixture, engineResult, tolerance = { absolute: 1, percent: 0.01 } }) {
  if (fixture.id !== engineResult.id) {
    throw new Error(`Fixture id ${fixture.id} does not match engine result id ${engineResult.id}`);
  }
  const expected = Number(fixture.expectedLocalModel?.totals?.adjusted || 0);
  const observed = Number(engineResult.engine?.observedDamage || 0);
  const delta = round(Math.abs(observed - expected));
  const percentDelta = expected === 0 ? (delta === 0 ? 0 : Infinity) : delta / expected;
  const pass = delta <= tolerance.absolute || percentDelta <= tolerance.percent;
  return {
    id: fixture.id,
    expected,
    observed,
    delta,
    percentDelta,
    pass
  };
}

function main(argv = process.argv.slice(2)) {
  const fixturePath = argv[0];
  const resultPath = argv[1];
  if (!fixturePath || !resultPath) {
    throw new Error('Usage: node scripts/compare-engine-result.js <fixture.json> <engine-result.json>');
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const engineResult = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const report = compareEngineResult({ fixture, engineResult });
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  compareEngineResult
};
