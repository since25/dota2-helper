const test = require('node:test');
const assert = require('node:assert/strict');

const { validateItemModel } = require('../itemModels/schema');

test('validateItemModel requires modeled items to expose at least one effect', () => {
  assert.throws(
    () => validateItemModel({
      key: 'empty',
      name: 'Empty',
      status: 'modeled',
      effects: []
    }),
    /must have at least one semantic effect/
  );
});

test('validateItemModel rejects unsupported effect types', () => {
  assert.throws(
    () => validateItemModel({
      key: 'bad',
      name: 'Bad',
      status: 'modeled',
      effects: [{ type: 'damage.unknown', label: 'bad' }]
    }),
    /unsupported type/
  );
});
