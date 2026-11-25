// hookd offline support: always try the network first so updates show straight away,
// and fall back to the saved copy when there's no connection.
const CACHE = 'hookd-v4';
const FILES = ['/', '/index.html', '/app/', '/app/index.html', '/manifest.webmanifest', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match(new URL(e.request.url).pathname.startsWith('/app') ? '/app/index.html' : '/index.html'))));
});
