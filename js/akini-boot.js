/* akini-boot.js —— 启动层（原 index.html 内联启动/配置脚本合并，顺序与内容不变） */

/* ---- boot block 1 ---- */

/* 每次加载都强制注销所有旧 Service Worker 并清空全部代码缓存（SW 是缓存旧版 JS 的根源）。
   与 milk/syy 一致：不保留任何资源缓存，仅保留 akini-vault-v1 数据保险箱。每次都清，
   避免「只清一次」后旧 SW 缓存残留导致一直拿到旧版本。 */
(function(){
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(r){
          try {
            var u = (r.active && r.active.scriptURL) || (r.installing && r.installing.scriptURL) || "";
            // 保留通知 SW（用于后台 showNotification），注销其它所有旧 SW
            if (u && u.indexOf("notification-sw.js") >= 0) return;
            r.unregister();
          } catch(e){}
        });
        // 注册通知 SW：它是无缓存 SW（永不缓存任何资源），仅用于后台系统通知
        return navigator.serviceWorker.register("js/notification-sw.js").catch(function(){});
      }).catch(function(){});
    }
    if ("caches" in window) {
      caches.keys().then(function(ks){
        ks.forEach(function(k){
          if (k !== "akini-vault-v1") { try { caches.delete(k); } catch(e){} }
        });
      }).catch(function(){});
    }
  } catch(e) {}
})();
/* 全局致命错误兜底：任何未捕获错误都记录下来，避免白屏无反馈 */
window.__akiniFatalErrors=[];
window.addEventListener("error",function(e){
  try{
    var msg=(e&&e.message)?e.message:String(e&&e.error||e);
    window.__akiniFatalErrors.push({msg:msg,src:e&&e.filename,line:e&&e.lineno,time:Date.now()});
  }catch(_){}
});
window.addEventListener("unhandledrejection",function(e){
  try{
    var r=e&&e.reason;
    window.__akiniFatalErrors.push({msg:(r&&r.message)?r.message:String(r),type:"promise",time:Date.now()});
  }catch(_){}
});


/* ---- boot block 2 ---- */

/* 移除了"启动 30 秒后清空全站 setInterval"的补丁。
   该补丁会把音乐状态、日历、聊天自动保存、联系人互动等定时器一并清掉，
   表现为用一会儿后功能静默失效（看起来像卡死/闪退）。
   真正的卡顿来自个别高频定时器本身，已在对应位置降低频率。 */
/* 终极老旧机型兼容 Polyfill (Android 9 / Chrome 70+ / vivo Y9s 等老内核兜底) */
(function(){
  try {
    if (typeof window !== 'undefined') {
      window.globalThis = window.globalThis || window;
      if (!Promise.allSettled) {
        Promise.allSettled = function(promises) {
          return Promise.all(Array.prototype.map.call(promises, function(p) {
            return Promise.resolve(p).then(
              function(val) { return { status: 'fulfilled', value: val }; },
              function(err) { return { status: 'rejected', reason: err }; }
            );
          }));
        };
      }
      if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(search, replacement) {
          if (search instanceof RegExp) {
            return this.replace(new RegExp(search.source, search.flags + (search.flags.indexOf('g') === -1 ? 'g' : '')), replacement);
          }
          return this.split(search).join(replacement);
        };
      }
      if (!Array.prototype.flat) {
        Array.prototype.flat = function(depth) {
          var d = depth === undefined ? 1 : Math.floor(depth);
          if (d <= 0) return this.slice();
          return Array.prototype.reduce.call(this, function(acc, val) {
            return acc.concat(Array.isArray(val) ? (d > 1 ? val.flat(d - 1) : val) : val);
          }, []);
        };
      }
      if (!Object.fromEntries) {
        Object.fromEntries = function(entries) {
          var obj = {};
          if (entries && typeof entries[Symbol.iterator] === 'function') {
            var it = entries[Symbol.iterator]();
            var step;
            while (!(step = it.next()).done) {
              var pair = step.value;
              if (pair && pair.length >= 2) obj[pair[0]] = pair[1];
            }
          }
          return obj;
        };
      }
      if (!window.queueMicrotask) {
        window.queueMicrotask = function(fn) {
          Promise.resolve().then(fn).catch(function(e) { setTimeout(function() { throw e; }, 0); });
        };
      }
    }
  } catch(e) { console.warn('[Akini Polyfill]', e); }
})();
/* 图片入库压缩：修掉"名叫 compress 但根本没压缩"的问题。
   原逻辑把手机原图（3~5MB）直接转 base64 写进 localStorage：
   ① setItem 是同步的，单次写入会卡住主线程几百毫秒 → 卡顿、掉帧；
   ② iOS Safari localStorage 上限约 5MB，写满后抛 QuotaExceeded → 头像/背景图丢失；
   ③ 几 MB 的字符串常驻内存 → WebKit Jetsam 强杀 → 闪退。
   这里在 FileReader 出口统一处理：超过 300KB 的图片缩到最长边 1080，JPEG 质量 0.75；
   PNG 透明素材继续输出 PNG，不丢透明通道；小于 300KB 的原图原样返回。 */
