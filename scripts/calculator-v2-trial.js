const fs = require('node:fs');
const path = require('node:path');

const { calculateDamageCombo, getHeroDamageProfile } = require('../damageCalculator');
const { buildCalculatorWorkbench } = require('../calculatorWorkbench');

const DEFAULT_OUTPUT_DIR = path.join('audit-runs', 'calculator-v2-trial-latest');
const DEFAULT_HEROES = [
  'Sand King',
  'Lich',
  'Lion',
  'Queen of Pain',
  'Slardar',
  'Phantom Assassin',
  'Jakiro',
  'Snapfire',
  'Skywrath Mage',
  'Terrorblade'
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function firstSelectableAbility(profile) {
  for (const ability of profile.abilities || []) {
    const component = (ability.components || []).find((entry) => !['reference_only', 'unsupported'].includes(entry.status));
    if (component) return { ability, component };
  }
  return null;
}

function firstItem(profile, semanticPrefix) {
  for (const item of profile.items || []) {
    const component = (item.components || []).find((entry) => entry.semanticType?.startsWith(semanticPrefix));
    if (component) return { item, component };
  }
  return null;
}

function valueFor(component) {
  return (component.values || []).map(Number).find(Number.isFinite);
}

async function runHeroTrial(hero) {
  const heroLevel = 6;
  const profile = await getHeroDamageProfile(hero);
  const workbench = await buildCalculatorWorkbench(hero, { heroLevel });
  const selectedComponents = [];
  const abilityPick = firstSelectableAbility(profile);
  const damageItem = firstItem(profile, 'damage.');
  const modifierItem = firstItem(profile, 'modifier.armor');

  if (abilityPick) {
    selectedComponents.push({
      sourceType: 'ability',
      abilityName: abilityPick.ability.name,
      componentId: abilityPick.component.id,
      abilityLevel: Math.min(abilityPick.component.valuesByAbilityLevel.length, abilityPick.ability.isUltimate ? 1 : 3),
      valueMode: abilityPick.component.theoreticalTotalByAbilityLevel?.length ? 'theoretical' : 'base',
      activeDurationSeconds: 1,
      attackDamage: workbench.heroPanel.averageAttackDamage
    });
  }
  if (modifierItem) {
    selectedComponents.push({
      sourceType: 'item',
      itemKey: modifierItem.item.key,
      componentId: modifierItem.component.id
    });
  }
  if (damageItem) {
    selectedComponents.push({
      sourceType: 'item',
      itemKey: damageItem.item.key,
      componentId: damageItem.component.id,
      value: valueFor(damageItem.component),
      activeDurationSeconds: damageItem.component.kind === 'sustained' ? 1 : undefined,
      triggerCount: damageItem.component.kind === 'attack_proc' ? 1 : undefined,
      attributeValue: workbench.heroPanel.attributes.intelligence
    });
  }

  const result = await calculateDamageCombo({
    hero,
    heroLevel,
    enemyArmor: 5,
    enemyMagicResistancePercent: 25,
    selectedComponents
  });

  return {
    hero,
    displayName: profile.displayName,
    heroPanel: workbench.heroPanel,
    selectedCount: selectedComponents.length,
    selectedComponents,
    totals: result.totals,
    effectiveEnemyArmor: result.effectiveEnemyArmor,
    effectiveEnemyMagicResistancePercent: result.effectiveEnemyMagicResistancePercent,
    componentNames: result.components.map((component) => component.displayName),
    warnings: result.warnings
  };
}

function renderHtml(trials) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Calculator v2 十英雄模拟验证</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #eef4f8; color: #1f2933; }
    main { width: min(1220px, calc(100vw - 32px)); margin: 0 auto; padding: 28px 0 48px; }
    h1 { color: #22364a; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d9e4ea; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px; border-bottom: 1px solid #d9e4ea; text-align: left; vertical-align: top; }
    th { background: #f7fafc; color: #31566d; }
    code { color: #9f2f1f; }
  </style>
</head>
<body>
  <main>
    <h1>Calculator v2 十英雄模拟验证</h1>
    <table>
      <thead>
        <tr>
          <th>英雄</th>
          <th>选择组件数</th>
          <th>原始总伤害</th>
          <th>抗性后总伤害</th>
          <th>组件</th>
        </tr>
      </thead>
      <tbody>
        ${trials.map((trial) => `
          <tr>
            <td><strong>${escapeHtml(trial.displayName)}</strong><br><code>${escapeHtml(trial.hero)}</code></td>
            <td>${trial.selectedCount}</td>
            <td>${trial.totals.raw}</td>
            <td>${trial.totals.adjusted}</td>
            <td>${trial.componentNames.map(escapeHtml).join('<br>')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

function parseArgs(argv) {
  const args = { outputDir: DEFAULT_OUTPUT_DIR, heroes: DEFAULT_HEROES };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') {
      args.outputDir = argv[index + 1] || args.outputDir;
      index += 1;
    } else if (argv[index] === '--heroes') {
      args.heroes = String(argv[index + 1] || '').split(',').map((hero) => hero.trim()).filter(Boolean);
      index += 1;
    }
  }
  return args;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const trials = [];
  for (const hero of options.heroes) {
    trials.push(await runHeroTrial(hero));
  }
  const outputDir = path.resolve(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'trials.json'), `${JSON.stringify(trials, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderHtml(trials));
  console.log(JSON.stringify({
    outputDir,
    heroCount: trials.length,
    minSelectedComponents: Math.min(...trials.map((trial) => trial.selectedCount)),
    totalAdjusted: trials.reduce((sum, trial) => sum + trial.totals.adjusted, 0),
    files: ['index.html', 'trials.json']
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_HEROES,
  runHeroTrial
};
