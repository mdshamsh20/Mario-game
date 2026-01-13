const CACHE_NAME = 'pixelio-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js',
    'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