(function () {
  try {
    if (!window.FileReader || !window.HTMLCanvasElement) return;
    var MAX_SIDE = 1080;
    var MAX_BYTES = 300 * 1024;
    var nativeRead = FileReader.prototype.readAsDataURL;

    function emit(fr, dataUrl) {
      try { Object.defineProperty(fr, 'result', { value: dataUrl, configurable: true }); } catch (e) {}
      try { Object.defineProperty(fr, 'readyState', { value: 2, configurable: true }); } catch (e) {}
      try { fr.dispatchEvent(new ProgressEvent('load', { lengthComputable: true, loaded: dataUrl.length, total: dataUrl.length })); } catch (e) {}
      try { fr.dispatchEvent(new ProgressEvent('loadend', { lengthComputable: true, loaded: dataUrl.length, total: dataUrl.length })); } catch (e) {}
    }

    FileReader.prototype.readAsDataURL = function (blob) {
      var fr = this;
      var type = (blob && blob.type) || '';
      if (!blob || !/^image\//.test(type) || type === 'image/svg+xml' || type === 'image/gif' || !blob.size || blob.size <= MAX_BYTES) {
        return nativeRead.call(fr, blob);
      }
      var url;
      try { url = URL.createObjectURL(blob); } catch (e) { return nativeRead.call(fr, blob); }
      var img = new Image();
      var done = false;
      function release() { try { URL.revokeObjectURL(url); } catch (e) {} }
      function retryNative() { if (done) return; done = true; release(); nativeRead.call(fr, blob); }
      img.onload = function () {
        if (done) return;
        done = true;
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var scale = Math.min(1, MAX_SIDE / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = cw;
          canvas.height = ch;
          canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
          var out = canvas.toDataURL(type === 'image/png' ? 'image/png' : 'image/jpeg', 0.75);
          /* 二次压缩：极少数纹理复杂的图（截图/噪点照片）即便缩放后仍很大，
             再缩到 900px / 0.6 编码一次，避免单张图就把 localStorage 配额吃掉。 */
          try {
            if (out && type !== 'image/png' && out.length > (700 * 1024)) {
              var s2 = Math.min(1, 900 / Math.max(cw, ch));
              var c2 = document.createElement('canvas');
              c2.width = Math.max(1, Math.round(cw * s2));
              c2.height = Math.max(1, Math.round(ch * s2));
              c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
              var out2 = c2.toDataURL('image/jpeg', 0.6);
              if (out2 && out2.length > 32 && out2.length < out.length) out = out2;
            }
          } catch (e2c) {}
          release();
          if (!out || out.length < 32) { done = false; retryNative(); return; }
          emit(fr, out);
        } catch (e) {
          done = false;
          retryNative();
        }
      };
      img.onerror = retryNative;
      try { img.src = url; } catch (e) { retryNative(); }
    };
  } catch (e) {}
})();
/* localStorage 写失败兜底（iOS 隐私模式 / 配额写满 / 部分 Android WebView 存储受限）：
   写不进去时不再抛 QuotaExceeded 打断保存流程，而是把值留在内存副本里继续可读，
   并在存储层就绪后补写 IndexedDB，避免"保存报错 → 刷新后数据消失"的设备特有问题。
   注意：必须打在 Storage.prototype 上（不能覆盖 localStorage 实例方法），否则会绕过
   akini-core.js 后续对 Storage.prototype.setItem 的镜像/脏标记拦截。 */
