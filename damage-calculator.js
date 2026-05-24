const heroSelect = document.getElementById('heroSelect');
const heroLevelInput = document.getElementById('heroLevelInput');
const enemyArmorInput = document.getElementById('enemyArmorInput');
const enemyMagicResistanceInput = document.getElementById('enemyMagicResistanceInput');
const calculateButton = document.getElementById('calculateButton');
const clearItemsButton = document.getElementById('clearItemsButton');
const statusText = document.getElementById('statusText');
const heroPanel = document.getElementById('heroPanel');
const abilityRows = document.getElementById('abilityRows');
const abilityCount = document.getElementById('abilityCount');
const itemRows = document.getElementById('itemRows');
const selectedItems = document.getElementById('selectedItems');
const shopTabs = document.getElementById('shopTabs');
const shopSearchInput = document.getElementById('shopSearchInput');
const rawTotal = document.getElementById('rawTotal');
const adjustedTotal = document.getElementById('adjustedTotal');
const effectiveTarget = document.getElementById('effectiveTarget');
const typeBreakdown = document.getElementById('typeBreakdown');
const componentBreakdown = document.getElementById('componentBreakdown');
const warningList = document.getElementById('warningList');

let currentWorkbench = null;
let activeShopGroup = 'damage';
let selectedItemComponents = [];

const STATUS_LABELS = {
  implemented: '可计算',
  reference_only: '仅参考',
  unsupported: '暂不支持',
  inferred: '自动推断'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fmt(value) {
  if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) return '-';
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

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `请求失败: ${response.status}`);
  return data;
}

