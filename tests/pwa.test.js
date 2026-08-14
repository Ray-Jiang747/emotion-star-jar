import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const rootUrl = new URL('../', import.meta.url);
const requiredFiles = [
  'manifest.webmanifest',
  'sw.js',
  'install.html',
  'install.css',
  'js/install.js',
  'js/pwa-register.js',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

const pngSize = async (relativePath) => {
  const bytes = await readFile(new URL(relativePath, rootUrl));
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

test('PWA exposes install metadata, prompt behavior, and an offline shell', async () => {
  for (const relativePath of requiredFiles) {
    assert.equal(existsSync(new URL(relativePath, rootUrl)), true, `${relativePath} must exist`);
  }

  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', rootUrl), 'utf8'));
  assert.equal(manifest.name, '我的情绪星星瓶');
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(await pngSize('assets/icon-192.png'), [192, 192]);
  assert.deepEqual(await pngSize('assets/icon-512.png'), [512, 512]);

  const { registerPwa } = await import('../js/pwa-register.js');
  const registrations = [];
  const registration = await registerPwa({ register: async (...args) => { registrations.push(args); return { active: true }; } }, console, 'https:');
  assert.equal(registration.active, true);
  assert.deepEqual(registrations[0], ['./sw.js', { scope: './', updateViaCache: 'none' }]);

  const { createInstallController, detectInstallEnvironment } = await import('../js/install.js');
  assert.deepEqual(detectInstallEnvironment({ userAgent: 'iPhone', standalone: false, displayMode: false }), { installed: false, ios: true });
  const view = { ready: false, status: '', installed: false, setReady(value) { this.ready = value; }, setStatus(value) { this.status = value; }, setInstalled(value) { this.installed = value; } };
  const controller = createInstallController({ view, environment: { installed: false, ios: false } });
  const promptEvent = { preventDefault() {}, async prompt() {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
  controller.capture(promptEvent);
  assert.equal(view.ready, true);
  assert.equal(await controller.prompt(), 'dismissed');
  assert.match(view.status, /稍后/);

  const listeners = new Map();
  let cachedPaths = [];
  const context = {
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, handler) => listeners.set(name, handler), skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: { open: async () => ({ addAll: async (paths) => { cachedPaths = paths; } }), keys: async () => [], delete: async () => true },
    fetch: async () => { throw new Error('not used during install'); },
    URL,
    Promise
  };
  vm.runInNewContext(await readFile(new URL('sw.js', rootUrl), 'utf8'), context);
  let installWork;
  listeners.get('install')({ waitUntil: (promise) => { installWork = promise; } });
  await installWork;
  for (const relativePath of ['./index.html', './install.html', './manifest.webmanifest', './js/app.js']) {
    assert.equal(cachedPaths.includes(relativePath), true, `${relativePath} must be precached`);
  }
});