(function () {
  try {
    if (!window.Storage || !Storage.prototype.setItem) return;
    var prevSet = Storage.prototype.setItem;
    var prevGet = Storage.prototype.getItem;
    var prevRm = Storage.prototype.removeItem;
    var prevClear = Storage.prototype.clear;
    function fb() { return window.__akiniLsFallback || (window.__akiniLsFallback = Object.create(null)); }
    function isLS(s) { try { return s === window.localStorage; } catch (e) { return false; } }
    Storage.prototype.getItem = function (k) {
      k = String(k);
      if (isLS(this)) {
        var f = window.__akiniLsFallback;
        if (f && Object.prototype.hasOwnProperty.call(f, k)) return f[k];
      }
      try { return prevGet.call(this, k); } catch (e) { return null; }
    };
    Storage.prototype.setItem = function (k, v) {
      k = String(k); v = String(v);
      try { if (isLS(this) && window.__akiniLsFallback) delete window.__akiniLsFallback[k]; } catch (e0) {}
      try {
        return prevSet.call(this, k, v);
      } catch (e) {
        if (!isLS(this)) throw e; // sessionStorage 等保持原生行为
        fb()[k] = v;
        window.__akiniLsDegraded = true;
        /* 存储层就绪后由它队列写 IDB；未就绪则等 persist 快照落盘时带上 */
        try {
          if (window.akiniStore && window.akiniStore._queueIdbWrite) window.akiniStore._queueIdbWrite(k, v);
        } catch (e2) {}
      }
    };
    Storage.prototype.removeItem = function (k) {
      k = String(k);
      try { if (isLS(this) && window.__akiniLsFallback) delete window.__akiniLsFallback[k]; } catch (e0) {}
      try { return prevRm.call(this, k); } catch (e) {}
    };
    Storage.prototype.clear = function () {
      try { if (isLS(this)) window.__akiniLsFallback = Object.create(null); } catch (e0) {}
      try { return prevClear.call(this); } catch (e) {}
    };
  } catch (e) {
    /* localStorage 整体不可访问（禁用 Cookie / 受限 WebView）：用纯内存实现顶替，
       保证所有 localStorage 读写不抛异常；真实数据由 IndexedDB 镜像与关键快照兜底。 */
    try {
      var mem = window.__akiniLsFallback || Object.create(null);
      var shim = {
        get length() { return Object.keys(mem).length; },
        key: function (i) { return Object.keys(mem)[i] || null; },
        getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        setItem: function (k, v) { mem[String(k)] = String(v); },
        removeItem: function (k) { delete mem[String(k)]; },
        clear: function () { Object.keys(mem).forEach(function (k) { delete mem[k]; }); }
      };
      window.__akiniLsFallback = mem;
      window.__akiniLsDegraded = true;
      Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return shim; } });
    } catch (e2) {}
  }
})();
/* 低内存检测：给全局做标记，后续 SW/保活/重合并均可读取 */
try{
  var _ua = navigator.userAgent || "";
  var _isOldAndroid = /Android\s*([0-9]+)/i.test(_ua) && parseInt(RegExp.$1, 10) <= 10;
  var _isLemur = /Lemur|Gecko|Firefox/i.test(_ua) && !/Chrome|Safari/i.test(_ua);
  var _isVivo = /vivo|V1945A|V19|OPPO|P[A-Z]{2}[0-9]{2}/i.test(_ua);
  window.__akiniLowMem = ((navigator.deviceMemory||8) <= 4) || ((navigator.hardwareConcurrency||8) <= 4) || (/iPad|iPhone|iPod/.test(_ua) && !(window.MSStream)) || _isOldAndroid || _isLemur || _isVivo;
  if(window.__akiniLowMem) document.documentElement.classList.add("low-mem");
  /* iOS 降级：iOS 及低内存设备一律进 ios-lite，全局关闭重 GPU 滤镜（backdrop-filter 是 iOS 内存/卡崩主要杀手） */
  var _isIOSLite = (/iPad|iPhone|iPod/.test(_ua) && !window.MSStream) || window.__akiniLowMem;
  if(_isIOSLite) document.documentElement.classList.add("ios-lite");
}catch(e){}
/* crash_mark 仅作日志面包屑保留——起 storage-safe 不再读取此标记做任何
   预算/批次收紧（对齐 极简标杆：简单直接，不过度防御）。unhandledrejection 不再标记
   （iOS webview 的 IDB/fetch 异步中断属于无害噪音，误标率 100% 反而害人）。 */
