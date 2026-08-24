const CACHE_NAME = 'koshur-kanvas-v5';
const FONTS_CACHE_NAME = 'koshur-kanvas-fonts-v5';

const CORE_ASSETS = [
  './',
  'index.html',
  'favicon.svg',
  'favicon.png',
  'favicon-32.png',
  'favicon-16.png',
  'app-icon.png',
  'app-icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'manifest.json'
];

const NOTO_NASTALIQ_FONTS = [
  'fonts/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-400-normal.woff2',
  'fonts/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-500-normal.woff2',
  'fonts/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-600-normal.woff2',
  'fonts/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-700-normal.woff2',
  'fonts/gulzar/files/gulzar-arabic-400-normal.woff2',
  'fonts/amiri/files/amiri-arabic-400-normal.woff2',
  'fonts/amiri/files/amiri-arabic-700-normal.woff2',
  'fonts/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff2',
  'fonts/noto-sans-arabic/files/noto-sans-arabic-arabic-600-normal.woff2',
  'fonts/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2',
  'fonts/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2',
  'fonts/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2'
];

// Install event - explicitly pre-cache core assets and font files safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Pre-cache core shell safely
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          CORE_ASSETS.map((asset) =>
            fetch(asset)
              .then((res) => {
                if (res.ok) return cache.put(asset, res);
              })
              .catch((err) => console.warn(`Failed to pre-cache core asset: ${asset}`, err))
          )
        );
      }),
      // Pre-cache fonts safely
      caches.open(FONTS_CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          NOTO_NASTALIQ_FONTS.map((fontUrl) =>
            fetch(fontUrl)
              .then((res) => {
                if (res.ok) return cache.put(fontUrl, res);
              })
              .catch((err) => console.warn(`Failed to pre-cache font: ${fontUrl}`, err))
          )
        );
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, FONTS_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - specialized cache-first strategy with fallback for fonts and core UI
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isFontRequest =
    event.request.destination === 'font' ||
    url.pathname.includes('/fonts/') ||
    url.pathname.includes('@fontsource') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com');

  if (isFontRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(FONTS_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 408, statusText: 'Font request timed out offline' });
          });
      })
    );
    return;
  }

  // Network-first with cache fallback for standard assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('index.html') || caches.match('./');
          }
          return new Response('Offline resource unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
