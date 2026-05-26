const fs = require('fs');

function round(value) {
  return Math.round(value * 100) / 100;
}

function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}

function attackRollExpectedRange({ fixture, engineResult }) {
  const component = (fixture.expectedLocalModel?.components || [])
    .find((entry) => entry.kind === 'attack_sequence' || entry.kind === 'basic_attack');
  const attackDamage = fixture.expectedLocalModel?.combatStats?.attackDamage;
  if (!component || !attackDamage) return null;
  const attackCount = Number(component.attackCount);
  const procDamage = Number(component.procDamage || 0);
  const min = Number(attackDamage.min);
  const max = Number(attackDamage.max);
  const average = Number(attackDamage.average);
  if (![attackCount, procDamage, min, max].every(Number.isFinite)) return null;
  if (component.kind === 'basic_attack' && !Number.isFinite(average)) return null;
  const nonRollDamage = component.kind === 'basic_attack'
    ? Number(component.raw || 0) - attackCount * average
    : procDamage;
  const armor = Number(engineResult.engine?.targetArmor || 0);
  const multiplier = component.damageType === 'Physical' ? physicalMultiplier(armor) : 1;
  const totalAdjusted = Number(fixture.expectedLocalModel?.totals?.adjusted || 0);
  const componentAdjusted = Number.isFinite(Number(component.adjusted))
    ? Number(component.adjusted)
    : totalAdjusted;
  const fixedAdjusted = totalAdjusted - componentAdjusted;
  return {
    min: Math.floor(round(fixedAdjusted + (attackCount * min + nonRollDamage) * multiplier)),
    max: Math.ceil(round(fixedAdjusted + (attackCount * max + nonRollDamage) * multiplier))
  };
}

function magicResistanceCheck({ fixture, engineResult }) {
  const expected = Number(fixture.target?.magicResistancePercent);
  const observed = Number(engineResult.engine?.targetMagicResistance);
  if (![expected, observed].every(Number.isFinite)) return null;
  const delta = round(Math.abs(observed - expected));
  return {
    expected,
    observed,
    delta,
    pass: delta <= 0.05
  };
}

function sampleStats(samples) {
  if (!Array.isArray(samples) || samples.length === 0) return null;
  const values = samples.map(Number).filter(Number.isFinite);
  if (values.length === 0) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.length > 1
    ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
    : 0;
  return {
    count: values.length,
    mean: round(mean),
    stdev: round(Math.sqrt(variance))
  };
}

function observedDamageFor(engineResult) {
  const stats = sampleStats(engineResult.engine?.observedDamageSamples);
  if (!stats) {
    return {
      observed: Number(engineResult.engine?.observedDamage || 0),
      sampleTolerance: null
    };
  }
  return {
    observed: stats.mean,
    sampleTolerance: {
      count: stats.count,
      stdev: stats.stdev,
      absolute: round(Math.max(1, 1.96 * stats.stdev / Math.sqrt(stats.count)))
    }
  };
}

function isForcedInvisibilityBreakProc(fixture, component) {
  if (fixture.scenario?.forceInvisibilityBreak !== true) return false;
  return ['invis_sword', 'silver_edge'].includes(component.itemKey);
}

function fixtureHasStochasticProc(fixture) {
  const components = fixture.expectedLocalModel?.components || [];
  return components.some((component) => (
    component.semanticType === 'modifier.crit' ||
    (
      (component.semanticType === 'damage.attack_proc' || component.kind === 'attack_proc') &&
      !isForcedInvisibilityBreakProc(fixture, component)
    )
  ));
}

function effectiveTrialCount({ fixture, engineResult }) {
  const declared = Number(fixture.trials ?? fixture.scenario?.trials);
  if (Number.isFinite(declared) && declared > 0) return Math.floor(declared);
  const samples = engineResult.engine?.observedDamageSamples;
  return Array.isArray(samples) ? samples.length : 1;
}

function validateProcTrialCount({ fixture, engineResult }) {
  if (fixture.scenario?.attackFlags?.processProcs !== true || !fixtureHasStochasticProc(fixture)) {
    return;
  }
  const trials = effectiveTrialCount({ fixture, engineResult });
  if (trials < 200) {
    throw new Error(`Fixture ${fixture.id} requires trials >= 200 for stochastic proc comparison; got ${trials}`);
  }
}

function compareEngineResult({ fixture, engineResult, tolerance = { absolute: 1, percent: 0.01 } }) {
  if (fixture.id !== engineResult.id) {
    throw new Error(`Fixture id ${fixture.id} does not match engine result id ${engineResult.id}`);
  }
  validateProcTrialCount({ fixture, engineResult });
  const expected = Number(fixture.expectedLocalModel?.totals?.adjusted || 0);
  const { observed, sampleTolerance } = observedDamageFor(engineResult);
  const delta = round(Math.abs(observed - expected));
  const percentDelta = expected === 0 ? (delta === 0 ? 0 : Infinity) : delta / expected;
  const expectedRange = attackRollExpectedRange({ fixture, engineResult });
  const absoluteTolerance = sampleTolerance
    ? Math.max(tolerance.absolute, sampleTolerance.absolute)
    : tolerance.absolute;
  const rangePass = expectedRange
    ? observed >= expectedRange.min && observed <= expectedRange.max
    : false;
  const pass = rangePass || delta <= absoluteTolerance || percentDelta <= tolerance.percent;
  const magicResistance = magicResistanceCheck({ fixture, engineResult });
  return {
    id: fixture.id,
    expected,
    observed,
    delta,
    percentDelta,
    expectedRange,
    sampleTolerance,
    magicResistanceCheck: magicResistance,
    pass
  };
}

function normalizeEngineResults(engineResults) {
  if (Array.isArray(engineResults)) return engineResults;
  if (Array.isArray(engineResults?.results)) return engineResults.results;
  return [engineResults];
}

function compareEngineResults({ fixture, engineResults, tolerance = { absolute: 1, percent: 0.01 } }) {
  const fixtures = Array.isArray(fixture.fixtures) ? fixture.fixtures : [fixture];
  const results = normalizeEngineResults(engineResults);
  const byId = new Map(results.map((result) => [result.id, result]));
  const comparisons = [];
  const missingResultIds = [];
  for (const entry of fixtures) {
    const engineResult = byId.get(entry.id);
    if (!engineResult) {
      missingResultIds.push(entry.id);
      continue;
    }
    comparisons.push(compareEngineResult({ fixture: entry, engineResult, tolerance }));
  }
  const passed = comparisons.filter((entry) => entry.pass).length;
  const failed = comparisons.length - passed + missingResultIds.length;
  return {
    id: fixture.id,
    total: fixtures.length,
    compared: comparisons.length,
    passed,
    failed,
    missingResultIds,
    results: comparisons,
    pass: failed === 0
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
  const report = Array.isArray(fixture.fixtures)
    ? compareEngineResults({ fixture, engineResults: engineResult })
    : compareEngineResult({ fixture, engineResult });
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
  compareEngineResult,
  compareEngineResults,
  sampleStats
};
