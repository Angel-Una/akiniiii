/* 联系人主动行为调度：主动发消息+ 开关变更后的重新排期 */
(function () {
  "use strict";
  if (window.__akiniActiveEngineReady) return;
  window.__akiniActiveEngineReady = true;

  /* 旧实现是一串自续期的 setTimeout，只有它自己会续命；清掉当前这一个就彻底停止。
     core 的启动排期可能晚于本脚本（慢设备恢复数据要十几秒），因此定时复核，
     否则两个引擎同时跑就会出现"联系人干啥都是两条"。 */
  function _killLegacy() {
    try {
      if (window.__activeMsgTimer) {
        clearTimeout(window.__activeMsgTimer);
        window.__activeMsgTimer = null;
      }
    } catch (e0) {}
    if (window._akiniActiveMsgAction) window._akiniActiveMsgAction = null;
    if (window._akiniRescheduleActiveMsg !== manage) window._akiniRescheduleActiveMsg = manage;
  }
  _killLegacy();

  var msgTimer = null;

  /* 直接读存储，绕开 __akiniToggleOn 的「必须已有活跃联系人」限制：
     启动早期联系人还没水合时，那个限制会把开关误判成关闭、并清掉已保存的排期。 */
  function _toggleOn() {
    try {
      var v = localStorage.getItem("akini_toggle_contactActiveMsgToggle");
      return null == v ? false : "1" === v;
    } catch (e) {
      return false;
    }
  }

  /* 用户设置的最小~最大分钟数之间随机取一个间隔 */
  function _randomIntervalMs() {
    var minM = parseFloat(localStorage.getItem("akini_num_activeMsgMin") || "");
    var maxM = parseFloat(localStorage.getItem("akini_num_activeMsgMax") || "");
    if (!(minM > 0)) minM = 5;
    if (!(maxM >= minM)) maxM = minM;
    var minMs = minM * 60e3,
      maxMs = maxM * 60e3;
    return minMs + Math.random() * (maxMs - minMs);
  }

  function _defaultContact() {
    try {
      {
        var c = window.__akiniDefaultContact();
        if (c && c.id != null) return c;
      }
    } catch (e) {}
    try {
      var cs = window.akiniContacts && window.akiniContacts.getContacts ? window.akiniContacts.getContacts() : null;
      if (cs && cs.length) return cs[0];
    } catch (e) {}
    return null;
  }

  /* 一次主动发消息：标记已读 + 连发 1~3 条（内容取自字卡库）。
     有概率转为「主动来电」，由 core 暴露的钩子处理。 */
  function _fire() {
    var c = _defaultContact();
    if (!c) return false;
    try {
      localStorage.removeItem("akini_active_msg_next");
    } catch (e) {}
    try {
      if (window.__akiniMaybeActiveCall && window.__akiniMaybeActiveCall(c.id)) return true;
    } catch (e) {}
    try {
      window.triggerTaReplyOnce(c.id);
    } catch (e) {}
    return true;
  }

  function _arm(delay) {
    if (msgTimer) clearTimeout(msgTimer);
    try {
      localStorage.setItem("akini_active_msg_next", String(Date.now() + Math.max(2000, delay)));
    } catch (e) {}
    msgTimer = setTimeout(
      function () {
        msgTimer = null;
        if (!_toggleOn()) return;
        try {
          _fire();
        } catch (e) {
          console.warn("[主动发消息] 发送异常", e);
        }
        manage();
      },
      Math.max(2000, delay),
    );
  }

  /* 原生 模型：一个 setTimeout 串到底；跨会话补发靠 akini_active_msg_next 时间戳：
     到点未发的（后台冻结/页面被杀导致），重排前先补一条。
     fromForeground=true（回前台）时：没过点且定时器还活着就原样不动——不做无条件重排，
     否则频繁切后台会把定时器不断后延，永远等不到（朋友圈/iCity 当年的同款 bug）。
     开关打开 → 在用户设置的「最小~最大分钟」之间随机一个间隔；到点执行，执行完继续随机下一次。 */
  function manage(fromForeground) {
    _killLegacy();
    if (msgTimer) {
      clearTimeout(msgTimer);
      msgTimer = null;
    }
    if (!_toggleOn()) {
      try {
        localStorage.removeItem("akini_active_msg_next");
      } catch (e) {}
      try {
        if (window.__akiniKillActiveMsg) window.__akiniKillActiveMsg();
      } catch (e) {}
      return;
    }
    var next = 0;
    try {
      next = parseInt(localStorage.getItem("akini_active_msg_next") || "0", 10) || 0;
    } catch (e) {}
    /* 只要还没到点就按剩余时间续上——刷新/回前台都不会把排期重置成新的随机间隔 */
    if (next > 0 && Date.now() < next) {
      _arm(next - Date.now());
      return;
    }
    if (next > 0 && Date.now() >= next)
      try {
        _fire();
      } catch (e) {}
    /* 联系人还没恢复出来时先不排期，等水合完成后的重试再排，避免空跑 */
    if (!_defaultContact()) return;
    _arm(_randomIntervalMs());
  }

  window.__akiniOnVisible(function () { manage(true); });

  /* 设置页改间隔时 core 会调这里 */
  window._akiniRescheduleActiveMsg = manage;

  /* core 的开关点击只写 akini_toggle_*，不会重排定时器；这里补齐四个主动行为开关 */
  var WATCHED = ["contactActiveMsgToggle", "contactFriendsToggle", "contactIcityToggle", "contactMailToggle"];
  function _rearmAll() {
    if (!_toggleOn()) {
      try {
        if (window.__akiniKillActiveMsg) window.__akiniKillActiveMsg();
      } catch (e) {}
    }
    manage();
    try {
      window._akiniRescheduleFriendsPost();
    } catch (e) {}
    try {
      window._akiniRescheduleIcityPost();
    } catch (e) {}
    try {
      if (window.akiniMailEngine && window.akiniMailEngine.resetAutoSend) window.akiniMailEngine.resetAutoSend();
    } catch (e) {}
  }
  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      var sw = t && t.closest ? t.closest(".toggle-switch") : null;
      if (!sw || WATCHED.indexOf(sw.id) < 0) return;
      setTimeout(_rearmAll, 0);
    },
    false,
  );

  window.__akiniOnVisible(function () { 
      _killLegacy();
     });

  function _bootPlan() {
    manage();
  }
  if (window.__akiniBooted) _bootPlan();
  else {
    var waited = 0;
    var iv = setInterval(function () {
      waited += 200;
      if (window.__akiniBooted || waited > 8000) {
        clearInterval(iv);
        _bootPlan();
      }
    }, 200);
  }
  /* 存储水合 + 联系人就绪之后再排一次；最多等 20 秒兜底 */
  var _planRetry = 0;
  var _planIv = setInterval(function () {
    _planRetry += 500;
    var restored = !!(window.__akiniStorageRestored || window.__akiniRestoreSettled);
    var hasContact = false;
    try {
      hasContact = !!(window.akiniContacts && window.akiniContacts.getContacts && window.akiniContacts.getContacts().length);
    } catch (e) {}
    if ((restored && hasContact) || _planRetry > 20000) {
      clearInterval(_planIv);
      manage(true);
    }
  }, 500);
  window.addEventListener("akini-storage-restored", function () {
    setTimeout(function () {
      manage(true);
    }, 300);
  });
  /* core 启动排期的延后触发点在启动后 1.5s/4s/9s 兜底清理即可；
     启动完成后旧定时器不会复活，删除 10s 常驻轮询（回前台时由 visibilitychange 再清一次）。 */
  [1500, 4000, 9000].forEach(function (ms) {
    setTimeout(_killLegacy, ms);
  });
})();
