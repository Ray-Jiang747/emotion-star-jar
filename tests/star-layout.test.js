import test from 'node:test';
import assert from 'node:assert/strict';
import { createStarLayout } from '../js/star-layout.js';

test('spreads a populated bottle across distinct rows and columns', () => {
  const layout = createStarLayout(28);
  assert.equal(layout.length, 28);
  assert.ok(Math.max(...layout.map((star) => star.y)) - Math.min(...layout.map((star) => star.y)) >= 60);
  assert.ok(new Set(layout.map((star) => `${Math.round(star.x)}:${Math.round(star.y)}`)).size >= 26);
  assert.ok(Math.max(...layout.slice(0, 5).map((star) => star.y)) - Math.min(...layout.slice(0, 5).map((star) => star.y)) >= 20);
  assert.ok(layout.every((star) => star.x >= 8 && star.x <= 92 && star.y >= 8 && star.y <= 78));
});
