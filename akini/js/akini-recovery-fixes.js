/* ===== v810 五大修复引擎 =====
 1. 大退数据保险恢复：绕过 contacts 判定，核心键空缺即从 vault/IDB 快照回填；图标键逐个镜像进 vault
 2. 首页播放器真实状态同步：全屏按钮用 musicPlayIcon/musicPauseIcon 的 display 切换（无 playing class），
    旧同步逻辑读不存在的 class 永远失真——改用双信号（图标 display + akini_music_playing）权威驱动
 3. 双人头像缺失占位补全 + 封面/头像触摸直达（绕过幽灵 click 吞噬链）
 4. 图标上传保底：removeWhiteBg 异步挂死时先落原始图，成功后原逻辑再覆盖为优化图
 5. 信箱已读：详情打开即写回 read/isRead 并刷新角标（补上原设计缺失的落库链路） ===== */
(function () {
 "use strict";
 /* ---------- 1. 核心数据保险恢复引擎 ---------- */
 var CORE_KEYS = ["akini_home_bg", "akini_s1_cover", "akini_s1_photo", "akini_s1_texts",
   "akini_s1_custom_text_1", "akini_s1_custom_text_2", "akini_s1_custom_text_3",
   "akini_s1_custom_text_4", "akini_s1_custom_text_5", "akini_s1_polaroid_note",
   "akini_deleted_posts", "akini_deleted_icity", "akini_srv_cd_seen",
   "akini_signature", "akini_cover_bg", "akini_day_bg", "akini_day_label", "akini_start_date",
   "akini_my_avatar", "akini_ta_avatar", "akini_avatar_left", "akini_avatar_right",
   "akini_music_bg", "akini_bubble_color"];
 function _empty(v) { return !v || v === "null" || v === "undefined" || v === "{}" || v === "[]"; }
 function missingCore() {
   var miss = [];
   for (var i = 0; i < CORE_KEYS.length; i++) {
     var k = CORE_KEYS[i];
     if (k === "akini_music_bg" && (window.__akiniCurrentMusicBg || (window._idbStore && window._idbStore.get))) {
       // v845: 网易云背景图存在内存/IDB最新值时跳过恢复，防止旧vault覆写
       continue;
     }
     var v = null; try { v = localStorage.getItem(k); } catch (e) {}
     if (_empty(v)) miss.push(k);
   }
   return miss;
 }
 /* 图标键被 IDB/vault 备份体系排除——逐个镜像到 akini_iconvault_X（可进 vault） */
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
   /* v966：防闪退——同一轮启动只真正执行一次完整恢复，后续重复触发(300/1200/3000/8000ms)直接返回，
      避免多次全量遍历+大字符串拷贝造成主线程长任务/内存峰值导致崩溃重进 */
   try { if (window.__akiniRestoredDone) return; } catch (e0) {}
   try {
     for (var i = 0; i < localStorage.length; i++) {
       var k = localStorage.key(i);
       if (!k || k.indexOf("akini_iconvault_") !== 0) continue;
       var orig = "akini_app_icon_" + k.slice("akini_iconvault_".length);
       /* v966：vault 是旧备份，绝不许覆盖/回填任何已存在的 app_icon_ 值——
          本地已有值(无论新旧)都以本地为准，根治"启动恢复把旧图标拉回"。 */
       if (_empty(localStorage.getItem(orig))) {
         try {
           var exists = false;
           try { if(window._idbStore && window._idbStore.get){ window._idbStore.get(orig,function(v){ if(v) exists=true; }); } } catch(eP){}
           if (!exists) { try { localStorage.setItem(orig, localStorage.getItem(k)); } catch (e) {} }
         } catch (e) {}
       }
     }
   } catch (e) {}
 }
 function applyCoreUI() {
   try {
     var bg = localStorage.getItem("akini_home_bg");
     if (bg && window.applyAkiniHomeBg) window.applyAkiniHomeBg(bg);
     var texts = {};
     try { texts = JSON.parse(localStorage.getItem("akini_s1_texts") || "{}"); } catch (e) {}
     for (var i = 1; i <= 4; i++) {
       /* v898 新键优先：akini_s1_custom_text_N 是用户最近编辑的权威值，旧键 JSON 仅兜底 */
       var _n = null; try { _n = localStorage.getItem("akini_s1_custom_text_" + i); } catch (eN) {}
       var t = (_n !== null && _n !== "") ? _n : texts["line" + i];
       if (t) { var el = document.getElementById("s1Text" + i); if (el) el.textContent = t; }
     }
     var sig = localStorage.getItem("akini_signature");
     if (sig) {
       ["subtitleText", "homeSignature", "mainSignature", "desktopSignature"].forEach(function (id) {
         var e = document.getElementById(id); if (e) e.innerText = sig;
       });
     }
     if (typeof applySavedImages === "function") { try { applySavedImages(); } catch (e) {} }
   } catch (e) {}
 }
 function restoreFromVault() {
   /* v979 对齐 极简标杆 纯原生存储：彻底废弃旧保险箱覆写！ */
   return;
 }
 function restoreFromIdbSnaps() {
   /* v979 对齐 极简标杆 纯原生存储：彻底废弃 snap_ 快照覆写！ */
   return;
 }
 /* v979：废弃 vault 打包（__akiniVaultSave），mirrorIcons 保留轻量图标镜像 */
 window.__v810VaultNow = function () {
   try { mirrorIcons(); } catch (e) {}
 };
 restoreIcons();
 /* v979 对齐 极简标杆：启动恢复一次性直出——对账完成后首帧一次性应用，
    废弃 [300,1200,3000,8000] 多拍重复触发导致的逐拍闪烁与长任务。 */
 var __v966RestoreRan = false;
 function __v979RunRestoreUI() {
   if (__v966RestoreRan) return;
   __v966RestoreRan = true;
   try { window.__akiniRestoredDone = false; } catch (e0) {}
   restoreFromVault();
   restoreFromIdbSnaps();
   applyCoreUI();
   try { window.__akiniRestoredDone = true; } catch (e1) {}
 }
 __v979RunRestoreUI();
 /* 保底：若首帧时存储尚未对账完成，load 时再补一次（单次，非多拍） */
 window.addEventListener('load', __v979RunRestoreUI);
 /* v845 性能：vault 全量打包（遍历 LS+stringify+Cache put）降频 15s→60s，
    后台直接跳过，避开切后台瞬间的 IO 尖峰 */
setInterval(function () { try { if (document.hidden) return; mirrorIcons(); } catch (e) {} }, 60000);
 document.addEventListener("visibilitychange", function () {
   /* v978：切后台只做轻量图标镜像，废弃 vault 全量打包写入（闪退元凶之一） */
   if (document.visibilityState === "hidden") { try { mirrorIcons(); } catch (e) {} }
 });
 /* ---------- 2. 首页播放器真实状态同步 ---------- */
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
     /* v1114 Bug④：首页播放器删除唱片转动——只有一起听界面 #musicDiscWrap 保留旋转，首页小唱片静止 */
   } catch (e) {}
 }
 // v1229 对齐 milk/syy：改为 visibilitychange 驱动，只在切到前台时更新
 document.addEventListener('visibilitychange', function(){ if(!document.hidden) applyMusicState(); });
 setTimeout(applyMusicState, 1200);
 document.addEventListener("click", function (ev) {
   try {
     var el = ev.target;
     var btn = el && el.closest ? el.closest("#musicPlayerPlay, #musicPlayerPrev, #musicPlayerNext") : null;
     if (btn) { setTimeout(applyMusicState, 250); setTimeout(applyMusicState, 700); }
   } catch (e) {}
 }, true);
 /* ---------- 3. 双人头像占位补全 + 触摸直达 ---------- */
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
   /* v1246：图片上传（封面/拍立得/双人头像底图/纪念日底图/s1封面）的点击委托
      已统一至 akini-image-upload.js（最后加载，单一入口）。
      本块仅保留：将底图模块设为 pointer-events:auto，确保用户点击能命中元素
      （父级 #screen2/#topCard 可能为 pointer-events:none）。 */
   var BG_SEL = "#coverAreaMain, #bgArea, #s1CoverBg, #s1PolaroidImg, #dualAvatarWrap";
   function ensureBgClickable() {
     try {
       var els = document.querySelectorAll(BG_SEL);
       for (var i = 0; i < els.length; i++) {
         if (els[i] && els[i].style.pointerEvents !== 'auto') {
           els[i].style.pointerEvents = 'auto';
         }
       }
     } catch (e) {}
   }
   ensureBgClickable();
   document.addEventListener('DOMContentLoaded', ensureBgClickable);
   setInterval(ensureBgClickable, 2000);
 })();
 /* v965：移除"图标上传保底"重复 change 监听——它与 initAppIcons 主监听重复绑定到
    同一 #akiniAppIconFileInput，双写 AKINI_PENDING_VAL 导致保存值错乱。主去白底逻辑已足够。 */
 /* ---------- 5. 信箱已读闭环 ---------- */
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
   /* v811: 增强信箱已读状态实时流转——回信时间到期自动置为已读，绝不让寄出的信一直显示未读 */
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
           m.isRead = true;
           m.read = true;
           m.repliedByTa = true;
           dirty = true;
         } else if (!m.replyTime && m.ts && (now - m.ts >= 60000) && !m.isRead) {
           m.isRead = true;
           m.read = true;
           dirty = true;
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