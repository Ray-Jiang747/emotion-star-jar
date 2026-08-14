import test from 'node:test';
import assert from 'node:assert/strict';
import { createStarStore, filterResolved } from '../js/star-store.js';

const memoryStorage = (seed = []) => {
  let raw = JSON.stringify(seed);
  return {
    getItem: () => raw,
    setItem: (_key, value) => { raw = value; },
    read: () => JSON.parse(raw)
  };
};

test('adds and persists a normalized pending star', () => {
  const storage = memoryStorage();
  const store = createStarStore(storage, () => 0);
  const star = store.add({ title: '误会', reason: '没有被理解', intensity: 70, color: 'pink' });
  assert.equal(star.status, 'pending');
  assert.equal(store.pending().length, 1);
  assert.equal(storage.read()[0].reason, '没有被理解');
});

test('random selection never returns a resolved star', () => {
  const storage = memoryStorage([
    { id: 'done', reason: '旧问题', status: 'resolved', solution: '沟通', resolvedAt: '2026-08-14T10:00:00.000Z' },
    { id: 'open', reason: '新问题', status: 'pending' }
  ]);
  const store = createStarStore(storage, () => 0);
  assert.equal(store.pickRandomPending().id, 'open');
});

test('resolve requires a solution and moves the star to resolved', () => {
  const storage = memoryStorage([{ id: 'open', reason: '新问题', status: 'pending' }]);
  const store = createStarStore(storage, () => 0);
  assert.throws(() => store.resolve('open', '   '), /解决方法/);
  const done = store.resolve('open', '认真沟通');
  assert.equal(done.status, 'resolved');
  assert.equal(done.solution, '认真沟通');
  assert.ok(done.resolvedAt);
  assert.equal(store.pending().length, 0);
});

test('filters resolved records by color', () => {
  const rows = [
    { status: 'resolved', color: 'pink' },
    { status: 'resolved', color: 'blue' },
    { status: 'pending', color: 'pink' }
  ];
  assert.equal(filterResolved(rows, 'pink').length, 1);
  assert.equal(filterResolved(rows, 'all').length, 2);
});

test('add rejects empty reason and clamps intensity', () => {
  const store = createStarStore(memoryStorage(), () => 0);
  assert.throws(() => store.add({ reason: '   ' }), /生气原因/);
  const star = store.add({ reason: '压力很大', intensity: 160, color: 'blue' });
  assert.equal(star.intensity, 100);
});