async function loadHeroes() {
  const heroes = await fetchJson('/api/heroes');
  heroSelect.innerHTML = heroes.map((hero) => (
    `<option value="${escapeHtml(hero.localized_name)}">${escapeHtml(hero.display_name || hero.localized_name)}</option>`
  )).join('');
  const defaultHero = heroes.find((hero) => hero.localized_name === 'Sand King');
  if (defaultHero) heroSelect.value = defaultHero.localized_name;
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

function renderHeroPanel(panel) {
  const attack = panel.attackDamage || {};
  heroPanel.innerHTML = [
    ['力量', panel.attributes.strength],
    ['敏捷', panel.attributes.agility],
    ['智力', panel.attributes.intelligence],
    ['生命', panel.maxHealth],
    ['魔法', panel.maxMana],
    ['护甲', panel.armor],
    ['攻击', `${fmt(attack.min)}-${fmt(attack.max)}`],
    ['均伤', panel.averageAttackDamage],
    ['攻击距离', panel.attackRange],
    ['移动速度', panel.moveSpeed]
  ].map(([label, value]) => `
    <div class="hero-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(fmt(value))}</strong>
    </div>
  `).join('');
}

function renderAbilities(profile) {
  const heroLevel = Number(heroLevelInput.value || 1);
  const cards = [];
  for (const ability of profile.abilities) {
    const legalMax = maxLevelForAbility(ability, heroLevel);
    for (const component of ability.components) {
      const status = component.status || ability.status || 'inferred';
      const isSelectable = !['reference_only', 'unsupported'].includes(status);
      const level = Math.max(1, legalMax || 1);
      const baseValue = valueAt(component.valuesByAbilityLevel, level);
      const theoretical = valueAt(component.theoreticalTotalByAbilityLevel, level);
      const durationByLevel = component.metadata?.durationByAbilityLevel || [];
      const attackCountByLevel = component.metadata?.attackCountByAbilityLevel || [];
      const attackFactorByLevel = component.metadata?.attackFactorPctByAbilityLevel || [];
      const defaultDuration = valueAt(durationByLevel, level);
      const attackCount = valueAt(attackCountByLevel, level);
      const attackFactor = valueAt(attackFactorByLevel, level);
      const hasDurationControl = component.kind === 'sustained' && defaultDuration !== null;
      const hasAttackControl = attackCount !== null || attackFactor !== null;
      const needsHealthInput = ['percent_health_dot', 'percent_health_instant'].includes(component.kind);
      const needsSourceDamageInput = component.kind === 'source_damage_percent';
      const canUseTheoretical = theoretical !== null
        || hasDurationControl
        || hasAttackControl
        || ['repeated_trigger', 'summon_attack', 'attribute_scaling', 'percent_health_dot', 'percent_health_instant', 'source_damage_percent'].includes(component.kind);
      cards.push(`
        <article class="ability-workbench-card" data-ability="${escapeHtml(ability.name)}" data-component="${escapeHtml(component.id)}" data-kind="${escapeHtml(component.kind)}" data-status="${escapeHtml(status)}" data-duration-by-level="${durationByLevel.join(',')}" data-attack-count-by-level="${attackCountByLevel.join(',')}" data-attack-factor-by-level="${attackFactorByLevel.join(',')}">
          <div class="ability-card-top">
            <label class="toggle-line">
              <input type="checkbox" class="component-check" ${component.countInFixedInstantTotal && isSelectable ? 'checked' : ''} ${isSelectable ? '' : 'disabled'}>
              <strong>${escapeHtml(ability.displayName || ability.name)}</strong>
            </label>
            <span class="status-pill">${escapeHtml(STATUS_LABELS[status] || status)}</span>
          </div>
          <div class="mini-meta">${escapeHtml(component.label || component.id)} · ${escapeHtml(component.kind)} · ${escapeHtml(component.damageType)}</div>
          <div class="component-controls">
            <label>等级
              <select class="ability-level">
                ${Array.from({ length: component.valuesByAbilityLevel.length }, (_, index) => {
                  const optionLevel = index + 1;
                  return `<option value="${optionLevel}" ${optionLevel === level ? 'selected' : ''} ${optionLevel > legalMax ? 'disabled' : ''}>${optionLevel}</option>`;
                }).join('')}
              </select>
            </label>
            <label>模式
              <select class="value-mode">
                <option value="base">基础值 ${fmt(baseValue)}</option>
                <option value="theoretical" ${canUseTheoretical && isSelectable ? '' : 'disabled'} ${hasDurationControl || hasAttackControl ? 'selected' : ''}>理论/运行时 ${fmt(theoretical)}</option>
              </select>
            </label>
            <label>作用时间
              <input class="active-duration" type="number" min="0" step="0.1" value="${hasDurationControl ? fmt(defaultDuration) : ''}" ${hasDurationControl ? '' : 'disabled'}>
            </label>
            <label>普攻伤害
              <input class="attack-damage" type="number" min="0" step="0.1" value="${hasAttackControl ? fmt(currentWorkbench.heroPanel.averageAttackDamage) : ''}" ${hasAttackControl ? '' : 'disabled'}>
            </label>
            <label>目标生命
              <input class="target-max-health" type="number" min="0" step="1" value="${needsHealthInput ? fmt(currentWorkbench.heroPanel.maxHealth) : ''}" ${needsHealthInput ? '' : 'disabled'}>
            </label>
            <label>前置伤害
              <input class="source-damage" type="number" min="0" step="1" value="${needsSourceDamageInput ? '0' : ''}" ${needsSourceDamageInput ? '' : 'disabled'}>
            </label>
          </div>
        </article>
      `);
    }
  }
  abilityCount.textContent = `${cards.length} 个组件`;
  abilityRows.innerHTML = cards.join('') || '<p class="damage-status">本地数据未提供可计算技能组件。</p>';
  abilityRows.querySelectorAll('[data-component]').forEach((row) => syncAbilityInputs(row));
}

function syncAbilityInputs(row, { resetToDefault = false } = {}) {
  const durationInput = row.querySelector('.active-duration');
  const attackDamageInput = row.querySelector('.attack-damage');
  const targetMaxHealthInput = row.querySelector('.target-max-health');
  const sourceDamageInput = row.querySelector('.source-damage');
  const abilityLevel = Number(row.querySelector('.ability-level').value || 1);
  const valueMode = row.querySelector('.value-mode').value;
  const defaultDuration = valueAt(parseNumericList(row.dataset.durationByLevel), abilityLevel);
  const attackCount = valueAt(parseNumericList(row.dataset.attackCountByLevel), abilityLevel);
  const attackFactor = valueAt(parseNumericList(row.dataset.attackFactorByLevel), abilityLevel);
  const hasDurationControl = defaultDuration !== null;
  const hasAttackControl = attackCount !== null || attackFactor !== null;
  const needsHealthInput = ['percent_health_dot', 'percent_health_instant'].includes(row.dataset.kind);
  const needsSourceDamageInput = row.dataset.kind === 'source_damage_percent';

  durationInput.disabled = !(hasDurationControl && valueMode === 'theoretical');
  if (defaultDuration !== null) {
    durationInput.max = defaultDuration;
    if (resetToDefault || durationInput.value === '') durationInput.value = fmt(defaultDuration);
  } else {
    durationInput.value = '';
    durationInput.removeAttribute('max');
  }

  attackDamageInput.disabled = !(hasAttackControl && valueMode === 'theoretical');
  if (!hasAttackControl) {
    attackDamageInput.value = '';
  } else if (resetToDefault || attackDamageInput.value === '') {
    attackDamageInput.value = fmt(currentWorkbench.heroPanel.averageAttackDamage);
  }

  targetMaxHealthInput.disabled = !(needsHealthInput && valueMode === 'theoretical');
  if (!needsHealthInput) {
    targetMaxHealthInput.value = '';
  } else if (resetToDefault || targetMaxHealthInput.value === '') {
    targetMaxHealthInput.value = fmt(currentWorkbench.heroPanel.maxHealth);
  }

  sourceDamageInput.disabled = !(needsSourceDamageInput && valueMode === 'theoretical');
  if (!needsSourceDamageInput) {
    sourceDamageInput.value = '';
  } else if (resetToDefault || sourceDamageInput.value === '') {
    sourceDamageInput.value = '0';
  }
}

function renderShopTabs(workbench) {
  shopTabs.innerHTML = workbench.shopGroups.map((group) => `
    <button type="button" class="shop-tab ${group.id === activeShopGroup ? 'active' : ''}" data-group="${escapeHtml(group.id)}">${escapeHtml(group.label)}</button>
  `).join('');
}

function itemMatches(item, keyword) {
  if (!keyword) return true;
  const haystack = [
    item.key,
    item.name,
    item.displayName,
    item.englishName,
    item.quality,
    item.groupLabel,
    ...(item.components || []).flatMap((component) => [component.semanticType, component.label, component.sourceKey])
  ].join(' ').toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function renderShop() {
  const keyword = shopSearchInput.value.trim();
  const items = (currentWorkbench.profile.items || [])
    .filter((item) => item.group === activeShopGroup)
    .filter((item) => itemMatches(item, keyword));
  itemRows.innerHTML = items.map((item) => {
    const primary = item.components[0] || {};
    const selected = selectedItemComponents.some((entry) => entry.itemKey === item.key);
    return `
      <button type="button" class="shop-card ${selected ? 'selected' : ''}" data-item-key="${escapeHtml(item.key)}">
        <strong>${escapeHtml(item.displayName || item.name)}</strong>
        <span>${escapeHtml(item.englishName || item.name)} · ${escapeHtml(item.key)} · ${escapeHtml(item.cost)} 金</span>
        <small>${escapeHtml(primary.semanticType || item.groupLabel)}</small>
      </button>
    `;
  }).join('') || '<p class="damage-status">没有匹配的物品。</p>';
}

function itemRuntimeDefaults(component) {
  const value = (component.values || []).map((entry) => Number(entry)).find((entry) => Number.isFinite(entry));
  return {
    value: Number.isFinite(value) ? value : null,
    activeDurationSeconds: component.kind === 'sustained' ? 1 : null,
    triggerCount: component.kind === 'attack_proc' ? 1 : null,
    attributeValue: component.kind === 'attribute_scaling' ? currentWorkbench.heroPanel.attributes.intelligence : null
  };
}

function addItem(itemKey) {
  const item = currentWorkbench.profile.items.find((entry) => entry.key === itemKey);
  if (!item) return;
  for (const component of item.components) {
    if (selectedItemComponents.some((entry) => entry.componentId === component.id)) continue;
    selectedItemComponents.push({
      sourceType: 'item',
      itemKey: item.key,
      itemName: item.displayName || item.name,
      itemEnglishName: item.englishName || item.name,
      componentId: component.id,
      label: component.label,
      semanticType: component.semanticType,
      kind: component.kind,
      ...itemRuntimeDefaults(component)
    });
  }
  renderSelectedItems();
  renderShop();
  calculate().catch((error) => { statusText.textContent = error.message; });
}

function removeItem(itemKey) {
  const beforeCount = selectedItemComponents.length;
  selectedItemComponents = selectedItemComponents.filter((entry) => entry.itemKey !== itemKey);
  if (selectedItemComponents.length === beforeCount) return false;
  renderSelectedItems();
  renderShop();
  calculate().catch((error) => { statusText.textContent = error.message; });
  return true;
}

function toggleItem(itemKey) {
  if (!removeItem(itemKey)) {
    addItem(itemKey);
  }
}

function renderSelectedItems() {
  selectedItems.innerHTML = selectedItemComponents.map((entry, index) => `
    <article class="selected-item" data-index="${index}">
      <button type="button" class="remove-item" title="移除物品">×</button>
      <strong>${escapeHtml(entry.itemName)}</strong>
      <span>${escapeHtml(entry.label)} · ${escapeHtml(entry.semanticType)}</span>
      <div class="selected-item-controls">
        <label>数值 <input class="selected-value" type="number" step="0.1" value="${entry.value ?? ''}" ${entry.value === null ? 'disabled' : ''}></label>
        <label>时间 <input class="selected-duration" type="number" min="0" step="0.1" value="${entry.activeDurationSeconds ?? ''}" ${entry.activeDurationSeconds === null ? 'disabled' : ''}></label>
        <label>次数 <input class="selected-trigger" type="number" min="0" step="1" value="${entry.triggerCount ?? ''}" ${entry.triggerCount === null ? 'disabled' : ''}></label>
        <label>属性 <input class="selected-attribute" type="number" min="0" step="0.1" value="${entry.attributeValue ?? ''}" ${entry.attributeValue === null ? 'disabled' : ''}></label>
      </div>
    </article>
  `).join('') || '<p class="damage-status">从商店中点选物品后，会显示在这里。</p>';
}

function selectedAbilityComponents() {
  return Array.from(abilityRows.querySelectorAll('[data-component]'))
    .filter((row) => row.querySelector('.component-check').checked)
    .map((row) => {
      const abilityLevel = Number(row.querySelector('.ability-level').value || 1);
      const activeDuration = row.querySelector('.active-duration');
      const attackDamage = row.querySelector('.attack-damage');
      const targetMaxHealth = row.querySelector('.target-max-health');
      const sourceDamage = row.querySelector('.source-damage');
      const attackCount = valueAt(parseNumericList(row.dataset.attackCountByLevel), abilityLevel);
      return {
        sourceType: 'ability',
        abilityName: row.dataset.ability,
        componentId: row.dataset.component,
        abilityLevel,
        valueMode: row.querySelector('.value-mode').value,
        ...(activeDuration && !activeDuration.disabled && activeDuration.value !== '' ? { activeDurationSeconds: Number(activeDuration.value) } : {}),
        ...(attackCount !== null ? { attackCount } : {}),
        ...(attackDamage && !attackDamage.disabled && attackDamage.value !== '' ? { attackDamage: Number(attackDamage.value) } : {}),
        ...(targetMaxHealth && !targetMaxHealth.disabled && targetMaxHealth.value !== '' ? { targetMaxHealth: Number(targetMaxHealth.value) } : {}),
        ...(sourceDamage && !sourceDamage.disabled && sourceDamage.value !== '' ? { sourceDamage: Number(sourceDamage.value) } : {})
      };
    });
}

function selectedComponents() {
  return [
    ...selectedAbilityComponents(),
    ...selectedItemComponents.map((entry) => ({
      sourceType: 'item',
      itemKey: entry.itemKey,
      componentId: entry.componentId,
      valueMode: 'theoretical',
      ...(entry.value !== null ? { value: Number(entry.value) } : {}),
      ...(entry.activeDurationSeconds !== null ? { activeDurationSeconds: Number(entry.activeDurationSeconds) } : {}),
      ...(entry.triggerCount !== null ? { triggerCount: Number(entry.triggerCount) } : {}),
      ...(entry.attributeValue !== null ? { attributeValue: Number(entry.attributeValue) } : {})
    }))
  ];
}

function renderResult(result) {
  const selectedItemNames = new Map(selectedItemComponents.map((entry) => [entry.componentId, entry.itemName]));
  rawTotal.textContent = fmt(result.totals.raw);
  adjustedTotal.textContent = fmt(result.totals.adjusted);
  effectiveTarget.innerHTML = `
    <div class="breakdown-row">护甲：${fmt(result.enemyArmor)} → ${fmt(result.effectiveEnemyArmor)}</div>
    <div class="breakdown-row">魔抗：${fmt(result.enemyMagicResistancePercent)}% → ${fmt(result.effectiveEnemyMagicResistancePercent)}%</div>
  `;
  typeBreakdown.innerHTML = Object.entries(result.totals.byType)
    .map(([type, value]) => `<div class="breakdown-row">${escapeHtml(type)}: 原始 ${fmt(value.raw)} / 抗性后 ${fmt(value.adjusted)}</div>`)
    .join('') || '<div class="breakdown-row">未选择组件</div>';
  componentBreakdown.innerHTML = result.components
    .map((component) => {
      const displayName = selectedItemNames.get(component.componentId) || component.displayName;
      return `<div class="breakdown-row"><strong>${escapeHtml(displayName)}</strong><br>${escapeHtml(component.kind)} / ${escapeHtml(component.damageType)}: 原始 ${fmt(component.raw)}，抗性后 ${fmt(component.adjusted)}<br>${escapeHtml(component.formula || '')}</div>`;
    })
    .join('') || '<div class="breakdown-row">未选择组件</div>';
  const warnings = [...new Set([
    ...(result.warnings || []),
    ...result.components.flatMap((component) => component.caveats || [])
  ])];
  warningList.innerHTML = warnings.map((warning) => `<div>${escapeHtml(warning)}</div>`).join('') || '<div>无</div>';
}

async function calculate() {
  if (!currentWorkbench) return;
  statusText.textContent = '计算中...';
  const result = await fetchJson('/api/damage/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hero: currentWorkbench.profile.hero,
      heroLevel: Number(heroLevelInput.value || 1),
      enemyArmor: Number(enemyArmorInput.value || 0),
      enemyMagicResistancePercent: Number(enemyMagicResistanceInput.value || 25),
      selectedComponents: selectedComponents()
    })
  });
  renderResult(result);
  statusText.textContent = '已更新';
}

