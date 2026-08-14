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

test('range input has a 44px mobile touch target', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /input\[type="range"\]\s*\{[^}]*min-height:\s*44px/s);
});

test('home grid and bottle opt out of intrinsic overflow at 320px', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.home-stage\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)[^}]*min-width:\s*0[^}]*max-width:\s*100%/s);
  assert.match(css, /\.bottle-stage\s*\{[^}]*width:\s*min\(100%,\s*430px\)[^}]*min-width:\s*0[^}]*max-width:\s*100%/s);
  assert.match(css, /@media\s*\(min-width:\s*768px\)[\s\S]*?\.bottle-stage\s*\{[^}]*width:\s*min\(100%,\s*470px\)/);
  assert.match(css, /@media\s*\(min-width:\s*1100px\)[\s\S]*?\.bottle-stage\s*\{[^}]*width:\s*min\(100%,\s*520px\)/);
});

test('copy and form accessibility match the approved UI contract', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /把每一种情绪折成星星，慢慢认识自己/);
  assert.match(html, /<textarea[^>]*id="star-reason"[^>]*aria-describedby="reason-error reason-count"/);
  assert.match(html, /<input[^>]*id="custom-emotion"[^>]*aria-describedby="custom-emotion-error"/);
  assert.match(html, /id="custom-emotion-error"[^>]*role="alert"/);
  for (const id of ['home-title', 'write-title', 'open-title', 'archive-title']) {
    assert.match(html, new RegExp(`<h[12][^>]*id="${id}"[^>]*tabindex="-1"`));
  }
});

test('open view offers both selected and random star actions on mobile', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

  assert.match(html, /<label[^>]*for="star-choice"/);
  assert.match(html, /<select[^>]*id="star-choice"/);
  assert.match(html, /id="open-selected-star"[^>]*>打开选择的星星</);
  assert.match(html, /id="open-random-star"[^>]*>随机抽一颗</);
  assert.match(css, /\.open-picker\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/s);
  assert.match(css, /\.open-picker select\s*\{[^}]*min-height:\s*44px[^}]*min-width:\s*0[^}]*max-width:\s*100%/s);
});
