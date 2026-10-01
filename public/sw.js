// Service worker mínimo: guarda o app (HTML/JS/ícones) para abrir rápido e offline.
// Mídias e API não são cacheadas aqui.
const CACHE = 'r34-feed-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // API e mídias não entram no cache do app (mídias são grandes e vídeos vêm em pedaços).
  if (/^\/(proxy|api|media)\//.test(url.pathname)) return;
  // Rede primeiro (pega atualizações), cache como fallback.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
