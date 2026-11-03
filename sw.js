/* Ecomondo 2026 — service worker : fonctionnement hors ligne */
const VERSION = 'v1.0.0';
const CACHE = 'ecomondo-' + VERSION;
const CORE = ['./', 'index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'data/seed.json', 'data/catalogue.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'lib/xlsx.full.min.js', 'lib/tesseract.min.js', 'lib/worker.min.js'];
const HEAVY = ['lib/core/tesseract-core-simd-lstm.wasm.js', 'lib/lang/eng.traineddata.gz'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    await Promise.all(HEAVY.map(u => c.add(u).catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('ecomondo-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { const r = await fetch(req); const c = await caches.open(CACHE); c.put('index.html', r.clone()); return r; }
      catch (err) { return (await caches.match('index.html')) || (await caches.match('./')) || Response.error(); }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(req); if (r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()); } return r; }
    catch (err) { return Response.error(); }
  })());
});
