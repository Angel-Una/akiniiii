/* ===== 双头像位置互换（内容互换 + 全场景重渲染） =====
   根因：core 的渲染函数（En / r6.showMusicHome / 陪伴头像）在开关开启时
   已经把「我」和「TA」的头像内容互换过一次；样式表里 .swapped 又用
   left/right/order 把两个头像的位置互换了一次。两次互换相互抵消，
   所以开关打开后画面看起来完全没变。
   修复：只保留「内容互换」这一种机制，删掉样式表里的位置互换规则，
   本脚本负责在启动/重渲染/存储恢复/回到前台时重新执行一次渲染，
   保证任何时机画面都与开关状态一致（不再写任何 left/right/order 内联样式）。 */
(function () {
  'use strict';
  if (window.__akiniAvatarSwapReady) return;
  window.__akiniAvatarSwapReady = true;

  var KEY = 'akini_swap_avatar_pos';

  function readState() {
    try {
      var v = localStorage.getItem(KEY);
      return v === '1' || v === 'true' || v === true;
    } catch (e) { return false; }
  }

  /* core 暴露的 reapplyAvatarSwap 会读取开关并重新渲染所有头像位
     （首页双头像、一起听主页、陪伴界面、聊天预览）。这里只做重渲染，
     不再动元素位置，避免和渲染逻辑互相抵消。
     注意：回前台、旋转屏幕（安卓 resize 极其频繁）不应无条件全量重渲染，
     否则每次切后台再回来都会把整套头像/一起听界面重建一遍 —— 卡顿主因之一。
     只有「开关状态变了」或「图片数据刚恢复」时才真正重绘。 */
  var _lastApplied = null;
  var _mergeTimer = null;
  var _mergedForce = false;
  function doRefresh(force) {
    var state = readState();
    if (!force && _lastApplied === state) return;
    _lastApplied = state;
    try {
      if (typeof window.reapplyAvatarSwap === 'function') window.reapplyAvatarSwap();
    } catch (e) {}
  }
  function refresh(force) {
    if (force) _mergedForce = true;
    if (_mergeTimer) return;
    _mergeTimer = setTimeout(function () {
      _mergeTimer = null;
      var f = _mergedForce;
      _mergedForce = false;
      doRefresh(f);
    }, 120);
  }
  window.__akiniApplyAvatarSwap = function () { refresh(true); };

  /* 开关点击兜底：core 未接管（状态没变）时补一次状态切换再重渲染。
     必须在捕获阶段记录点击前状态，否则 core 的元素级处理器会先改状态。 */
  var pendingState = null;
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#swapAvatarPosToggle,#swapAvatarRow') : null;
    if (!t) return;
    pendingState = readState();
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#swapAvatarPosToggle,#swapAvatarRow') : null;
    if (!t) return;
    var before = pendingState;
    pendingState = null;
    setTimeout(function () {
      if (before !== null && readState() === before) {
        try { localStorage.setItem(KEY, before ? '0' : '1'); } catch (err) {}
      }
      refresh(true);
    }, 60);
  }, false);

  var _forceOnce = function () { refresh(true); };
  ['DOMContentLoaded', 'load'].forEach(function (ev) {
    if (document.readyState === 'complete' && ev === 'load') { _forceOnce(); return; }
    window.addEventListener(ev, _forceOnce);
  });
  window.addEventListener('akini-img-ready', _forceOnce);
  window.addEventListener('akini-storage-restored', _forceOnce);
  /* 回前台/往返缓存恢复：不强制，只有开关真的变了才重绘 */
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(false); });
  window.addEventListener('pageshow', function () { refresh(false); });
  /* 安卓 resize（地址栏收起/软键盘）会高频触发，必须节流 */
  var _rzTimer = null;
  window.addEventListener('resize', function () {
    if (_rzTimer) clearTimeout(_rzTimer);
    _rzTimer = setTimeout(function () { refresh(false); }, 300);
  });

  refresh(true);
  setTimeout(function () { refresh(true); }, 1200);
})();
