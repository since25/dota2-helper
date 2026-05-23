#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { getHeroLocalizationList } = require('../heroAliases');

const DEFAULT_BASE_URL = 'http://localhost:3002';
const DEFAULT_OUT_DIR = path.join(process.cwd(), 'audit-runs', 'damage-level6-trial-latest');
const DEFAULT_SAMPLE_SIZE = 10;
const DEFAULT_THRESHOLD = 0.7;
const DEFAULT_TOLERANCE = 0.01;
const DEFAULT_ATTACK_COUNT = 3;
const DEFAULT_TARGET_MAX_HEALTH = 1000;
const DEFAULT_TARGET_CURRENT_HEALTH = 1000;

function roundDamage(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function valueAt(values, abilityLevel) {
  if (!Array.isArray(values) || !values.length || abilityLevel <= 0) return null;
  return values[Math.min(abilityLevel, values.length) - 1] ?? null;
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function physicalMultiplier(armor) {
  return 1 - (0.06 * armor) / (1 + 0.06 * Math.abs(armor));
}

function adjustedDamage(raw, damageType, options) {
  if (damageType === 'Magical') return roundDamage(raw * (1 - options.enemyMagicResistancePercent / 100));
  if (damageType === 'Physical') return roundDamage(raw * physicalMultiplier(options.enemyArmor));
  return roundDamage(raw);
}

function attackDamageAtLevel(stats, heroLevel) {
  if (!stats) return 0;
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  const strength = Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained;
  const agility = Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained;
  const intelligence = Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained;
  const primaryDamage = stats.primaryAttribute === 'all'
    ? (strength + agility + intelligence) * 0.7
    : { str: strength, agi: agility, int: intelligence }[stats.primaryAttribute] || 0;
  const attackMin = Math.round(Number(stats.baseAttackMin || 0) + primaryDamage);
  const attackMax = Math.round(Number(stats.baseAttackMax || 0) + primaryDamage);
  return roundDamage((attackMin + attackMax) / 2);
}

async function fetchJson(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${route}: ${text.slice(0, 120)}`);
  }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status} from ${route}`);
  return data;
}

function isSelectableComponent(component) {
  if (!component || component.status !== 'implemented') return false;
  if (!component.valuesByAbilityLevel?.length) return false;
  return !['debuff_reference'].includes(component.kind);
}

function triggerCountFor(component) {
  const input = component.metadata?.triggerCountInput || '';
  if (/kiss|projectile/.test(input)) return 2;
  if (/pulse|strike|machine|bounce|hit|count/.test(input)) return DEFAULT_ATTACK_COUNT;
  return DEFAULT_ATTACK_COUNT;
}

function healthValueFor(component) {
  const input = component.metadata?.healthInput || '';
  if (/current/.test(input)) return DEFAULT_TARGET_CURRENT_HEALTH;
  return DEFAULT_TARGET_MAX_HEALTH;
}

function attributeValueFor(component, profile, heroLevel) {
  const stats = profile.stats || {};
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  const strength = Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained;
  const agility = Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained;
  const intelligence = Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained;
  const input = component.metadata?.attributeInput || '';
  if (/strength/.test(input)) return roundDamage(strength);
  if (/agility/.test(input)) return roundDamage(agility);
  if (/intelligence/.test(input)) return roundDamage(intelligence);
  return roundDamage({ str: strength, agi: agility, int: intelligence }[stats.primaryAttribute] || intelligence || strength);
}

function componentTheoryRaw(component, abilityLevel, profile, heroLevel, attackDamage) {
  const base = valueAt(component.valuesByAbilityLevel || [], abilityLevel) || 0;
  const theoretical = valueAt(component.theoreticalTotalByAbilityLevel || [], abilityLevel);
  if (theoretical !== null) return theoretical;

  if (component.kind === 'attack_sequence') {
    const attackCount = valueAt(component.metadata?.attackCountByAbilityLevel || [], abilityLevel) || DEFAULT_ATTACK_COUNT;
    return roundDamage(attackCount * attackDamage + base);
  }
  if (component.kind === 'attack_modifier') {
    const factor = valueAt(component.metadata?.attackFactorPctByAbilityLevel || [], abilityLevel);
    if (factor !== null) return roundDamage(base + attackDamage * (factor / 100));
    return base;
  }
  if (component.kind === 'repeated_trigger') {
    const triggerCount = triggerCountFor(component);
    const bonus = valueAt(component.metadata?.bounceBonusDamageByAbilityLevel || [], abilityLevel) || 0;
    return roundDamage(base * triggerCount + bonus * Math.max(0, triggerCount - 1));
  }
  if (component.kind === 'summon_attack') {
    const attackCount = DEFAULT_ATTACK_COUNT;
    const isPercent = /illusion|percent|tooltip_illusion/.test(component.label || '');
    const perAttack = isPercent ? attackDamage * (base / 100) : base;
    return roundDamage(perAttack * attackCount);
  }
  if (component.kind === 'percent_health_dot') {
    const duration = valueAt(component.metadata?.durationByAbilityLevel || [], abilityLevel) || 1;
    return roundDamage(healthValueFor(component) * (base / 100) * duration);
  }
  if (component.kind === 'attribute_scaling') {
    const multiplier = valueAt(component.metadata?.attributeMultiplierByAbilityLevel || [], abilityLevel) || 0;
    return roundDamage(base + attributeValueFor(component, profile, heroLevel) * multiplier);
  }
  if (component.kind === 'conditional_instant') return 0;
  return base;
}

function bestComponentScore(ability, abilityLevel, profile, heroLevel) {
  const attackDamage = attackDamageAtLevel(profile.stats, heroLevel);
  return (ability.components || [])
    .filter(isSelectableComponent)
    .reduce((sum, component) => sum + componentTheoryRaw(component, abilityLevel, profile, heroLevel, attackDamage), 0);
}

function abilityMaxLevelAtSix(ability) {
  return ability.isUltimate ? 1 : Math.min(3, Math.max(1, ...(ability.components || []).map((c) => c.valuesByAbilityLevel?.length || 1)));
}

function selectedComponentsForAbility(ability, abilityLevel, profile, heroLevel) {
  const attackDamage = attackDamageAtLevel(profile.stats, heroLevel);
  return (ability.components || [])
    .filter(isSelectableComponent)
    .map((component) => {
      const selection = {
        sourceType: 'ability',
        abilityName: ability.name,
        componentId: component.id,
        abilityLevel,
        valueMode: 'theoretical'
      };
      if (component.kind === 'sustained') {
        const duration = valueAt(component.metadata?.durationByAbilityLevel || [], abilityLevel);
        if (duration !== null) selection.activeDurationSeconds = duration;
      }
      if (component.kind === 'attack_sequence') {
        selection.attackCount = valueAt(component.metadata?.attackCountByAbilityLevel || [], abilityLevel) || DEFAULT_ATTACK_COUNT;
        selection.attackDamage = attackDamage;
      }
      if (component.kind === 'attack_modifier' || component.kind === 'summon_attack') {
        selection.attackCount = DEFAULT_ATTACK_COUNT;
        selection.attackDamage = attackDamage;
      }
      if (component.kind === 'repeated_trigger') selection.triggerCount = triggerCountFor(component);
      if (component.kind === 'percent_health_dot') {
        selection.targetMaxHealth = DEFAULT_TARGET_MAX_HEALTH;
        selection.targetCurrentHealth = DEFAULT_TARGET_CURRENT_HEALTH;
        const duration = valueAt(component.metadata?.durationByAbilityLevel || [], abilityLevel);
        if (duration !== null) selection.activeDurationSeconds = duration;
      }
      if (component.kind === 'attribute_scaling') {
        const input = component.metadata?.attributeInput || '';
        const value = attributeValueFor(component, profile, heroLevel);
        if (/strength/.test(input)) selection.casterStrength = value;
        else if (/agility/.test(input)) selection.casterAgility = value;
        else selection.casterIntelligence = value;
      }
      return selection;
    });
}

function buildLevelSixTrialRequest(profile, options = {}) {
  const heroLevel = 6;
  const attackDamage = attackDamageAtLevel(profile.stats, heroLevel);
  const basicAbilities = profile.abilities
    .filter((ability) => !ability.isUltimate && (ability.components || []).some(isSelectableComponent));
  const ultimate = profile.abilities
    .filter((ability) => ability.isUltimate && (ability.components || []).some(isSelectableComponent))
    .sort((a, b) => bestComponentScore(b, 1, profile, heroLevel) - bestComponentScore(a, 1, profile, heroLevel))[0] || null;

  const rankedBasics = basicAbilities
    .map((ability) => ({
      ability,
      level3Score: bestComponentScore(ability, abilityMaxLevelAtSix(ability), profile, heroLevel),
      level1Score: bestComponentScore(ability, 1, profile, heroLevel)
    }))
    .sort((a, b) => b.level3Score - a.level3Score);

  const primary = rankedBasics[0]?.ability || null;
  const otherBasics = rankedBasics.slice(1, 3).map((entry) => entry.ability);
  const skillPlan = [];
  if (primary) skillPlan.push({ ability: primary, abilityLevel: abilityMaxLevelAtSix(primary), role: 'highest_basic' });
  for (const ability of otherBasics) skillPlan.push({ ability, abilityLevel: 1, role: 'other_basic' });
  if (ultimate) skillPlan.push({ ability: ultimate, abilityLevel: 1, role: 'ultimate' });

  const selectedComponents = skillPlan.flatMap(({ ability, abilityLevel }) =>
    selectedComponentsForAbility(ability, abilityLevel, profile, heroLevel)
  );
  const attackSequenceConsumesBasicAttack = selectedComponents.some((selection) => {
    const ability = profile.abilities.find((entry) => entry.name === selection.abilityName);
    const component = ability?.components.find((entry) => entry.id === selection.componentId);
    return component?.kind === 'attack_sequence';
  });
  if (!attackSequenceConsumesBasicAttack) {
    selectedComponents.push({
      sourceType: 'basic_attack',
      attackCount: options.attackCount || DEFAULT_ATTACK_COUNT,
      attackDamage,
      valueMode: 'theoretical'
    });
  }

  return {
    hero: profile.hero,
    heroLevel,
    enemyArmor: options.enemyArmor ?? 0,
    enemyMagicResistancePercent: options.enemyMagicResistancePercent ?? 25,
    selectedComponents,
    skillPlan: skillPlan.map(({ ability, abilityLevel, role }) => ({
      abilityName: ability.name,
      displayName: ability.displayName,
      abilityLevel,
      role
    })),
    assumptions: {
      attackCount: options.attackCount || DEFAULT_ATTACK_COUNT,
      targetMaxHealth: DEFAULT_TARGET_MAX_HEALTH,
      targetCurrentHealth: DEFAULT_TARGET_CURRENT_HEALTH,
      attackDamage,
      basicAttackAdded: !attackSequenceConsumesBasicAttack
    }
  };
}

function evaluateExpected(profile, request) {
  const byType = {};
  const components = [];
  const attackDamage = attackDamageAtLevel(profile.stats, request.heroLevel);
  for (const selection of request.selectedComponents) {
    let raw = 0;
    let damageType = 'Physical';
    let name = 'Basic Attack';
    if (selection.sourceType === 'basic_attack') {
      raw = roundDamage((numeric(selection.attackCount) || DEFAULT_ATTACK_COUNT) * (numeric(selection.attackDamage) || attackDamage));
    } else {
      const ability = profile.abilities.find((entry) => entry.name === selection.abilityName);
      const component = ability?.components.find((entry) => entry.id === selection.componentId);
      if (!ability || !component) continue;
      name = ability.name;
      damageType = component.damageType;
      raw = componentTheoryRaw(component, selection.abilityLevel, profile, request.heroLevel, numeric(selection.attackDamage) || attackDamage);
    }
    const adjusted = adjustedDamage(raw, damageType, request);
    const key = damageType || 'Unknown';
    if (!byType[key]) byType[key] = { raw: 0, adjusted: 0 };
    byType[key].raw = roundDamage(byType[key].raw + raw);
    byType[key].adjusted = roundDamage(byType[key].adjusted + adjusted);
    components.push({ name, damageType, raw, adjusted });
  }
  return {
    raw: roundDamage(Object.values(byType).reduce((sum, entry) => sum + entry.raw, 0)),
    adjusted: roundDamage(Object.values(byType).reduce((sum, entry) => sum + entry.adjusted, 0)),
    byType,
    components
  };
}

function compareTotals(apiResult, expected, tolerance = DEFAULT_TOLERANCE) {
  const rawDelta = roundDamage(apiResult.totals.raw - expected.raw);
  const adjustedDelta = roundDamage(apiResult.totals.adjusted - expected.adjusted);
  return {
    rawDelta,
    adjustedDelta,
    rawPass: Math.abs(rawDelta) <= tolerance,
    adjustedPass: Math.abs(adjustedDelta) <= tolerance,
    pass: Math.abs(rawDelta) <= tolerance && Math.abs(adjustedDelta) <= tolerance
  };
}

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.DAMAGE_TRIAL_BASE_URL || DEFAULT_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
    sampleSize: DEFAULT_SAMPLE_SIZE,
    threshold: DEFAULT_THRESHOLD,
    tolerance: DEFAULT_TOLERANCE,
    heroes: []
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--base-url') {
      options.baseUrl = next;
      index += 1;
    } else if (arg === '--out') {
      options.outDir = next;
      index += 1;
    } else if (arg === '--sample-size') {
      options.sampleSize = Number(next) || DEFAULT_SAMPLE_SIZE;
      index += 1;
    } else if (arg === '--threshold') {
      options.threshold = Number(next) || DEFAULT_THRESHOLD;
      index += 1;
    } else if (arg === '--heroes') {
      options.heroes = String(next || '').split(',').map((item) => item.trim()).filter(Boolean);
      index += 1;
    }
  }
  return options;
}

