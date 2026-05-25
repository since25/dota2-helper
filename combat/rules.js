function round(value) {
  return Math.round(value * 100) / 100;
}

function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}

function applyMagicResistance(raw, resistances = []) {
  let multiplier = 1;
  const stages = [];
  for (const entry of resistances) {
    const resistancePercent = Number(entry.resistancePercent || 0);
    const stageMultiplier = 1 - resistancePercent / 100;
    multiplier *= stageMultiplier;
    stages.push({
      source: entry.source || 'magic_resistance',
      resistancePercent,
      multiplier: stageMultiplier
    });
  }
  return {
    adjusted: round(raw * multiplier),
    multiplier,
    stages
  };
}

function applyDamageAmp(raw, {
  spellAmpPercent = 0,
  damageAmpPercent = 0,
  damageType = 'Unknown'
} = {}) {
  let adjusted = raw;
  const stages = [];

  if (damageType === 'Magical' && spellAmpPercent) {
    const multiplier = 1 + Number(spellAmpPercent) / 100;
    adjusted *= multiplier;
    stages.push({ source: 'spell_amp', percent: Number(spellAmpPercent), multiplier });
  }

  if (damageAmpPercent) {
    const multiplier = 1 + Number(damageAmpPercent) / 100;
    adjusted *= multiplier;
    stages.push({ source: 'damage_amp', percent: Number(damageAmpPercent), multiplier });
  }

  return { adjusted: round(adjusted), stages };
}

function resolveCritMultiplier(crits = [], options = {}) {
  if (options.forceCritSource) {
    const forced = crits.find((crit) => crit.source === options.forceCritSource);
    if (forced) {
      return {
        source: forced.source,
        multiplier: Number(forced.multiplierPercent || 100) / 100,
        mode: 'forced'
      };
    }
  }

  return { source: null, multiplier: 1, mode: 'none' };
}

function expectedCritMultiplier(crits = []) {
  return crits.reduce((expected, crit) => {
    const chance = Number(crit.chancePercent || 0) / 100;
    const multiplier = Number(crit.multiplierPercent || 100) / 100;
    return expected + chance * (multiplier - 1);
  }, 1);
}

module.exports = {
  applyDamageAmp,
  applyMagicResistance,
  expectedCritMultiplier,
  physicalMultiplier,
  resolveCritMultiplier,
  round
};
