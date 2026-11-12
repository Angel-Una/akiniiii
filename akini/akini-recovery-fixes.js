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
   var start = {}, lastTap = {};
   /* v823 严令禁点：任何头像（avatarLeft/avatarRight/s1AvatarCircle等）绝对禁止触发选图。
      仅允许纯背景底图模块触发更换背景图；头像点击一律静默拦截，绝不弹选图、绝不误触底图选图。 */
   var BG_SEL = "#coverAreaMain, #bgArea, #s1CoverBg, #s1PolaroidImg, #dualAvatarWrap";
   var AV_SEL = "#avatarLeft, #avatarRight, #s1AvatarCircle";
   function hostOf(el, sel) { return el && el.closest ? el.closest(sel) : null; }
   /* v1244 根治底图点击不生效：#coverAreaMain/#dualAvatarWrap/#bgArea 因父级
      #screen2/#topCard 的 pointer-events:none 而无法接收点击事件。
      显式将底图模块设为 pointer-events:auto，让用户点击能命中这些元素。
      头像子元素(AV_SEL)仍由上方头像拦截逻辑静默吞掉，不误触底图选图。 */
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
   /* v823 根治“换过一次或重进后无法再点击更换”：选图 input 独立挂载在 document.body，
      无论 coverAreaMain 被任何 textContent="" / innerHTML="" 清空，input 永存不失。
      每次点击底图时先校验存在，若被清掉则自动重建。 */
   function ensureUniversalCoverInput() {
     var inp = document.getElementById('s2CoverInputDirect');
     if (!inp || !document.body.contains(inp)) {
       if (inp && inp.parentNode) inp.parentNode.removeChild(inp);
       inp = document.createElement('input');
       inp.type = 'file';
       inp.accept = 'image/*';
       inp.id = 's2CoverInputDirect';
       inp.className = 'akini-hidden-input';
       inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.01;width:1px;height:1px;pointer-events:none;';
       inp.onchange = function(e) { if (window.handleS2CoverDirect) window.handleS2CoverDirect(e); };
       document.body.appendChild(inp);
     }
     return inp;
   }
   function ensureUniversalDayInput() {
     var inp = document.getElementById('s2DayBgInputDirect');
     if (!inp || !document.body.contains(inp)) {
       if (inp && inp.parentNode) inp.parentNode.removeChild(inp);
       inp = document.createElement('input');
       inp.type = 'file';
       inp.accept = 'image/*';
       inp.id = 's2DayBgInputDirect';
       inp.className = 'akini-hidden-input';
       inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.01;width:1px;height:1px;pointer-events:none;';
       inp.onchange = function(e) { if (window.handleS2DayBgDirect) window.handleS2DayBgDirect(e); };
       document.body.appendChild(inp);
     }
     return inp;
   }
   function ensureUniversalS1Input() {
     var inp = document.getElementById('s1CoverInputDirect');
     if (!inp || !document.body.contains(inp)) {
       if (inp && inp.parentNode) inp.parentNode.removeChild(inp);
       inp = document.createElement('input');
       inp.type = 'file';
       inp.accept = 'image/*';
       inp.id = 's1CoverInputDirect';
       inp.className = 's1-direct-input';
       inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.01;width:1px;height:1px;pointer-events:none;';
       inp.onchange = function(e) { if (window.handleS1CoverDirect) window.handleS1CoverDirect(e); };
       document.body.appendChild(inp);
     }
     return inp;
   }
   /* 拍立得照片选图 input：复用页面上已有的 #s1PhotoInputDirect，
      若被清掉则重建（onchange → handleS1PhotoDirect）。 */
   function ensureUniversalPhotoInput() {
     var inp = document.getElementById('s1PhotoInputDirect');
     if (!inp || !document.body.contains(inp)) {
       if (inp && inp.parentNode) inp.parentNode.removeChild(inp);
       inp = document.createElement('input');
       inp.type = 'file';
       inp.accept = 'image/*';
       inp.id = 's1PhotoInputDirect';
       inp.className = 'akini-hidden-input';
       inp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.01;width:1px;height:1px;pointer-events:none;';
       inp.onchange = function(e) { if (window.handleS1PhotoDirect) window.handleS1PhotoDirect(e); };
       document.body.appendChild(inp);
     }
     return inp;
   }
   document.addEventListener("touchstart", function (ev) {
     try {
       var t0 = ev.touches[0]; if (!t0) return;
       /* 头像区触碰：直接静默拦截，绝不进入任何分发 */
       if (hostOf(t0.target, AV_SEL)) { ev.__akiniAvatarTap = true; return; }
       var host = hostOf(t0.target, BG_SEL);
       if (host) start[host.id] = { x: t0.clientX, y: t0.clientY, t: Date.now() };
     } catch (e) {}
   }, true);
   document.addEventListener("touchend", function (ev) {
     try {
       /* 头像区触碰结束：一律静默吞掉，绝不触发任何选图 */
       if (ev.__akiniAvatarTap) { ev.__akiniAvatarTap = false; ev.preventDefault && ev.preventDefault(); return; }
       var t0 = ev.changedTouches && ev.changedTouches[0]; if (!t0) return;
       /* 若落在头像区域，彻底吞掉，防止穿透到 coverAreaMain */
       if (hostOf(t0.target, AV_SEL)) { ev.preventDefault && ev.preventDefault(); return; }
       var host = hostOf(t0.target, BG_SEL);
       if (!host) return;
       /* v830：落点本身是 file input（首页纪念日卡片全幅透明选图层）时直接放行，
          让浏览器原生点击打开相册——iOS/PWA 下程序化 .click() 打开文件框不可靠，
          原生点击才保真；此处绝不 preventDefault/程序化点击造成双开或全吞 */
       if (t0.target && t0.target.tagName === "INPUT" && String(t0.target.type || "").toLowerCase() === "file") { delete start[host.id]; return; }
       var s = start[host.id]; delete start[host.id];
       if (!s) return;
       if (Math.abs(t0.clientX - s.x) > 12 || Math.abs(t0.clientY - s.y) > 12 || Date.now() - s.t > 400) return;
       var now = Date.now();
       if (lastTap[host.id] && now - lastTap[host.id] < 800) return;
       lastTap[host.id] = now;
       var i = null;
       if (host.id === 'coverAreaMain' || host.id === 'dualAvatarWrap') i = ensureUniversalCoverInput();
       else if (host.id === 'bgArea') i = ensureUniversalDayInput();
       else if (host.id === 's1CoverBg') i = ensureUniversalS1Input();
       else if (host.id === 's1PolaroidImg') i = ensureUniversalPhotoInput();
       if (i) { try { i.value = ''; i.click(); } catch (e) {} }
     } catch (e) {}
   }, true);
   /* 桌面/无触摸兜底：点击头像区时一律拦截冒泡，绝不弹任何选图，也绝不让头像误触底图 */
   document.addEventListener("click", function (ev) {
     try {
       if (hostOf(ev.target, AV_SEL)) return;
       var host = hostOf(ev.target, BG_SEL);
       if (!host) return;
       /* 落点是 file input 时放行原生点击，保留系统选图行为 */
       if (ev.target && ev.target.tagName === "INPUT" && String(ev.target.type || "").toLowerCase() === "file") return;
       var lt = lastTap[host.id];
       if (lt && Date.now() - lt < 800) return;
       lastTap[host.id] = Date.now();
       var i2 = null;
       if (host.id === 'coverAreaMain' || host.id === 'dualAvatarWrap') i2 = ensureUniversalCoverInput();
       else if (host.id === 'bgArea') i2 = ensureUniversalDayInput();
       else if (host.id === 's1CoverBg') i2 = ensureUniversalS1Input();
       else if (host.id === 's1PolaroidImg') i2 = ensureUniversalPhotoInput();
       if (i2) { try { i2.value = ''; i2.click(); } catch (e) {} }
     } catch (e) {}
   }, true);
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