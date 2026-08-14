import test from 'node:test';
import assert from 'node:assert/strict';
import { EMOTIONS, getEmotion, getEmotionLabel } from '../js/emotion-catalog.js';

test('catalog exposes the seven approved emotions', () => {
  assert.deepEqual(EMOTIONS.map(({ id }) => id), ['happy', 'calm', 'sad', 'anxious', 'wronged', 'angry', 'other']);
});

test('custom emotion labels override the generic other label', () => {
  assert.equal(getEmotionLabel({ emotion: 'other', customEmotion: '期待' }), '期待');
  assert.equal(getEmotion('missing').id, 'angry');
});
