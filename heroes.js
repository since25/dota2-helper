const heroRows = document.getElementById('heroRows');
const heroStatus = document.getElementById('heroStatus');
const heroCount = document.getElementById('heroCount');
const heroSearchInput = document.getElementById('heroSearchInput');

let allHeroes = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `请求失败: ${response.status}`);
  return data;
}

function heroMatches(hero, keyword) {
  if (!keyword) return true;
  const haystack = [
    hero.localized_name,
    hero.zh_name,
    hero.display_name,
    ...(hero.aliases || [])
  ].join(' ').toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function renderHeroes() {
  const keyword = heroSearchInput.value.trim();
  const heroes = allHeroes.filter((hero) => heroMatches(hero, keyword));
  heroCount.textContent = `${heroes.length} / ${allHeroes.length} 个英雄`;
  heroRows.innerHTML = heroes.map((hero) => {
    const heroName = encodeURIComponent(hero.localized_name);
    const aliases = (hero.aliases || [])
      .map((alias) => `<span class="chip">${escapeHtml(alias)}</span>`)
      .join('');
    return `
      <tr>
        <td><strong>${escapeHtml(hero.zh_name || '-')}</strong></td>
        <td>${escapeHtml(hero.localized_name)}</td>
        <td><div class="alias-list">${aliases || '<span class="chip">无</span>'}</div></td>
        <td><a class="link-button" href="/damage-profile.html?hero=${heroName}">查看伤害模型</a></td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="4">没有匹配的英雄。</td></tr>';
}

async function init() {
  try {
    heroStatus.textContent = '正在加载英雄列表...';
    allHeroes = await fetchJson('/api/heroes');
    renderHeroes();
    heroStatus.textContent = '已更新';
  } catch (error) {
    heroStatus.textContent = error.message;
  }
}

heroSearchInput.addEventListener('input', renderHeroes);
init();