try {
  window.addEventListener('error', function (ev) {
    try {
      if (ev && ev.target && (ev.target.src || ev.target.href)) return;
      sessionStorage.setItem('akini_crash_mark', '1');
    } catch (e) {}
  }, true);
} catch (e) {}


/* ---- boot block 3 ---- */
/* 版本标记已移除：清理历史 akini_ver 版本缓存，不再写入任何版本数据 */(function(){ try { localStorage.removeItem('akini_ver'); } catch(e){} })();

/* ---- boot block 4 ---- */

/* ===== 核心键写穿透镜像（根治背景图/头像/自定义文字/头像互换等一切"回退旧数据"） =====
   根因：这些键此前只写 localStorage 主键；恢复源（vault / IDB snap_ / LS 快照）
   躺的是旧值——崩溃丢键后回填旧值，用户就看到"设置回到旧数据"。
   旧实现把 localStorage.setItem 装成实例自有属性，遮蔽了 Storage.prototype 拦截器，
   导致 Storage.prototype.setItem.call(localStorage,...) 与 localStorage.setItem(...)
   走两条路径，互换开关/自定义文字等出现"写了读不到"的设备特有故障。
   修复（对齐 极简标杆 + syy 单路径原则）：
   1. 直接包装 Storage.prototype.setItem/removeItem，不碰实例属性——所有写路径统一；
   2. 白名单键每次写同步镜像到 IDB 主键 + snap_/snap2_ → restoreAll 能直接命中；
   3. removeItem 同步删镜像 → 已删除的背景/文字不会被恢复源复活；
   4. 每次写/删登记 akini_key_mtime → 恢复侧守卫：快照比当前动作旧就绝不回填。 */
