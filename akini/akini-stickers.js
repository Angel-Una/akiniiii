/* zza: 字卡库打开/返回单击修复——iOS 上 click 可能被吞，显式 pointerup/touchend/click 三通道绑定（350ms 防重锁） */
(function () {
 function _bindTap(el, fn) {
   if (!el || el.__zzaTap) return;
   el.__zzaTap = true;
   var lock = 0;
   function go() {
     var now = Date.now();
     if (now - lock < 350) return;
     lock = now;
     try { fn(); } catch (e) {}
   }
   el.addEventListener("pointerup", go, true);
   el.addEventListener("touchend", go, true);
   el.addEventListener("click", go, true);
 }
 function _closeWb() {
   var w = document.getElementById("wordbankOverlay");
   var eo = document.getElementById("wbExclOverlay");
   if (eo) { eo.style.display = "none"; eo.classList.remove("show"); }
   if (w) { w.style.display = "none"; w.classList.remove("show"); }
   try { if (typeof exitBlockMode === "function") exitBlockMode(); } catch (e) {}
   /* 再走一遍主模块的关闭链路，保证内部状态（搜索词/多选/专属页）同步复位 */
   try { var b = document.getElementById("closeWordBank"); b && b.click && b.click(); } catch (e) {}
 }
 function init() {
   _bindTap(document.getElementById("wordBtn"), function () {
     window.__openWordBank && window.__openWordBank();
   });
   _bindTap(document.querySelector("#wordbankOverlay .wb-head-close"), _closeWb);
 }
 if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
 else init();
})();
/* zzj: 补发内容时间戳回写——离线期间应发的内容，时间用计划时间而非上线时间 */
window.__akiniBackdateTs = 0;
window.__akiniNowTs = function () {
 var b = window.__akiniBackdateTs || 0;
 var now = Date.now();

var bd = document.getElementById('wbBlockDoBtn'); if (bd) bd.textContent = '屏蔽(' + cnt + ')';
   var bu = document.getElementById('wbBlockUndoBtn'); if (bu) bu.textContent = '取消屏蔽(' + cnt + ')';
   var sb = document.getElementById('selectBtn');
   if (sb) { var so = on && _srvSelMode; sb.style.background = so ? '#1a1a1a' : ''; sb.style.color = so ? '#fff' : ''; }
   var bb2 = document.getElementById('wbBlockBtn');
   if (bb2) { var bo = on && _srvBlockMode; bb2.style.background = bo ? '#1a1a1a' : ''; bb2.style.color = bo ? '#fff' : ''; }
 }
 function _srvExitModes() { _srvSelMode = false; _srvBlockMode = false; _srvSel = {}; _srvSyncBars(); }
 /* 与 _stkTap 同款的元素级四通道绑定，tab 守卫改为 survey */
 function _srvTap(el, fn) {
   if (typeof el === 'string') el = document.getElementById(el);
   if (!el || el.__srvTapBound) return;
   el.__srvTapBound = 1;
   el.style.cursor = 'pointer';
   el.style.webkitTapHighlightColor = 'transparent';
   el.style.touchAction = 'manipulation';
   el.__srvLock = 0;
   el.__srvHandled = 0;
   var _moved = false, _sx = 0, _sy = 0;
   var swallowNext = function () {
     var done = 0;
     var h = function (ev) {
       if (done) return;
       if (ev.target !== el && !(el.contains && el.contains(ev.target))) return;
       done = 1;
       document.removeEventListener('click', h, true);
       document.removeEventListener('touchend', h, true);
       try { ev.preventDefault(); ev.stopPropagation(); } catch (x) {}
     };
     document.addEventListener('click', h, true);
     document.addEventListener('touchend', h, true);
     setTimeout(function () {
       document.removeEventListener('click', h, true);
       document.removeEventListener('touchend', h, true);
     }, 400);
   };
   var fire = function (evt) {
     var n = Date.now();
     if (n - el.__srvLock < 120) return;
     el.__srvLock = n;
     el.__srvHandled = 1;
     swallowNext();
     if (evt) { try { evt.preventDefault(); evt.stopPropagation(); } catch (x) {} }
     try { fn(evt); } catch (x) {}
   };
   el.addEventListener('touchstart', function (evt) {
     if (evt.touches && evt.touches.length > 0) {
       _sx = evt.touches[0].clientX; _sy = evt.touches[0].clientY; _moved = false;
     }
   }, { passive: true });
   el.addEventListener('touchmove', function (evt) {
     if (evt.touches && evt.touches.length > 0) {
       if (Math.abs(evt.touches[0].clientX - _sx) > 8 || Math.abs(evt.touches[0].clientY - _sy) > 8) _moved = true;
     }
   }, { passive: true });
   el.addEventListener('touchend', function (evt) {
     if (_moved) { _moved = false; return; }
     if (window.__wbTab !== 'survey') return;
     fire(evt);
   }, { passive: false });
   el.addEventListener('click', function (evt) {
     if (window.__wbTab !== 'survey') return;
     if (el.__srvHandled) { el.__srvHandled = 0; return; }
     fire(evt);
   });
 }
 function _srvToggleSearch() {
   var bar = document.getElementById('wbSearchBar');
   if (!bar) return;
   var showing = bar.style.display !== 'none' && bar.style.display !== '';
   var ip = document.getElementById('wbSearchInput');
   if (showing) {
     bar.style.display = 'none';

var tb = document.querySelector('#wordbankOverlay .wb-toolbar');
   if (tb) tb.style.display = '';
   var gf = document.getElementById('wbGroupFilter');
   if (gf) gf.style.display = 'none';
   var addBtn = document.getElementById('addWordBtn');
   if (addBtn) addBtn.style.display = 'none';
   var contacts = [];
   try {
     if (window.akiniContacts && window.akiniContacts.getContacts) {
       contacts = window.akiniContacts.getContacts() || [];
     }
   } catch (e) {}
   if (!contacts.length) {
     try {
       var raw0 = localStorage.getItem("akini_contacts");
       if (raw0) contacts = JSON.parse(raw0) || [];
     } catch (e) {}
   }
   contacts = contacts.filter(function (c) { return c && c.id !== "me" && c.id !== "my"; });
   if (!contacts.length) {
     box.innerHTML = '<div style="text-align:center;color:#999;font-size:14px;padding:60px 20px;line-height:1.8;">还没有联系人<br/>请先在通讯录添加联系人后，再来为 TA 设置专属问卷</div>';
     _srvSyncBars();
     return;
   }
   var activeCid = window.__currentWbSurveyCid;
   var hasActive = contacts.some(function (c) { return String(c.id) === String(activeCid); });
   if (!hasActive) {
     var curChat = (window.akiniContacts && window.akiniContacts.getActiveChatId) ? window.akiniContacts.getActiveChatId() : "";
     if (curChat && contacts.some(function (c) { return String(c.id) === String(curChat); })) {
       activeCid = curChat;
     } else {
       activeCid = contacts[0].id;
     }
     window.__currentWbSurveyCid = activeCid;
   }
   window.__currentWbSurveyCid = activeCid;
   window.__wbSurveyContactId = activeCid;
   var curContact = contacts.find(function (c) { return String(c.id) === String(activeCid); }) || contacts[0];
   var curName = (curContact && curContact.name) || "联系人";
   /* 联系人横条（每个联系人独立问卷库） */
   var h = '<div style="display:flex;align-items:center;gap:12px;overflow-x:auto;padding:8px 16px 10px;margin-top:2px;background:#fff;-webkit-overflow-scrolling:touch;width:100%;box-sizing:border-box;border-bottom:1px solid #f0f0f0;flex-shrink:0;">';
   contacts.forEach(function (c) {
     var on = String(c.id) === String(activeCid);
     var avHtml = nt(c.avatar, 44);
     var cName = (c.name || "对方").replace(/</g, "&lt;");

h += '</div>';
   box.innerHTML = h;
   _srvSyncBars();
   box.querySelectorAll('.wb-survey-person').forEach(function (el) {
     var cid = el.getAttribute('data-cid');
     var handle = function (e) {
       e.preventDefault(); e.stopPropagation();
       window.__currentWbSurveyCid = cid;
       window.__wbSurveyContactId = cid;
       _srvSel = {};
       renderSurveyWbTab();
     };
     el.addEventListener('click', handle);
     el.addEventListener('touchend', handle);
   });
   box.querySelectorAll('.wb-srv-chip').forEach(function (el) {
     var handle = function (e) {
       e.preventDefault(); e.stopPropagation();
       _srvFilterGid = el.getAttribute('data-gid') || '';
       _srvSel = {};
       renderSurveyWbTab();
     };
     el.addEventListener('click', handle);
     el.addEventListener('touchend', handle);
   });
   /* v867：多选/屏蔽模式下点击卡片=切换选中（星星删除/屏蔽均走此选择） */
   box.querySelectorAll('.wb-survey-card').forEach(function (card) {
     var handle = function (e) {
       if (!_srvSelMode && !_srvBlockMode) return;
       if (e.target && e.target.closest && (e.target.closest('.wb-survey-edit-btn') || e.target.closest('.wb-survey-del-btn'))) return;
       e.preventDefault(); e.stopPropagation();
       var sid = card.getAttribute('data-sid');
       if (_srvSel[sid]) delete _srvSel[sid]; else _srvSel[sid] = true;
       var on2 = !!_srvSel[sid];
       card.style.borderColor = on2 ? '#1a1a1a' : '#eee';
       card.style.opacity = (on2 || !card.style.opacity) ? card.style.opacity : card.style.opacity;
       var chk = card.querySelector('.srv-chk');
       if (chk) {
         chk.style.borderColor = on2 ? '#1a1a1a' : '#ccc';
         chk.style.background = on2 ? '#1a1a1a' : '#fff';
         chk.innerHTML = on2 ? '&#10003;' : '';
       }
       _srvSyncBars();
     };
     card.addEventListener('click', handle);
     card.addEventListener('touchend', handle);
   });
   /* 保证弹窗层级最高，能浮在字卡库之上 */
   function _ensureSurveyModalZIndex() {
     ['surveyCreateModal', 'surveyListModal', 'surveyDetailModal', 'surveyCreatedListModal'].forEach(function (id) {
       var m = document.getElementById(id);
       if (m) {
         m.style.zIndex = '8600';
         if (m.parentNode !== document.body) document.body.appendChild(m);
       }
     });
   }
   box.querySelectorAll('.wb-survey-edit-btn').forEach(function (btn) {
     function _onEdit(e) {
       if (e) { e.preventDefault(); e.stopPropagation(); }
       if (_srvSelMode || _srvBlockMode) return;
       var sid = btn.getAttribute('data-sid');
       var sIdx = surveys.findIndex(function (it) { return String(it.id) === String(sid); });
       if (sIdx < 0) return;
       window.__surveyForContactConfig = activeCid;
       window.__currentWbSurveyCid = activeCid;
       window.__wbSurveyContactId = activeCid;
       try { localStorage.setItem("akini_active_chat_id", activeCid); } catch(x){}
       _ensureSurveyModalZIndex();
       if (typeof window.openSurveyEdit === 'function') {
         window.openSurveyEdit(sIdx);
       } else {
         console.warn("[survey] openSurveyEdit not found on window");
       }

function renderStickerTab() {
   var box = document.getElementById('wbContent');
   if (!box) return;
   _applyStickerChrome(true);
   var cid = _getCid();
   var contacts = (window.akiniContacts && window.akiniContacts.getContacts) ? (window.akiniContacts.getContacts() || []) : [];
   var myName = localStorage.getItem('akini_my_name') || '我';
   var _hasSel = _stkSelMode || _stkBlockMode || (function () { for (var k in _stkSel) { if (_stkSel.hasOwnProperty(k)) return true; } return false; })();
   var _sig = cid + '\x1f' + _stkFilterGid + '\x1f' + contacts.length + '\x1f' + myName;
   if (!_hasSel && _stkRenderCache.key === _sig && _stkRenderCache.html) {
     box.innerHTML = _stkRenderCache.html;
     _syncModeBars();
     return;
   }
   var people = [{ id: 'me', name: myName, avatar: _myAvatar() }]
     .concat(contacts.map(function (c) { return { id: c.id, name: c.name || '对方', avatar: c.avatar || '' }; }));
   var h = '<div style="display:flex;gap:14px;overflow-x:auto;padding:6px 16px 8px;margin-top:4px;background:#fff;-webkit-overflow-scrolling:touch;width:100%;box-sizing:border-box;align-self:stretch;flex-shrink:0;min-height:72px;">';
   people.forEach(function (p) {
     var on = String(p.id) === String(cid);
     h += '<div class="wb-stk-person" data-cid="' + p.id + '" style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent;">' +
       '<div style="width:44px;height:44px;border-radius:50%;background:#f0f0f0;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;' + (on ? 'box-shadow:0 0 0 2px #1a1a1a;' : '') + '">' + _avHtml(p.avatar, 44) + '</div>' +
       '<div style="font-size:11px;' + (on ? 'color:#1a1a1a;font-weight:600;' : 'color:#888;') + 'max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2;">' + _esc(p.name) + '</div></div>';
   });
   h += '</div>';
   /* 表情包独立分组筛选条：与其他三个 tab 一致，无分组数据时不显示 */
   var groups = _stkGRead();
   if (groups.length) {
     var arr0 = _stkRead(cid);
     h += '<div style="display:flex;gap:6px;overflow-x:auto;margin:0 16px 8px;padding:5px;background:#f5f5f5;border-radius:14px;-webkit-overflow-scrolling:touch;align-self:stretch;box-sizing:border-box;flex-shrink:0;min-height:40px;">';
     /* chips 样式统一走 .wb-gf-btn（图五：灰底圆角条 + 选中白底黑色线条包裹），不再内联 */
     var chip = function (gid, label, count) {
       var on2 = String(_stkFilterGid) === String(gid);
       return '<button type="button" class="wb-stk-chip wb-gf-btn' + (on2 ? ' active' : '') + '" data-gid="' + gid + '" style="flex-shrink:0;-webkit-tap-highlight-color:transparent;">' + label + (count != null ? '(' + count + ')' : '') + '</button>';
     };
     h += chip('', '全部', null);
     h += chip('__ungrouped__', '未分组', arr0.filter(function (x) { return !x.g; }).length);
     groups.forEach(function (g) {
       h += chip(g.id, _esc(g.name), arr0.filter(function (x) { return String(x.g) === String(g.id); }).length);
     });
     h += '</div>';
   }
   var arr = _stkRead(cid);
   var shown = _stkFiltered(arr);
   /* 白底（去掉灰底），网格每行四个 */
   h += '<div style="padding:0 12px 12px;background:#fff;min-height:200px;width:100%;box-sizing:border-box;align-self:stretch;flex:1 1 auto;"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">';
   shown.forEach(function (row) {
     var it = row.it, i = row.idx;
     var selOn = !!_stkSel[i];
     var inMode = _stkSelMode || _stkBlockMode;
     h += '<div class="wb-stk-item" data-idx="' + i + '" style="position:relative;aspect-ratio:1/1;background:#fff;border:1px solid ' + (selOn ? '#1a1a1a' : '#eee') + ';border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;' + (it.b ? 'opacity:.4;' : '') + '">' +
       /* v660: 懒加载（对齐极简）——上千张表情不再一次性全部解码，只解码滚动到可视区的 */
       '<img src="' + it.s + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:contain;" alt=""/>' +
       (inMode ? '<span class="stk-chk" style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;border:1.5px solid ' + (selOn ? '#1a1a1a' : '#ccc') + ';background:' + (selOn ? '#1a1a1a' : 'rgba(255,255,255,.9)') + ';color:#fff;font-size:12px;line-height:17px;text-align:center;">' + (selOn ? '✓' : '') + '</span>' : '') +
       (it.b ? '<span style="position:absolute;bottom:3px;right:3px;font-size:10px;color:#fff;background:rgba(0,0,0,.55);border-radius:6px;padding:1px 5px;">已屏蔽</span>' : '') +
       '</div>';
   });
   h += '</div>' + (shown.length ? '' : '<div style="text-align:center;color:#bbb;font-size:13px;padding:40px 0;">' + (arr.length ? '没有匹配的表情包' : '还没有表情包，点右上角「新增」添加图片') + '</div>') + '</div>';
   box.innerHTML = h;
   if (!_hasSel) { _stkRenderCache.key = _sig; _stkRenderCache.html = h; }
   _syncModeBars();
   /* 容器级事件委托：window 捕获阶段三通道（pointerdown/touchend/click）。
      iOS 上主字卡模块在 wbContent 的 touchend 里无条件 preventDefault 会抑制 click，
      导致头像切换/分组筛选/格子点击全部失效；捕获阶段先于其执行，彻底绕过。 */
   if (!window.__stkTapDelegated) {
     window.__stkTapDelegated = true;
     /* 统一轻量事件委托：单个 click + 10px 滑动过滤；
        不使用捕获阶段、不拦截默认行为，绝不与其他模块抢事件 */
     var _content = document.getElementById('wbContent');
     if (!_content) return;
     var _slop = { x: 0, y: 0, moved: false };

function _bindTabs() {
   var tabs = document.querySelector('.wb-tabs');
   if (!tabs || tabs.__stkBound) return;
   tabs.__stkBound = 1;
   /* iOS 上原有 touchend 处理器会抑制 click，三条通道并行兜底确保 __wbTab 更新 */
   tabs.addEventListener('click', function () { setTimeout(function () { _syncTab(); }, 0); });
   tabs.addEventListener('touchend', function (e) {
     var t = e.target && e.target.closest ? e.target.closest('.tab') : null;
     if (t) {
       var name = t.getAttribute('data-tab');
       setTimeout(function () { _syncTab(name); }, 0);
       setTimeout(function () { _syncTab(); }, 80);
     }
   }, true);
   if (window.MutationObserver) {
     var mo = new MutationObserver(function () { _syncTab(); });
     mo.observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class'] });
   }
 }
 /* ---- 工具栏接管：表情包 tab 下由表情包模块独立处理（与主字卡/emoji/拍一拍平级） ---- */
 /* 与主模块 a() 完全相同的绑定模式：元素级 touchstart/touchmove/touchend/click，
    touchend fire 后 preventDefault 抑制合成 click + swallow 吞残余 + __stkHandled 双保险，
    confirm/prompt 弹窗不会弹两遍；行为与主字卡/Emoji/拍一拍工具栏完全一致 */
 function _stkTap(el, fn) {
   if (window.__akiniBindTap) window.__akiniBindTap(el, fn, function () { return window.__wbTab === "sticker"; });
 }
 /* 分组管理弹窗 */
 function _stkRenderGroupModal() {
   var list = document.getElementById('stkGroupList');
   var empty = document.getElementById('stkGroupEmpty');
   if (!list) return;
   var groups = _stkGRead();
   var arr = _stkRead(_getCid());
   if (!groups.length) {
     list.innerHTML = '';
     list.style.display = 'none';
     if (empty) empty.style.display = 'block';
     return;
   }
   list.style.display = 'flex';
   if (empty) empty.style.display = 'none';
   var h = '';
   groups.forEach(function (g, gi) {

var mo = new MutationObserver(function () { _syncTab(); });
     mo.observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class'] });
   }
 }
 /* ---- 工具栏接管：表情包 tab 下由表情包模块独立处理（与主字卡/emoji/拍一拍平级） ---- */
 /* 与主模块 a() 完全相同的绑定模式：元素级 touchstart/touchmove/touchend/click，
    touchend fire 后 preventDefault 抑制合成 click + swallow 吞残余 + __stkHandled 双保险，
    confirm/prompt 弹窗不会弹两遍；行为与主字卡/Emoji/拍一拍工具栏完全一致 */
 function _stkTap(el, fn) {
   if (typeof el === 'string') el = document.getElementById(el);
   if (!el || el.__stkTapBound) return;
   el.__stkTapBound = 1;
   el.style.cursor = 'pointer';
   el.style.cursor = 'pointer';
   el.style.webkitTapHighlightColor = 'transparent';
   el.style.touchAction = 'manipulation';
   el.__stkLock = 0;
   el.__stkHandled = 0;
   var _moved = false, _sx = 0, _sy = 0;
   var swallowNext = function () {
     var done = 0;
     var h = function (ev) {
       if (done) return;
       if (ev.target !== el && !(el.contains && el.contains(ev.target))) return;
       done = 1;
       document.removeEventListener('click', h, true);
       document.removeEventListener('touchend', h, true);
       try { ev.preventDefault(); ev.stopPropagation(); } catch (x) {}
     };
     document.addEventListener('click', h, true);
     document.addEventListener('touchend', h, true);
     setTimeout(function () {
       document.removeEventListener('click', h, true);
       document.removeEventListener('touchend', h, true);
     }, 400);
   };
   var fire = function (evt) {
     var n = Date.now();
     if (n - el.__stkLock < 120) return;
     el.__stkLock = n;
     el.__stkHandled = 1;
     swallowNext();
     if (evt) { try { evt.preventDefault(); evt.stopPropagation(); } catch (x) {} }
     try { fn(evt); } catch (x) {}
   };
   el.addEventListener('touchstart', function (evt) {
     if (evt.touches && evt.touches.length > 0) {
       _sx = evt.touches[0].clientX; _sy = evt.touches[0].clientY; _moved = false;
     }
   }, { passive: true });
   el.addEventListener('touchmove', function (evt) {
     if (evt.touches && evt.touches.length > 0) {
       if (Math.abs(evt.touches[0].clientX - _sx) > 8 || Math.abs(evt.touches[0].clientY - _sy) > 8) _moved = true;
     }
   }, { passive: true });
   el.addEventListener('touchend', function (evt) {
     if (_moved) { _moved = false; return; }
     if (window.__wbTab !== 'sticker') return;
     fire(evt);
   }, { passive: false });
   el.addEventListener('click', function (evt) {
     if (window.__wbTab !== 'sticker') return;
     if (el.__stkHandled) { el.__stkHandled = 0; return; }
     fire(evt);
   });
 }
 /* 分组管理弹窗 */
 function _stkRenderGroupModal() {
   var list = document.getElementById('stkGroupList');
   var empty = document.getElementById('stkGroupEmpty');
   if (!list) return;