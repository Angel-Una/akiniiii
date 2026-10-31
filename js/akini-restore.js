/* ===== akini-avatar-restore.js ===== */

/* 头像与第一屏壁纸恢复 */
(function(){
  function __akiniApplyAvatar(id, url) {
    if (!url) return;
    var el = document.getElementById(id);
    if (!el) return;
    if (String(url).indexOf('<img') === 0) {
      if (el.getAttribute('data-avatar-applied') === url) return;
      el.innerHTML = url;
      el.setAttribute('data-avatar-applied', url);
      return;
    }
    if (el.getAttribute('data-avatar-applied') === url) return;
    var img = el.querySelector('img');
    if (!img) {
      el.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
    } else {
      img.src = url;
    }
    el.setAttribute('data-avatar-applied', url);
  }

  function applyHomeBg(url) {
    if (!url || typeof url !== 'string' || url.length <= 10) return;
    /* 同步写 CSS 变量：主样式表的 background 简写 !important 会覆盖非important内联，
       由 perf-lite.css 末尾的高优先级规则统一渲染。 */
    try { document.documentElement.style.setProperty('--akini-home-bg', 'url("' + url + '")'); } catch(e) {}
    var pf = document.getElementById('phoneFrame');
    if (!pf) return;
    pf.style.setProperty('background-image', 'url("' + url + '")', 'important');
    pf.style.setProperty('background-size', 'cover', 'important');
    pf.style.setProperty('background-position', 'center', 'important');
    pf.style.setProperty('background-repeat', 'no-repeat', 'important');
    pf.classList.add('has-custom-bg');
  }

  /* 壁纸兜底恢复：localStorage 配额满时壁纸只存在 IndexedDB/localforage 里，
     此时同步读 localStorage 是空的，刷新后必须先异步取回再上墙。 */
  function restoreHomeBgAsync() {
    var ls = null;
    try { ls = localStorage.getItem('akini_home_bg') || localStorage.getItem('home_bg'); } catch(e) {}
    if (ls && ls.length > 10) { applyHomeBg(ls); return; }
    var settled = false;
    function done(v) {
      if (settled) return;
      if (!v || typeof v !== 'string' || v.length <= 10) return;
      settled = true;
      applyHomeBg(v);
      try { localStorage.setItem('akini_home_bg', v); } catch(e) {}
      try { if (window.__akiniImgCache) window.__akiniImgCache['akini_home_bg'] = v; } catch(e) {}
    }
    try {
      var mem = window.akiniStore && window.akiniStore.memoryGet ? window.akiniStore.memoryGet('akini_home_bg') : null;
      if (mem && mem.length > 10) { done(mem); return; }
    } catch(e) {}
    /* 壁纸真正落盘的位置是 _idbStore（localforage 实例 AkiniApp / akini_data）。
       之前先读全局 localforage（默认实例，库名不同）取不到值就直接 return，
       导致刷新后壁纸丢失。这里先读主存储，再兜底读快照与全局 localforage。 */
    var fromLocalforage = function() {
      try {
        if (window.localforage && localforage.getItem) localforage.getItem('akini_home_bg').then(done).catch(function(){});
      } catch(e) {}
    };
    try {
      if (window._idbStore && window._idbStore.get) {
        window._idbStore.get('akini_home_bg', function(v) {
          if (v && String(v).length > 10) { done(v); return; }
          try {
            window._idbStore.get('snap_akini_home_bg', function(sv) {
              if (sv && String(sv).length > 10) { done(sv); return; }
              fromLocalforage();
            });
          } catch(e) { fromLocalforage(); }
        });
        return;
      }
    } catch(e) {}
    fromLocalforage();
  }

  /* 从「内存缓存 → IndexedDB 镜像(memory) → localStorage」三处按优先级取图片值。
     配额满时图片只存在于 IndexedDB，同步读 LS 是空的，必须逐层兜底。 */
  function pickImg(k) {
    try {
      if (window.__akiniImgCache && typeof window.__akiniImgCache[k] === 'string' && window.__akiniImgCache[k].length > 10) return window.__akiniImgCache[k];
    } catch(e) {}
    try {
      if (window.akiniStore && window.akiniStore.memoryGet) {
        var m = window.akiniStore.memoryGet(k);
        if (m && String(m).length > 10) return m;
      }
    } catch(e) {}
    try { var v = localStorage.getItem(k); if (v && v.length > 10) return v; } catch(e) {}
    return '';
  }

  /* 首页顶部大卡封面 / 背景卡：配额满时值可能只存在 IndexedDB，
     同步读不到就必须异步从 IDB 取回，否则刷新后永远是灰底空白。 */
  function applyCoverArea(url) {
    if (!url || typeof url !== 'string' || url.length <= 10) return;
    var el = document.getElementById('coverAreaMain');
    if (!el) return;
    if (el.getAttribute('data-applied-bg') === url) return;
    el.setAttribute('data-applied-bg', url);
    el.style.setProperty('background-image', 'url("' + url + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
  }
  function applyBgArea(url) {
    if (!url || typeof url !== 'string' || url.length <= 10) return;
    var el = document.getElementById('bgArea');
    if (!el) return;
    if (el.getAttribute('data-applied-bg') === url) return;
    el.setAttribute('data-applied-bg', url);
    el.style.setProperty('background-image', 'url("' + url + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
  }
  /* 拍立得内芯是 div，图片只能以 background-image 呈现。
     必须用 !important 内联：样式表里有 background-image 的规则，且其它脚本
     （akini-app.js 的上传/加载逻辑）用普通 style.backgroundImage 赋值会把
     已有声明的 important 标记清掉，导致图片被样式表覆盖 → 刷新后拍立得空白。 */
  function applyPolaroid(url, el) {
    try {
      if (!el) el = document.getElementById('s1PolaroidImg');
      if (!el || !url || typeof url !== 'string' || url.length <= 10) return;
      var cur = el.style.backgroundImage || '';
      if (cur && cur.indexOf(url) >= 0 && el.style.getPropertyPriority('background-image') === 'important') return;
      el.setAttribute('data-applied-src', url);
      el.style.setProperty('background-image', 'url("' + url + '")', 'important');
      el.style.setProperty('background-size', 'cover', 'important');
      el.style.setProperty('background-position', 'center', 'important');
      el.style.setProperty('background-repeat', 'no-repeat', 'important');
    } catch (e) {}
  }
  var COVER_KEYS = ['akini_cover_img', 'akini_cover_bg', 'akini_s2_cover', 'cover_bg'];
  var DAY_KEYS = ['akini_day_bg', 'akini_bg_img', 'akini_anniv_bg', 'akini_s2_day_bg', 'day_bg'];
  function pickKeys(keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = pickImg(keys[i]);
      if (v && v.length > 10) return v;
    }
    return '';
  }
  /* 逐个从 IndexedDB 里按顺序找，找到第一个就回调（同步读全部落空时才走这里） */
  function pickKeysIdb(keys, cb) {
    var i = 0;
    function next() {
      if (i >= keys.length) return cb('');
      var k = keys[i++];
      try {
        if (window._idbStore && window._idbStore.get) {
          window._idbStore.get(k, function (v) {
            if (v && String(v).length > 10) { cb(String(v)); return; }
            next();
          });
          return;
        }
      } catch (e) {}
      next();
    }
    next();
  }

  /* 补齐首页/照片墙/头像等所有可自定义图片位的恢复：
     原实现只恢复 home_bg + s1_avatar + 左右头像，其余图片位在配额满时只存在于 IDB，
     刷新后会一直显示默认图（看起来像"数据消失"）。 */
  function restoreMiscSlots() {
    try {
      /* 首页顶部卡片封面（用户导入的图最容易"刷新后消失"，优先同步，落空再走 IDB） */
      var cover = pickKeys(COVER_KEYS);
      if (cover) applyCoverArea(cover);
      else pickKeysIdb(COVER_KEYS, applyCoverArea);
      var day = pickKeys(DAY_KEYS);
      if (day) applyBgArea(day);
      else pickKeysIdb(DAY_KEYS, applyBgArea);
      var photo = pickImg('akini_s1_photo');
      var elPhoto = document.getElementById('s1PolaroidImg');
      applyPolaroid(photo, elPhoto);
      if (!photo && elPhoto) {
        pickKeysIdb(['akini_s1_photo'], function (v) {
          applyPolaroid(v, elPhoto);
        });
      }
      var avL = pickImg('akini_avatar_left') || pickImg('akini_s2_avatar_left') || pickImg('akini_my_avatar') || pickImg('akini_s1_avatar');
      if (avL) __akiniApplyAvatar('avatarLeft', avL);
      var avR = pickImg('akini_avatar_right') || pickImg('akini_s2_avatar_right') || pickImg('akini_ta_avatar');
      if (avR) __akiniApplyAvatar('avatarRight', avR);
      /* 中间大头像是 div（s1AvatarCircle），换图后内部 img 不再带 id，必须作用在容器上 */
      var s1Av = pickImg('akini_s1_avatar') || pickImg('akini_my_avatar');
      if (s1Av) __akiniApplyAvatar('s1AvatarCircle', s1Av);
    } catch(e) {}
    /* 聊天/音乐/icity 等背景由 core 的 applyBg 统一处理，这里在数据恢复后再触发一次 */
    try { if (typeof applyBg === 'function') applyBg(); } catch(e) {}
    /* 自定义文字：配额恢复后重新渲染，避免刷新后只剩默认文案 */
    try { if (window.__akiniRenderUserText) window.__akiniRenderUserText(); } catch(e) {}
    /* 头像互换的内联定位在重渲染后需要重新应用 */
    try { if (window.__akiniApplyAvatarSwap) window.__akiniApplyAvatarSwap(); } catch(e) {}
  }

  function restoreAllImagesAndConfig() {
    try {
      var homeBg = pickImg('akini_home_bg') || pickImg('home_bg');
      applyHomeBg(homeBg);
      restoreHomeBgAsync();
    } catch(e) {}
    restoreMiscSlots();
  }

  function scheduleRestore() {
    if (window.__akiniRestoreScheduled) return;
    window.__akiniRestoreScheduled = true;
    var run = function(){ window.__akiniRestoreScheduled = false; restoreAllImagesAndConfig(); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      requestAnimationFrame(run);
    }
  }
  scheduleRestore();
  window.addEventListener('load', restoreAllImagesAndConfig);
  /* 图片键从 IndexedDB 回填完成后（可能晚于首屏），再补一次壁纸/头像恢复 */
  window.addEventListener('akini-img-ready', function(){ try { restoreAllImagesAndConfig(); } catch(e) {} });
  /* 存储层对账完成后再补一轮（IDB → LS 回填发生在首屏之后，晚到的数据必须重新上屏） */
  window.addEventListener('akini-storage-restored', function(){ try { restoreAllImagesAndConfig(); } catch(e) {} });
  [600, 1800, 4000, 8000].forEach(function(ms){ setTimeout(function(){ try { restoreAllImagesAndConfig(); } catch(e) {} }, ms); });
  /* 从后台切回前台时再补一轮：系统可能在此期间清掉/延迟写入图片，
     或者 iOS 已把页面重载——重新上屏一次，避免"要再进一次才显示"。 */
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) return;
    setTimeout(function(){ try { restoreAllImagesAndConfig(); } catch(e) {} }, 300);
  });

  /* core 的 ct("akini_home_bg") 会在启动后异步再写一次 background-image，
     而且不带 !important，会把上面恢复的壁纸覆盖成不生效的内联声明。
     这里在启动期补几次，只在内联优先级丢失时重设。 */
  function reapplyHomeBg() {
    try {
      var v = localStorage.getItem('akini_home_bg') || localStorage.getItem('home_bg');
      if (!v || v.length <= 10) return;
      var pf = document.getElementById('phoneFrame');
      if (!pf) return;
      if (pf.style.getPropertyPriority('background-image') === 'important') return;
      applyHomeBg(v);
    } catch(e) {}
  }
  [300, 800, 1600, 3200].forEach(function(ms){ setTimeout(reapplyHomeBg, ms); });

  /* 拍立得同样会被其它脚本的普通内联赋值降级（important 标记被清掉），
     启动期多轮补几次：只在优先级丢失时重设，已带 important 的直接跳过。 */
  function reapplyPolaroid() {
    try {
      var el = document.getElementById('s1PolaroidImg');
      if (!el) return;
      if (el.style.getPropertyPriority('background-image') === 'important') return;
      var v = pickImg('akini_s1_photo') || pickImg('akini_s1_polaroid_img');
      if (v) applyPolaroid(v, el);
    } catch(e) {}
  }
  [300, 800, 1600, 3200, 6000].forEach(function(ms){ setTimeout(reapplyPolaroid, ms); });
  window.addEventListener('akini-storage-restored', reapplyPolaroid);

  /* 启动早期若 localStorage 里的联系人/会话被读成空值，core 会补建默认联系人「对方」，
     akiniContacts 的内存缓存 d/u/v 也会把这份"临时数据"固化下来 —— 之后 IDB 对账
     把真实数据写回 LS，界面却仍用旧缓存渲染，表现为"联系人名字被重置"。
     对账完成后清掉缓存并重渲染聊天列表、聊天标题栏与聊天背景。 */
  function refreshContactsAndChat() {
    try { if (window.akiniContacts && window.akiniContacts.resetCache) window.akiniContacts.resetCache(); } catch(e) {}
    try { if (typeof window.renderChatList === 'function') window.renderChatList(); } catch(e) {}
    try { if (typeof window.refreshChatHeader === 'function') window.refreshChatHeader(); } catch(e) {}
    try { if (typeof window.applyChatBackground === 'function') window.applyChatBackground(); } catch(e) {}
    try { if (typeof window.updateChatPreview === 'function') window.updateChatPreview(); } catch(e) {}
  }
  ['akini-storage-restored', 'akini-img-ready'].forEach(function(evt){ window.addEventListener(evt, refreshContactsAndChat); });
  [1200, 3000].forEach(function(ms){ setTimeout(refreshContactsAndChat, ms); });

  /* 清除壁纸：localStorage.removeItem 被全局拦截器挡住，这里用白名单标记真正删除，
     同时清掉 CSS 变量与 IndexedDB 镜像，避免刷新后壁纸"复活"。 */
  document.addEventListener('click', function(e) {
    var t = e.target;
    var btn = t && t.closest ? t.closest('#clearHomeBgBtn') : null;
    if (!btn) return;
    try { document.documentElement.style.removeProperty('--akini-home-bg'); } catch(e1) {}
    try {
      window._akiniAllowRemove = true;
      localStorage.removeItem('akini_home_bg');
      localStorage.removeItem('home_bg');
      /* 快照/备份键同样带 akini_ 前缀，必须在白名单窗口内删除 */
      localStorage.removeItem('snap_akini_home_bg');
      localStorage.removeItem('snap2_akini_home_bg');
      localStorage.removeItem('akini_home_bg_ok');
      window._akiniAllowRemove = false;
    } catch(e2) { window._akiniAllowRemove = false; }
    try { if (window.__akiniImgCache) delete window.__akiniImgCache['akini_home_bg']; } catch(e3) {}
    try { if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet('akini_home_bg', ''); } catch(e3b) {}
    try { if (window.localforage && localforage.removeItem) localforage.removeItem('akini_home_bg').catch(function(){}); } catch(e3c) {}
    try {
      if (window._idbStore && window._idbStore.remove) {
        window._idbStore.remove('akini_home_bg');
        window._idbStore.remove('snap_akini_home_bg');
        window._idbStore.remove('snap2_akini_home_bg');
      }
    } catch(e4) {}
    try {
      var pf = document.getElementById('phoneFrame');
      if (pf) { pf.style.setProperty('background-image', 'none', 'important'); pf.classList.remove('has-custom-bg'); }
    } catch(e5) {}
  }, true);
})();

