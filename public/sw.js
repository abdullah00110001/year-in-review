// Service Worker for push notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle push events (server-side push via FCM/web push)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: 'Life OS', body: event.data.text() }; }
  
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || data.route || '/', type: data.type },
    tag: data.tag || `lifeos-${Date.now()}`,
    requireInteraction: true,
  };
  
  // Big Picture style - add image if provided
  if (data.imageUrl || data.image || data.bigPicture) {
    options.image = data.imageUrl || data.image || data.bigPicture;
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Life OS', options)
  );
});
