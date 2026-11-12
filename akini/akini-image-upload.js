/* ============================================================
   akini-image-upload.js — 统一图片上传引擎（拍立得 / 首页封面 / 纪念日底图）
   设计原则：
   1. 单一入口：所有图片选择 → 压缩 → 上墙 → 持久化 走同一套流程
   2. 单一委托：一个 document click 监听器负责触发对应 file input
   3. 无内联依赖：不依赖 HTML 上的 onclick/onchange
   4. 幂等绑定：input 的 change 事件只绑一次
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 配置：区域 ↔ 元素ID ↔ inputID ↔ 存储键 ---------- */
  var AREAS = {
    s1cover:  { elId: 's1CoverBg',       inputId: 's1CoverInputDirect', keys: ['akini_s1_cover', 'akini_s1_cover_bg', 's1_cover'] },
    polaroid: { elId: 's1PolaroidImg',   inputId: 's1PhotoInputDirect', keys: ['akini_s1_photo', 'akini_s1_polaroid_img'] },
    cover:    { elId: 'coverAreaMain',   inputId: 's2CoverInputDirect', keys: ['akini_cover_bg', 'akini_cover_img', 'akini_s2_cover', 'cover_bg'] },
    daybg:    { elId: 'bgArea',          inputId: 's2DayBgInputDirect',  keys: ['akini_day_bg', 'akini_bg_img', 'akini_anniv_bg', 'day_bg'] }
  };

  /* ---------- 工具函数 ---------- */

  // 把 dataUrl 设为元素背景（用 !important 防止 CSS 简写覆盖）
  function applyBg(elId, dataUrl) {
    var el = document.getElementById(elId);
    if (!el || !dataUrl) return;
    el.style.setProperty('background-image', 'url("' + dataUrl + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
  }

  // 把 dataUrl 写入所有存储键（localStorage + IDB 兜底）
  function persist(keys, dataUrl) {
    for (var i = 0; i < keys.length; i++) {
      try { localStorage.setItem(keys[i], dataUrl); } catch (e) {}
    }
    try {
      if (window.akiniStore && typeof window.akiniStore.set === 'function') {
        window.akiniStore.set(keys[0], dataUrl);
        if (typeof window.akiniStore.flushIdb === 'function') window.akiniStore.flushIdb();
      }
    } catch (e) {}
  }

  // 取第一个非空存储值
  function firstValid(keys) {
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = localStorage.getItem(keys[i]);
        if (v && v.length > 10) return v;
      } catch (e) {}
    }
    return null;
  }

  // 压缩（如果有压缩函数），否则原样回调
  function compress(dataUrl, cb) {
    if (typeof window.compressImageDataUrl === 'function') {
      window.compressImageDataUrl(dataUrl, function (c) { cb(c || dataUrl); });
    } else {
      cb(dataUrl);
    }
  }

  /* ---------- 核心：处理选中的图片文件 ---------- */
  function processFile(type, file) {
    if (!file) return;
    var area = AREAS[type];
    if (!area) return;

    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target.result;
      compress(dataUrl, function (finalUrl) {
        applyBg(area.elId, finalUrl);
        persist(area.keys, finalUrl);
      });
    };
    reader.onerror = function () {
      if (window.akiniToast) window.akiniToast('图片读取失败，请重试');
    };
    reader.readAsDataURL(file);
  }

  /* ---------- 绑定 input 的 change 事件（幂等） ---------- */
  function bindInput(type) {
    var area = AREAS[type];
    var input = document.getElementById(area.inputId);
    if (!input || input.__akImgBound) return;
    input.__akImgBound = true;
    input.addEventListener('change', function (e) {
      processFile(type, e.target.files && e.target.files[0]);
      // 重置 input，允许重复选同一张图
      try { e.target.value = ''; } catch (err) {}
    });
  }

  /* ---------- 全局点击委托：点击区域 → 触发对应 input ---------- */
  function setupClickDelegation() {
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      // 点到 input 本身不处理
      if (t && t.tagName === 'INPUT' && t.type === 'file') return;

      var host = t && t.closest ? t.closest('#s1CoverBg, #s1PolaroidImg, #coverAreaMain, #dualAvatarWrap, #bgArea') : null;
      if (!host) return;

      var id = host.id;
      var inputId = null;
      if (id === 's1CoverBg') inputId = AREAS.s1cover.inputId;
      else if (id === 's1PolaroidImg') inputId = AREAS.polaroid.inputId;
      else if (id === 'coverAreaMain' || id === 'dualAvatarWrap') inputId = AREAS.cover.inputId;
      else if (id === 'bgArea') inputId = AREAS.daybg.inputId;

      if (inputId) {
        ev.preventDefault();
        ev.stopPropagation();
        var inp = document.getElementById(inputId);
        if (inp) {
          try { inp.value = ''; } catch (e) {}
          inp.click();
        }
      }
    });
  }

  /* ---------- 恢复已保存的图片 ---------- */
  function restoreAll() {
    applyBg(AREAS.s1cover.elId,  firstValid(AREAS.s1cover.keys));
    applyBg(AREAS.polaroid.elId, firstValid(AREAS.polaroid.keys));
    applyBg(AREAS.cover.elId,    firstValid(AREAS.cover.keys));
    applyBg(AREAS.daybg.elId,    firstValid(AREAS.daybg.keys));
  }

  /* ---------- 初始化 ---------- */
  function init() {
    bindInput('s1cover');
    bindInput('polaroid');
    bindInput('cover');
    bindInput('daybg');
    setupClickDelegation();
    restoreAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 存储层恢复后再次恢复图片（数据可能从 IDB 异步加载）
  function onStorageReady() { restoreAll(); }
  if (window.__akiniStorageRestored) {
    onStorageReady();
  } else {
    var prev = window.__akiniOnStorageRestored;
    window.__akiniOnStorageRestored = function () {
      if (typeof prev === 'function') { try { prev(); } catch (e) {} }
      onStorageReady();
    };
  }

  /* ---------- 兼容旧内联 onchange（HTML 里残留的 onchange 仍可调用） ---------- */
  window.handleS1CoverDirect = function (e) { processFile('s1cover',  e.target && e.target.files && e.target.files[0]); };
  window.handleS1PhotoDirect = function (e) { processFile('polaroid', e.target && e.target.files && e.target.files[0]); };
  window.handleS2CoverDirect = function (e) { processFile('cover',    e.target && e.target.files && e.target.files[0]); };
  window.handleS2DayBgDirect  = function (e) { processFile('daybg',    e.target && e.target.files && e.target.files[0]); };
  window.triggerDayBgUpload   = function ()  { var i = document.getElementById(AREAS.daybg.inputId); if (i) i.click(); };

})();
