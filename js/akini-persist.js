/*
 * akini 关键数据快照（对齐 syy 的 BACKUP_V1_critical 机制）
 *
 * 背景：akini 的数据分散在 localStorage（同步读）与 IndexedDB（大容量镜像）两处，
 * 一旦其中一层被系统清理/写满/截断，就会出现“聊天记录变少、联系人变默认、图片消失”。
 *
 * 本模块做三件事：
 *   1) 快照：把全部关键键（联系人/会话/聊天记录/字卡/邮件/朋友圈/订单/设置/头像背景...）
 *      写成两份本地快照 —— localStorage 小快照（≤900KB，优先文本核心）+ IndexedDB 全量快照；
 *   2) 启动回填：脚本加载时【同步】读取 localStorage 快照，在页面渲染前就填回内存，
 *      杜绝“默认值先渲染、之后再被真实数据覆盖”的观感丢失；
 *   3) 仲裁凭据：记录删除墓碑与逐键写入时间戳，供云恢复判断“本地确实是空壳/被清空”，
 *      避免云端旧数据把用户刚删的内容又拉回来。
 *
 * 依赖：akini-storage.js 暴露的 window.akiniStore（memoryGet/memorySet/rawLSGet/_queueIdbWrite）。
 */
(function () {
  'use strict';
  if (window.__akiniPersistReady) return;
  window.__akiniPersistReady = true;

  var LS_KEY = '__akini_critical_snapshot_ls';
  var IDB_KEY = '__akini_critical_snapshot_idb';
  var LS_MAX = 400 * 1024;          // localStorage 小快照上限（syy 的 critical 也只放核心数据；写 LS 是同步的，越大越卡）
  var IDB_MAX = 8 * 1024 * 1024;     // IndexedDB 全量快照上限（图片已不进快照，8MB 足够覆盖全部文字数据）
  var CHAT_TAIL = 300;               // 单会话聊天记录最多保留最后 300 条
  var IMG_LS_MAX = 400 * 1024;       // 大于该体积的图片不进 LS 小快照（IDB 快照仍保留）

  var SKIP_RE = /^(akini_next_|akini_last_)/;
  /* 大体积动态数据：只走 IDB 原键 + 内存，不重复进周期快照 */
  var HOT_SKIP_RE = /^(akini_posts|akini_posts_backup|akini_icity_diaries|akini_mail_sent|akini_mail_received)$/;
  var SKIP_EXACT = {
    akini_ls_dirty: 1,
    akini_localstorage_snapshot: 1,
    akini_localstorage_snapshot_backup: 1,
    akini_idb_full_snapshot: 1,
    akini_dedupe_v: 1
  };
  // 视觉关键图片：优先进入 LS 小快照（但受 IMG_LS_MAX 限制）
  var PRIORITY_IMG_RE = /^(akini_(home_bg|bg_img|cover_img|s1_cover|s1_photo|s2_cover|s2_day_bg|day_bg|my_avatar|ta_avatar|icity_my_avatar|icity_ta_avatar|chat_bg|music_bg|music_player_bg|polaroid_photo|friends_bg|call_bg|callmini_bg))|(akini_contact_avatar_)|(akini_chat_bg_)/;

  function store() { return window.akiniStore || null; }
  function memGet(k) { try { var s = store(); return s && s.memoryGet ? s.memoryGet(k) : null; } catch (e) { return null; } }
  function memSet(k, v) { try { var s = store(); if (s && s.memorySet) s.memorySet(k, v); } catch (e) {} }
  function rawGet(k) {
    // LS 写满/被禁用时的内存副本优先（它才是用户刚写进去的最新值）
    try {
      var f = window.__akiniLsFallback;
      if (f && Object.prototype.hasOwnProperty.call(f, k)) return f[k];
    } catch (e0) {}
    try {
      var s = store();
      if (s && s.rawLSGet) return s.rawLSGet(k);
    } catch (e) {}
    // 存储层尚未就绪（或初始化失败）时兜底直读，避免整层快照因 akiniStore 缺失而失效
    try { return localStorage.getItem(k); } catch (e2) { return null; }
  }
  function queueIdb(k, v) { try { var s = store(); if (s && s._queueIdbWrite) s._queueIdbWrite(k, v); } catch (e) {} }
  function isImg(k) { try { return !!(window.__akiniImgWts && window.__akiniImgWts.isImg && window.__akiniImgWts.isImg(k)); } catch (e) { return false; } }
  function isReal(v) { return !(v == null || v === '' || v === '[]' || v === '{}' || v === 'null' || v === 'undefined'); }

  function isCritical(k) {
    if (!k || typeof k !== 'string') return false;
    if (k.indexOf('akini_') !== 0) return false;
    if (SKIP_RE.test(k) || SKIP_EXACT[k]) return false;
    if (k.indexOf('_backup') >= 0) return false; // 冗余副本不重复快照
    return true;
  }

  function collectKeys() {
    var out = {}, s = store();
    try { if (s && s.memoryKeys) s.memoryKeys().forEach(function (k) { if (k) out[k] = 1; }); } catch (e) {}
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k) out[k] = 1;
      }
    } catch (e2) {}
    return Object.keys(out).filter(isCritical);
  }

  function trimChat(k, v) {
    if (k.indexOf('akini_chat_history') !== 0) return v;
    if (v.length < 200 * 1024) return v;
    try {
      var a = JSON.parse(v);
      if (!Array.isArray(a) || a.length <= CHAT_TAIL) return v;
      return JSON.stringify(a.slice(-CHAT_TAIL));
    } catch (e) { return v; }
  }

  // ---- 构造快照 ----
  var _cur = null;      // 当前已知的最近快照（LS 启动快照 + 运行期更新）
  var _lastSig = '';
  function buildSnap(prev, now, recordDel) {
    var keys = collectKeys();
    var deferred = window.__akiniDeferredKeys || {};
    var d = {}, t = {};
    var del = (prev && prev.del) ? prev.del : {};
    var total = 0;
    keys.sort(function (a, b) { return priOf(a) - priOf(b); }); // 文本核心优先，聊天记录最后
    keys.forEach(function (k) {
      var v = memGet(k);
      if (typeof v !== 'string' || v === '') v = rawGet(k);
      if (typeof v !== 'string' || !isReal(v)) {
        // 超预算未驻留的大键：保留上一次快照值，绝不误判为删除
        if (deferred[k] && prev && prev.d && isReal(prev.d[k])) {
          d[k] = prev.d[k];
          t[k] = (prev.t && prev.t[k]) || now;
          return;
        }
        if (recordDel && prev && prev.d && isReal(prev.d[k])) del[k] = now; // 仅显式删除时记墓碑，避免误判阻断云恢复
        return;
      }
      var sv = trimChat(k, v);
      /* syy 对齐：critical 快照只存核心文字数据，图片一律不进快照。
         图片的权威副本本来就在 IndexedDB 原键里，再复制一份进快照，
         会让每次签名变化都重新 stringify 十几 MB 并同步写 LS —— 切后台重进必卡。 */
      if (isImg(k)) return;
      /* 带图朋友圈/iCity/邮件这类大文本，原始副本已经在 IndexedDB 里，
         再复制一份进 20s 周期快照只会让每次 stringify 多背几 MB（低端机卡顿/闪退主因）。
         超过 900KB 的直接不参与快照，交付权威副本仍由 IDB 原键承担。 */
      if (HOT_SKIP_RE.test(k) && sv.length > 900 * 1024) return;
      if (!sv || sv.length > 512 * 1024) return;
      /* 总量预算：对齐 syy 的 critical 小快照，避免多会话超大聊天记录把
         JSON.stringify 撑爆低端机内存。快照只是启动快恢复 + 墓碑仲裁的兜底，
         全量数据已由 akiniSet 逐键落 IndexedDB，这里不需要几 MB 的大快照。 */
      if (total + sv.length > 1024 * 1024) return;
      total += sv.length;
      d[k] = sv;
      t[k] = (prev && prev.d && prev.d[k] === sv && prev.t && prev.t[k]) ? prev.t[k] : now;
    });
    Object.keys(del).forEach(function (k) { if (d[k] && isReal(d[k])) delete del[k]; });
    return { v: 1, ts: now, d: d, t: t, del: del };
  }

  function priOf(k) {
    if (PRIORITY_IMG_RE.test(k)) return 2;
    if (k.indexOf('akini_chat_history') === 0) return 3;
    if (k.indexOf('akini_') === 0) return 0;
    return 4;
  }
  // localStorage 小快照：优先文本核心，其次头像/背景，最后聊天记录尾巴
  function shrinkSnap(snap) {
    var d = {}, t = (snap && snap.t) || {}, del = (snap && snap.del) || {};
    var entries = Object.keys((snap && snap.d) || {}).map(function (k) { return { k: k, v: snap.d[k] }; });
    entries.sort(function (a, b) { return priOf(a.k) - priOf(b.k) || a.v.length - b.v.length; });
    var total = 0;
    entries.forEach(function (e) {
      var v = e.v;
      if (!isReal(v)) return;
      if (priOf(e.k) === 2 && v.length > IMG_LS_MAX) return;
      if (total + v.length > LS_MAX) return;
      d[e.k] = v;
      total += v.length;
    });
    return { v: 1, ts: (snap && snap.ts) || Date.now(), d: d, t: t, del: del };
  }

  function persistSnap(snap) {
    var body = JSON.stringify(snap);
    var small = snap, sBody = body;
    if (sBody.length > LS_MAX) { small = shrinkSnap(snap); sBody = JSON.stringify(small); }
    try { localStorage.setItem(LS_KEY, sBody); } catch (e1) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(shrinkSnap(small))); } catch (e2) {}
    }
    // IDB 全量快照（超过上限时退化为小快照）
    try {
      var IDB = window._idbStore;
      if (IDB && IDB.set) {
        var full = body.length <= IDB_MAX ? body : JSON.stringify(shrinkSnap(snap));
        IDB.set(IDB_KEY, full);
      }
    } catch (e3) {}
  }

  function sigOf() {
    var keys = collectKeys();
    var total = 0, sig = keys.length + ':';
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = memGet(k);
      if (typeof v !== 'string' || v === '') v = rawGet(k);
      total += (typeof v === 'string') ? v.length : 0;
      sig += k.length + ',';
    }
    return sig + '#' + total;
  }

  function takeSnapshot(force, sig) {
    if (!store()) return;
    if (window.__akiniWiping) return;
    if (!force && !window.__akiniRestoreSettled) return; // 启动对账完成前不写快照，防止用默认值覆盖
    try {
      var now = Date.now();
      var snap = buildSnap(_cur, now, !!force);
      _cur = snap;
      persistSnap(snap);
      _lastSig = (typeof sig === 'string') ? sig : sigOf();
      try { window.__akiniSnapAt = now; } catch (e0) {}
    } catch (e) {}
  }

  function checkSnapshot(force) {
    if (window.__akiniWiping) return;
    if (!force && !window.__akiniRestoreSettled) return;
    var sig = sigOf();
    if (!force && sig === _lastSig) return;
    takeSnapshot(force, sig);
  }

  // ---- 回填：只补“缺失/空壳”的键，绝不覆盖用户已有真实数据 ----
  var DEFAULT_VALS = {
    akini_my_name: ['我', ''], akini_ta_name: ['梦角', '对方', 'TA', ''],
    akini_my_status: ['在线', ''], akini_ta_status: ['在线', ''],
    akini_signature: [''], akini_friends_signature: ['']
  };
  /* 启动默认值/空壳：只有默认联系人、空数组、默认名字等 —— 都应被快照里的真实数据替换 */
  function isShellVal(k, v) {
    if (!isReal(v)) return true;
    var s = String(v);
    if (s === '[]' || s === '{}') return true;
    if (DEFAULT_VALS[k] && DEFAULT_VALS[k].indexOf(s) >= 0) return true;
    try {
      if (k === 'akini_contacts') {
        var a = JSON.parse(s);
        if (!Array.isArray(a) || !a.length) return true;
        var real = a.filter(function (c) { return c && !c.isDefault && c.id !== 'ta_default' && String(c.name || '') !== '对方'; });
        return !real.length;
      }
      if (k === 'akini_groups' || k === 'akini_sessions' || k === 'akini_chat_sessions' || k === 'akini_chat_pins' || k === 'akini_home_avatars') {
        var o = JSON.parse(s);
        if (Array.isArray(o)) return !o.length;
        return !o || !Object.keys(o).length;
      }
      if (k.indexOf('akini_chat_history') === 0) {
        var msgs = JSON.parse(s);
        return !Array.isArray(msgs) || !msgs.length;
      }
    } catch (e) {}
    return false;
  }

  function fill(k, v) {
    memSet(k, v);
    /* 对齐 syy：localStorage 只当小体积同步缓存，大文本/图片的权威副本在 IndexedDB。
       之前无条件回写 LS，带图动态/图片一回填就把 5MB 配额吃满，
       后续名字/联系人/设置全部写不进去 —— 表现为“数据莫名其妙少了好多”。 */
    if (k.indexOf('akini_chat_history') !== 0 && !isImg(k) && v.length <= 900 * 1024) {
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    queueIdb(k, v);
  }

  function applySnap(snap, why) {
    if (!snap || !snap.d) return 0;
    var filled = 0;
    Object.keys(snap.d).forEach(function (k) {
      var sv = snap.d[k];
      if (k.indexOf('akini_') !== 0 || !isReal(sv)) return;
      var cur = memGet(k);
      if (typeof cur !== 'string' || cur === '') cur = rawGet(k);
      var need = false;
      if (!isReal(cur)) {
        need = true;
      } else if (k.indexOf('akini_chat_history') === 0) {
        // 聊天记录：只有快照更完整时才回填（LS 侧常只是被截断的尾部）
        var cn = -1, ln = -1;
        try { cn = JSON.parse(sv).length; } catch (e1) {}
        try { ln = JSON.parse(cur).length; } catch (e2) {}
        if (cn > 0 && cn > ln) need = true;
        else if (cn < 0 && ln < 0 && sv.length > cur.length) need = true;
      } else if (isImg(k)) {
        need = false; // 图片已有值就尊重本地（时间戳仲裁由云恢复负责）
      } else {
        // 本地只是启动默认值/空壳 → 用快照里的真实数据替换；真实数据则尊重本地
        need = isShellVal(k, cur);
      }
      if (!need) return;
      try { fill(k, sv); filled++; } catch (e3) {}
    });
    if (filled) console.warn('[快照] 已回填 ' + filled + ' 项关键数据（' + why + '）');
    return filled;
  }

  function mergeSnap(a, b) {
    if (!a) return b;
    if (!b) return a;
    var out = { v: 1, ts: Math.max(a.ts || 0, b.ts || 0), d: {}, t: {}, del: {} };
    [a, b].forEach(function (s) {
      if (!s || !s.d) return;
      Object.keys(s.d).forEach(function (k) {
        var sv = s.d[k];
        if (!isReal(sv)) return;
        var st = (s.t && +s.t[k]) || 0;
        var have = out.d[k];
        if (!have) { out.d[k] = sv; out.t[k] = st; return; }
        if (k.indexOf('akini_chat_history') === 0) {
          if (sv.length > have.length) { out.d[k] = sv; out.t[k] = st; }
        } else if (st >= (out.t[k] || 0)) {
          out.d[k] = sv; out.t[k] = st;
        }
      });
      Object.keys(s.del || {}).forEach(function (k) { out.del[k] = Math.max(out.del[k] || 0, +s.del[k] || 0); });
    });
    Object.keys(out.del).forEach(function (k) { if (out.d[k] && isReal(out.d[k])) delete out.del[k]; });
    return out;
  }

  function loadLsSnap() {
    var raw = null;
    try { raw = localStorage.getItem(LS_KEY); } catch (e) {}
    if (!raw) return null;
    try { var o = JSON.parse(raw); return (o && o.d) ? o : null; } catch (e) { return null; }
  }

  function loadIdbSnap(cb) {
    var IDB = window._idbStore;
    if (!IDB || !IDB.get) { if (cb) cb(null); return; }
    try {
      IDB.get(IDB_KEY, function (raw) {
        var o = null;
        try { o = raw ? JSON.parse(raw) : null; } catch (e) {}
        if (cb) cb(o);
      });
    } catch (e) { if (cb) cb(null); }
  }

  function restoreIdbSnap() {
    loadIdbSnap(function (snap) {
      if (!snap || !snap.d) return;
      _cur = mergeSnap(_cur, snap);
      var n = applySnap(_cur, 'IndexedDB 快照');
      if (n && window.__akiniRestoreSettled) {
        try { if (typeof window.__akiniOnCriticalRestored === 'function') window.__akiniOnCriticalRestored(); } catch (e) {}
      }
    });
  }

  // ---- 启动第一步：同步读 LS 小快照并立即回填（先于后续所有脚本渲染）----
  try {
    _cur = loadLsSnap();
    if (_cur) applySnap(_cur, '启动快照');
  } catch (eBoot) {}

  // ---- 启动对账完成后再合并 IDB 全量快照 + 首次落快照 ----
  function afterSettle(fn) {
    if (window.__akiniRestoreSettled) { fn(); return; }
    var tries = 0;
    var timer = setInterval(function () {
      if (window.__akiniRestoreSettled || ++tries > 120) {
        clearInterval(timer);
        fn();
      }
    }, 250);
  }
  afterSettle(function () {
    restoreIdbSnap();
    setTimeout(function () { takeSnapshot(false); }, 1200);
  });

  // ---- 钩住“启动对账完成”回调：真实数据回填后立即再校一次快照 ----
  try {
    var _prevHook = window.__akiniOnCriticalRestored;
    window.__akiniOnCriticalRestored = function () {
      try { if (_cur) applySnap(_cur, '启动对账后'); } catch (e1) {}
      if (typeof _prevHook === 'function') { try { _prevHook(); } catch (e2) {} }
    };
  } catch (eHook) {}

  // ---- 运行期快照：对齐 syy，取消前台周期性全量快照 ----
  /* syy 只在切后台/关闭页时做小体积 critical 备份，从不在前台每 20s 全量 stringify。
     akini 之前每 20s 调 sigOf() 读全量 localStorage + 变化时 buildSnap+JSON.stringify，
     是低端机「用着用着突然卡崩」的直接原因。全量数据已由 akiniSet 逐键落 IndexedDB，
     快照仅作启动快恢复 + 墓碑仲裁兜底，由显式删除(_snapshotCritical(true))和切后台时触发。 */
  function flushStore() {
    try {
      var s = store();
      if (!s) return;
      if (typeof s.flushIdb === 'function') s.flushIdb();
      else if (typeof s.flushIdbQueue === 'function') s.flushIdbQueue();
    } catch (e) {}
  }
  try {
    /* 页面隐藏时：先落 IndexedDB 队列（真正的数据落盘），再做一份小快照兜底。
       快照现已封顶 1MB（单键 512KB），stringify 开销与 syy 的 _backupCriticalData 同级，
       不会在冻结窗口里把主线程卡死。回前台不再重建快照——全量数据由 IDB 逐键权威承载。 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { flushStore(); try { takeSnapshot(false); } catch (e) {} }
    });
    window.addEventListener('pagehide', flushStore);
  } catch (eT2) {}

  // ---- 对外接口 ----
  window._snapshotCritical = function (force) { try { takeSnapshot(!!force); } catch (e) {} };
  window.__akiniSnap = {
    snapshot: window._snapshotCritical,
    restore: function () { restoreIdbSnap(); if (_cur) applySnap(_cur, '手动恢复'); },
    keyTs: function (k) { return +((_cur && _cur.t && _cur.t[k]) || 0); },
    isDeleted: function (k) { return +((_cur && _cur.del && _cur.del[k]) || 0); },
    loadedKeys: function () { return (_cur && _cur.d) ? Object.keys(_cur.d).length : 0; }
  };

  console.log('[akini-persist] 关键数据快照层已加载' + (_cur ? '（启动快照 ' + Object.keys(_cur.d || {}).length + ' 项）' : ''));
})();
