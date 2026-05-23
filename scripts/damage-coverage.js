#!/usr/bin/env node

const { buildDamageModelCoverage } = require('../damageModels/coverage');

buildDamageModelCoverage()
  .then((report) => {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