async function loadWorkbench() {
  statusText.textContent = '加载英雄实验室...';
  currentWorkbench = await fetchJson(`/api/calculator/workbench/${encodeURIComponent(heroSelect.value)}?heroLevel=${encodeURIComponent(heroLevelInput.value || 6)}`);
  selectedItemComponents = [];
  renderHeroPanel(currentWorkbench.heroPanel);
  renderAbilities(currentWorkbench.profile);
  renderShopTabs(currentWorkbench);
  renderSelectedItems();
  renderShop();
  await calculate();
}

function updateSelectedItemFromCard(card) {
  const index = Number(card.dataset.index);
  const entry = selectedItemComponents[index];
  if (!entry) return;
  const valueInput = card.querySelector('.selected-value');
  const durationInput = card.querySelector('.selected-duration');
  const triggerInput = card.querySelector('.selected-trigger');
  const attributeInput = card.querySelector('.selected-attribute');
  entry.value = valueInput.disabled || valueInput.value === '' ? null : Number(valueInput.value);
  entry.activeDurationSeconds = durationInput.disabled || durationInput.value === '' ? null : Number(durationInput.value);
  entry.triggerCount = triggerInput.disabled || triggerInput.value === '' ? null : Number(triggerInput.value);
  entry.attributeValue = attributeInput.disabled || attributeInput.value === '' ? null : Number(attributeInput.value);
}

