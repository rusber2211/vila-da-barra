const CACHE_NAME = 'vila-da-barra-v1';

const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARQUIVOS_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(chaves =>
      Promise.all(
        chaves.filter(c => c !== CACHE_NAME).map(c => caches.delete(c))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});