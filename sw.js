const CACHE_NAME = 'nexus-pwa-v4';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/mobile.html',
  '/mobile.css',
  '/mobile.js',
  '/style.css',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/app.js',
  '/i18n.js',
  '/geo_earth.js',
  '/companion_ui.js',
  '/command_center.js',
  '/cooperative_ui.js',
  '/assistant_studio.js',
  '/research_hub.js',
  '/neural.js',
  '/agents.js',
  '/graph.js',
  '/chat.js',
  '/metrics.js',
  '/gemini.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API endpoints, metrics, or the private Owner Control Plane
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/metrics' ||
    url.pathname === '/admin.html' ||
    url.pathname === '/security_ui.js'
  ) {
    return;
  }

  // Network-first with cache fallback for instant updates + offline PWA compliance
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  );
});
