(function () {
  "use strict";
  if (window.__akiniChatEngineInstalled) return;
  window.__akiniChatEngineInstalled = true;

  var EMPTY_TIP = "字卡库为空，请先到字卡库添加回复内容";

  /* ------------------------- 字卡池（原生 replyPool） ------------------------- */

  var bankCache = null;
  var bankAt = 0;

  function readBank() {
    var now = Date.now();
    if (bankCache && now - bankAt < 1000) return bankCache;

    var bank = [];
    try {
      var v = window.__wbRead ? window.__wbRead("akini_wordbank", []) : null;
      if (Array.isArray(v)) bank = v;
    } catch (e) {}
    if (!bank.length) {
      try {
        var raw = localStorage.getItem("akini_wordbank");
        var sp = raw ? JSON.parse(raw) : null;
        if (Array.isArray(sp)) bank = sp;
      } catch (e2) {}
    }

    bankCache = bank;
    bankAt = now;
    return bank;
  }

  /* 可用字卡：排除拍一拍 / 气泡类，正文必须非空（与 原生 的过滤一致） */
  function isUsableCard(c) {
    if (!c) return false;
    if (typeof c === "string") return !!c.trim();
    var tab = (c.tab || "").toLowerCase();
    var type = (c.type || "").toLowerCase();
    if (tab === "pat" || tab === "bubble" || type === "pat" || type === "bubble") return false;
    var text = c.text || c.content || "";
    return typeof text === "string" && !!text.trim();
  }

  function cardText(c) {
    if (typeof c === "string") return c.trim();
    return String((c && (c.text || c.content)) || "").trim();
  }

  function replyPool(cid) {
    var bank = readBank();
    var list = (Array.isArray(bank) ? bank : []).filter(isUsableCard);
    if (!list.length) return [];
    {
      var filtered = null;
      try {
        filtered = window.__wbFilter(list, cid == null ? "" : String(cid));
      } catch (e) {
        filtered = null;
      }
      if (filtered) list = filtered;
    }
    return list;
  }

  /* 原生：随机取词最多重试 6 次，确保返回可用文本 */
  function pickReplyText(cid) {
    var pool = replyPool(cid);
    if (!pool.length) return "";
    for (var i = 0; i < 6; i++) {
      var c = pool[Math.floor(Math.random() * pool.length)];
      var t = cardText(c);
      if (t) return t;
    }
    return "";
  }

  /* --------------------- 从源头替换取词函数 ---------------------
     core 的 G / J / 转账回复 / 朋友圈等全部走 window.pickWordCards，
     换掉它以后，所有链路都获得「重试 + 禁用过滤」的保障。 */
  var enginePick = function (count, cid) {
    count = Math.max(1, parseInt(count, 10) || 1);
    var pool = replyPool(cid);
    if (!pool.length) return "";
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = pickReplyText(cid);
      if (t) out.push(t);
    }
    return out.join("\n");
  };
  enginePick.__akiniEngine = true;
  window.pickWordCards = enginePick;

  /* --------------------------- 提示 --------------------------- */

  var lastEmptyTipAt = 0;
  function notifyEmpty() {
    var now = Date.now();
    if (now - lastEmptyTipAt < 8000) return;
    lastEmptyTipAt = now;
    try {
      return void window.__akiniNotify(EMPTY_TIP);
    } catch (e) {}
  }

  window.__akiniNotifyEmptyReply = notifyEmpty;
  window.__akiniHasReplyPool = function (cid) {
    return replyPool(cid).length > 0;
  };
})();
