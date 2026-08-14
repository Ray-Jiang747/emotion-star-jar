const CACHE_NAME = 'emotion-star-jar-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './install.html',
  './manifest.webmanifest',
  './styles.css',
  './install.css',
  './js/app.js',
  './js/emotion-catalog.js',
  './js/install.js',
  './js/pwa-register.js',
  './js/star-layout.js',
  './js/star-store.js',
  './js/view-state.js',
  './assets/empty-star-jar.png',
  './assets/fold-journey-cute.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/kitty-companion.png',
  './assets/kitty-head.png',
  './assets/kitty-star-jar.png',
  './assets/origami-star-cute.png',
  './assets/starfield-bg.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('emotion-star-jar-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

const cacheSuccessful = async (request, response) => {
  if (response?.ok && new URL(request.url).origin === self.location.origin) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
};

const networkFirst = async (request) => {
  try {
    return await cacheSuccessful(request, await fetch(request));
  } catch {
    return (await caches.match(request)) || (await caches.match('./index.html'));
  }
};

const cacheFirst = async (request, event) => {
  const cached = await caches.match(request);
  const update = fetch(request).then((response) => cacheSuccessful(request, response)).catch(() => null);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  return (await update) || Response.error();
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request, event));
});
