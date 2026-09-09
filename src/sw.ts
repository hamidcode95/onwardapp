/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

export {};
declare const self: ServiceWorkerGlobalScope;

// Injected at build time by vite-plugin-pwa with the list of files to
// precache for offline support.
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handles a Web Push message arriving from send-time-anchor-push, even
// when no Onward tab is open.
self.addEventListener('push', (event) => {
  let data = { title: 'Onward', body: 'You have a new notification!', anchorId: null };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Non-JSON payload — fall back to the default text above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { anchorId: data.anchorId },
    })
  );
});

// Focuses (or opens) the app when the user taps the notification, and
// deep-links to the anchor that fired so the app can show it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const anchorId = event.notification.data?.anchorId;
  const targetUrl = anchorId ? `/?anchor=${anchorId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c);
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
