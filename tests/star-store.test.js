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
  const star = store.add({ title: '误会', reason: '没有被理解', intensity: 70, emotion: 'wronged' });
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
  assert.throws(() => store.resolve('open', '   '), /回应内容/);
  const done = store.resolve('open', '认真沟通');
  assert.equal(done.status, 'resolved');
  assert.equal(done.solution, '认真沟通');
  assert.ok(done.resolvedAt);
  assert.equal(store.pending().length, 0);
});

test('filters resolved records by emotion', () => {
  const rows = [
    { status: 'resolved', emotion: 'happy' },
    { status: 'resolved', emotion: 'sad' },
    { status: 'pending', emotion: 'happy' }
  ];
  assert.equal(filterResolved(rows, 'happy').length, 1);
  assert.equal(filterResolved(rows, 'all').length, 2);
});

test('add rejects empty reason and clamps intensity', () => {
  const store = createStarStore(memoryStorage(), () => 0);
  assert.throws(() => store.add({ reason: '   ' }), /发生的事情/);
  const star = store.add({ reason: '压力很大', intensity: 160, emotion: 'sad' });
  assert.equal(star.intensity, 100);
});

test('legacy records become angry without losing their original color', () => {
  const store = createStarStore(memoryStorage([{ id: 'legacy', reason: '旧记录', color: 'blue', status: 'pending' }]));
  assert.equal(store.list()[0].emotion, 'angry');
  assert.equal(store.list()[0].color, 'blue');
});

test('persists a selected emotion and requires a custom other label', () => {
  const store = createStarStore(memoryStorage(), () => 0);
  assert.throws(() => store.add({ reason: '说不清', emotion: 'other' }), /情绪名称/);
  const star = store.add({ reason: '新的体验', emotion: 'happy', intensity: 75 });
  assert.equal(star.emotion, 'happy');
  assert.equal(star.color, 'yellow');
});

test('resolved archive is newest first without mutating source', () => {
  const source = [
    { id: 'old', status: 'resolved', color: 'pink', resolvedAt: '2026-08-13T10:00:00.000Z' },
    { id: 'new', status: 'resolved', color: 'pink', resolvedAt: '2026-08-14T10:00:00.000Z' }
  ];
  const result = filterResolved(source, 'all');
  assert.deepEqual(result.map((item) => item.id), ['new', 'old']);
  assert.deepEqual(source.map((item) => item.id), ['old', 'new']);
});
