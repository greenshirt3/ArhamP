
const CACHE_NAME = 'arham-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-onedrive') {
    event.waitUntil(syncWithOneDrive());
  }
});

async function syncWithOneDrive() {
  // Placeholder: Add logic to sync data with OneDrive when back online
  console.log('Background sync with OneDrive triggered.');
}
