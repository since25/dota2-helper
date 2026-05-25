const { isCombatSemanticType } = require('./semanticTypes');

const CONFIDENCE_LEVELS = new Set(['auto', 'candidate', 'reviewed', 'engine_verified']);

function validateCombatAssertion(assertion) {
  if (!assertion || typeof assertion !== 'object') {
    throw new Error('Combat assertion must be an object');
  }
  if (!isCombatSemanticType(assertion.semanticType)) {
    throw new Error(`unsupported semanticType: ${assertion.semanticType}`);
  }
  if (!assertion.source || !assertion.sourceKey) {
    throw new Error('Combat assertion requires source and sourceKey');
  }
  if (assertion.confidence && !CONFIDENCE_LEVELS.has(assertion.confidence)) {
    throw new Error(`unsupported confidence: ${assertion.confidence}`);
  }
  return assertion;
}

function combatAssertion(fields) {
  return validateCombatAssertion({
    confidence: 'candidate',
    references: [],
    ...fields
  });
}

module.exports = {
  CONFIDENCE_LEVELS,
  combatAssertion,
  validateCombatAssertion
};
