/* ===== 联系人资料（TA 的昵称 / @ / 关于 TA）实时保存 =====
   问题：core 里这三个输入框只在「切换联系人」时才调用保存函数，
   直接输入后点完成/退出完全不会落盘，刷新就恢复旧值，看起来"设置不生效"。
   这里补上 input/change/完成 三处保存入口，并同步刷新资料卡显示。 */
(function () {
  'use strict';
  if (window.__akiniProfileFixReady) return;
  window.__akiniProfileFixReady = true;

  var FIELD_RE = /^icityTa(Nick|Handle|Bio)Input$/;

  function currentId() {
    var id = window._icityEditContactId || window._currentIcityContactId;
    if (id) return id;
    try {
      var list = window.akiniContacts && window.akiniContacts.getContacts ? window.akiniContacts.getContacts() : [];
      if (Array.isArray(list) && list.length) {
        var def = list.filter(function (c) { return c && c.isDefault; })[0];
        return (def || list[0]).id;
      }
    } catch (e) {}
    return null;
  }

  function save() {
    var id = currentId();
    if (!id) return;
    var key = 'akini_icity_profile_' + id;
    var obj = {};
    try { obj = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { obj = {}; }
    var nick = document.getElementById('icityTaNickInput');
    var handle = document.getElementById('icityTaHandleInput');
    var bio = document.getElementById('icityTaBioInput');
    if (nick) obj.name = nick.value.trim();
    if (handle) obj.handle = handle.value.trim();
    if (bio) obj.bio = bio.value.trim();
    var str = JSON.stringify(obj);
    try { localStorage.setItem(key, str); } catch (e) {}
    try { if (window._idbStore && window._idbStore.set) window._idbStore.set(key, str); } catch (e) {}
    try { if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet(key, str); } catch (e) {}

    /* 资料卡上的展示文本立即同步，不必等重新打开 */
    var dn = document.getElementById('icityTaNameDisplay');
    if (dn && obj.name) dn.textContent = obj.name;
    var dh = document.getElementById('icityTaHandleDisplay');
    if (dh) dh.textContent = '@' + (obj.handle || obj.name || '');
    var db = document.getElementById('icityTaBioDisplay');
    if (db && obj.bio != null) db.textContent = obj.bio;
  }

  var timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(save, 250);
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && t.id && FIELD_RE.test(t.id)) schedule();
  }, true);

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.id && FIELD_RE.test(t.id)) save();
  }, true);

  /* 「完成」按钮：即使输入事件被输入法打断，也在关闭前强制保存一次 */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#icityProfileEditDone') : null;
    if (!t) return;
    clearTimeout(timer);
    save();
  }, true);

  /* 切到后台/页面隐藏前补存一次，避免输入后直接杀进程丢数据 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearTimeout(timer); save(); }
  });
  window.addEventListener('pagehide', function () { clearTimeout(timer); save(); });
})();

/* ===== 单人情侣模式硬约束 =====
   需求：全站只保留一个 TA。微信点进去直接是与 TA 的聊天，不再出现通讯录/添加联系人/
   多人会话等旧入口；历史残留的多余联系人连同其专属数据一并清除。 */
(function () {
  'use strict';
  if (window.__akiniSingleModeReady) return;
  window.__akiniSingleModeReady = true;

  /* 单人模式：数据层归一由 akini-storage.js 的 __akiniEnforceSingleContact 负责
     （它会删除多余联系人的聊天记录/头像/iCity 资料/评论，并把唯一 TA 写回 LS/IDB/内存）。
     这里只负责在合适的时机触发归一，并刷新界面，不做任何拦截或遮罩。 */
  function enforce() {
    try { if (typeof window.__akiniEnforceSingleContact === 'function') window.__akiniEnforceSingleContact(); } catch (e) {}
    try { if (window._renderIcity) window._renderIcity(); } catch (e) {}
    try { if (window.__akiniRefreshChatListBadges) window.__akiniRefreshChatListBadges(); } catch (e) {}
  }
  enforce();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enforce);
  ['akini-storage-restored', 'akini-contacts-restored', 'load', 'pageshow'].forEach(function (evt) {
    window.addEventListener(evt, enforce);
  });
  [800, 2000, 4500].forEach(function (ms) { setTimeout(enforce, ms); });
})();
