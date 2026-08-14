import test from 'node:test';
import assert from 'node:assert/strict';
import { createViewState } from '../js/view-state.js';

test('navigation publishes one valid active view', () => {
  const router = createViewState('home');
  const visited = [];
  router.subscribe((view) => visited.push(view));
  assert.equal(router.navigate('write'), 'write');
  assert.equal(router.current(), 'write');
  assert.deepEqual(visited, ['write']);
  assert.throws(() => router.navigate('missing'), /未知界面/);
  assert.equal(router.current(), 'write');
});
