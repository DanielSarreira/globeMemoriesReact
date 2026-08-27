/* ── Globe Memories — Service Worker (PWA shell) ───────────────
 *
 * Round 86 — fully rewritten. Previous version pre-cached
 * `/icons/favicon.png` etc. that were removed in Round 15. With
 * `cache.addAll` (all-or-nothing), a single 404 killed the install
 * and the SW never registered, leaving the user with the
 * "Failed to execute 'addAll' on 'Cache'" error on every page load.
 *
 * The new version:
 *   1. Uses `Promise.allSettled` + per-URL `cache.add` so a single
 *      404 doesn't reject the whole install. Failed URLs are logged
 *      to the console but the SW still registers.
 *   2. Only pre-caches URLs that exist on every deploy — the
 *      favicon bundle + manifest + root. Webpack's content-hashed
 *      JS/CSS (in /static/) is NOT pre-cached (the hashes change
 *      every build); the fetch handler picks those up as the user
 *      navigates.
 *   3. Bumps CACHE_VERSION to gm-v3 to force a clean upgrade from
 *      any half-built cache left by a previous failed install.
 *
 * Estratégia: app-shell + network-first para HTML, cache-first
 * para assets estáticos.
 *
 *  - `install`: pré-cache do shell mínimo (root + manifest + favicon).
 *  - `activate`: limpa caches antigos quando uma nova versão
 *    deste SW é publicada (`skipWaiting` + `clients.claim`).
 *  - `fetch`:
 *      • Navegação (HTML) → network-first, fallback cache.
 *      • Assets estáticos (mesmo origin, /static/, /images/, /icons/)
 *        → cache-first com background revalidate.
 *      • API calls (mesmo origin, /api/, /auth, /trips, /users, /files/*…)
 *        → network-only (nunca cache — dados do user devem estar
 *        sempre frescos e nunca persistidos no SW).
 */

const CACHE_VERSION = 'gm-v3';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Round 86 — only URLs we KNOW exist on every deploy. The favicon
// bundle is the real-favicon one deployed in Round 15
// (`favicon.ico`, `favicon.svg`, `favicon-96x96.png`,
// `apple-touch-icon.png`, `web-app-manifest-192x192.png`,
// `web-app-manifest-512x512.png`). The `/manifest.json` and root
// `/` are the SPA shell. Webpack's content-hashed JS/CSS go in
// `/static/js/main.*.js` and `/static/css/main.*.css` — we let
// the fetch handler pick those up as the user navigates instead
// of pre-caching them (the hashes change every deploy).
const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
];

self.addEventListener('install', (event) => {
  // Round 86 — `cache.addAll` is all-or-nothing. A single 404 in
  // SHELL_URLS rejects the whole install, the SW never registers,
  // and the user gets "Failed to execute 'addAll' on 'Cache'" in
  // the console on every page load. We now use per-URL `cache.add`
  // inside `Promise.allSettled` so a missing file is logged but
  // doesn't kill the install.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const results = await Promise.allSettled(
        SHELL_URLS.map((url) => cache.add(url)),
      );
      const failed = results
        .map((r, i) => (r.status === 'rejected' ? SHELL_URLS[i] : null))
        .filter(Boolean);
      if (failed.length) {
        // eslint-disable-next-line no-console
        console.warn(
          '[Globe Memories SW] Some shell URLs failed to cache:',
          failed,
        );
      }
      // Force the new SW to take over immediately so the user gets
      // the v2 cache on this page load (not on the next).
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete ALL caches that don't start with the current version.
      // v1 left a half-built cache from its failed install — purge it.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isApiRequest(url) {
  // API calls do nosso próprio backend (8080) nunca devem ser
  // servidas do cache — a app espera dados frescos do server.
  // O frontend chama /api/* (axios baseURL) que o Nginx reescreve
  // para o backend. Em produção, o frontend chama o backend no
  // mesmo origin via /api/*.
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/trips') ||
    url.pathname.startsWith('/users') ||
    url.pathname.startsWith('/notifications') ||
    url.pathname.startsWith('/forum') ||
    url.pathname.startsWith('/qanda') ||
    url.pathname.startsWith('/follow') ||
    url.pathname.startsWith('/weather') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/oauth') ||
    url.pathname.startsWith('/sessions') ||
    url.pathname.startsWith('/password') ||
    url.pathname.startsWith('/email') ||
    url.pathname.startsWith('/categories') ||
    url.pathname.startsWith('/languages') ||
    url.pathname.startsWith('/transports') ||
    url.pathname.startsWith('/accommodation') ||
    url.pathname.startsWith('/cities') ||
    url.pathname.startsWith('/files/') ||
    url.pathname.startsWith('/media/')
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/assets/') ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|gif|woff2?|ttf|css|js|map)$/i.test(
      url.pathname,
    )
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin: deixa passar

  // API: network-only (sem cache).
  if (isApiRequest(url)) return;

  // Navegação (HTML): network-first, fallback cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shellCached = await caches.match('/');
          if (shellCached) return shellCached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })(),
    );
    return;
  }

  // Assets estáticos: cache-first, revalidate em background.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          // Re-valida em background; serve do cache já.
          fetch(request)
            .then((response) => {
              if (response && response.ok) {
                caches
                  .open(RUNTIME_CACHE)
                  .then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {});
          return cached;
        }
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          return new Response('Offline', { status: 503 });
        }
      })(),
    );
  }
});

// Recebe mensagens do cliente para forçar update / limpar cache.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      })(),
    );
  }
});
