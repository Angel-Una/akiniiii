/* ==========================================================================
 * Akini 聊天引擎 —— 完全按 syy 的「回消息 / 主动发消息」模型重写
 * --------------------------------------------------------------------------
 * syy 的 simulateReply 逻辑（逐条对齐）：
 *   1. 先算出可用回复池（replyPool）；池为空 → 直接提示用户，绝不静默返回；
 *   2. 确认池非空之后，才显示「正在输入」；
 *   3. 回复条数 1~3：75% 一条、95% 两条、其余三条；
 *   4. 每条回复取词最多随机重试 6 次，保证一定拿到可用文本；
 *   5. 彻底取不到文本 → 收起「正在输入」并提示用户，绝不发明空气泡；
 *   6. 发送失败（渲染抛错）也要补一条，不能静默吞掉。
 * 本文件在 akini-r6.js 之后加载，属于「源头」层：
 *   · 直接替换 window.pickWordCards —— 所有取词调用点自动获得上面的保障；
 *   · 再包一层 window.I（core 的 G）—— 所有回复路径都经过池校验与失败兜底；
 *   · 重写 akiniTriggerReply / __akiniForceReply / triggerTaReplyOnce。
 * ========================================================================== */
(function () {
  'use strict';
  if (window.__akiniChatEngineInstalled) return;
  window.__akiniChatEngineInstalled = true;

  var EMPTY_TIP = '字卡库为空，请先到字卡库添加回复内容';

  /* ---------------------------- 基础工具 ---------------------------- */

  function num(key, dflt) {
    var v = parseFloat(localStorage.getItem(key) || '');
    return isNaN(v) ? dflt : v;
  }

  function reportErr(where, e) {
    try { console.error('[AkiniChatEngine] ' + where, e && (e.stack || e.message) || e); } catch (_) {}
    try { if (window.__akiniReportErr) window.__akiniReportErr('聊天引擎-' + where, e); } catch (_) {}
  }

  function escapeHtml(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function activeId() {
    try {
      return window.akiniContacts && window.akiniContacts.getActiveChatId
        ? window.akiniContacts.getActiveChatId() : null;
    } catch (e) { return null; }
  }

  function getTarget(cid) {
    try {
      return window.akiniContacts && window.akiniContacts.getChatTarget
        ? window.akiniContacts.getChatTarget(cid) : null;
    } catch (e) { return null; }
  }

  /* ------------------------- 字卡池（syy replyPool） ------------------------- */

  var bankCache = null;
  var bankAt = 0;

  function readBank() {
    var now = Date.now();
    if (bankCache && now - bankAt < 1000) return bankCache;

    var bank = [];
    /* ① 统一的读写层 */
    try {
      var v = window.__wbRead ? window.__wbRead('akini_wordbank', []) : null;
      if (Array.isArray(v)) bank = v;
    } catch (e) {}
    /* ② 内存存储 */
    if (!bank.length) {
      try {
        var m = window.akiniStore && window.akiniStore.memoryGet ? window.akiniStore.memoryGet('akini_wordbank') : null;
        if (m) {
          var mp = typeof m === 'string' ? JSON.parse(m) : m;
          if (Array.isArray(mp)) bank = mp;
        }
      } catch (e2) {}
    }
    /* ③ 同步存储层 */
    if (!bank.length) {
      try {
        var s = window.akiniStore && window.akiniStore.getSync ? window.akiniStore.getSync('akini_wordbank', null) : null;
        if (s) {
          var sp = typeof s === 'string' ? JSON.parse(s) : s;
          if (Array.isArray(sp) && sp.length) bank = sp;
        }
      } catch (e3) {}
    }
    /* ④ 任意 akini_wordbank* 键兜底（多账号 / 迁移残留） */
    if (!bank.length) {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('akini_wordbank') === 0) {
            var g = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(g) && g.length) { bank = g; break; }
          }
        }
      } catch (e4) {}
    }

    bankCache = bank;
    bankAt = now;
    return bank;
  }

  window.__akiniInvalidateReplyPool = function () { bankCache = null; bankAt = 0; };

  /* 可用字卡：排除拍一拍 / 气泡类，正文必须非空（与 syy 的过滤一致） */
  function isUsableCard(c) {
    if (!c) return false;
    if (typeof c === 'string') return !!c.trim();
    var tab = (c.tab || '').toLowerCase();
    var type = (c.type || '').toLowerCase();
    if (tab === 'pat' || tab === 'bubble' || type === 'pat' || type === 'bubble') return false;
    var text = c.text || c.content || '';
    return typeof text === 'string' && !!text.trim();
  }

  function cardText(c) {
    if (typeof c === 'string') return c.trim();
    return String((c && (c.text || c.content)) || '').trim();
  }

  function replyPool(cid) {
    var bank = readBank();
    var list = (Array.isArray(bank) ? bank : []).filter(isUsableCard);
    if (!list.length) return [];
    if (typeof window.__wbFilter === 'function') {
      var filtered = null;
      try {
        filtered = window.__wbFilter(list, cid == null ? '' : String(cid));
      } catch (e) { filtered = null; }
      /* syy：过滤后仍有可用内容才换池；过滤后为空 → 保留未过滤池，绝不因此不回消息 */
      if (filtered && filtered.length) list = filtered;
    }
    return list;
  }

  window.__akiniReplyPool = replyPool;
  window.__akiniHasReplyPool = function (cid) { return replyPool(cid).length > 0; };

  /* syy：随机取词最多重试 6 次，确保返回可用文本 */
  function pickReplyText(cid) {
    var pool = replyPool(cid);
    if (!pool.length) return '';
    for (var i = 0; i < 6; i++) {
      var c = pool[Math.floor(Math.random() * pool.length)];
      var t = cardText(c);
      if (t) return t;
    }
    return '';
  }
  window.__akiniPickReplyText = pickReplyText;

  /* --------------------- 从源头替换取词函数 ---------------------
     core 的 G / J / 转账回复 / 朋友圈等全部走 window.pickWordCards，
     换掉它以后，所有链路都获得「重试 + 过滤兜底」的保障。 */
  var inheritedPick = window.pickWordCards;   /* 原始实现只捕获一次，避免递归 */
  var enginePick = function (count, cid) {
    count = Math.max(1, parseInt(count, 10) || 1);
    var pool = replyPool(cid);
    if (!pool.length) {
      if (typeof inheritedPick === 'function') {
        try { return inheritedPick(count, cid) || ''; } catch (e) { return ''; }
      }
      return '';
    }
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = pickReplyText(cid);
      if (t) out.push(t);
    }
    if (!out.length) {
      if (typeof inheritedPick === 'function') {
        try { return inheritedPick(count, cid) || ''; } catch (e2) { return ''; }
      }
      return '';
    }
    return out.join('\n');
  };
  enginePick.__akiniEngine = true;
  window.pickWordCards = enginePick;

  /* --------------------------- 提示 / 输入中 --------------------------- */

  var lastEmptyTipAt = 0;
  function notifyEmpty() {
    var now = Date.now();
    if (now - lastEmptyTipAt < 8000) return;
    lastEmptyTipAt = now;
    try {
      if (typeof window.__akiniNotify === 'function') return void window.__akiniNotify(EMPTY_TIP);
      if (typeof window.showNotification === 'function') return void window.showNotification(EMPTY_TIP, 'info', 3500);
      if (typeof window.ae === 'function') return void window.ae('字卡库为空');
      if (typeof window.__akiniToast === 'function') return void window.__akiniToast(EMPTY_TIP);
    } catch (e) {}
  }

  function typingEl() { return document.getElementById('typingIndicator'); }

  function showTyping(cid, target) {
    try {
      if (!cid || document.hidden) return;
      var active = activeId();
      if (active && active !== cid) return;
      window.__akiniTypingMap = window.__akiniTypingMap || {};
      var old = window.__akiniTypingMap[cid];
      if (old && old.timer) clearTimeout(old.timer);
      var avatarHtml = '';
      try { avatarHtml = window._akiniAv ? window._akiniAv(target && target.avatar, 38, cid) : ''; } catch (e) {}
      window.__akiniTypingMap[cid] = {
        avatar: avatarHtml,
        timer: setTimeout(function () { clearTyping(cid); }, 120000)
      };
      var el = typingEl();
      if (el) el.style.display = 'block';
      if (typeof window.__akiniPaintTypingFloat === 'function') window.__akiniPaintTypingFloat();
    } catch (e) { reportErr('showTyping', e); }
  }

  function clearTyping(cid) {
    try {
      window.__akiniTypingMap = window.__akiniTypingMap || {};
      if (cid) {
        var e = window.__akiniTypingMap[cid];
        if (e && e.timer) clearTimeout(e.timer);
        delete window.__akiniTypingMap[cid];
      }
      var active = activeId();
      if (!cid || !active || active === cid) {
        var el = typingEl();
        if (el) el.style.display = 'none';
        var body = document.getElementById('chatBody');
        if (body) {
          var rows = body.querySelectorAll('[id^="typingBubbleRow_"]');
          for (var i = 0; i < rows.length; i++) {
            try { rows[i].remove(); } catch (e2) {
              try { rows[i].parentNode && rows[i].parentNode.removeChild(rows[i]); } catch (e3) {}
            }
          }
        }
      }
      if (typeof window.__akiniPaintTypingFloat === 'function') window.__akiniPaintTypingFloat();
    } catch (e) { reportErr('clearTyping', e); }
  }
  window.__akiniClearTyping = clearTyping;

  /* ------------------------- 兜底直发（绝不静默） ------------------------- */

  function otherCount(cid) {
    try {
      var s = window.akiniContacts.getSession ? window.akiniContacts.getSession(cid) : null;
      var html = (s && s.messagesHTML) || '';
      var m = html.match(/msg-row other/g);
      return m ? m.length : 0;
    } catch (e) { return -1; }
  }

  function fallbackAppend(cid, target, text) {
    if (!cid || !text) return false;
    try {
      var name = (target && target.name) || '对方';
      var avatar = (target && target.avatar) || '';
      var av = '';
      try { av = window._akiniAv ? window._akiniAv(avatar, 38, cid) : ''; } catch (e) {}
      var ts = window.__akiniNextTs ? window.__akiniNextTs() : Date.now();
      var html = '<div class="msg-row other" data-ts="' + ts + '">' +
        '<div class="msg-content-line">' +
        '<div class="msg-avatar" data-sender-name="' + escapeHtml(name) + '">' + av + '</div>' +
        '<div class="bubble">' + escapeHtml(text) + '</div>' +
        '</div></div>';

      var contacts = window.akiniContacts;
      var active = activeId();
      var sess = contacts && contacts.getSession ? (contacts.getSession(cid) || {}) : {};
      var unread = (active === cid) ? (sess.unread || 0) : (sess.unread || 0) + 1;

      if (typeof window.__akiniAppendMessageHTML === 'function') {
        window.__akiniAppendMessageHTML(cid, html, {
          lastMsg: text, lastTime: Date.now(), unread: unread,
          lastSenderAvatar: avatar, lastSenderName: name
        });
        return true;
      }
      if (contacts && contacts.updateSession) {
        contacts.updateSession(cid, {
          messagesHTML: (sess.messagesHTML || '') + html,
          lastMsg: text, lastTime: Date.now(), unread: unread,
          lastSenderAvatar: avatar, lastSenderName: name
        });
        return true;
      }
    } catch (e) { reportErr('fallbackAppend', e); }
    return false;
  }

  /* ------------------- 包 window.I（core 的 G）：全路径兜底 ------------------- */

  function wrapI() {
    var orig = window.I;
    if (typeof orig !== 'function' || orig.__akiniEngineWrapped) return typeof orig === 'function';

    function wrapped(cid, target, behavior, instant, member) {
      var args = arguments;
      try {
        var contacts = window.akiniContacts;
        cid = cid || activeId();
        if (!cid || !contacts) return orig.apply(this, args);
        target = target || getTarget(cid);
        var isNone = !!(behavior && behavior.type === 'none');

        /* syy 第 1/2 步：池为空直接提示，不给「正在输入」空转 */
        if (!isNone && !replyPool(cid).length) {
          clearTyping(cid);
          notifyEmpty();
          return;
        }

        var before = otherCount(cid);
        var ret;
        try {
          ret = orig.call(this, cid, target, behavior, instant, member);
        } catch (err) {
          reportErr('window.I 渲染失败', err);
          ret = undefined;
          if (window.__akiniReportErr) {
            try { window.__akiniReportErr('回复-渲染', err); } catch (e2) {}
          }
        }

        /* syy 第 5 步：一条都没发出来（渲染失败或静默返回）→ 用保证可用的文本补一条 */
        if (!isNone) {
          var after = otherCount(cid);
          if (after < 0 || after <= before) {
            var text = pickReplyText(cid);
            if (text && fallbackAppend(cid, target, text)) {
              clearTyping(cid);
            } else if (!text) {
              clearTyping(cid);
              notifyEmpty();
            }
          }
        }
        return ret;
      } catch (e) {
        reportErr('wrapI', e);
        try { return orig.apply(this, args); } catch (e2) { return undefined; }
      }
    }

    wrapped.__akiniEngineWrapped = true;
    wrapped.__akiniInner = orig;
    window.I = wrapped;
    return true;
  }

  /* --------------------- 回消息（syy simulateReply） --------------------- */

  function syyReply(cid, force) {
    try {
      var contacts = window.akiniContacts;
      if (!contacts) return;
      if (window.__akiniToggleOn && !window.__akiniToggleOn('contactReplyToggle', true)) return;

      cid = cid || activeId();
      if (!cid) return;
      var target = getTarget(cid);
      if (!target) return;

      /* ① 先确认池非空 */
      if (!replyPool(cid).length) {
        clearTyping(cid);
        notifyEmpty();
        return;
      }

      /* ② 行为；强制补发时忽略「已读不回」 */
      var behavior = null;
      try {
        behavior = window.AKR && window.AKR.pickReplyBehavior ? window.AKR.pickReplyBehavior() : null;
      } catch (e) {}
      if (!behavior || !behavior.type) behavior = { type: 'text', extra: {} };
      if (force && behavior.type === 'none') behavior = { type: 'text', extra: {} };
      if (behavior.type === 'none') return;   /* 用户主动开了「已读不回」，尊重设置 */

      /* ③ 确认有可用回复之后才显示输入中（syy 关键差异） */
      var active = activeId();
      if (active === cid) showTyping(cid, target);

      var dmin = num('akini_num_replyDelayMin', 3);
      var dmax = num('akini_num_replyDelayMax', 7);
      if (dmin <= 0) dmin = 3;
      if (dmax < dmin) dmax = dmin + 1;
      var delay = 1000 * (dmin + Math.random() * (dmax - dmin));

      setTimeout(function () {
        try {
          /* ④ 到点再验一次池（用户可能刚清空字卡） */
          if (!replyPool(cid).length) {
            clearTyping(cid);
            notifyEmpty();
            return;
          }
          window.I(cid, target, behavior, true);
        } catch (e) {
          reportErr('syyReply:send', e);
          var text = pickReplyText(cid);
          if (text) fallbackAppend(cid, target, text);
          else notifyEmpty();
        }
        clearTyping(cid);
      }, delay);
    } catch (e) {
      reportErr('syyReply', e);
    }
  }
  window.__akiniSyyReply = syyReply;

  /* ------------------------------------------------------------------
     入口函数重写必须在 core 的 DOMContentLoaded 处理器执行之后安装：
     akiniTriggerReply / __akiniForceReply / triggerTaReplyOnce 都是 core
     在 DOMContentLoaded 里才赋值的，直接在这里改会被 core 覆盖回去。
     ------------------------------------------------------------------ */
  var capturedOrig = { trigger: null, force: null };

  function captureOrig() {
    if (!capturedOrig.trigger && typeof window.akiniTriggerReply === 'function' && !window.akiniTriggerReply.__akiniEngine) {
      capturedOrig.trigger = window.akiniTriggerReply;
    }
    if (!capturedOrig.force && typeof window.__akiniForceReply === 'function' && !window.__akiniForceReply.__akiniEngine) {
      capturedOrig.force = window.__akiniForceReply;
    }
  }

  /* ---- akiniTriggerReply：表情包 / 转账后的回消息，改走 syy 模型 ---- */
  function wTrigger(cid) {
    try {
      syyReply(cid, false);
    } catch (e) {
      try { if (capturedOrig.trigger) return capturedOrig.trigger.apply(this, arguments); } catch (e2) {}
    }
  }
  wTrigger.__akiniEngine = true;

  /* ---- __akiniForceReply：底部「继续」/ 看门狗强制补一条，只发一次 ---- */
  function wForce() {
    try {
      if (window.__akiniForceReplyInFlight) return;
      window.__akiniForceReplyInFlight = true;
      setTimeout(function () { window.__akiniForceReplyInFlight = false; }, 9000);
      syyReply(null, true);
    } catch (e) {
      try { if (capturedOrig.force) return capturedOrig.force.apply(this, arguments); } catch (e2) {}
    }
  }
  wForce.__akiniEngine = true;

  /* ---- 主动发消息：syy 模型 —— 先验池，再输入中，再发，绝不空跑 ---- */
  function wTaReply(cid, minDelay) {
    try {
      if (window.Ai && window.Ai.active) return;
      if (window.__akiniToggleOn && !window.__akiniToggleOn('contactActiveMsgToggle', false)) return;
      var contacts = window.akiniContacts;
      if (!contacts) return;

      cid = cid || activeId();
      if (!cid) return;
      var target = getTarget(cid);
      if (!target || target.type === 'group') return;

      /* 主动发消息同样先验池：空则提示，绝不空跑 */
      if (!replyPool(cid).length) { notifyEmpty(); return; }

      var dmin = num('akini_num_replyDelayMin', 3);
      var dmax = num('akini_num_replyDelayMax', 7);
      if (dmin <= 0) dmin = 3;
      if (dmax < dmin) dmax = dmin + 1;
      var delay = 1000 * (dmin + Math.random() * (dmax - dmin));
      var floor = (typeof minDelay === 'number' && minDelay > 0) ? minDelay : (600 + 900 * Math.random());
      if (delay < floor) delay = floor;

      var active = activeId();
      if (active === cid) showTyping(cid, target);

      setTimeout(function () {
        try {
          if (!replyPool(cid).length) { clearTyping(cid); notifyEmpty(); return; }
          var behavior = null;
          try {
            behavior = window.AKR && window.AKR.pickReplyBehavior ? window.AKR.pickReplyBehavior() : null;
          } catch (e) {}
          if (!behavior || !behavior.type || behavior.type === 'none') behavior = { type: 'text', extra: {} };
          window.I(cid, target, behavior, true);
        } catch (e) {
          reportErr('activeSend:send', e);
          var text = pickReplyText(cid);
          if (text) fallbackAppend(cid, target, text);
          else notifyEmpty();
        }
        clearTyping(cid);
      }, delay);
    } catch (e) {
      reportErr('triggerTaReplyOnce', e);
    }
  }
  wTaReply.__akiniEngine = true;

  /* 安装（幂等）：只负责把入口函数指到上面三个包装，被 core 覆盖了就再指回去 */
  function installEntryHooks() {
    captureOrig();
    if (window.pickWordCards !== enginePick) window.pickWordCards = enginePick;
    if (window.akiniTriggerReply !== wTrigger) window.akiniTriggerReply = wTrigger;
    if (window.__akiniForceReply !== wForce) window.__akiniForceReply = wForce;
    if (window.triggerTaReplyOnce !== wTaReply) window.triggerTaReplyOnce = wTaReply;
  }
  window.__akiniInstallChatEngineHooks = installEntryHooks;

  /* core 的 __akiniBootComplete 在它完成全部赋值之后才置 true；
     DOMContentLoaded 监听器按注册顺序执行，core 先注册，所以这里天然后跑。 */
  function bootInstall() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(installEntryHooks, 0); });
    } else {
      setTimeout(installEntryHooks, 0);
    }
    /* 兜底：即使 core 的赋值发生在事件之后，也会在几个时间点补装回来 */
    var delays = [300, 1000, 2500, 5000];
    for (var i = 0; i < delays.length; i++) setTimeout(installEntryHooks, delays[i]);
    var n = 0;
    var iv = setInterval(function () {
      if (window.__akiniBootComplete) { installEntryHooks(); clearInterval(iv); }
      else if (++n > 600) clearInterval(iv);
    }, 100);
  }
  bootInstall();

  /* ------------------------- 安装 window.I 包装 ------------------------- */
  if (!wrapI()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (wrapI() || ++tries > 200) clearInterval(iv);
    }, 150);
  }
})();
