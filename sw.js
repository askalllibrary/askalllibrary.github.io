/* ASKALL V7.4 — static app shell only. Never cache Supabase, PDFs, auth, or user submissions. */
'use strict';
const CACHE = 'askall-shell-v7-4-20261121';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png',
  '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('askall-shell-') && k !== CACHE).map(k => caches.delete(k)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Only the public HTML shell is cached, never API data, search queries, PDFs, or login results.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(response => {
      if (response.ok && (url.pathname === '/' || url.pathname === '/index.html')) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put('/', copy)));
      }
      return response;
    }).catch(async () => {
      const saved = await caches.match('/');
      return saved || new Response('ASKALL memerlukan koneksi internet untuk pertama kali dibuka.', {
        status: 503, headers: {'Content-Type':'text/plain; charset=utf-8'}
      });
    }));
    return;
  }
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
