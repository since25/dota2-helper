(function attachOutputFormatter(root) {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function safeHref(value) {
    const href = String(value || '').trim();
    if (/^(https?:|mailto:)/i.test(href)) return escapeHtml(href);
    return '#';
  }

  function processInline(value) {
    const escaped = escapeHtml(value);
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^\*]+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => (
        `<a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
      ));
  }

  function formatStructuredOutput(text) {
    let html = '';
    const lines = String(text || '').split('\n');
    let currentListType = null;
    let inTable = false;
    let tableRows = [];

    function closeList() {
      if (!currentListType) return;
      html += currentListType === 'ol' ? '</ol>\n' : '</ul>\n';
      currentListType = null;
    }

    function renderTable() {
      if (!tableRows.length) return;
      html += '<div class="table-wrapper"><table>\n';
      tableRows.forEach((row, index) => {
        const cells = row.split('|').filter((cell) => cell.trim() !== '');
        if (cells.every((cell) => /^[\s-:]+$/.test(cell))) return;
        const tag = index === 0 ? 'th' : 'td';
        const rowClass = index === 0 ? 'table-header' : (index % 2 === 0 ? 'table-row-even' : 'table-row-odd');
        html += `<tr class="${rowClass}">`;
        cells.forEach((cell) => {
          html += `<${tag}>${processInline(cell.trim())}</${tag}>`;
        });
        html += '</tr>\n';
      });
      html += '</table></div>\n';
      tableRows = [];
      inTable = false;
    }

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        closeList();
        inTable = true;
        tableRows.push(trimmedLine);
        return;
      }
      if (inTable) renderTable();

      if (trimmedLine.startsWith('### ')) {
        closeList();
        html += `<h3>${processInline(trimmedLine.substring(4).trim())}</h3>\n`;
      } else if (trimmedLine.startsWith('## ')) {
        closeList();
        html += `<h4>${processInline(trimmedLine.substring(3).trim())}</h4>\n`;
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        if (currentListType !== 'ol') {
          closeList();
          html += '<ol>\n';
          currentListType = 'ol';
        }
        html += `<li>${processInline(trimmedLine.replace(/^\d+\.\s/, ''))}</li>\n`;
      } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        if (currentListType !== 'ul') {
          closeList();
          html += '<ul>\n';
          currentListType = 'ul';
        }
        html += `<li>${processInline(trimmedLine.substring(2).trim())}</li>\n`;
      } else if (trimmedLine === '---' || trimmedLine === '***') {
        closeList();
        html += '<hr>\n';
      } else if (trimmedLine === '') {
        closeList();
      } else {
        closeList();
        html += `<p>${processInline(trimmedLine)}</p>\n`;
      }
    });

    closeList();
    if (inTable) renderTable();
    return html;
  }

  const api = { escapeHtml, formatStructuredOutput, safeHref };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DotaOutputFormatter = api;
})(typeof window !== 'undefined' ? window : globalThis);