(function () {
  "use strict";
  if (!window.Storage || !Storage.prototype.setItem) return;
  var CORE = {
    akini_home_bg: 1, akini_cover_bg: 1, akini_day_bg: 1, akini_music_bg: 1,
    akini_s1_cover: 1, akini_s1_photo: 1, akini_s1_avatar: 1, akini_s1_texts: 1,
    akini_s1_polaroid_note: 1,
    akini_my_avatar: 1, akini_ta_avatar: 1, akini_avatar_left: 1, akini_avatar_right: 1,
    akini_icity_my_avatar: 1, akini_icity_ta_avatar: 1,
    akini_signature: 1, akini_bubble_color: 1, akini_day_label: 1, akini_start_date: 1,
    akini_cal_custom_center: 1, akini_swap_avatar_pos: 1,
    akini_my_name: 1, akini_ta_name: 1, akini_my_status: 1, akini_ta_status: 1,
    akini_friends_signature: 1, akini_bubble_css: 1
  };
  function isCore(k) {
    if (!k) return false;
    if (CORE[k]) return true;
    var ks = String(k);
    if (ks.indexOf("akini_s1_custom_text_") === 0) return true;
    return false;
  }
  /* 取当前原型方法（已被前面的配额兜底脚本包过一层），在其外再包一层写穿透 */
  var prevSet = Storage.prototype.setItem;
  var prevRm = Storage.prototype.removeItem;
  var _inPatch = false;
  function rawGet(k) { try { return prevGet.call(window.localStorage, k); } catch (e) { return null; } }
  var prevGet = Storage.prototype.getItem;
  function touchMtime(k) {
    try {
      var m = {};
      try { m = JSON.parse(rawGet("akini_key_mtime") || "{}") || {}; } catch (e) { m = {}; }
      m[k] = Date.now();
      _inPatch = true;
      try { prevSet.call(window.localStorage, "akini_key_mtime", JSON.stringify(m)); } finally { _inPatch = false; }
    } catch (e2) {}
  }
  function mirrorToIdb(k, v) {
    try {
      var s = String(v);
      if (window._idbStore && window._idbStore.set) {
        /* 主键：restoreAll 直接读这个；snap_/snap2_：快照/保险箱恢复源用 */
        window._idbStore.set(k, s);
        window._idbStore.set("snap_" + k, s);
        window._idbStore.set("snap2_" + k, s);
      }
    } catch (e) {}
  }
  Storage.prototype.setItem = function (k, v) {
    k = String(k); v = String(v);
    var ret = prevSet.call(this, k, v);
    if (_inPatch || !isCore(k)) return ret;
    touchMtime(k);
    mirrorToIdb(k, v);
    return ret;
  };
  Storage.prototype.removeItem = function (k) {
    k = String(k);
    var ret = prevRm.call(this, k);
    if (_inPatch || !isCore(k)) return ret;
    touchMtime(k);
    try {
      if (window._idbStore && window._idbStore.remove) {
        window._idbStore.remove(k);
        window._idbStore.remove("snap_" + k);
        window._idbStore.remove("snap2_" + k);
      }
    } catch (e) {}
    return ret;
  };
  /* 若实例属性残留（旧版写入），清掉让原型方法生效 */
  try { delete localStorage.setItem; delete localStorage.removeItem; } catch (e) {}
  function mirrorAllCore() {
    try {
      var seen = {};
      var keys = Object.keys(CORE);
      for (var i = 0; i < localStorage.length; i++) {
        var lk = localStorage.key(i);
        if (lk && isCore(lk)) keys.push(lk);
      }
      keys.forEach(function (k) {
        if (seen[k]) return; seen[k] = 1;
        try {
          var v = rawGet(k);
          if (v == null || v === "" || v === "null" || v === "undefined") return;
          mirrorToIdb(k, v);
        } catch (e) {}
      });
    } catch (e) {}
  }
  setTimeout(function () {
    if (window._idbStore && window._idbStore.set) mirrorAllCore();
  }, 800);
  window.__akiniCoreWriteThrough = { isCore: isCore, touchMtime: touchMtime, mirrorAllCore: mirrorAllCore };
})();


/* ---- boot block 5 ---- */

(function(){try{
  if(/[?&]fresh=/.test(location.search))return;
  setTimeout(function(){
    try{ if(window.akiniContacts&&window.akiniStore&&window.openChat) return; }catch(e){}
    try{ if(sessionStorage.getItem("__akiniFreshReload"))return; sessionStorage.setItem("__akiniFreshReload","1"); }catch(e){}
    var p=location.pathname+location.search;
    location.replace(p+(p.indexOf("?")>=0?"&":"?")+"fresh="+Date.now()+location.hash);
  },2600);
}catch(e){}})();


/* ---- boot block 6 ---- */

/* 崩溃防护：自动清理历史 safe-mode 状态，确保首页布局纯净顶格展示 */
(function () {
  try {
    localStorage.removeItem('akini_crash_guard');
    document.documentElement.classList.remove('akini-safe-mode', 'akini-deep-safe');
  } catch (e) {}
})();


