const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'damage-calculator.css'), 'utf8');

test('damage calculator v2 workbench keeps controls readable without table compression', () => {
  assert.match(css, /\.workbench-layout\s*\{[\s\S]*grid-template-columns:\s*280px minmax\(0, 1fr\) 340px/);
  assert.match(css, /\.workbench-center\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /\.ability-workbench-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit, minmax\(310px, 1fr\)\)/);
  assert.match(css, /\.shop-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fill, minmax\(180px, 1fr\)\)/);
  assert.match(css, /\.selected-item-controls\s*\{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});
