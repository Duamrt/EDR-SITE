const CACHE_NAME = 'edr-esquadro-qr-2026.08.21-1516';
const APP_FILES = [
  './',
  './index.html',
  './styles.css?v=20260821-1516',
  './geometry.js?v=20260821-1516',
  './app.js?v=20260821-1516',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest?v=20260821-1516',
  './vendor/pdf.min.mjs',
  './vendor/pdf.worker.min.mjs',
  './assets/locacao-demo.svg',
  './assets/qr-demo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
