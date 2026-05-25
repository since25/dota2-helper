const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCalculatorWorkbench,
  heroAttributesAtLevel,
  itemCards
} = require('../calculatorWorkbench');
const { getHeroDamageProfile } = require('../damageCalculator');

test('heroAttributesAtLevel derives level-scaled attributes for the workbench panel', () => {
  const attrs = heroAttributesAtLevel({
    baseStrength: 20,
    strengthGain: 2,
    baseAgility: 15,
    agilityGain: 1.5,
    baseIntelligence: 18,
    intelligenceGain: 3
  }, 6);

  assert.deepEqual(attrs, {
    strength: 30,
    agility: 22.5,
    intelligence: 33
  });
});

test('buildCalculatorWorkbench exposes devilesk-inspired workbench sections without old data dependency', async () => {
  const workbench = await buildCalculatorWorkbench('Sand King', { heroLevel: 6 });

  assert.equal(workbench.reference.project, 'devilesk/dota-hero-calculator');
  assert.ok(workbench.reference.notAdopted.includes('old static dota-datafiles numbers'));
  assert.equal(workbench.heroPanel.hero, 'Sand King');
  assert.equal(workbench.heroPanel.heroLevel, 6);
  assert.ok(workbench.heroPanel.maxHealth > 0);
  assert.ok(workbench.profile.abilities.length > 0);
  assert.ok(workbench.profile.items.some((item) => item.key === 'dagon'));
  assert.ok(workbench.shopGroups.some((group) => group.id === 'upgrade'));
});

test('buildCalculatorWorkbench localizes shop item names from schinese data', async () => {
  const workbench = await buildCalculatorWorkbench('Lich', { heroLevel: 6 });
  const dagon = workbench.profile.items.find((item) => item.key === 'dagon');
  const shard = workbench.profile.items.find((item) => item.key === 'aghanims_shard');

  assert.equal(dagon.name, '达贡之神力');
  assert.equal(dagon.displayName, '达贡之神力（Dagon）');
  assert.equal(dagon.englishName, 'Dagon');
  assert.equal(shard.name, '阿哈利姆魔晶');
});

test('itemCards groups item components by current semantic middle layer', async () => {
  const profile = await getHeroDamageProfile('Lich');
  const cards = itemCards(profile);

  assert.equal(cards.find((item) => item.key === 'dagon').group, 'damage');
  assert.equal(cards.find((item) => item.key === 'desolator').group, 'modifier');
  assert.equal(cards.find((item) => item.key === 'aghanims_shard').group, 'upgrade');
  assert.ok(cards.find((item) => item.key === 'broadsword').combatAssertions.some((assertion) => (
    assertion.semanticType === 'stat.attack_damage.flat'
  )));
});

test('itemCards keeps descriptive zero-value item damage entries out of selectable calculator cards', async () => {
  const profile = await getHeroDamageProfile('Lich');
  const cards = itemCards(profile);
  const dagon = cards.find((item) => item.key === 'dagon');

  assert.equal(dagon.components.length, 1);
  assert.deepEqual(dagon.components[0].values, [400, 500, 600, 700, 800]);
});
