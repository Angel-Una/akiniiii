// Akini Service Worker v1231
// 1) 通知点击处理（原功能保留）
// 2) 应用外壳缓存：保证"添加到主屏幕"后即使网络差也能启动，不再白屏/闪退
const SHELL_CACHE = 'akini-shell-v1231';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './akini-style.css',
  './akini-perf-lite.css',
  './favicon.png',
  './favicon-96.png',
  './icon-180.png',
  './icon-192.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      // 单个资源失败不影响整体安装（某些托管环境可能没有 ./）
      .then(function (cache) {
        return Promise.all(SHELL_ASSETS.map(function (url) {
          return cache.add(new Request(url, { cache: 'reload' })).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf('akini-shell-') === 0 && k !== SHELL_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
    .then(function () {
      // v1243：新 SW 激活后通知所有客户端重载，拉取新版 index.html（旧 SW 不再缓存 index.html）
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
        cs.forEach(function (c) {
          try { c.postMessage({ type: 'AKINI_SW_UPDATED' }); } catch (e) {}
        });
      });
    })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 跨域请求交给浏览器原生处理

  // 页面导航：网络优先，5 秒超时或离线时回退到缓存的外壳
  if (req.mode === 'navigate') {
    e.respondWith(
      new Promise(function (resolve) {
        let settled = false;
        const timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          caches.match('./index.html').then(function (hit) { resolve(hit || fetch(req)); });
        }, 5000);
        fetch(req).then(function (res) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          // 成功导航后更新外壳，保证下次离线可用
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put('./index.html', copy); });
          }
          resolve(res);
        }).catch(function () {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          caches.match('./index.html').then(function (hit) { resolve(hit || Response.error()); });
        });
      })
    );
    return;
  }

  // 静态资源：缓存优先 + 后台更新（URL 带版本号，升级后自动换新）
  if (/\.(?:js|css|png|jpe?g|gif|webp|svg|woff2?|ttf|mp3|mp4)(?:$|\?)/i.test(url.pathname + url.search)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        const network = fetch(req).then(function (res) {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return hit || Response.error(); });
        return hit || network;
      })
    );
  }
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    if (cs.length > 0) { cs[0].focus(); return; }
    return self.clients.openWindow('./');
  }));
});
