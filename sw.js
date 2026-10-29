// 故意留空：任何注册了此文件的 SW 立即跳过所有缓存并尝试 unregister
self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
  self.registration.unregister().catch(function(){});
});
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request).catch(function() { return Response.error(); }));
});