function heroNames(options) {
  if (options.heroes.length) return options.heroes;
  return getHeroLocalizationList().map((hero) => hero.localized_name);
}

async function runHeroTrial(baseUrl, heroName, options = {}) {
  const profile = await fetchJson(baseUrl, `/api/damage/heroes/${encodeURIComponent(heroName)}`);
  const request = buildLevelSixTrialRequest(profile, options);
  const apiResult = await fetchJson(baseUrl, '/api/damage/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  const expected = evaluateExpected(profile, request);
  const comparison = compareTotals(apiResult, expected, options.tolerance);
  return {
    hero: profile.hero,
    displayName: profile.displayName,
    pass: comparison.pass,
    comparison,
    request,
    expected,
    apiTotals: apiResult.totals,
    apiComponents: apiResult.components,
    warnings: apiResult.warnings || []
  };
}

function summarize(results) {
  const passCount = results.filter((entry) => entry.pass).length;
  return {
    total: results.length,
    passCount,
    failCount: results.length - passCount,
    passRate: results.length ? passCount / results.length : 0
  };
}

function renderMarkdown(report) {
  const lines = [
    '# 6级伤害 trial 校验报告',
    '',
    `- 生成时间：${report.generatedAt}`,
    `- API：${report.baseUrl}`,
    `- 抽样：${report.sampleSummary.passCount}/${report.sampleSummary.total} 通过，通过率 ${(report.sampleSummary.passRate * 100).toFixed(1)}%`,
    `- 阈值：${(report.threshold * 100).toFixed(1)}%`,
    `- 是否继续全量：${report.continuedToAll ? '是' : '否'}`,
    report.allSummary ? `- 全量：${report.allSummary.passCount}/${report.allSummary.total} 通过，通过率 ${(report.allSummary.passRate * 100).toFixed(1)}%` : '',
    '',
    '## 判定规则',
    '',
    '- 6级默认有 6 个技能点：最高理论伤害普通技能 3级，另外两个可计算普通技能 1级，大招 1级。',
    '- 额外加入 3 次普攻；如果选中的被动攻击序列已经消费 3 次普攻，则不再重复加入基础普攻。',
    '- 敌方护甲 0，魔抗 25%。百分比生命默认目标 1000 当前/最大生命。',
    '',
    '## 结果明细',
    '',
    '| 英雄 | 通过 | API 原始 | 理论原始 | 原始偏差 | API 抗性后 | 理论抗性后 | 抗性后偏差 | 技能方案 |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |'
  ].filter(Boolean);

  for (const result of report.results) {
    const plan = result.request.skillPlan
      .map((item) => `${item.abilityName} Lv${item.abilityLevel}`)
      .join('<br>');
    lines.push([
      result.displayName || result.hero,
      result.pass ? '是' : '否',
      result.apiTotals.raw,
      result.expected.raw,
      result.comparison.rawDelta,
      result.apiTotals.adjusted,
      result.expected.adjusted,
      result.comparison.adjustedDelta,
      plan
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }

  if (report.problemSummary.length) {
    lines.push('', '## 问题清单', '');
    for (const problem of report.problemSummary) {
      lines.push(`- ${problem.hero}: raw delta ${problem.rawDelta}, adjusted delta ${problem.adjustedDelta}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

async function writeReport(outDir, report) {
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'level6-trial-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, 'level6-trial-report.md'), renderMarkdown(report));
}

async function run(options) {
  const names = heroNames(options);
  const sampleNames = names.slice(0, options.sampleSize);
  const sampleResults = [];
  for (const name of sampleNames) sampleResults.push(await runHeroTrial(options.baseUrl, name, options));
  const sampleSummary = summarize(sampleResults);

  let continuedToAll = false;
  let results = sampleResults;
  let allSummary = null;
  if (sampleSummary.passRate > options.threshold) {
    continuedToAll = true;
    const sampled = new Set(sampleResults.map((entry) => entry.hero));
    const remaining = names.filter((name) => !sampled.has(name));
    const rest = [];
    for (const name of remaining) rest.push(await runHeroTrial(options.baseUrl, name, options));
    results = [...sampleResults, ...rest];
    allSummary = summarize(results);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    threshold: options.threshold,
    tolerance: options.tolerance,
    sampleSize: options.sampleSize,
    continuedToAll,
    sampleSummary,
    allSummary,
    problemSummary: results
      .filter((entry) => !entry.pass)
      .map((entry) => ({
        hero: entry.hero,
        rawDelta: entry.comparison.rawDelta,
        adjustedDelta: entry.comparison.adjustedDelta
      })),
    results
  };
  await writeReport(options.outDir, report);
  return report;
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await run(options);
    process.stdout.write(`Sample pass rate: ${(report.sampleSummary.passRate * 100).toFixed(1)}% (${report.sampleSummary.passCount}/${report.sampleSummary.total})\n`);
    if (report.continuedToAll) {
      process.stdout.write(`All pass rate: ${(report.allSummary.passRate * 100).toFixed(1)}% (${report.allSummary.passCount}/${report.allSummary.total})\n`);
    } else {
      process.stdout.write('Sample pass rate did not exceed threshold; stopped before full run.\n');
    }
    process.stdout.write(`Report: ${path.join(options.outDir, 'level6-trial-report.md')}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {
  adjustedDamage,
  attackDamageAtLevel,
  buildLevelSixTrialRequest,
  compareTotals,
  componentTheoryRaw,
  evaluateExpected,
  parseArgs,
  run,
  runHeroTrial,
  summarize
};
