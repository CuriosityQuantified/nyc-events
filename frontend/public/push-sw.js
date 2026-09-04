self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "New event match", {
      body: payload.body ?? "Open NYC Events to see your match.",
      data: { url: payload.url ?? "/saved" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requested = new URL(
    event.notification.data?.url ?? "/saved",
    self.location.origin,
  );
  const target =
    requested.origin === self.location.origin &&
    requested.pathname.startsWith("/events/")
      ? requested.href
      : new URL("/saved", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url === target);
      return existing ? existing.focus() : clients.openWindow(target);
    }),
  );
});