/* ---- boot block 7 ---- */
document.addEventListener("gesturestart",function(e){e.preventDefault()});document.addEventListener("gesturechange",function(e){e.preventDefault()});document.addEventListener("gestureend",function(e){e.preventDefault()});document.addEventListener("dblclick",function(e){e.preventDefault()},{passive:false});

/* ---- boot block 8 ---- */
(function(){try{var t=window.localStorage;try{t.removeItem("__aktest__");}catch(_e0){}t.setItem("__aktest__","1");t.removeItem("__aktest__");}catch(e){var _n=e&&(e.name||"");var _c=(e&&typeof e.code==="number")?e.code:-1;var _quota=(_n==="QuotaExceededError"||_n==="NS_ERROR_DOM_STORAGE_QUOTA_REACHED"||_n==="QuotaExceeded"||_c===22||_c===1014);if(_quota){try{window.localStorage.removeItem("__aktest__");}catch(_e1){}console.warn("[Akini] localStorage 配额已满：保留原生存储，旧数据仍可读写");return;}var s={};try{Object.defineProperty(window,"localStorage",{value:{getItem:function(k){return s[k]||null;},setItem:function(k,v){s[k]=String(v);},removeItem:function(k){delete s[k];},clear:function(){s={};},key:function(i){return Object.keys(s)[i]||null;},get length(){return Object.keys(s).length;}},writable:true,configurable:true});window.__akiniLocalStorageBlocked=true;}catch(_e2){window.__akiniLocalStorageBlocked=true;}console.warn("[Akini] localStorage 不可用，已启用内存模式（数据不会持久化）");}})();

/* ---- boot block 9 ---- */
/* 启动清理：合并备份链产生的 _backup_backup... 冗余键（好友设备 5.2MB/1397 键，卡顿根因之一），只保留单个 _backup */(function(){try{var removed=0;for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&/_backup(_backup)+$/.test(k)){localStorage.removeItem(k);removed++;}}if(removed)console.log("[Akini] 清理冗余备份键:",removed);}catch(e){}})();

/* ---- boot block 10 ---- */
(function(){window.__akiniFormatDateTime=function(s){try{if(!s){return '';}var d;if(/^-?\d+/.test(String(s).trim())){d=new Date(Number(String(s).trim()));}else{d=new Date(s);}if(isNaN(d.getTime())){return '';}var now=new Date();var h=Math.floor((now-d)/3600000);if(h<1){var m=Math.floor((now-d)/60000);if(m<1){m=1;}return m+'分钟前';}if(h<24){return h+'小时前';}if(h<48){return '昨天';}var Y=d.getFullYear(),M=d.getMonth()+1,D=d.getDate();function p(n){return n<10?'0'+n:''+n;}return Y+'-'+p(M)+'-'+p(D);}catch(e){return '';}};})();

/* ---- boot block 11 ---- */
/* 网易云 API 代理（歌单导入/一起听使用） */
window.AKINI_NETEASE_PROXY = "https://api.mc666.org.cn";

/* ---- boot block 12 ---- */
/* 早期安全桩：内联 onclick 在 app.js 定义函数之前被点也不会抛 ReferenceError */
window.editS1CustomText = window.editS1CustomText || function(){};

/* ---- boot block 13 ---- */
/* 时序桩：main.js 启动渲染可能先于内联头像助手定义，先占位避免 ReferenceError 中断启动链；真正的实现紧随其后会覆盖它 */
window.__akiniAvOrLine = window.__akiniAvOrLine || function(v){var s=String(v==null?"":v).trim();return s?s:"data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f7f8fa"/><circle cx="40" cy="29" r="14" fill="none" stroke="#5a5e66" stroke-width="1.5"/><path d="M12 76c4-17 14-26 28-26s24 9 28 26" fill="none" stroke="#5a5e66" stroke-width="1.5" stroke-linecap="round"/></svg>');};