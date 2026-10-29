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

  /* 被移除联系人名下的按联系人数据键前缀 */
  var PER_CONTACT_PREFIXES = [
    'akini_chat_history_', 'akini_contact_avatar_', 'akini_icity_profile_',
    'akini_icity_ta_bg_', 'akini_chat_bg_', 'akini_surveys_', 'akini_sticker_groups_'
  ];

  function purgeContactData(cid) {
    PER_CONTACT_PREFIXES.forEach(function (p) {
      var k = p + cid;
      try { window.__akiniWiping = true; } catch (e0) {}
      try { localStorage.removeItem(k); } catch (e1) {}
      try { localStorage.removeItem(k + '_backup'); } catch (e2) {}
      try { if (window._idbStore && window._idbStore.remove) { window._idbStore.remove(k); window._idbStore.remove(k + '_backup'); } } catch (e3) {}
      try { if (window.akiniStore && window.akiniStore.memoryRemove) window.akiniStore.memoryRemove(k); } catch (e4) {}
      try { window.__akiniWiping = false; } catch (e5) {}
    });
  }

  function enforceSingleContact() {
    try {
      var api = window.akiniContacts;
      if (!api || !api.getContacts) return;
      var list = api.getContacts() || [];
      if (!Array.isArray(list) || !list.length) return;
      var keep = list.filter(function (c) { return c && c.isDefault; })[0] || list[0];
      if (!keep || !keep.id) return;
      if (list.length > 1) {
        list.forEach(function (c) {
          if (c && c.id && String(c.id) !== String(keep.id)) purgeContactData(c.id);
        });
        var single = JSON.stringify([keep]);
        try { localStorage.setItem('akini_contacts', single); } catch (e1) {}
        try { if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet('akini_contacts', single); } catch (e2) {}
        try { if (window._idbStore && window._idbStore.set) window._idbStore.set('akini_contacts', single); } catch (e3) {}
        try { console.warn('[单人模式] 已收敛多余联系人 ' + (list.length - 1) + ' 个，只保留 ' + keep.id); } catch (e4) {}
      }
      /* 活动会话锁定到唯一 TA */
      try {
        if (String(localStorage.getItem('akini_active_chat_id') || '') !== String(keep.id)) {
          localStorage.setItem('akini_active_chat_id', keep.id);
        }
      } catch (e5) {}
      try { if (window._renderIcity) window._renderIcity(); } catch (e6) {}
      try { if (window.__akiniRefreshChatListBadges) window.__akiniRefreshChatListBadges(); } catch (e7) {}
    } catch (e) {}
  }

  function boot() {
    enforceSingleContact();
  }

  boot();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  ['akini-storage-restored', 'load', 'pageshow'].forEach(function (evt) {
    window.addEventListener(evt, boot);
  });
  [800, 2000, 4500].forEach(function (ms) { setTimeout(boot, ms); });
})();
