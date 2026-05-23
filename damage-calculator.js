const heroSelect = document.getElementById('heroSelect');
const heroLevelInput = document.getElementById('heroLevelInput');
const enemyArmorInput = document.getElementById('enemyArmorInput');
const enemyMagicResistanceInput = document.getElementById('enemyMagicResistanceInput');
const calculateButton = document.getElementById('calculateButton');
const statusText = document.getElementById('statusText');
const abilityRows = document.getElementById('abilityRows');
const rawTotal = document.getElementById('rawTotal');
const adjustedTotal = document.getElementById('adjustedTotal');
const typeBreakdown = document.getElementById('typeBreakdown');
const componentBreakdown = document.getElementById('componentBreakdown');
const warningList = document.getElementById('warningList');

let currentProfile = null;

const STATUS_LABELS = {
  implemented: '可计算',
  reference_only: '仅参考',
  unsupported: '暂不支持',
  inferred: '自动推断'
};

const SOURCE_LABELS = {
  curated: '人工模型',
  inferred: '自动推断'
};

function fmt(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(2).replace(/\.00$/, '');
}

function valueAt(values, level) {
  if (!values || !values.length) return null;
  return values[Math.min(level, values.length) - 1] ?? null;
}

function parseNumericList(value) {
  return (value || '')
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function defaultAttackDamage(profile, heroLevel) {
  const stats = profile?.stats;
  if (!stats) return null;
  const levelsGained = Math.max(0, Number(heroLevel || 1) - 1);
  const strength = Number(stats.baseStrength || 0) + Number(stats.strengthGain || 0) * levelsGained;
  const agility = Number(stats.baseAgility || 0) + Number(stats.agilityGain || 0) * levelsGained;
  const intelligence = Number(stats.baseIntelligence || 0) + Number(stats.intelligenceGain || 0) * levelsGained;
  const primaryDamage = stats.primaryAttribute === 'all'
    ? (strength + agility + intelligence) * 0.7
    : { str: strength, agi: agility, int: intelligence }[stats.primaryAttribute] || 0;
  const attackMin = Math.round(Number(stats.baseAttackMin || 0) + primaryDamage);
  const attackMax = Math.round(Number(stats.baseAttackMax || 0) + primaryDamage);
  return (attackMin + attackMax) / 2;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `请求失败: ${response.status}`);
  return data;
}

async function loadHeroes() {
  const heroes = await fetchJson('/api/heroes');
  heroSelect.innerHTML = heroes.map((hero) => (
    `<option value="${hero.localized_name}">${hero.display_name || hero.localized_name}</option>`
  )).join('');
  const sandKing = heroes.find((hero) => hero.localized_name === 'Sand King');
  if (sandKing) heroSelect.value = sandKing.localized_name;
}

function maxLevelForAbility(ability, heroLevel) {
  const maxComponentLevel = Math.max(...ability.components.map((component) => component.valuesByAbilityLevel.length));
  if (ability.isUltimate) {
    if (heroLevel >= 18) return Math.min(3, maxComponentLevel);
    if (heroLevel >= 12) return Math.min(2, maxComponentLevel);
    if (heroLevel >= 6) return Math.min(1, maxComponentLevel);
    return 0;
  }
  if (heroLevel >= 7) return Math.min(4, maxComponentLevel);
  if (heroLevel >= 5) return Math.min(3, maxComponentLevel);
  if (heroLevel >= 3) return Math.min(2, maxComponentLevel);
  return Math.min(1, maxComponentLevel);
}

