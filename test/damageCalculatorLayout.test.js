const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'damage-calculator.css'), 'utf8');

test('damage calculator table keeps usable input widths instead of compressing columns', () => {
  assert.match(css, /\.damage-main\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /\.damage-section\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /\.damage-table\s*\{[\s\S]*min-width:\s*1220px/);
  assert.match(css, /\.damage-table\s+select\.ability-level[\s\S]*min-width:\s*56px/);
  assert.match(css, /\.damage-table\s+input\.active-duration[\s\S]*min-width:\s*92px/);
  assert.match(css, /\.damage-table\s+select\.value-mode[\s\S]*min-width:\s*108px/);
});
