export async function registerPwa(
  serviceWorker = globalThis.navigator?.serviceWorker,
  logger = console,
  protocol = globalThis.location?.protocol || ''
) {
  if (!serviceWorker || !/^https?:$/.test(protocol)) return null;
  try {
    return await serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
  } catch (error) {
    logger.error('Service Worker 注册失败', error);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => { registerPwa(); });
}
