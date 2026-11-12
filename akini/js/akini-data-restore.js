
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

  window.__VaultNow = function () {
    try { mirrorIcons(); } catch (e) {}
  };

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

  function ensureAvatar(elId, keys, phText, phBg) {
    try {
      var el = document.getElementById(elId);
      if (!el || el.querySelector("img")) return;
      for (var i = 0; i < keys.length; i++) {
        var v = null; try { v = localStorage.getItem(keys[i]); } catch (e) {}
        if (v && v.indexOf("data:image") === 0) {
          var img = document.createElement("img");
          img.src = v; img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;border-radius:50%";
          el.appendChild(img); return;
        }
      }
      if (!el.querySelector("span.ak-ph")) {
        var s = document.createElement("span");
        s.className = "ak-ph";
        s.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:#fff;letter-spacing:1px;background:" + phBg;
        s.textContent = phText;
        el.appendChild(s);
      }
    } catch (e) {}
  }
  setInterval(function () {
    ensureAvatar("avatarLeft", ["akini_avatar_left", "akini_my_avatar"], "我", "linear-gradient(135deg,#7f9cf5,#9f7aea)");
    ensureAvatar("avatarRight", ["akini_ta_avatar", "akini_avatar_right"], "TA", "linear-gradient(135deg,#f6a6c1,#c084fc)");
  }, 1500);

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
  setInterval(syncSentMailStatus, 10000);
})();
