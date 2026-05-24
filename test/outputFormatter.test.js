const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml, formatStructuredOutput, safeHref } = require('../outputFormatter');

test('escapeHtml escapes HTML metacharacters', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert(1)">`),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
  );
});

test('formatStructuredOutput escapes raw HTML before markdown formatting', () => {
  const html = formatStructuredOutput('### 标题\n<script>alert(1)</script>\n**重点**');

  assert.match(html, /<h3>标题<\/h3>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<strong>重点<\/strong>/);
  assert.doesNotMatch(html, /<script>/);
});

test('formatStructuredOutput blocks javascript links', () => {
  const html = formatStructuredOutput('[点我](javascript:alert(1)) [官网](https://example.com/a)');

  assert.match(html, /href="#"/);
  assert.match(html, /href="https:\/\/example.com\/a"/);
  assert.equal(safeHref('mailto:test@example.com'), 'mailto:test@example.com');
});
