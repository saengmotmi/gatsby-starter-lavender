/* 
 * Transitional service worker for Gatsby -> React Router migration.
 * Existing clients already scoped to /sw.js will receive this file,
 * clear old caches, then unregister.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

async function refreshClients() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  await Promise.all(
    clients.map(async (client) => {
      client.postMessage({ type: "SW_CLEANUP_COMPLETE" });

      if (typeof client.navigate === "function") {
        try {
          await client.navigate(client.url);
        } catch {
          // Ignore navigation failures (for example, if the tab is closing).
        }
      }
    })
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await clearAllCaches();
      await self.registration.unregister();
      await refreshClients();
    })()
  );
});
