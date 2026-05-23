const heroSelect = document.getElementById('heroSelect');
const reloadButton = document.getElementById('reloadButton');
const profileStatus = document.getElementById('profileStatus');
const profileTitle = document.getElementById('profileTitle');
const rawJsonLink = document.getElementById('rawJsonLink');
const statsGrid = document.getElementById('statsGrid');
const profileSummary = document.getElementById('profileSummary');
const abilityCards = document.getElementById('abilityCards');
const rawJsonBlock = document.getElementById('rawJsonBlock');

let heroes = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fmt(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.join(' / ');
  if (typeof value === 'number') return Number(value.toFixed(2)).toString();
  return String(value);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `请求失败: ${response.status}`);
  return data;
}

function queryHero() {
  const params = new URLSearchParams(window.location.search);
  return params.get('hero') || 'Lich';
}

function setHeroQuery(hero) {
  const next = new URL(window.location.href);
  next.searchParams.set('hero', hero);
  window.history.replaceState(null, '', next);
}

function renderInfoGrid(container, items, className) {
  container.innerHTML = items.map(([label, value]) => `
    <div class="${className}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(fmt(value))}</strong>
    </div>
  `).join('');
}

function renderStats(profile) {
  const stats = profile.stats || {};
  const level1 = stats.derived?.level1 || {};
  renderInfoGrid(statsGrid, [
    ['攻击类型', stats.attackType],
    ['主属性', stats.primaryAttribute],
    ['攻击距离', stats.attackRange],
    ['移动速度', stats.moveSpeed],
    ['基础护甲', stats.baseArmor],
    ['基础魔抗', `${fmt(stats.baseMagicResistance)}%`],
    ['1级生命', level1.maxHealth],
    ['1级魔法', level1.maxMana],
    ['1级攻击力', `${fmt(level1.attackMin)} - ${fmt(level1.attackMax)}`],
    ['1级护甲', level1.armor]
  ], 'stat-item');
}

function renderSummary(profile) {
  const abilities = profile.abilities || [];
  const components = abilities.flatMap((ability) => ability.components || []);
  const implemented = components.filter((component) => component.status === 'implemented').length;
  const referenceOnly = components.filter((component) => component.status === 'reference_only').length;
  const selectable = components.filter((component) => !['reference_only', 'unsupported'].includes(component.status)).length;
  renderInfoGrid(profileSummary, [
    ['技能数量', abilities.length],
    ['组件数量', components.length],
    ['可计算组件', implemented],
    ['可勾选组件', selectable],
    ['仅参考组件', referenceOnly],
    ['物品组件', (profile.items || []).length]
  ], 'summary-item');
}

function renderAbilities(profile) {
  abilityCards.innerHTML = (profile.abilities || []).map((ability) => {
    const components = (ability.components || []).map((component) => `
      <tr>
        <td>${escapeHtml(component.label || component.id)}</td>
        <td>${escapeHtml(component.kind)}</td>
        <td>${escapeHtml(component.damageType)}</td>
        <td>${escapeHtml(fmt(component.valuesByAbilityLevel))}</td>
        <td>${escapeHtml(fmt(component.theoreticalTotalByAbilityLevel))}</td>
        <td>${escapeHtml(fmt(component.metadata?.durationByAbilityLevel))}</td>
        <td>${escapeHtml(component.status || ability.status || '-')}</td>
        <td class="component-note">${escapeHtml(component.reason || ability.reason || (component.caveats || [])[0] || '')}</td>
      </tr>
    `).join('');
    const mana = fmt(ability.manaCostByAbilityLevel);
    const cooldown = fmt(ability.cooldownByAbilityLevel);
    return `
      <article class="ability-card">
        <header>
          <div>
            <h3>${escapeHtml(ability.displayName || ability.name)}</h3>
            <div class="ability-meta">模型：${escapeHtml(ability.model || '-')} · 来源：${escapeHtml(ability.modelSource || '-')} · 状态：${escapeHtml(ability.status || '-')}</div>
          </div>
          <div class="chip-list">
            <span class="chip">蓝耗 ${escapeHtml(mana)}</span>
            <span class="chip">冷却 ${escapeHtml(cooldown)}</span>
          </div>
        </header>
        <div class="component-table-wrap">
          <table class="component-table">
            <thead>
              <tr>
                <th>字段</th>
                <th>模型类型</th>
                <th>伤害类型</th>
                <th>基础值</th>
                <th>理论总量</th>
                <th>持续时间</th>
                <th>状态</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>${components || '<tr><td colspan="8">暂无组件。</td></tr>'}</tbody>
          </table>
        </div>
      </article>
    `;
  }).join('') || '<p class="data-status">本地数据未提供技能组件。</p>';
}

async function loadHeroes() {
  heroes = await fetchJson('/api/heroes');
  heroSelect.innerHTML = heroes.map((hero) => (
    `<option value="${escapeHtml(hero.localized_name)}">${escapeHtml(hero.display_name || hero.localized_name)}</option>`
  )).join('');
}

async function loadProfile(hero = heroSelect.value || queryHero()) {
  profileStatus.textContent = '正在加载伤害模型...';
  const profile = await fetchJson(`/api/damage/heroes/${encodeURIComponent(hero)}`);
  heroSelect.value = profile.hero;
  setHeroQuery(profile.hero);
  rawJsonLink.href = `/api/damage/heroes/${encodeURIComponent(profile.hero)}`;
  profileTitle.textContent = `${profile.displayName || profile.hero} 伤害模型`;
  renderStats(profile);
  renderSummary(profile);
  renderAbilities(profile);
  rawJsonBlock.textContent = JSON.stringify(profile, null, 2);
  profileStatus.textContent = '已更新';
}

async function init() {
  try {
    await loadHeroes();
    const requestedHero = queryHero();
    const exists = heroes.some((hero) => hero.localized_name === requestedHero || hero.zh_name === requestedHero);
    heroSelect.value = exists ? requestedHero : 'Lich';
    await loadProfile(heroSelect.value);
  } catch (error) {
    profileStatus.textContent = error.message;
  }
}

heroSelect.addEventListener('change', () => loadProfile().catch((error) => { profileStatus.textContent = error.message; }));
reloadButton.addEventListener('click', () => loadProfile().catch((error) => { profileStatus.textContent = error.message; }));
init();