;
/* ===== akini-data-restore.js ===== */

(function () {
  "use strict";

  function _empty(v) { return !v || v === "null" || v === "undefined" || v === "{}" || v === "[]"; }

  function mirrorIcons() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("akini_app_icon_") !== 0) continue;
        var v = localStorage.getItem(k);
        if (v && v.length < 90000) localStorage.setItem("akini_iconvault_" + k.slice("akini_app_icon_".length), v);
      }
    } catch (e) {}
  }

  function restoreIcons() {
    try { if (window.__akiniRestoredDone) return; } catch (e0) {}
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("akini_iconvault_") !== 0) continue;
        var orig = "akini_app_icon_" + k.slice("akini_iconvault_".length);
        if (_empty(localStorage.getItem(orig))) {
          try {
            var exists = false;
            try { if (window._idbStore && window._idbStore.get) { window._idbStore.get(orig, function (v) { if (v) exists = true; }); } } catch (eP) {}
            if (!exists) { try { localStorage.setItem(orig, localStorage.getItem(k)); } catch (e) {} }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  restoreIcons();
  var __RestoreRan = false;
  function __RunRestoreUI() {
    if (__RestoreRan) return;
    __RestoreRan = true;
    try { window.__akiniRestoredDone = true; } catch (e1) {}
  }
  __RunRestoreUI();
  window.addEventListener('load', __RunRestoreUI);
  setInterval(function () { try { if (document.hidden) return; mirrorIcons(); } catch (e) {} }, 60000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { try { mirrorIcons(); } catch (e) {} }
  });

  function realPlaying() {
    try {
      var pi = document.getElementById("musicPlayIcon");
      var pa = document.getElementById("musicPauseIcon");
      if (pi && pa) {
        if (pa.style.display && pa.style.display !== "none") return true;
        if (pi.style.display && pi.style.display !== "none") return false;
      }
    } catch (e) {}
    try { return localStorage.getItem("akini_music_playing") === "1"; } catch (e) {}
    return false;
  }

  function applyMusicState() {
    try {
      var btn = document.getElementById("musicPlayerPlay");
      if (!btn) return;
      var playing = realPlaying();
      var pi = btn.querySelector(".play-icon"), pa = btn.querySelector(".pause-icon");
      if (pi) pi.style.display = playing ? "none" : "block";
      if (pa) pa.style.display = playing ? "block" : "none";
      if (playing) btn.classList.add("playing"); else btn.classList.remove("playing");
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) applyMusicState(); });
  setTimeout(applyMusicState, 1200);
  document.addEventListener("click", function (ev) {
    try {
      var el = ev.target;
      var btn = el && el.closest ? el.closest("#musicPlayerPlay, #musicPlayerPrev, #musicPlayerNext") : null;
      if (btn) { setTimeout(applyMusicState, 250); setTimeout(applyMusicState, 700); }
    } catch (e) {}
  }, true);

  /* 旧版头像占位（渐变底 + "我"/"TA" 文字的 span.ak-ph）已废弃：
     头像一律由线条人形 SVG 渲染，这里原先每 1.5 秒注入占位符的定时器属于遗留代码，已删除。 */

  (function () {
    var modal = document.getElementById("mailDetailModal");
    if (!modal) return;
    var lastShown = 0;
    function visible() {
      try { return getComputedStyle(modal).display !== "none" && modal.offsetParent !== null; }
      catch (e) { return false; }
    }
    function markAllRead() {
      try {
        var mails = JSON.parse(localStorage.getItem("akini_mail_received") || "[]");
        if (!Array.isArray(mails)) return;
        var changed = false;
        for (var i = 0; i < mails.length; i++) {
          if (!mails[i].read && !mails[i].isRead) { mails[i].read = true; mails[i].isRead = true; changed = true; }
        }
        if (changed) {
          localStorage.setItem("akini_mail_received", JSON.stringify(mails));
          try { localStorage.removeItem("akini_mail_seen_count"); } catch (e) {}
          [400, 1200].forEach(function (ms) {
            setTimeout(function () {
              try { window.__renderMail && window.__renderMail(); } catch (e) {}
              try { window.__updateHomeBadges && window.__updateHomeBadges(); } catch (e) {}
            }, ms);
          });
        }
      } catch (e) {}
    }
    var mo = new MutationObserver(function () {
      if (visible() && Date.now() - lastShown > 1200) { lastShown = Date.now(); markAllRead(); }
    });
    mo.observe(modal, { attributes: true, attributeFilter: ["style", "class"] });
  })();

  function syncSentMailStatus() {
    try {
      var raw = localStorage.getItem("akini_mail_sent");
      if (!raw) return;
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) return;
      var now = Date.now();
      var dirty = false;
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (!m) continue;
        if (m.replyTime && now >= m.replyTime && (!m.isRead || !m.repliedByTa)) {
          m.isRead = true; m.read = true; m.repliedByTa = true; dirty = true;
        } else if (!m.replyTime && m.ts && (now - m.ts >= 60000) && !m.isRead) {
          m.isRead = true; m.read = true; dirty = true;
        }
      }
      if (dirty) {
        localStorage.setItem("akini_mail_sent", JSON.stringify(list));
        if (window.akiniStore && window.akiniStore.set) window.akiniStore.set("akini_mail_sent", JSON.stringify(list));
        if (window.__renderMail) window.__renderMail();
      }
    } catch (e) {}
  }
  syncSentMailStatus();
  /* 邮件已读/已回复的判定阈值是 60 秒+，每 10 秒检查一次过于频繁；
     放宽到 30 秒，仍能在阈值到达后 30 秒内完成状态同步。 */
  setInterval(syncSentMailStatus, 30000);
})();




