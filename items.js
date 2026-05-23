const itemRows = document.getElementById('itemRows');
const itemStatus = document.getElementById('itemStatus');
const itemCount = document.getElementById('itemCount');
const itemSearchInput = document.getElementById('itemSearchInput');
const detailTitle = document.getElementById('detailTitle');
const itemDetail = document.getElementById('itemDetail');
const rawJsonBlock = document.getElementById('rawJsonBlock');

let allItems = [];

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
  return String(value);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `请求失败: ${response.status}`);
  return data;
}

function itemMatches(item, keyword) {
  if (!keyword) return true;
  const haystack = [
    item.key,
    item.name,
    item.displayName,
    item.englishName,
    item.quality,
    ...(item.effects || []).flatMap((effect) => [effect.type, effect.label, effect.key, effect.abilityName])
  ].join(' ').toLowerCase();
  return haystack.includes(keyword.toLowerCase());
}

function renderChips(values) {
  return values.map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join('');
}

function selectItem(key) {
  const item = allItems.find((entry) => entry.key === key);
  if (!item) return;
  detailTitle.textContent = `${item.displayName || item.name} 详情`;
  itemDetail.innerHTML = `
    <article class="ability-card">
      <header>
        <div>
          <h3>${escapeHtml(item.displayName || item.name)}</h3>
          <div class="ability-meta">${escapeHtml(item.englishName || item.name)} · ${escapeHtml(item.key)} · ${escapeHtml(item.quality)} · ${escapeHtml(item.cost)} 金</div>
        </div>
        <div class="chip-list">${renderChips((item.components || []).map((part) => `组件 ${part}`))}</div>
      </header>
      <div class="component-table-wrap">
        <table class="component-table">
          <thead>
            <tr>
              <th>语义类型</th>
              <th>标签</th>
              <th>来源</th>
              <th>数值</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            ${(item.effects || []).map((effect) => `
              <tr>
                <td>${escapeHtml(effect.type)}</td>
                <td>${escapeHtml(effect.label)}</td>
                <td>${escapeHtml(effect.key || effect.abilityName || effect.source || '-')}</td>
                <td>${escapeHtml(fmt(effect.values))}</td>
                <td class="component-note">${escapeHtml(effect.description || effect.display || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `;
  rawJsonBlock.textContent = JSON.stringify(item, null, 2);
}

function renderItems() {
  const keyword = itemSearchInput.value.trim();
  const items = allItems.filter((item) => itemMatches(item, keyword));
  itemCount.textContent = `${items.length} / ${allItems.length} 个物品`;
  itemRows.innerHTML = items.map((item) => {
    const types = [...new Set((item.effects || []).map((effect) => effect.type))].slice(0, 6);
    return `
      <tr>
        <td><button type="button" class="link-button item-select" data-key="${escapeHtml(item.key)}">${escapeHtml(item.displayName || item.name)}</button><br><code>${escapeHtml(item.englishName || item.name)} · ${escapeHtml(item.key)}</code></td>
        <td>${escapeHtml(item.cost)}</td>
        <td>${escapeHtml(item.quality || '-')}</td>
        <td><div class="alias-list">${renderChips(types)}</div></td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="4">没有匹配的物品。</td></tr>';

  itemRows.querySelectorAll('.item-select').forEach((button) => {
    button.addEventListener('click', () => selectItem(button.dataset.key));
  });
}

async function init() {
  try {
    itemStatus.textContent = '正在加载物品模型...';
    const data = await fetchJson('/api/items/models');
    allItems = data.items || [];
    renderItems();
    if (allItems.length) selectItem(allItems.find((item) => item.key === 'dagon')?.key || allItems[0].key);
    itemStatus.textContent = '已更新';
  } catch (error) {
    itemStatus.textContent = error.message;
  }
}

itemSearchInput.addEventListener('input', renderItems);
init();
