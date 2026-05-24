const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

test('formatStructuredOutput preserves query string href semantics', () => {
  const html = formatStructuredOutput('[q](https://example.com?a=1&b=2)');

  assert.match(html, /href="https:\/\/example.com\?a=1&amp;b=2"/);
  assert.doesNotMatch(html, /&amp;amp;/);
});

test('formatStructuredOutput keeps markdown-looking links literal inside inline code', () => {
  const html = formatStructuredOutput('`[x](javascript:alert(1))`');

  assert.match(html, /<code>\[x\]\(javascript:alert\(1\)\)<\/code>/);
  assert.doesNotMatch(html, /<a /);
});

test('formatStructuredOutput does not replace user text that looks like old code placeholders', () => {
  const html = formatStructuredOutput('`real code` @@DOTA_CODE_SPAN_0@@');

  assert.match(html, /<code>real code<\/code>/);
  assert.match(html, /@@DOTA_CODE_SPAN_0@@/);
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

test('main script fallback runs without output formatter and escapes raw HTML', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  const elements = new Map();

  function createElement() {
    return {
      value: '',
      textContent: '',
      innerHTML: '',
      disabled: false,
      style: {},
      classList: { add() {}, remove() {} },
      appendChild() {},
      addEventListener() {},
      querySelector() {
        return createElement();
      }
    };
  }

  const document = {
    addEventListener() {},
    createElement,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement());
      return elements.get(id);
    }
  };

  const context = vm.createContext({
    window: {
      location: { search: '' },
      history: { replaceState() {} }
    },
    document,
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    URLSearchParams,
    console: { log() {}, error() {} }
  });

  vm.runInContext(script, context);
  const html = vm.runInContext('formatStructuredOutput(`<script>alert(1)</script>`)', context);

  assert.equal(html, '&lt;script&gt;alert(1)&lt;/script&gt;');
});