/* ===== 启动自救：会话表丢失 / 数据晚到时，不用重进聊天也能自动恢复 =====
   ① 会话表 akini_chat_sessions 为空但聊天记录还在 → 用记录重建会话；
   ② 已经进入聊天页但消息区是空的（历史还在，只是水合晚到）→ 自动重渲染，
      用户不需要退出再重进。 */
(function () {
  'use strict';
  if (window.__akiniSessionRepairReady) return;
  window.__akiniSessionRepairReady = true;

  function readHist(cid, cb) {
    var v = '';
    try { v = (window.akiniStore && window.akiniStore.memoryGet ? window.akiniStore.memoryGet('akini_chat_history_' + cid) : '') || ''; } catch (e) {}
    if (!v) { try { v = localStorage.getItem('akini_chat_history_' + cid) || ''; } catch (e) {} }
    if (v) { cb(v); return; }
    try {
      if (window._idbStore && window._idbStore.get) {
        window._idbStore.get('akini_chat_history_' + cid, function (iv) { cb(String(iv || '')); });
        return;
      }
    } catch (e) {}
    cb('');
  }

  function activeId() {
    try {
      var C = window.akiniContacts;
      if (!C) return '';
      if (C.getActiveChatIdStrict) return String(C.getActiveChatIdStrict() || '');
      return String(C.getActiveChatId ? (C.getActiveChatId() || '') : '');
    } catch (e) { return ''; }
  }

  /* 消息区空但历史其实在 → 直接重渲染，不要求用户重进 */
  function ensureChat() {
    try {
      var id = activeId();
      if (!id) return;
      var screen = document.getElementById('app-chat');
      if (!screen || !screen.classList.contains('show') || 'none' === screen.style.display) return;
      var body = document.getElementById('chatBody');
      if (!body) return;
      if (body.querySelectorAll('.msg-row').length) return;
      var C = window.akiniContacts;
      var sess = (C && C.getSessions ? C.getSessions() : {}) || {};
      var html = (sess[id] && sess[id].messagesHTML) || '';
      if (!html) {
        try { html = (window.akiniStore && window.akiniStore.memoryGet ? window.akiniStore.memoryGet('akini_chat_history_' + id) : '') || ''; } catch (e0) {}
      }
      if (!html || html.indexOf('msg-row') < 0) return;
      if (window.openChat) window.openChat(id, true);
    } catch (e) {}
  }

  /* 同一份问卷卡在会话里被写了两遍时，只保留第一张 */
  function dedupeSurveyRows(html) {
    if (!html || html.indexOf('survey-bubble') < 0) return null;
    try {
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      var seen = {}, changed = false;
      var rows = wrap.querySelectorAll('.msg-row');
      for (var i = 0; i < rows.length; i++) {
        /* 顺带把已存的问卷卡时间戳改回设置里的时间格式 */
        try {
          var ts = rows[i].getAttribute('data-ts');
          var tsEl = ts ? rows[i].querySelector('.msg-ts') : null;
          if (ts && tsEl && window.__akiniFmtTs) {
            var nv = window.__akiniFmtTs(parseInt(ts, 10));
            if (nv && tsEl.textContent !== nv) { tsEl.textContent = nv; changed = true; }
          }
        } catch (eTs) {}
        var b = rows[i].querySelector('.bubble.survey-bubble[data-survey-id]');
        if (!b) continue;
        var id = b.getAttribute('data-survey-id') || '';
        if (!id) continue;
        if (seen[id]) {
          if (rows[i].parentNode) { rows[i].parentNode.removeChild(rows[i]); changed = true; }
        } else seen[id] = 1;
      }
      return changed ? wrap.innerHTML : null;
    } catch (e) { return null; }
  }

  function repair() {
    try {
      var C = window.akiniContacts;
      if (!C || !C.getContacts || !C.getSessions || !C.updateSession) { ensureChat(); return; }
      if (!window.__akiniStorageRestored && !window.__akiniRestoreSettled) { ensureChat(); return; }
      var contacts = C.getContacts() || [];
      /* 默认联系人被清空时自动补回：和 syy 一样只有这一个对话框，而不是空白 */
      if (!contacts.length) {
        try {
          var nc = C.addContact ? C.addContact("对方") : null;
          if (nc && nc.id) {
            try { nc.isDefault = true; C.updateContact && C.updateContact(nc.id, { isDefault: true }); } catch (e0) {}
            contacts = C.getContacts() || [];
            try { if (window.__akiniRefreshChatListBadges) window.__akiniRefreshChatListBadges(); } catch (e1) {}
            console.log('[联系人自救] 已补回默认联系人');
          }
        } catch (e2) {}
      }
      /* 会话里重复的问卷卡清理一次（历史遗留的两张邀请卡） */
      try {
        if (!window.__akiniSurveyDupFixed && C.getSessions) {
          window.__akiniSurveyDupFixed = true;
          var sessAll = C.getSessions() || {};
          Object.keys(sessAll).forEach(function (sid) {
            var h = sessAll[sid] && sessAll[sid].messagesHTML;
            var fixed = dedupeSurveyRows(h);
            if (fixed) {
              try { C.updateSession(sid, { messagesHTML: fixed }); console.log('[问卷自救] 已清理重复的问卷卡：' + sid); } catch (e3) {}
            }
          });
        }
      } catch (e4) {}
      var sessions = C.getSessions() || {};
      if (!Object.keys(sessions).length && contacts.length) {
        var c = contacts[0];
        if (c && c.id) {
          readHist(c.id, function (h) {
            if (h && h.indexOf('msg-row') >= 0) {
              try {
                C.updateSession(c.id, { messagesHTML: h });
                console.log('[会话自救] 已从聊天记录重建会话：' + c.id);
              } catch (e) {}
            }
            ensureChat();
          });
          setTimeout(ensureChat, 50);
          return;
        }
      }
      ensureChat();
    } catch (e) {}
  }

  /* 单一触发入口：原来 3 个事件 + 4 个定时器共 7 条链各自调用 repair，
     互相覆盖还会在后台重复重绘。现在统一走一个去抖调度，只跑一次。 */
  var _repairTimer = 0;
  function scheduleRepair(delay) {
    if (document.hidden) return;
    if (_repairTimer) return;
    _repairTimer = setTimeout(function () {
      _repairTimer = 0;
      if (document.hidden) return;
      repair();
    }, delay > 0 ? delay : 0);
  }
  window.addEventListener('akini-storage-restored', function () { scheduleRepair(600); });
  window.addEventListener('akini-img-ready', function () { scheduleRepair(600); });
  window.addEventListener('pageshow', function () { scheduleRepair(300); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleRepair(300); });
  setTimeout(function () { scheduleRepair(0); }, 3000);
})();