async function init() {
  try {
    await loadHeroes();
    await loadWorkbench();
  } catch (error) {
    statusText.textContent = error.message;
  }
}

heroSelect.addEventListener('change', () => loadWorkbench().catch((error) => { statusText.textContent = error.message; }));
heroLevelInput.addEventListener('change', () => loadWorkbench().catch((error) => { statusText.textContent = error.message; }));
calculateButton.addEventListener('click', () => calculate().catch((error) => { statusText.textContent = error.message; }));
clearItemsButton.addEventListener('click', () => {
  selectedItemComponents = [];
  renderSelectedItems();
  renderShop();
  calculate().catch((error) => { statusText.textContent = error.message; });
});
abilityRows.addEventListener('change', (event) => {
  const row = event.target.closest('[data-component]');
  if (row) syncAbilityInputs(row, { resetToDefault: event.target.classList.contains('ability-level') });
  calculate().catch((error) => { statusText.textContent = error.message; });
});
shopTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-group]');
  if (!tab) return;
  activeShopGroup = tab.dataset.group;
  renderShopTabs(currentWorkbench);
  renderShop();
});
shopSearchInput.addEventListener('input', renderShop);
itemRows.addEventListener('click', (event) => {
  const card = event.target.closest('[data-item-key]');
  if (card) toggleItem(card.dataset.itemKey);
});
selectedItems.addEventListener('click', (event) => {
  const remove = event.target.closest('.remove-item');
  if (!remove) return;
  const card = remove.closest('[data-index]');
  selectedItemComponents.splice(Number(card.dataset.index), 1);
  renderSelectedItems();
  renderShop();
  calculate().catch((error) => { statusText.textContent = error.message; });
});
selectedItems.addEventListener('change', (event) => {
  const card = event.target.closest('[data-index]');
  if (!card) return;
  updateSelectedItemFromCard(card);
  calculate().catch((error) => { statusText.textContent = error.message; });
});

init();
