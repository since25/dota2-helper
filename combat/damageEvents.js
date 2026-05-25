const { applyDamageAmp, applyMagicResistance, physicalMultiplier, round } = require('./rules');

function adjustDamageEvent(event, params = {}) {
  const amp = applyDamageAmp(event.raw, {
    damageType: event.damageType,
    spellAmpPercent: params.spellAmpPercent || 0,
    damageAmpPercent: params.damageAmpPercent || 0
  });

  if (event.damageType === 'Physical') {
    const armor = Number(params.enemyArmor || 0);
    return {
      ...event,
      adjusted: round(amp.adjusted * physicalMultiplier(armor)),
      stages: [...(event.stages || []), ...amp.stages, { source: 'armor', armor }]
    };
  }

  if (event.damageType === 'Magical') {
    const magic = applyMagicResistance(amp.adjusted, params.magicResistances || [
      { source: 'target_base', resistancePercent: Number(params.enemyMagicResistancePercent ?? 25) }
    ]);
    return {
      ...event,
      adjusted: magic.adjusted,
      stages: [...(event.stages || []), ...amp.stages, ...magic.stages]
    };
  }

  return {
    ...event,
    adjusted: amp.adjusted,
    stages: [...(event.stages || []), ...amp.stages]
  };
}

module.exports = {
  adjustDamageEvent
};