function renderProfile(profile) {
  const heroLevel = Number(heroLevelInput.value || 1);
  const rows = [];
  for (const ability of profile.abilities) {
    const legalMax = maxLevelForAbility(ability, heroLevel);
    for (const component of ability.components) {
      const status = component.status || ability.status || 'inferred';
      const source = component.source || ability.modelSource || 'inferred';
      const isSelectable = !['reference_only', 'unsupported'].includes(status);
      const level = Math.max(1, legalMax || 1);
      const baseValue = valueAt(component.valuesByAbilityLevel, level);
      const theoretical = valueAt(component.theoreticalTotalByAbilityLevel, level);
      const isAttackSequence = component.kind === 'attack_sequence';
      const attackFactorByLevel = component.metadata?.attackFactorPctByAbilityLevel || [];
      const attackFactor = valueAt(attackFactorByLevel, level);
      const isAttackScaled = component.kind === 'attack_modifier' && attackFactor !== null;
      const canUseTheoretical = theoretical !== null && theoretical !== undefined || isAttackSequence || isAttackScaled;
      const durationByLevel = component.metadata?.durationByAbilityLevel || [];
      const attackCountByLevel = component.metadata?.attackCountByAbilityLevel || [];
      const defaultDuration = valueAt(durationByLevel, level);
      const attackCount = valueAt(attackCountByLevel, level);
      const attackDamage = defaultAttackDamage(profile, heroLevel);
      const hasDurationControl = component.kind === 'sustained' && canUseTheoretical && defaultDuration !== null;
      const hasAttackControl = (isAttackSequence && attackCount !== null && attackDamage !== null) || (isAttackScaled && attackDamage !== null);
      const theoreticalLabel = isAttackSequence
        ? `普攻×${fmt(attackCount)} + ${fmt(baseValue)}`
        : isAttackScaled
          ? `${fmt(baseValue)} + 普攻×${fmt(attackFactor)}%`
        : canUseTheoretical ? fmt(theoretical) : '-';
      const statusNote = component.reason || ability.reason || (component.caveats || [])[0] || '';
      rows.push(`
        <tr data-ability="${ability.name}" data-component="${component.id}" data-status="${status}" data-source="${source}" data-duration-by-level="${durationByLevel.join(',')}" data-attack-count-by-level="${attackCountByLevel.join(',')}" data-attack-factor-by-level="${attackFactorByLevel.join(',')}">
          <td><input type="checkbox" class="component-check" ${component.countInFixedInstantTotal && isSelectable ? 'checked' : ''} ${isSelectable ? '' : 'disabled'}></td>
          <td>${ability.displayName}</td>
          <td>
            <select class="ability-level">
              ${Array.from({ length: component.valuesByAbilityLevel.length }, (_, index) => {
                const optionLevel = index + 1;
                const disabled = optionLevel > legalMax ? 'disabled' : '';
                const selected = optionLevel === level ? 'selected' : '';
                return `<option value="${optionLevel}" ${selected} ${disabled}>${optionLevel}</option>`;
              }).join('')}
            </select>
          </td>
          <td>
            ${component.kind}<br>
            <small>${component.growthKind}</small><br>
            <span class="status-pill">${STATUS_LABELS[status] || status}</span>
            <span class="source-pill">${SOURCE_LABELS[source] || source}</span>
            ${statusNote ? `<small class="status-note">${statusNote}</small>` : ''}
          </td>
          <td>${component.damageType}</td>
          <td>${fmt(baseValue)}</td>
          <td>${theoreticalLabel}</td>
          <td>
            <input class="active-duration" type="number" min="0" step="0.1" value="${hasDurationControl ? fmt(defaultDuration) : ''}" ${hasDurationControl ? '' : 'disabled'}>
          </td>
          <td>
            <input class="attack-damage" type="number" min="0" step="0.1" value="${hasAttackControl ? fmt(attackDamage) : ''}" ${hasAttackControl ? '' : 'disabled'}>
          </td>
          <td>
            <select class="value-mode">
              <option value="base">基础值</option>
              <option value="theoretical" ${canUseTheoretical && isSelectable ? '' : 'disabled'} ${isSelectable && (hasDurationControl || hasAttackControl) ? 'selected' : ''}>理论总量</option>
            </select>
          </td>
        </tr>
      `);
    }
  }
  abilityRows.innerHTML = rows.join('') || '<tr><td colspan="10">本地数据未提供可计算技能组件。</td></tr>';
  abilityRows.querySelectorAll('tr[data-component]').forEach((row) => syncRowInputs(row));
}

function syncRowInputs(row, { resetToDefault = false } = {}) {
  const input = row.querySelector('.active-duration');
  const attackDamageInput = row.querySelector('.attack-damage');

  const durationByLevel = parseNumericList(row.dataset.durationByLevel);
  const attackCountByLevel = parseNumericList(row.dataset.attackCountByLevel);
  const attackFactorByLevel = parseNumericList(row.dataset.attackFactorByLevel);
  const abilityLevel = Number(row.querySelector('.ability-level').value || 1);
  const valueMode = row.querySelector('.value-mode').value;
  const defaultDuration = valueAt(durationByLevel, abilityLevel);
  const attackCount = valueAt(attackCountByLevel, abilityLevel);
  const attackFactor = valueAt(attackFactorByLevel, abilityLevel);
  const hasDurationControl = defaultDuration !== null;
  const hasAttackControl = attackCount !== null || attackFactor !== null;

  input.disabled = !(hasDurationControl && valueMode === 'theoretical');
  if (defaultDuration !== null) {
    input.max = defaultDuration;
    if (resetToDefault || input.value === '') {
      input.value = fmt(defaultDuration);
    }
  } else {
    input.removeAttribute('max');
    input.value = '';
  }

  attackDamageInput.disabled = !(hasAttackControl && valueMode === 'theoretical');
  if (!hasAttackControl) {
    attackDamageInput.value = '';
  } else if (resetToDefault && currentProfile) {
    attackDamageInput.value = fmt(defaultAttackDamage(currentProfile, Number(heroLevelInput.value || 1)));
  }
}

