const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

test('formatStructuredOutput keeps markdown-looking links literal inside inline code', () => {
  const html = formatStructuredOutput('`[x](javascript:alert(1))`');

  assert.match(html, /<code>\[x\]\(javascript:alert\(1\)\)<\/code>/);
  assert.doesNotMatch(html, /<a /);
});

test('formatStructuredOutput escapes raw HTML in link labels', () => {
  const html = formatStructuredOutput('[<img src=x onerror=alert(1)>](https://example.com)');

  assert.match(html, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer">&lt;img src=x onerror=alert\(1\)&gt;<\/a>/);
  assert.doesNotMatch(html, /<img/);
});

test('formatStructuredOutput blocks javascript links inside table cells', () => {
  const html = formatStructuredOutput('| Link |\n| --- |\n| [bad](javascript:alert(1)) |');

  assert.match(html, /<td><a href="#" target="_blank" rel="noopener noreferrer">bad<\/a><\/td>/);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('main script resolves output formatter defensively with an escaping fallback', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

  assert.doesNotMatch(script, /const\s*\{\s*formatStructuredOutput\s*\}\s*=\s*window\.DotaOutputFormatter/);
  assert.match(script, /window\.DotaOutputFormatter\?\.formatStructuredOutput/);
  assert.match(script, /fallbackFormatStructuredOutput/);
  assert.match(script, /replaceAll\('<', '&lt;'\)/);
});
