// Minimal service worker for push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Onward', body: 'You have a new notification!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
