import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

test('a first mobile visit stays within a 1.5 MiB local asset budget', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const css = readFileSync(new URL('styles.css', root), 'utf8');
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  const initialAssets = new Set(['index.html', 'styles.css', 'js/app.js', 'js/pwa-register.js']);

  for (const tag of html.matchAll(/<img\b[^>]*>/g)) {
    if (/\bloading=["']lazy["']/.test(tag[0])) continue;
    const src = tag[0].match(/\bsrc=["']\.\/([^"']+)["']/)?.[1];
    if (src) initialAssets.add(src);
  }

  for (const match of css.matchAll(/url\(["']?\.\/([^"')]+)["']?\)/g)) {
    initialAssets.add(match[1]);
  }

  const shell = worker.match(/const APP_SHELL = \[([\s\S]*?)\];/)?.[1] || '';
  for (const match of shell.matchAll(/["']\.\/([^"']*)["']/g)) {
    initialAssets.add(match[1] || 'index.html');
  }

  const totalBytes = [...initialAssets].reduce((total, relativePath) => {
    const path = fileURLToPath(new URL(relativePath, root));
    return total + statSync(path).size;
  }, 0);

  assert.ok(
    totalBytes <= 1.5 * 1024 * 1024,
    `first-visit local assets are ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`
  );
});

test('offline shell includes every image created dynamically by the app', () => {
  const app = readFileSync(new URL('js/app.js', root), 'utf8');
  const worker = readFileSync(new URL('sw.js', root), 'utf8');
  const dynamicImages = [...app.matchAll(/["'](\.\/assets\/[^"']+\.(?:png|webp))["']/g)]
    .map((match) => match[1]);

  for (const image of new Set(dynamicImages)) {
    assert.match(worker, new RegExp(image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
