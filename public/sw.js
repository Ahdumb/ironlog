self.addEventListener("push", e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || "PeakSet", {
      body: data.body || "Time to hit a lift 💪",
      icon: "/icon-192.png",
      badge: "/favicon.png",
      tag: "workout-reminder",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow("/");
    })
  );
});
