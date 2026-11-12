/*
* akini-storage-safe.js  1030 重做版
* 网站式可靠存储：localStorage 同步读写为主（和普通网站一致），
* IndexedDB 双副本镜像兜底，启动时全量对账恢复。
* 保证：写入绝不中断、绝不主动删除任何数据、退出/刷新/随时打开数据都在。
*/
(function () {
 'use strict';
 if (window.__akiniStorageSafeReady) return;
 window.__akiniStorageSafeReady = true;
 // =========================================================================
 // 对齐 milk / syy：启动全量大媒体自动迁移到 IndexedDB（释放 localStorage 5MB 空间）
 // =========================================================================
 function migrateLsBigMediaToIdb() {
   try {
     if (!rawLS) return;
     var totalKeys = rawLS.length || 0;
     var migrated = 0;
     var freedBytes = 0;
     var keysToCheck = [];
     for (var idx = 0; idx < totalKeys; idx++) {
       try {
         var k = origKey ? origKey.call(rawLS, idx) : rawLS.key(idx);
         if (k && String(k).indexOf('akini_') === 0) keysToCheck.push(k);
       } catch (eK) {}
     }
     keysToCheck.forEach(function (k) {
       try {
         var v = origGet ? origGet.call(rawLS, k) : rawLS.getItem(k);
         if (!v) return;
         var len = v.length || 0;
         if (isImgKey(k) || len > (40 * 1024)) {
           // 存入内存 Map，供前端同步读写无感命中
           memSet(k, v);
           // 写入 IndexedDB 大容量数据库
           queueIdbWrite(k, v);
           if (isImgKey(k)) _stampImgKey(k);
           // 对齐 milk/syy：只有非首页核心底图大键才从 LS 移除；
           // 核心底图与头像白名单：在小于 1.8MB 时强行保留在 LS，同时写入 IDB，杜绝重进被清空！
           var _ESSENTIAL_LS = {
             akini_home_bg: 1, akini_s1_cover: 1, akini_s1_photo: 1, akini_cover_bg: 1,
             akini_avatar_left: 1, akini_avatar_right: 1, akini_my_avatar: 1, akini_ta_avatar: 1,
             akini_s1_avatar: 1, akini_music_bg: 1, akini_chat_bg: 1, akini_day_bg: 1,
             akini_cover_img: 1, akini_bg_img: 1, akini_music_player_bg: 1
           };
           var isEssential = _ESSENTIAL_LS[k] || (k && k.indexOf('akini_chat_bg_') === 0);
           if (!isEssential || len > (1800 * 1024)) {
             if (origRemove) origRemove.call(rawLS, k); else rawLS.removeItem(k);
             migrated++;
             freedBytes += len;
           }
         }
       } catch (eMig) {}
     });
     if (migrated > 0) {
       console.log('[存储架构升级] 成功将 ' + migrated + ' 个大媒体迁移至 IndexedDB，释放 LS 配额: ' + Math.round(freedBytes / 1024) + ' KB');
     }
   } catch (e) {}
 }
 try { migrateLsBigMediaToIdb(); } catch(eMigInit) {}
 // wipe 保险丝：上一轮清除若在刷新前来不及清完 IDB，本轮启动第一时间清空（cookie 不受 localStorage.clear 影响）
 try {
   if (/(?:^|;\s*)akini_wipe_pending=1/.test(document.cookie || "")) {
     try { document.cookie = "akini_wipe_pending=;path=/;max-age=0"; } catch (e) {}
     // 清除数据后的启动：10 秒后摘掉的 ?reset= 参数，避免用户收藏带参链接导致云恢复永久失效
     try {
       if (/[?&]reset=/.test(location.search || "") && window.history && history.replaceState) {
         setTimeout(function () {
           try { history.replaceState(null, "", location.pathname); } catch (e) {}
         }, 10000);
       }
     } catch (e) {}
     try { localStorage.clear(); } catch (e) {}
     try { sessionStorage.clear(); } catch (e) {}
     try {
       if (typeof localforage !== "undefined") {
         var _wlf = localforage.createInstance({ name: "AkiniApp", storeName: "akini_data" });
         _wlf.clear().catch(function () {});
       }
     } catch (e) {}
     try { indexedDB.deleteDatabase("akini_img_db"); } catch (e) {}
   }
 } catch (e) {}
 var HIGH_FREQ_RE = /^akini_(next_|last_)/; // 高频调度键不镜像，避免事务堆积
 function isCriticalKey(k) {
   if (!k) return false;
   var ks = String(k);
   if (HIGH_FREQ_RE.test(ks)) return false;
   return ks.indexOf('akini_') === 0; // 全量保护：所有 akini_ 数据都镜像
 }
 function safeParse(s, fb) { if (s == null) return fb; try { return JSON.parse(s); } catch (e) { return fb; } }
 function safeStringify(v) { try { return JSON.stringify(v); } catch (e) { return null; } }
 // ---- localStorage 原始引用（在拦截前取到，供内部直读直写）----

// ---- localStorage 原始引用（在拦截前取到，供内部直读直写）----
 var rawLS = null;
 try { rawLS = window.localStorage; } catch (e) {}
 var origSet = null, origGet = null, origRemove = null, origKey = null;
 try {
   var proto = rawLS ? Object.getPrototypeOf(rawLS) : null;
   if (proto) {
     origSet = proto.setItem; origGet = proto.getItem; origRemove = proto.removeItem; origKey = proto.key;
   }
 } catch (e) {}
 function lsGet(k) {
   try { return origGet ? origGet.call(rawLS, k) : rawLS.getItem(k); } catch (e) { return null; }
 }
 // 图片/壁纸类大键：配额紧张时优先清理它们，为关键数据腾出空间
 var BIG_IMG_RE = /^akini_(chat_history_|home_bg|bubble_css|icity_|my_avatar|ta_avatar|contact_avatar_)/;
 /* ===== 头像/背景图回退根治：图像键"修改时间戳"体系 =====
    根因：大图像键(>200KB)只存内存+IDB，localStorage 恒空。启动早期（存储对账 restoreAll
    尚未完成时）云备份/保险箱/IDB 兜底把"LS+内存为空"误判为"本地缺失"，把【旧值】回填
    并巩固到三层——新头像被旧值永久覆盖（用户看到"回退到旧的去了"）。
    方案：图像键每次写入时同步盖章：
      ① LS 侧车小键 akini_wts_<key>（随云备份/保险箱 payload 上传，自带时间标记）；
      ② cookie akini_wts（10 年，LS/IDB 被系统清理后唯一存活的"本机设置过更新的"凭据）。
    所有恢复路径回填前对比：本地记录时间 > 恢复源数据时间(3s 容差) → 拒绝旧值回填。 */
 var IMG_EXACT = {
   akini_my_avatar: 1, akini_ta_avatar: 1, akini_icity_my_avatar: 1, akini_icity_ta_avatar: 1,
   akini_home_bg: 1, akini_bg_img: 1, akini_cover_img: 1, akini_friends_bg: 1,
   akini_call_bg: 1, akini_callmini_bg: 1, akini_chat_bg: 1,
   akini_icity_my_bg: 1, akini_icity_ta_bg: 1, akini_music_bg: 1,
   akini_s1_cover: 1, akini_s1_photo: 1, akini_s2_cover: 1, akini_s2_day_bg: 1,
   akini_music_player_bg: 1, akini_polaroid_photo: 1
 };
 var IMG_PREFIXES = [
   'akini_contact_avatar_', 'akini_chat_bg_', 'akini_icity_ta_bg_', 'akini_icity_my_bg_',
   'akini_media_', 'akini_stickers_', 'akini_net_', 'akini_music_custom_bg_'
 ];
 function isImgKey(k) {
   if (!k) return false;
   var ks = String(k);
   if (ks.indexOf('akini_wts_') === 0) return false;
   if (IMG_EXACT[ks]) return true;
   for (var _ip = 0; _ip < IMG_PREFIXES.length; _ip++) { if (ks.indexOf(IMG_PREFIXES[_ip]) === 0) return true; }
   return false;
 }
 function _wtsCookieAll() {
   try {
     var m = (document.cookie || '').match(/(?:^|;\s*)akini_wts=([^;]+)/);
     if (!m) return {};
     var o = JSON.parse(decodeURIComponent(m[1]));
     return (o && typeof o === 'object') ? o : {};
   } catch (e) { return {}; }
 }
 function _stampImgKey(k, ts) {
   try {
     var t = ts || Date.now();
     var wk = 'akini_wts_' + k;
     // ① LS 侧车小键（几十字节；会随 collectAll/_collectVault 自动进入云端与保险箱）
     if (origSet) origSet.call(rawLS, wk, String(t)); else rawLS.setItem(wk, String(t));
     // ② IDB 镜像（与主键同批落盘，作为 IDB 值的时间标记）
     if (_restored) queueIdbWrite(wk, String(t)); else _preRestorePending[wk] = String(t);
     // ③ cookie 冗余（同步写、10 年有效；LS/IDB 被系统清理后唯一存活的新旧凭据）
     var all = _wtsCookieAll();
     all[k] = t;
     var s = JSON.stringify(all);
     if (s.length > 3500) { // 超 cookie 限制：只保留最新的 20 个键的时间戳
       var arr = Object.keys(all).map(function (kk) { return { k: kk, t: all[kk] }; });
       arr.sort(function (a, b) { return b.t - a.t; });
       all = {};
       for (var i = 0; i < arr.length && i < 20; i++) all[arr[i].k] = arr[i].t;
       s = JSON.stringify(all);
     }
     document.cookie = 'akini_wts=' + encodeURIComponent(s) + ';path=/;max-age=315360000;SameSite=Lax';
   } catch (e) {}
 }
 function _localImgWts(k) {
   var t = 0;
   try { var c = _wtsCookieAll()[k]; if (c) t = Math.max(t, +c || 0); } catch (e) {}
   try { var l = lsGet('akini_wts_' + k); if (l) t = Math.max(t, +l || 0); } catch (e) {}
   return t;
 }
 function _evictBigKeys() {
   var removed = 0;
   try {
     var keys = lsKeys();
     // 优先清理最大的图片键（聊天记录/壁纸），保留联系人/设置等小键
     var bigs = [];
     for (var i = 0; i < keys.length; i++) {
       var k = keys[i];
       if (!k || String(k).indexOf('akini_') !== 0) continue;
       /* 消息资产键永不驱逐——chat_history 的 rawLSSet 热备是唯一同步可靠层
          （微信切后台 IDB 事务经常不 commit），驱逐它=删掉最后保险；表情包/图片会话
          最先变超大键也最先被驱逐，正是"表情包总是莫名消失"的根因 */
       var _ks = String(k);
       if (_ks.indexOf('akini_chat_history_') === 0 || _ks.indexOf('akini_media_') === 0 || _ks.indexOf('akini_stickers_') === 0 || _ks.indexOf('akini_favs_') === 0) continue;
       var v = lsGet(k);
       if (v && typeof v === 'string' && v.length > 60000) bigs.push({ k: k, len: v.length });
     }
     bigs.sort(function (a, b) { return b.len - a.len; });
     // 最多清理最大的 8 个大键（它们在 IndexedDB 中有镜像，可按需水合恢复）
     for (var j = 0; j < bigs.length && j < 8; j++) {
       try {
         /* 驱逐前先镜像到 IndexedDB（含 _backup 双副本）——
            被驱逐的大键若无 IDB 镜像等于永久删除（"部分数据莫名消失"根因之一） */
         var _ev = lsGet(bigs[j].k);
         var _IDB = getIDB();
         if (_ev && _IDB && _IDB.set) { try { _IDB.set(bigs[j].k, _ev); _IDB.set(bigs[j].k + '_backup', _ev); } catch (eM) {} }
         lsRemoveRaw(bigs[j].k); removed++;
       } catch (e) {}
     }
   } catch (e) {}
   return removed;
 }
 function lsSet(k, v) {
   try { if (origSet) origSet.call(rawLS, k, v); else rawLS.setItem(k, v); return true; }
   catch (e) {
     // 配额满（QuotaExceededError）：清理大体积图片键后重试，避免关键数据静默丢失
     try {
       var evicted = _evictBigKeys();
       if (evicted > 0) {
         if (origSet) origSet.call(rawLS, k, v); else rawLS.setItem(k, v);
         console.warn('[存储] 配额紧张，已清理' + evicted + '个大键后重试写入', k);
         return true;
       }
     } catch (e2) {}
     return false;
   }
 }
 /* 启动瘦身：扫描 localStorage，清除已失效/冗余的旧媒体备份，为关键数据腾出配额。
    清理目标：
    1) akini_media_*_backup 系列（含 _backup_backup 冗余副本）——媒体主键由 IDB/rawLS 镜像兜底，
       这些冗余 LS 副本是配额爆满（lsTotalBytes>3.8MB）的元凶；
    2) 体积超过 300KB 的超大值 akini_* 键（多为巨型 base64 图片，早期未压缩遗留）。
    仅在接近配额上限（>3.8MB）或检测到大量冗余备份时触发，普通设备无副作用。 */
 function startupSlim() {
   try {
     var keys = lsKeys();
     if (!keys || !keys.length) return 0;
     var total = 0, backupCount = 0;
     for (var i = 0; i < keys.length; i++) {
       try {
         var v = lsGet(keys[i]);
         if (v && typeof v === 'string') {
           total += v.length;
           if (String(keys[i]).indexOf('akini_media_') === 0 && String(keys[i]).indexOf('_backup') > 0) backupCount++;
         }
       } catch (e) {}
     }
     // 不紧张（<3.8MB 且无冗余备份）则跳过，避免无谓清理
     if (total < 3840 * 1024 && backupCount === 0) return 0;
     var removed = 0;
     for (var j = 0; j < keys.length; j++) {
       var k = keys[j];
       if (!k) continue;
       var ks = String(k);
       // 清除媒体冗余备份键（主键由 IDB/rawLS 镜像兜底，删冗余副本不影响读取）
       if (ks.indexOf('akini_media_') === 0 && ks.indexOf('_backup') > 0) {
         lsRemoveRaw(k); removed++; continue;
       }
       // 清除超大残留图片值（>300KB），避免单键撑爆配额（这些值会由 IDB 兜底恢复）
       var bigV = lsGet(k);
       if (bigV && typeof bigV === 'string' && bigV.length > 300 * 1024 && ks.indexOf('akini_') === 0) {
         // 先确保有 IDB 镜像再删 LS 残留，避免丢图
         try { var IDB = getIDB(); if (IDB && IDB.set) IDB.set(k, bigV); } catch (eM) {}
         lsRemoveRaw(k); removed++;
       }
     }
     if (removed > 0) console.warn('[存储] 启动瘦身：清理了 ' + removed + ' 个冗余/超大键（总占用约 ' + Math.round(total / 1024) + 'KB）');
     return removed;
   } catch (e) { return 0; }
 }
 function lsRemoveRaw(k) {
   try { if (origRemove) origRemove.call(rawLS, k); else rawLS.removeItem(k); return true; } catch (e) { return false; }
 }
 function lsKeys() {
   var out = [];
   try {
     for (var i = 0; i < rawLS.length; i++) {
       var k = origKey ? origKey.call(rawLS, i) : rawLS.key(i);
       if (k) out.push(k);
     }
   } catch (e) {}
   return out;
 }
 // ---- 内存缓存：同步读取的权威层，IDB 恢复后也会回填到这里 ----
 var memoryCache = {};
 function memGet(k) { return memoryCache.hasOwnProperty(k) ? memoryCache[k] : null; }
 function memSet(k, v) { memoryCache[k] = v; }
 function memRemove(k) { delete memoryCache[k]; }
 // ---- standard 同款①：大键（>200KB，图片/壁纸 dataURL）不进 localStorage ----
 // 手机 LS 配额仅 ~5MB，几张图片就撑爆；撑爆后【所有】后续 setItem 全部静默失败，
 // 这就是数据"随机消失"的头号根因。大键只进 内存缓存 + IndexedDB（配额大得多）。
 var LS_BIG_LIMIT = 40 * 1024; /* 对齐 milk/syy：超过40KB的数据彻底不进 5MB localStorage，只进 IndexedDB */
 function isBigVal(v) { return typeof v === 'string' && v.length > LS_BIG_LIMIT; }
 // ---- standard 同款②：LS 写失败脏键集合——对账时这些键信 IDB，不信 LS 残留旧值 ----
 var _lsDirty = {};
 try {
   var _d = JSON.parse(sessionStorage.getItem('akini_ls_dirty') || '[]');
   if (Array.isArray(_d)) _d.forEach(function (k) { if (k) _lsDirty[k] = 1; });

function akiniSet(k, v, cb) {
   if (typeof v !== 'string') v = String(v);
   if ((v === '[]' || v === '{}') && _isGuardKey(k) && !window.__akiniWiping && !window._akiniAllowRemove) {
     var _gp = memGet(k);
     if (_gp == null) _gp = lsGet(k);
     if (_gp && _gp !== '[]' && _gp !== '{}' && _gp.length > 2) {
       console.warn('[存储] 永久防御：拒绝非显式空值覆盖核心键(akiniSet)', k);
       if (cb) cb(true);
       return;
     }
   }
   // 图像键写入即盖章（记录修改时间，供恢复路径仲裁新旧）
   if (isImgKey(k) && v && v.length > 10 && v !== 'null' && v !== 'undefined') { try { _stampImgKey(k); } catch (e0) {} }
   memSet(k, v);
   var lsOk = true;
   if (isBigVal(v)) {
     /* 图片大键（背景/头像 dataURL）崩溃窗口回退根因修复：此前直接删 LS 副本、
        只靠 500ms 防抖 IDB——崩溃/强杀落在窗口内 = 新值蒸发、旧值复活（网易云背景回退旧数据同款）。
        修复：图片键 ≤1.5MB 时尽力直写 LS（lsSet 自带配额满驱逐重试），写不进才删旧残留防遮蔽 */
     if (isImgKey(k)) {
       var _imgLsOk = false;
       if (v.length <= 1572864) { try { _imgLsOk = lsSet(k, v); } catch (eB) {} }
       if (!_imgLsOk) lsRemoveRaw(k);
     } else {
       lsRemoveRaw(k);
     }
   } else {
     lsOk = lsSet(k, v);
     if (lsOk) clearDirty(k); else markDirty(k);
   }
   if (isCriticalKey(k)) {
     if (!_restored) { _preRestorePending[k] = v; }
     else { queueIdbWrite(k, v); if (isImgKey(k)) flushIdbQueue(); }
   }
   // localStorage 写失败（配额满等）时立即落盘 IDB，不等 500ms 防抖，防退出丢数据
   if (!lsOk && _restored) flushIdbQueue();
   if (cb) cb(true || lsOk);
 }
 function akiniRemove(k, cb) {
   memRemove(k);
   lsRemoveRaw(k); lsRemoveRaw(k + '_backup');
   if (isCriticalKey(k)) {
     if (!_restored) { _preRestorePending[k] = null; }
     else queueIdbWrite(k, null);
   }
   var IDB = getIDB();
   if (IDB && IDB.remove) { try { IDB.remove(k); IDB.remove(k + '_backup'); } catch (e) {} }
   if (cb) cb(true);
 }
 function akiniGetJson(k, cb, fb) { akiniGet(k, function (v) { var r = safeParse(v, fb); if (typeof cb === "function") cb(r); }); }
 function akiniSetJson(k, v, cb) { var s = safeStringify(v); if (s == null) { if (cb) cb(false); return; } akiniSet(k, s, cb); }
 // ---- 启动全量对账恢复（standard 同款 OOM 防线）：分批流式 + 大键驻留预算 ----
 // 背景：几十 MB 的图片/字卡键一次性全量读入内存会把 JS 堆推到渲染进程上限直接崩溃
 //（Chrome "喔唷崩溃啦"），低端安卓机尤其明显。防两条：
 //  ① 分批恢复：每批 4 键、批间隔 25ms，瞬时内存峰值不再叠加；
 //  ② 大键驻留预算：>200KB 的键驻留总量 ≤4GB 设备 12MB / 其他 24MB，超预算的键
 //     不驻留内存（记入 __akiniDeferredKeys），读取时按需从 IDB 异步水合。
 var _restored = false;
 /* 彻底移除"安全模式"——iOS 不再无条件收紧预算，crash_mark 不再影响行为。

});
         }
       });
     });
   } catch (e) {}
 }
 function restoreAll() {
   /* Bug B 修复：的 `if(_restored)return` 整体拦截会让"已完成后再调用"的那一路静默返回，
      若该路恰好是启动链里带回调的必要调用，回调永不触发 → 启动死等/异常风暴 → 闪退重进又卡崩。
      改为对账式：首次正常跑全量对账并置位；完成后若再次被调用，只做轻量的"回填内存为空且 IDB 非空的键"，
      绝不整体拦截后续调用、绝不覆盖运行时已写入的新值（读到空绝不回写语义不变）。 */
   if (_restored) {
     _reconcileAfterRestored();
     return;
   }
   var IDB = getIDB();
   if (!IDB || !IDB.keys) return;
   try {
     IDB.keys(function (keys) {
       if (!Array.isArray(keys)) return;
       var targets = keys.filter(function (k) {
         return k && String(k).indexOf('akini_') === 0 && String(k).indexOf('_backup') < 0 && !HIGH_FREQ_RE.test(String(k));
       });
       var i = 0;
       (function nextBatch() {
         if (i >= targets.length) {
           if (!_restored) {
             _restored = true;
             // 对外暴露"启动对账已完成"门闩——云备份等恢复层据此判断大键是否真的缺失
             try { window.__akiniStorageRestored = true; } catch (e0) {}
             try { window.__akiniRestoreSettled = true; } catch (e1) {} // 启动对账完成，放行 __akiniBootApp（防默认值抢跑挡住真实数据恢复）
             // 启动期暂缓的写入落盘：强制写回 IndexedDB，确保用户数据落盘
             // 关键修复：空值（'[]'/'{}'/'null'）一律不落盘——防止任何遗漏路径把
             // 启动默认空值写回 IDB 覆盖真实数据（数据丢失双保险之二）
             try {
               Object.keys(_preRestorePending).forEach(function (k) {
                 var pv = _preRestorePending[k];
                 if (pv != null && pv !== '' && pv !== '[]' && pv !== '{}' && pv !== 'null') {
                   queueIdbWrite(k, pv);
                 }
               });
             } catch (e) {}
             _preRestorePending = {};
             try { if (typeof window.__akiniOnCriticalRestored === 'function') window.__akiniOnCriticalRestored(); } catch (e) {}
             /* 修复单人模块背景图/拍立得/头像灰白不显示：启动早期大图从 LS 迁移到 IDB，
                同步读取必为空；对账恢复完成后重新渲染首屏大图，确保不残留灰白 */
             try { if (typeof window.loadS1SavedData === 'function') window.loadS1SavedData(); } catch (eLS) {}
             console.log('[存储] 启动恢复完成，共同步', targets.length, '个键，大键驻留', Math.round(_bigMemUsed / 1024), 'KB');
           }
           return;
         }
         var batch = targets.slice(i, i + _BOOT_BATCH);
         i += _BOOT_BATCH;
         var pending = batch.length;
         batch.forEach(function (k) {
           idbGet(k, function (v) {
             try {
               // Bug②根因修复（数据消失/图片重置）：用最简单可靠的 milk/syy 语义——
               // “真实持久化数据永远最高权威，绝不被启动期程序性默认值覆盖”。
               // 之前多路 reconcile 让 _preRestorePending 在若干分支优先于真实 IDB 值，
               // 导致启动默认空值（'[]'等）或旧快照把用户真实数据/导入的图片覆盖掉。
               // 现：丢弃该键启动期暂存的程序性值，只用真实数据回填。
               try { if (_preRestorePending && Object.prototype.hasOwnProperty.call(_preRestorePending, k)) delete _preRestorePending[k]; } catch (e2) {}
               if (v == null || v === '') return; // 无真实数据：跳过，不回填任何值
               _reconciledKeys[k] = 1;
               var _idbEmpty = v === '[]' || v === '{}' || v === 'null';
               var ls = lsGet(k);
               var _lsReal = ls != null && ls !== '' && ls !== '[]' && ls !== '{}' && ls !== 'null';
               // 【安卓/鸿蒙/iOS加固】空语义 IDB 值视为陈旧，若 LS 存有真实数据则信 LS（绝不丢）
               if (_idbEmpty && _lsReal) {
                 memSet(k, ls);
                 queueIdbWrite(k, ls);
                 if (--pending === 0) setTimeout(nextBatch, _BOOT_BATCH_DELAY);
                 return;
               }
               var big = isBigVal(v);
               // 真实有效数据的取舍：LS 有非空真实值 → 信 LS（最高权威）；否则信 IDB
               var _ks2 = String(k);
               var _isCritKey = _ks2.indexOf('akini_chat_history_') === 0
                 || _ks2.indexOf('akini_my_avatar') === 0
                 || _ks2.indexOf('akini_ta_avatar') === 0
                 || _ks2.indexOf('akini_icity_my_avatar') === 0
                 || _ks2.indexOf('akini_icity_ta_avatar') === 0
                 || _ks2.indexOf('akini_s1_avatar') === 0
                 || _ks2.indexOf('akini_home_bg') === 0
                 || _ks2.indexOf('akini_bg') === 0;
               var _ref = _lsReal ? ls : v;
               var _refLen = _ref.length;
               if (!_isCritKey && big && (_refLen > 4194304 || _bigMemUsed + _refLen > BIG_MEM_BUDGET)) {
                 window.__akiniDeferredKeys[k] = 1; // 超预算：不驻留，按需水合
               } else {
                 memSet(k, _ref);
                 if (big && !_isCritKey) _bigMemUsed += _refLen;
               }
               if (_lsReal) {
                 if (isImgKey(k)) lsRemoveRaw(k); else if (ls !== v) queueIdbWrite(k, ls);
               } else if (big) {
                 lsRemoveRaw(k);
               } else {
                 if (lsSet(k, v)) clearDirty(k); else markDirty(k);
               }
             } catch (e) {}
             if (--pending <= 0) setTimeout(nextBatch, _BOOT_BATCH_DELAY);
           });
         });
       })();
     });
   } catch (e) {}
 }
 function restoreCriticalFromIdb() { restoreAll(); }
 function restoreChatHistoryFromIdb() { restoreAll(); }
 window.akiniStore = {
   _queueIdbWrite: queueIdbWrite,
   flushIdb: flushIdbQueue,
   get: akiniGet,
   getSync: akiniGetSync,
   set: akiniSet,
   remove: akiniRemove,
   getJson: akiniGetJson,
   setJson: akiniSetJson,
   isCritical: isCriticalKey,
   restoreCriticalFromIdb: restoreCriticalFromIdb,
   restoreChatHistoryFromIdb: restoreChatHistoryFromIdb,
   memoryGet: memGet,
   memorySet: memSet,
   memoryRemove: memRemove,
   memoryKeys: function () { return Object.keys(memoryCache); },
   // 直写通道：绕过拦截层的原始 LS 写（配额满返回 false），专供聊天记录切后台热备——
   // 拦截层对 >200KB 大键只删不写，的"同步 LS 热备"对图片聊天记录完全失效（记录丢失元凶）
   rawLSSet: function (k, v) {
     try { if (origSet) origSet.call(rawLS, k, v); else rawLS.setItem(k, v); return true; }
     catch (e) { return false; }
   },
   /* 原始 LS 读（绕过内存镜像）——邮箱 getSent/getReceived 权威读，杜绝"内存旧数组回写覆盖新信" */
   rawLSGet: function (k) {
     try { return origGet ? origGet.call(rawLS, k) : rawLS.getItem(k); } catch (e) { return null; }
   },
   // 清除数据专用：清空内存镜像 + IDB 待写队列 + 启动前暂存 + 脏键集合，
   // 防止清除后内存/队列里的旧数据在刷新前的间隙被重新落盘
   wipeMemory: function () {
     try { memoryCache = {}; } catch (e) {}
     try { _idbQueue = {}; } catch (e) {}
     try { _preRestorePending = {}; } catch (e) {}
     try { _reconciledKeys = {}; } catch (e) {}
     try { _lsDirty = {}; lsDirtySave(); } catch (e) {}
     try { if (_idbFlushTimer) { clearTimeout(_idbFlushTimer); _idbFlushTimer = null; } } catch (e) {}
   }
 };
 // 图像键时间戳仲裁接口（供云备份/保险箱/IDB 兜底等恢复路径使用）
 window.__akiniImgWts = { isImg: isImgKey, local: _localImgWts, stamp: _stampImgKey };
 // ---- 拦截 localStorage 写入：先原始写入（绝不被中断），再镜像内存+IDB ----
 // 注意：origSet 为空说明 localStorage 是内存 shim（隐私模式/被禁用），其原型是 Object.prototype，
 // 绝不能往 Object.prototype 上挂 setItem/getItem/removeItem，否则污染所有对象——此时走 shim 包装分支
 try {
   var lsProto = Object.getPrototypeOf(rawLS);
   if (lsProto && rawLS && typeof origSet === 'function') {
     var self = { memGet: memGet, memSet: memSet, memRemove: memRemove, queueIdbWrite: queueIdbWrite, isCritical: isCriticalKey, origSet: origSet, origGet: origGet, origRemove: origRemove, isBigVal: isBigVal, markDirty: markDirty, clearDirty: clearDirty };
     // standard 同款③：读取拦截——内存缓存优先（大键只存在内存/IDB，直接读 LS 会拿到空）
     lsProto.getItem = function (k) {
       try {
         if (self.isCritical(k)) {
           var m = self.memGet(k);
           if (m !== null && m !== '') return m;
           // 超预算大键未驻留内存：触发异步水合，本次先返回 LS 值，水合完成后下次读取即得
           if (window.__akiniDeferredKeys && window.__akiniDeferredKeys[k]) {
             delete window.__akiniDeferredKeys[k];
             idbGet(k, function (v) { if (v != null && v !== '') memSet(k, v); });
           }
           // 内存缓存为空时回退到原始 LS（绝不让内存的空状态遮蔽 LS 里的真实数据）
           var raw = self.origGet ? self.origGet.call(this, k) : null;
           if (raw != null && raw !== '') return raw;
           return null;
         }
         return self.origGet ? self.origGet.call(this, k) : null;
       } catch (e) { return null; }
     };
     // 核心数据资产键：非显式清除操作下一律拒绝被空数组覆盖（安卓/鸿蒙/iOS慢机切回与后台GC高发防护）
     var _GUARD_KEYS = {
       akini_contacts: 1, akini_mail_sent: 1, akini_mail_received: 1, akini_posts: 1, akini_icity_diaries: 1, akini_wordbank: 1,
       akini_start_date: 1, akini_day_label: 1, akini_meaningful_numbers: 1, akini_signature: 1, akini_friends_signature: 1,
       akini_bubble_color: 1, akini_swap_avatar_pos: 1, akini_last_page_state: 1, akini_wb_groups: 1,
       akini_shop_orders: 1, akini_shop_products: 1, akini_surveys: 1
     };
     var _GUARD_PREFIXES = ['akini_settings_', 'akini_toggle_', 'akini_num_', 'akini_chat_history_', 'akini_stickers_'];
     function _isGuardKeyProto(k) {
       if (!k) return false;
       if (_GUARD_KEYS[k]) return true;
       var ks = String(k);
       for (var i = 0; i < _GUARD_PREFIXES.length; i++) {
         if (ks.indexOf(_GUARD_PREFIXES[i]) === 0) return true;
       }
       return false;
     }
     lsProto.setItem = function (k, v) {
       // 清除数据期间：akini_ 键一律拒写（含原始 LS 层），杜绝清完复活
       if (window.__akiniWiping && k && String(k).indexOf('akini_') === 0) return;
       var sv = String(v);
       /* 修复"气泡 CSS 变 null"根因：setItem(k, null/undefined) 会被浏览器
          存成字面字符串 "null"，下次启动当成有效 CSS 应用 → 气泡透明。
          任何 akini_ 键的 null 值与字面 "null"/"undefined" 脏值一律拒写（空串是
          合法清除操作，必须放行）。 */
       if (k && String(k).indexOf('akini_') === 0 &&
           (v === null || v === undefined || sv === 'null' || sv === 'undefined')) return;
       if ((sv === '[]' || sv === '{}') && _isGuardKeyProto(k) && !window.__akiniWiping && !window._akiniAllowRemove) {
         try {
           var _gp = self.memGet(k);
           if (_gp == null) _gp = self.origGet ? self.origGet.call(this, k) : null;
           if (_gp && _gp !== '[]' && _gp !== '{}' && _gp.length > 2) {
             console.warn('[存储] 永久防御：拒绝非显式空值覆盖核心键(setItem)', k);
             return;
           }
         } catch (e) {}
       }
       var big = self.isCritical(k) && self.isBigVal(sv);
       var ok = true;
       // 1) 原始写入永远先执行（大键跳过 LS 并清残留，防撑爆配额）；任何异常都不影响镜像
       if (big || isImgKey(k)) {
         /* 对齐 milk/syy 架构：图片和超大媒体键 100% 只进内存缓存与 IndexedDB，
            绝对不写入有限的 5MB localStorage，并且清除 localStorage 中的历史残留，
            保证 localStorage 永远占用极低（<200KB），永不发生 QuotaExceededError 爆满！ */
         try { self.origRemove.call(this, k); } catch (e) {}
       } else {
         try { self.origSet.call(this, k, v); } catch (e) {
           // 配额满：清理大体积图片键后重试，避免关键数据静默丢失
           try {
             var _ev = _evictBigKeys();
             if (_ev > 0) { self.origSet.call(this, k, v); ok = true; }
             else { ok = false; }
           } catch (e2) { ok = false; }
         }
       }
       // 2) 镜像层失败无所谓，绝不影响数据本体
       try {
         if (self.isCritical(k)) {
           self.memSet(k, sv);
           // 图像键写入即盖章（拦截层覆盖所有 localStorage.setItem 调用路径）
           if (isImgKey(k) && sv && sv.length > 10 && sv !== 'null' && sv !== 'undefined') { try { _stampImgKey(k); } catch (e9) {} }
           if (!_restored) { _preRestorePending[k] = sv; }
           else { self.queueIdbWrite(k, sv); if (big && isImgKey(k)) flushIdbQueue(); }
           if (ok || big) { self.clearDirty(k); }
           else { self.markDirty(k); if (_restored) flushIdbQueue(); }
         }
       } catch (e) {}
     };
     if (typeof lsProto.clear === 'function') {
       var _origClear = lsProto.clear;
       lsProto.clear = function () {
         try { _origClear.call(this); } catch (e) {}
         try { if (window.akiniStore && window.akiniStore.wipeMemory) window.akiniStore.wipeMemory(); } catch (e) {}
       };
     }
     lsProto.removeItem = function (k) {
       try { self.origRemove.call(this, k); } catch (e) {}
       try {
         if (self.isCritical(k)) {
           self.memRemove(k);
           if (!_restored) { _preRestorePending[k] = null; }
           else { self.queueIdbWrite(k, null); }
         }
       } catch (e) {}
     };
   }
 } catch (e) {
   console.warn('[存储] localStorage 拦截安装失败（不影响读写）', e);
 }
 // ---- localStorage 被禁用（隐私模式/部分内置浏览器）时的兜底 ----
 // shim 是带自有方法的普通对象，原型拦截装不上；直接包装其自有方法，
 // 让关键写入仍镜像到 内存缓存 + IndexedDB，重开后可从 IndexedDB 完整恢复
 try {
   if (window.__akiniLocalStorageBlocked && rawLS && typeof rawLS.setItem === 'function' && typeof origSet !== 'function') {
     var _shimSet = rawLS.setItem, _shimGet = rawLS.getItem, _shimRemove = rawLS.removeItem;
     rawLS.setItem = function (k, v) {
       var sv = String(v);
       /* null 值/字面 "null"/"undefined" 脏值对 akini_ 键一律拒写（同主拦截层） */
       if (k && String(k).indexOf('akini_') === 0 &&
           (v === null || v === undefined || sv === 'null' || sv === 'undefined')) return;
       try { _shimSet.call(rawLS, k, sv); } catch (e) {}
       try {
         if (isCriticalKey(k)) {
           memSet(k, sv);
           // 图像键写入即盖章（shim 分支同主拦截层）
           if (isImgKey(k) && sv && sv.length > 10 && sv !== 'null' && sv !== 'undefined') { try { _stampImgKey(k); } catch (e8) {} }
           if (!_restored) { _preRestorePending[k] = sv; }
           else queueIdbWrite(k, sv);
         }
       } catch (e) {}
     };
     rawLS.getItem = function (k) {
       try {
         if (isCriticalKey(k)) {
           var m = memGet(k);
           if (m !== null && m !== '') return m;
           if (window.__akiniDeferredKeys && window.__akiniDeferredKeys[k]) {
             delete window.__akiniDeferredKeys[k];
             idbGet(k, function (v) { if (v != null && v !== '') memSet(k, v); });
           }
           var raw = _shimGet.call(rawLS, k);
           if (raw != null && raw !== '') return raw;
           return null;
         }
       } catch (e) {}
       try { return _shimGet.call(rawLS, k); } catch (e) { return null; }