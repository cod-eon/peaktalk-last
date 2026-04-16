self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'PeakTalk', body: event.data.text() };
  }

  const title = data.title || 'PeakTalk';
  const options = {
    body: data.body || 'У вас новое уведомление',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    data: {
      url: data.url || '/dashboard',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/dashboard';
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).toString();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            await client.navigate(absoluteTargetUrl);
            return client.focus();
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteTargetUrl);
      }
      return undefined;
    })
  );
});
