const { expectedCritMultiplier, resolveCritMultiplier, round } = require('./rules');

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstValue(assertion) {
  return numeric((assertion.values || [])[0], 0);
}

function selectedAttackCount(input) {
  if (input.mode === 'duration') {
    return Math.floor(numeric(input.durationSeconds, 0) * numeric(input.attackSpeed?.attacksPerSecond, 0));
  }
  return Math.max(0, Math.floor(numeric(input.attackCount, 1)));
}

function calculateAttackWindow(input) {
  const attackCount = selectedAttackCount(input);
  const baseDamage = numeric(input.attackDamage?.average, 0);
  const crits = (input.assertions || []).filter((assertion) => assertion.semanticType === 'attack.event.crit');
  const forcedCrit = resolveCritMultiplier(crits, { forceCritSource: input.forceCritSource });
  const crit = forcedCrit.mode === 'none' && crits.length
    ? { source: 'expected_crit', multiplier: expectedCritMultiplier(crits), mode: 'expected' }
    : forcedCrit;
  const breakBonuses = (input.assertions || []).filter((assertion) => (
    assertion.semanticType === 'attack.event.bonus_damage'
    && assertion.condition === 'condition.invisibility_break'
    && input.forceInvisibilityBreak
  ));

  const events = [];
  for (let index = 0; index < attackCount; index += 1) {
    const components = [{
      semanticType: 'attack.event.base_damage',
      raw: round(baseDamage * crit.multiplier)
    }];
    if (index === 0) {
      for (const assertion of breakBonuses) {
        components.push({
          semanticType: assertion.semanticType,
          sourceKey: assertion.sourceKey,
          raw: firstValue(assertion)
        });
      }
    }
    const raw = round(components.reduce((sum, component) => sum + component.raw, 0));
    events.push({
      type: 'attack',
      damageType: 'Physical',
      raw,
      components,
      crit
    });
  }

  return {
    mode: input.mode || 'attack_count',
    attackCount,
    raw: round(events.reduce((sum, event) => sum + event.raw, 0)),
    events
  };
}

module.exports = {
  calculateAttackWindow
};
