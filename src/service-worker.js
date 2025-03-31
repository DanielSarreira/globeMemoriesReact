// src/service-worker.js
const CACHE_NAME = 'globe-memories-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js', // Ajuste conforme o nome do seu bundle JS gerado
  '/static/css/main.chunk.css', // Ajuste conforme o nome do seu CSS gerado
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aberto');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Adicionar suporte a notificações push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Globe Memories';
  const options = {
    body: data.body || 'Você tem uma nova notificação!',
    icon: '/icons/icon-192x192.png', // Ícone da notificação
    badge: '/icons/icon-192x192.png', // Ícone pequeno para a notificação (opcional)
    data: data.payload || {}, // Dados adicionais para redirecionamento
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Lidar com cliques na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { type, relatedId } = event.notification.data;

  // Redirecionar com base no tipo de notificação
  let url = '/';
  if (type === 'like' || type === 'comment') {
    url = `/travel/${relatedId}`;
  } else if (type === 'follow') {
    url = `/profile/${relatedId}`;
  } else if (type === 'new_travel') {
    url = `/travel/${relatedId}`;
  }

  event.waitUntil(
    clients.openWindow(url)
  );
});