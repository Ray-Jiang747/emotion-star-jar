import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('writing view uses inclusive emotion language and approved controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /发生了什么？/);
  assert.match(html, /我想怎样回应这份情绪？/);
  for (const emotion of ['happy', 'calm', 'sad', 'anxious', 'wronged', 'angry', 'other']) {
    assert.match(html, new RegExp(`value="${emotion}"`));
  }
  assert.doesNotMatch(html, /为什么生气？|我已经解决了|待解决星星/);
});

test('styles are mobile-first and include tablet and desktop breakpoints', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /html\s*\{[^}]*min-width\s*:/s);
  assert.match(css, /@media\s*\(min-width:\s*768px\)/);
  assert.match(css, /@media\s*\(min-width:\s*1100px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /font-size:\s*16px/);
});
