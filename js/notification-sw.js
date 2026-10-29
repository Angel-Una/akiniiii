// Akini Service Worker —— 核弹级清缓存版
// 核心原则：绝不缓存任何 HTML；install/activate 都删全部缓存；导航永远走网络。
// 目的：彻底解决旧 SW 缓存旧版 index.html 导致的白屏/卡开屏问题。

const CACHE_NAME = 'akini-nocache';

// install：先删光所有缓存，再 skipWaiting 立即接管
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// activate：再删一次全部缓存，claim 所有客户端，然后强制刷新所有页面
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
        return Promise.all(cs.map(function (c) {
          try { c.postMessage({ type: 'AKINI_SW_CLEAR' }); } catch (e) {}
          try {
            if (c.navigate) return c.navigate(c.url).catch(function () {});
          } catch (e) {}
          return Promise.resolve();
        }));
      });
    })
  );
});

// fetch：HTML/导航永远走网络，不缓存；静态资源网络优先且不缓存
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 导航请求或 .html：纯网络，永不回退缓存
  if (req.mode === 'navigate' || /\.html(?:$|\?)/i.test(url.pathname)) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        if (res && res.ok) return res;
        return new Response(
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Akini</title></head>' +
          '<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,sans-serif;color:#333">' +
          '<div style="text-align:center"><div style="font-size:22px;font-weight:700;margin-bottom:10px">Akini</div>' +
          '<div style="color:#888;font-size:14px">网络连接失败，请检查网络后下拉刷新</div></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }).catch(function () {
        return new Response(
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Akini</title></head>' +
          '<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,sans-serif;color:#333">' +
          '<div style="text-align:center"><div style="font-size:22px;font-weight:700;margin-bottom:10px">Akini</div>' +
          '<div style="color:#888;font-size:14px">网络连接失败，请检查网络后下拉刷新</div></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // 静态资源：网络优先，不缓存（避免旧版 JS/CSS 锁死）
  e.respondWith(
    fetch(req, { cache: 'no-store' }).then(function (res) {
      if (res && res.ok) return res;
      return caches.match(req, { ignoreSearch: true }).then(function (old) {
        return old || Response.error();
      });
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (old) {
        return old || Response.error();
      });
    })
  );
});

// 处理服务端推送（Web Push）：从 event.data 解析标题/正文并展示系统通知
self.addEventListener('push', function (e) {
  try {
    var data = {};
    try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data ? e.data.text() : '' }; }
    var title = data.title || 'Akini';
    var options = {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      tag: data.tag || ('akini_push_' + Date.now()),
      renotify: true,
      data: data.data || {}
    };
    e.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {}
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    if (cs.length > 0) { cs[0].focus(); return; }
    return self.clients.openWindow('./');
  }));
});