function selectedComponents() {
  return Array.from(abilityRows.querySelectorAll('tr[data-component]'))
    .filter((row) => row.querySelector('.component-check').checked)
    .map((row) => {
      const durationInput = row.querySelector('.active-duration');
      const attackDamageInput = row.querySelector('.attack-damage');
      const attackCount = valueAt(parseNumericList(row.dataset.attackCountByLevel), Number(row.querySelector('.ability-level').value || 1));
      const activeDurationSeconds = durationInput && !durationInput.disabled && durationInput.value !== ''
        ? Number(durationInput.value)
        : null;
      const attackDamage = attackDamageInput && !attackDamageInput.disabled && attackDamageInput.value !== ''
        ? Number(attackDamageInput.value)
        : null;

      return {
        sourceType: 'ability',
        abilityName: row.dataset.ability,
        componentId: row.dataset.component,
        abilityLevel: Number(row.querySelector('.ability-level').value),
        valueMode: row.querySelector('.value-mode').value,
        ...(activeDurationSeconds !== null ? { activeDurationSeconds } : {}),
        ...(attackCount !== null ? { attackCount } : {}),
        ...(attackDamage !== null ? { attackDamage } : {})
      };
    });
}

function renderResult(result) {
  rawTotal.textContent = fmt(result.totals.raw);
  adjustedTotal.textContent = fmt(result.totals.adjusted);
  typeBreakdown.innerHTML = Object.entries(result.totals.byType)
    .map(([type, value]) => `<div class="breakdown-row">${type}: 原始 ${fmt(value.raw)} / 抗性后 ${fmt(value.adjusted)}</div>`)
    .join('') || '<div class="breakdown-row">未选择组件</div>';
  componentBreakdown.innerHTML = result.components
    .map((component) => {
      const durationText = component.activeDurationSeconds !== null && component.activeDurationSeconds !== undefined
        ? `作用时间 ${fmt(component.activeDurationSeconds)} 秒${component.durationLimitSeconds ? ` / 上限 ${fmt(component.durationLimitSeconds)} 秒` : ''}<br>`
        : '';
      const attackText = component.attackCount !== null && component.attackCount !== undefined
        ? `普攻 ${fmt(component.attackCount)} 次 × ${fmt(component.attackDamage)} + 触发伤害 ${fmt(component.procDamage)}<br>`
        : '';
      const attackScaleText = component.attackFactorPct !== null && component.attackFactorPct !== undefined
        ? `基础 ${fmt(component.procDamage)} + 普攻伤害 ${fmt(component.attackDamage)} × ${fmt(component.attackFactorPct)}%<br>`
        : '';
      return `<div class="breakdown-row"><strong>${component.displayName}</strong><br>${component.kind} / ${component.damageType}: 原始 ${fmt(component.raw)}，抗性后 ${fmt(component.adjusted)}<br>${durationText}${attackText}${attackScaleText}${component.formula}</div>`;
    })
    .join('') || '<div class="breakdown-row">未选择组件</div>';
  const warnings = [
    ...result.warnings,
    ...result.components.flatMap((component) => component.caveats || [])
  ];
  warningList.innerHTML = [...new Set(warnings)].map((warning) => `<div>${warning}</div>`).join('') || '<div>无</div>';
}

async function calculate() {
  if (!currentProfile) return;
  statusText.textContent = '计算中...';
  const result = await fetchJson('/api/damage/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hero: currentProfile.hero,
      heroLevel: Number(heroLevelInput.value || 1),
      enemyArmor: Number(enemyArmorInput.value || 0),
      enemyMagicResistancePercent: Number(enemyMagicResistanceInput.value || 25),
      selectedComponents: selectedComponents()
    })
  });
  renderResult(result);
  statusText.textContent = '已更新';
}

async function loadProfile() {
  statusText.textContent = '加载英雄数据...';
  currentProfile = await fetchJson(`/api/damage/heroes/${encodeURIComponent(heroSelect.value)}`);
  renderProfile(currentProfile);
  await calculate();
}

async function init() {
  try {
    await loadHeroes();
    await loadProfile();
  } catch (error) {
    statusText.textContent = error.message;
  }
}

heroSelect.addEventListener('change', () => loadProfile().catch((error) => { statusText.textContent = error.message; }));
heroLevelInput.addEventListener('change', () => {
  if (currentProfile) {
    renderProfile(currentProfile);
    calculate().catch((error) => { statusText.textContent = error.message; });
  }
});
calculateButton.addEventListener('click', () => calculate().catch((error) => { statusText.textContent = error.message; }));
abilityRows.addEventListener('change', (event) => {
  const row = event.target.closest('tr[data-component]');
  if (row) {
    syncRowInputs(row, { resetToDefault: event.target.classList.contains('ability-level') });
  }
  calculate().catch((error) => { statusText.textContent = error.message; });
});

init();
