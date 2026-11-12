
function contacts() {
   try { return (window.akiniContacts && window.akiniContacts.getContacts) ? (window.akiniContacts.getContacts() || []) : []; } catch (e) { return []; }
 }
 function contactById(id) {
   try { return (window.akiniContacts && window.akiniContacts.getContactById) ? window.akiniContacts.getContactById(id) : null; } catch (e) { return null; }
 }
 function goHome() { try { window.navTo('home'); } catch (e) { var h = $('homeArea'); if (h) h.style.display = 'flex'; } }
 function openSheet(id) { var e = $(id); if (e) e.style.display = 'flex'; }
 function closeSheet(id) { var e = $(id); if (e) e.style.display = 'none'; }
 /* ============================================================
  * 一、陪伴
  * ============================================================ */
 var COMPANION_KEY = 'akini_companion_state';
 var COMPANION_BG_KEY = 'akini_companion_bg';
 var _companionSel = null;
 var _companionTimer = null;
 var _companionBg = ''; /* 内存缓存，进入时从 IDB 读 */
 var EMOJIS = ['😀','😄','😆','🥰','😘','😚','😊','😉','🤗','😋','😜','😝','😭','😡','🥺','😴','🤒','😳','😱','😬','🙄','😇','🤭','😪','😤','🙃','😈','👻','👍','🙏','👏','🤝','💗','💖','💕','💘','💝','❤️','🎉','🎂','🌹','⭐'];
 function companionState() {
   try { return JSON.parse(lsGet(COMPANION_KEY, 'null')); } catch (e) { return null; }
 }
 function saveCompanionState(st) { lsSet(COMPANION_KEY, JSON.stringify(st)); }
 function renderCompanionPicker() {
   var list = $('companionContactList');
   if (!list) return;
   var cs = contacts();
   if (!cs.length) {
     list.innerHTML = '<div style="text-align:center;color:#999;font-size:14px;padding:60px 0;line-height:1.8">还没有联系人<br>去微信-通讯录添加一位吧</div>';
     return;
   }
   list.innerHTML = cs.map(function (c) {
     var on = _companionSel === c.id;
     return '<div class="akcp-item" data-cid="' + esc(c.id) + '" style="display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid #f0f0f0;cursor:pointer;-webkit-tap-highlight-color:transparent">'
       + '<div style="width:22px;height:22px;border-radius:50%;border:2px solid ' + (on ? '#1a1a1a' : '#ddd') + ';background:' + (on ? '#1a1a1a' : '#fff') + ';color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + (on ? '\u2713' : '') + '</div>'
       + '<div style="width:44px;height:44px;border-radius:50%;background:#e8e8e8;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">' + avatarInner(c.avatar) + '</div>'
       + '<div style="flex:1;min-width:0;font-size:16px;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(c.name || '未命名') + '</div>'
       + '</div>';
   }).join('');
   Array.prototype.forEach.call(list.querySelectorAll('.akcp-item'), function (el) {
     el.addEventListener('click', function () {
       _companionSel = el.getAttribute('data-cid');
       renderCompanionPicker();
       updateCompanionConfirm();
     });
   });
   updateCompanionConfirm();
 }
 function updateCompanionConfirm() {
   var info = $('companionPickerSelectedInfo');
   var c = _companionSel ? contactById(_companionSel) : null;
   if (info) info.textContent = c ? ('已选择：' + (c.name || '未命名')) : '已选择 0 人';
 }
 function fmtDur(ms) {
   var s = Math.max(0, Math.floor(ms / 1000));
   var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
   function p(n) { return (n < 10 ? '0' : '') + n; }
   return p(h) + ':' + p(m) + ':' + p(ss);
 }
 function showCompanionView(view) {
   var pv = $('companionPickerView'), mv = $('companionMainView');
   if (pv) pv.style.display = view === 'picker' ? 'flex' : 'none';
   if (mv) mv.style.display = view === 'main' ? 'flex' : 'none';
 }
 function applyCompanionBg() {
   var layer = $('companionBgLayer'), dim = $('companionBgDim');
   if (!layer || !dim) return;
   var app = $('app-companion');
   if (isImgSrc(_companionBg)) {
     layer.style.backgroundImage = 'url(' + _companionBg + ')';
     layer.style.display = 'block';
     dim.style.display = 'block'; /* 更换背景图后整体带一层浅黑色 */
     if (app) app.classList.add('hasBg'); /* 气泡切自定义背景适配样式 */
   } else {
     layer.style.display = 'none';
     dim.style.display = 'none';
     if (app) app.classList.remove('hasBg'); /* 默认背景用默认气泡 */
   }
 }
 function renderCompanionMsgs(scrollBottom) {
   var box = $('companionMsgs');
   if (!box) return;
   var st = companionState();
   var msgs = (st && st.msgs) || [];
   if (!msgs.length) {
     box.innerHTML = '<div style="text-align:center;color:#bbb;font-size:13px;padding:26px 0 0;line-height:1.8">陪伴开始啦<br>在下面发条消息给对方吧~</div>';
     return;
   }
   /* 陪伴气泡不显示头像（用户需求），仅消息内容居中/两侧对齐 */
   box.innerHTML = '';
   msgs.forEach(function (m) {
     var me = m.side === 'me';
     var row = document.createElement('div');
     row.className = 'msg-row ' + (me ? 'me' : 'other');
     row.setAttribute('data-ts', String(m.ts || Date.now()));
     row.style.paddingLeft = '0';
     row.style.paddingRight = '0';
     var bubbleHtml = m.img
       ? '<div class="bubble sticker-bubble" style="background:transparent;padding:0;box-shadow:none;border:none;"><img src="' + esc(m.img) + '" style="max-width:120px;max-height:120px;border-radius:8px;display:block;" alt=""/></div>'
       : '<div class="bubble">' + esc(m.text || '') + '</div>';
     row.innerHTML = '<div class="msg-content-line">' + bubbleHtml + '</div>';
     box.appendChild(row);
     try { if (typeof window.__akiniProcessMsgMeta === 'function') window.__akiniProcessMsgMeta(row); } catch (e) {}
   });
   if (scrollBottom !== false) box.scrollTop = box.scrollHeight;
 }
 /* 陪伴历史存储 key */
 var COMPANION_HISTORY_KEY = 'akini_companion_history';
 function companionHistory() {
   try { return JSON.parse(lsGet(COMPANION_HISTORY_KEY, '[]')) || []; } catch (e) { return []; }

+ '<div style="font-size:12px;color:#999;margin-top:2px">' + (h.msgCount || 0) + ' 条聊天记录</div>'
       + '</div>'
       + '</div>';
   }).join('');
 }
 function startCompanion(cid) {
   /* 距离只在开启陪伴时随机生成一次（0-1000），随会话固化保存；
      退出陪伴后下次开启才重新随机；计时每次从 0 开始（不累计） */
   /* 距离 0-100 米，保留一位小数 */
   var st = { cid: cid, ts: Date.now(), msgs: [], dist: Math.round(Math.random() * 1000) / 10 };
   saveCompanionState(st);
   enterCompanionMain(st);
 }
 function enterCompanionMain(st) {
   var c = contactById(st.cid);
   var name = c ? (c.name || '未命名') : '对方';
   var ava = c ? c.avatar : '';
   var myA = $('companionMyAvatar'), taA = $('companionTaAvatar');
   if (myA) myA.innerHTML = avatarInner(myAvatar());
   if (taA) taA.innerHTML = avatarInner(ava);
   /* 距离读取本轮陪伴固化的 dist（开启时生成）；旧数据无 dist 时补一次并保存，之后不再变 */
   var dd = $('companionDistance');
   if (dd) {
     if (typeof st.dist !== 'number' || isNaN(st.dist)) {
       st.dist = Math.round(Math.random() * 1000) / 10;
       saveCompanionState(st);
     }
     dd.textContent = 'TA距离你' + st.dist.toFixed(1) + '米';
   }
   applyCompanionBg();
   renderCompanionMsgs(false);
   showCompanionView('main');
   if (_companionTimer) { clearInterval(_companionTimer); _companionTimer = null; }
   var timerEl = $('companionTimer');
   var tick = function () {
     var cur = companionState();
     if (!cur) { if (timerEl) timerEl.textContent = '00:00:00'; return; }
     if (timerEl) timerEl.textContent = fmtDur(Date.now() - cur.ts);
   };
   tick();
   _companionTimer = setInterval(tick, 1000);
 }
 function endCompanion() {
   /* 退出前归档陪伴历史（对象/时长/消息条数），再清空状态 */
   var st = companionState();
   if (st && st.cid) pushCompanionHistory(st);
   /* 主程序重写了 localStorage.removeItem（失效），且快照恢复会把 'null' 视为丢失并复活旧值；
      故写 '{"cleared":true}' 墓碑：非空不进恢复条件，解析后无 cid 即无会话 */
   lsSet(COMPANION_KEY, '{"cleared":true}');
   if (_companionTimer) { clearInterval(_companionTimer); _companionTimer = null; }
   _companionSel = null;
   closeSheet('companionMenuSheet');
   showCompanionView('picker');
   renderCompanionPicker();
 }
 function myStickerPool() {
   /* 修复：我给自己添加的表情包在 akini_stickers_me（与字卡库表情包 tab 同一数据源）。
      用 getContactStickersSync('me')（与观影/聊天同一直读 localStorage 的通道），
      不用 __wbRead——其内存缓存可能滞后于最新写入导致读取为空；无后缀旧数据并入兼容 */
   /* 修复：直读 localStorage（与字卡库 _stkRead 同通道）——
      getContactStickersSync 有 __csCache 内存缓存可能陈旧，__wbRead 走 akiniStore 缓存层也可能滞后，
      都会让"我"刚添加的表情包读不出来；无后缀旧数据并入兼容 */
   var arr = [];
   try {
     arr = JSON.parse(lsGet('akini_stickers_me', '[]')) || [];
   } catch (e) {}

/* v645: 不在陪伴界面时计未读角标 */
     try { window.__akiniIncrFeatureUnread && window.__akiniIncrFeatureUnread('companion'); } catch (eU) {}
     window.showInAppNotif({
       app: '陪伴',
       appIcon: '🎧',
       avatar: (cc && cc.avatar) || '',
       name: (cc && cc.name) || '陪伴对象',
       fullContent: true,
       msg: msg || '',
       onTap: function () {
         try { window.__openCompanion && window.__openCompanion(); } catch (e0) {}
       }
     });
   } catch (e) {}
 }
 function sendCompanionMsg(imgUrl) {
   var st = companionState();
   if (!st) return;
   var input = $('companionMsgInput');
   var v = imgUrl ? '' : ((input && input.value || '').trim());
   if (!imgUrl && !v) return;
   st.msgs = st.msgs || [];
   st.msgs.push(imgUrl ? { side: 'me', img: imgUrl, ts: Date.now() } : { side: 'me', text: v, ts: Date.now() });
   saveCompanionState(st);
   if (input) input.value = '';
   renderCompanionMsgs(true);
   scheduleCompanionReply(st.cid);
 }
 window.__openCompanion = function () {
   idbGet(COMPANION_BG_KEY, function (v) { _companionBg = v || ''; applyCompanionBg(); });
   /* 会话保持（与一起听一致）——存在进行中的陪伴会话时直接回到陪伴主界面，
      切出/返回/刷新都不重置；仅「退出陪伴」主动操作才清除会话回选人页 */
   var st = companionState();
   if (st && st.cid && contactById(st.cid)) {
     enterCompanionMain(st);
     return;
   }
   var d = window.__akiniDefaultContact && window.__akiniDefaultContact();
   if (d) {
     _companionSel = d.id;
     startCompanion(d.id);
     return;
   }
   _companionSel = null;
   showCompanionView('picker');
   renderCompanionPicker();
 };
 function bindCompanion() {
   var back1 = $('companionBackBtn'), back2 = $('companionMainBackBtn');
   var confirm = $('companionConfirmBtn');
   var histBtn = $('companionHistoryBtn');
   var histClose = $('companionHistoryClose');
   var histOverlay = $('companionHistoryOverlay');
   var menuBtn = $('companionMenuBtn');
   var menuCancel = $('companionMenuCancel');
   var menuSheet = $('companionMenuSheet');
   var actBg = $('companionActBg');
   var actBgReset = $('companionActBgReset');
   var actExit = $('companionActExit');
   var bgInput = $('companionBgInput');
   var msgInput = $('companionMsgInput');
   var emojiBtn = $('companionEmojiBtn');
   var emojiSheet = $('companionEmojiSheet');
   var emojiGrid = $('companionEmojiGrid');
   if (back1) back1.addEventListener('click', goHome);
   if (back2) back2.addEventListener('click', goHome);
   if (histBtn) histBtn.addEventListener('click', function () {

renderCompanionHistory();
     openSheet('companionHistoryOverlay');
   });
   if (histClose) histClose.addEventListener('click', function () {
     closeSheet('companionHistoryOverlay');
   });
   if (histOverlay) histOverlay.addEventListener('click', function (e) {
     if (e.target === histOverlay) closeSheet('companionHistoryOverlay');
   });
   if (confirm) confirm.addEventListener('click', function () {
     if (!_companionSel) return;
     startCompanion(_companionSel);
   });
   if (menuBtn) menuBtn.addEventListener('click', function () { openSheet('companionMenuSheet'); });
   if (menuCancel) menuCancel.addEventListener('click', function () { closeSheet('companionMenuSheet'); });
   if (menuSheet) menuSheet.addEventListener('click', function (e) { if (e.target === menuSheet) closeSheet('companionMenuSheet'); });
   if (actBg) actBg.addEventListener('click', function () {
     closeSheet('companionMenuSheet');
     if (bgInput) bgInput.click();
   });
   if (actBgReset) actBgReset.addEventListener('click', function () {
     closeSheet('companionMenuSheet');
     _companionBg = '';
     idbSet(COMPANION_BG_KEY, '');
     applyCompanionBg();
   });
   if (actExit) actExit.addEventListener('click', endCompanion);
   if (bgInput) bgInput.addEventListener('change', function () {
     var f = this.files && this.files[0];

for (var i = 0; i < b.title.length; i++) h = (h * 31 + b.title.charCodeAt(i)) >>> 0;
   var g = COVER_GRADS[h % COVER_GRADS.length];
   return '<div style="width:100%;height:100%;background:linear-gradient(150deg,' + g[0] + ',' + g[1] + ');display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;box-sizing:border-box">'
     + '<div style="font-size:14px;font-weight:700;color:rgba(60,40,20,.85);text-align:center;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;word-break:break-all">' + esc(b.title) + '</div>'
     + '<div style="margin-top:6px;width:24px;height:2px;background:rgba(60,40,20,.35);border-radius:1px"></div>'
     + '</div>';
 }
 window.__renderNovelShelf = function () {
   loadBooks(function () {
     var grid = $('novelShelfGrid');
     var tip = $('novelEmptyTip');
     if (!grid) return;
     if (tip) tip.style.display = _books.length ? 'none' : 'block';
     grid.innerHTML = _books.map(function (b) {
       var cover = isImgSrc(b.cover)
         ? '<img src="' + esc(b.cover) + '" style="width:100%;height:100%;object-fit:cover;">'
         : defaultCover(b);
       return '<div class="aknv-book" data-bid="' + esc(b.id) + '" style="cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none">'
         + '<div style="width:100%;aspect-ratio:3/4;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);background:#eee">' + cover + '</div>'
         + '<div style="margin-top:6px;font-size:13px;color:#333;text-align:center;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-all">' + esc(b.title) + '</div>'
         + '</div>';
     }).join('');
     bindBookEvents(grid);
   });
 };
 function bindBookEvents(grid) {
   Array.prototype.forEach.call(grid.querySelectorAll('.aknv-book'), function (el) {
     var lpTimer = null, longFired = false;
     var start = function () {
       longFired = false;
       var bid = el.getAttribute('data-bid');
       lpTimer = setTimeout(function () {
         longFired = true;
         if (_manageMode) return;
         _curBook = _books.filter(function (b) { return b.id === bid; })[0] || null;
         if (_curBook) openSheet('novelBookActions');
         try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
       }, 600);
         try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
       }, 600);
     };
     var cancel = function () { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } };
     el.addEventListener('touchstart', start, { passive: true });
     el.addEventListener('touchend', cancel);
     el.addEventListener('touchmove', cancel);
     el.addEventListener('mousedown', start);
     el.addEventListener('mouseup', cancel);
     el.addEventListener('mouseleave', cancel);
     el.addEventListener('click', function () {
       if (longFired) { longFired = false; return; }
       if (_manageMode) { openEditBook(el.getAttribute('data-bid')); return; }
       var bid = el.getAttribute('data-bid');
       _curBook = _books.filter(function (b) { return b.id === bid; })[0] || null;
       if (_curBook) openNovelPicker();
     });
   });
 }
 /* ---------- 导入 txt ---------- */
 function decodeText(buf) {
   /* 根治乱码：先按 UTF-8 严格解码（带 BOM 去头），任何非法字节才回退 GB18030 */
   var u8 = new Uint8Array(buf);
   if (u8.length >= 3 && u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) u8 = u8.subarray(3);
   if (u8.length >= 2 && ((u8[0] === 0xFF && u8[1] === 0xFE) || (u8[0] === 0xFE && u8[1] === 0xFF))) {
     try { return new TextDecoder('utf-16').decode(u8); } catch (e0) {}
   }
   /* 分块流式解码——大文件一次性 decode 会在低端机产生巨大内存峰值导致页面卡死/崩溃，
      按 4MB 分块 stream 解码，多字节字符跨块由 TextDecoder 自动处理 */
   function streamDecode(u8d, enc, fatal) {
     var dec = fatal ? new TextDecoder(enc, { fatal: true }) : new TextDecoder(enc);
     var CH = 4 * 1024 * 1024, out = '';
     for (var i = 0; i < u8d.length; i += CH) {
       out += dec.decode(u8d.subarray(i, Math.min(i + CH, u8d.length)), { stream: true });
     }
     return out + dec.decode();
   }
   try { return streamDecode(u8, 'utf-8', true); } catch (e) {}
   try { return streamDecode(u8, 'gb18030', false); } catch (e2) {}
   try { return streamDecode(u8, 'utf-8', false); } catch (e3) { return ''; }
 }
 /* 书籍信息里保存/读取章节缓存，切换书籍后章节列表立即可用 */
 var CHAPTER_CACHE_PREFIX = 'akini_novel_chapters_';
 function cacheChapters(bookId, chapters) {
   /* v663：章节缓存只写 IDB，不再写 localStorage（防止大文本爆配额） */
   try { idbSet(CHAPTER_CACHE_PREFIX + bookId, JSON.stringify(chapters)); } catch (e) {}
   try { window._idbStore && window._idbStore.flush && window._idbStore.flush(); } catch (e) {}
 }
 function loadCachedChapters(bookId) {
   try {

function openReader() {
   if (!_curBook) return;
   closeSheet('novelPickerOverlay');
   var myA = $('novelReaderMyAvatar'), taA = $('novelReaderTaAvatar');
   var avs = _readerContacts.map(function (id) { return contactById(id); }).filter(Boolean);
   if (myA) { myA.style.width = '40px'; myA.style.height = '40px'; myA.innerHTML = avatarInner(myAvatar()); }
   if (taA) {
     taA.style.width = 'auto'; taA.style.height = '40px'; taA.style.background = 'transparent';
     taA.style.border = 'none'; taA.style.overflow = 'visible'; taA.style.marginLeft = '0';
     taA.style.display = 'flex'; taA.style.alignItems = 'center';
     taA.innerHTML = avs.length ? avs.map(function (c2, i) {
       return '<div style="width:40px;height:40px;border-radius:50%;background:#e8e8e8;overflow:hidden;border:2px solid #fff;margin-left:' + (i ? '-14px' : '-10px') + ';position:relative;z-index:' + (20 - i) + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' + avatarInner(c2.avatar) + '</div>';
     }).join('') : '<span style="font-size:14px;color:#bbb;margin-left:-10px">+</span>';
   }
   var tt = $('novelReaderTitle');
   if (tt) tt.textContent = _curBook.title;
   var content = $('novelReaderContent');
   if (content) content.innerHTML = '<div style="text-align:center;color:#999;padding:40px 0">加载中…</div>';
   window.showEl('app-novel-reader');
   applyReaderSettings();
   idbGet(CONTENT_PREFIX + _curBook.id, function (txt) {
     txt = txt || '';
     _readerParas = txt.split(/\n+/).map(function (p) { return p.trim(); }).filter(function (p) { return p !== ''; });
     _readerChapters = parseChapters(_readerParas);
     cacheChapters(_curBook.id, _readerChapters);
     _readerIdx = 0;
     if (content) content.innerHTML = '';
     if (flipMode() === 'page') {
       enterPageMode();
       restorePageProgress();
     } else {
       exitPageMode();
       renderMoreParas();
       /* 打开一律从文章开头开始，不再跳到中间；
          有历史进度时浮出"继续上次阅读"胶囊，点击才跳到上次段落开头 */
       if (content) content.scrollTop = 0;
       var prog = parseInt(lsGet(PROGRESS_PREFIX + _curBook.id, '0'), 10) || 0;
       if (content && prog > 5 && prog < _readerParas.length - 1) showResumeTip(prog);
     }
   });
 }
 /* 继续上次阅读浮动胶囊（8 秒自动消失，滚动后消失） */
 function showResumeTip(prog) {
   var content = $('novelReaderContent');
   if (!content || !content.parentElement) return;
   var old = $('novelResumeTip');
   if (old) old.remove();
   var host = content.parentElement;
   var hs = window.getComputedStyle(host).position;
   if (hs === 'static') host.style.position = 'relative';
   var tip = document.createElement('button');
   tip.id = 'novelResumeTip';
   tip.type = 'button';
   tip.textContent = '继续上次阅读 · 第' + prog + '段';
   tip.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:30;background:rgba(26,26,26,.88);color:#fff;font-size:13px;padding:9px 16px;border:none;border-radius:20px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;touch-action:manipulation;white-space:nowrap';
   tip.addEventListener('click', function () {
     var target = Math.min(_readerParas.length, Math.round(prog));
     while (_readerIdx < target) renderMoreParas();
     requestAnimationFrame(function () {
       var el = content.querySelector('[data-pidx="' + Math.max(0, target - 1) + '"]');
       if (el) content.scrollTop = Math.max(0, el.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 12);
     });
     tip.remove();
   });
   host.appendChild(tip);
   var kill = function () { try { tip.remove(); } catch (e) {} };
   setTimeout(kill, 8000);
   content.addEventListener('scroll', kill, { once: true, passive: true });
 }
 function renderMoreParas() {
   var content = $('novelReaderContent');
   if (!content || !_readerParas.length) {
     if (content && !_readerParas.length) content.innerHTML = '<div style="text-align:center;color:#999;padding:40px 0">这本书没有内容</div>';
     return;
   }
   var end = Math.min(_readerParas.length, _readerIdx + RENDER_CHUNK);
   var html = '';
   for (var i = _readerIdx; i < end; i++) {
     html += '<p data-pidx="' + i + '" style="margin:0 0 1em;text-indent:2em;word-break:break-all">' + esc(_readerParas[i]) + '</p>';
   }
   if (end >= _readerParas.length) html += '<div id="novelProgressMarker" style="text-align:center;color:#bbb;font-size:12px;padding:24px 0">— 全书完 —</div>';
   var marker = $('novelProgressMarker');
   if (marker) marker.remove();
   var wrap = document.createElement('div');
   wrap.innerHTML = html;
   while (wrap.firstChild) content.appendChild(wrap.firstChild);
   _readerIdx = end;
   try { window._akiniDecorateCm && window._akiniDecorateCm(); } catch (e) {}
 }
 function saveProgress() {
   if (!_curBook) return;
   lsSet(PROGRESS_PREFIX + _curBook.id, String(_readerIdx));
 }
 function closeReader() {
   if (flipMode() === 'page') savePageProgress(); else saveProgress();
   var e = $('app-novel-reader');
   if (e) e.style.display = 'none';
   closeChapterDrawer();
   window.__renderNovelShelf();
 }
 /* ---------- 章节目录侧滑面板 ---------- */
 function openChapterDrawer() {
   var drawer = $('novelChapterDrawer');
   var panel = $('novelChapterDrawerPanel');
   var list = $('novelChapterDrawerList');
   if (!drawer || !panel || !list) return;
   renderChapterList(list);
   drawer.style.display = 'flex';
   requestAnimationFrame(function () { panel.style.transform = 'translateX(0)'; });
 }

saveProgress();
   }
 }
 /* ---------- 绑定 ---------- */
 function bindNovel() {
   var back = $('novelBackBtn');
   var addBtn = $('novelAddBtn');
   var importInput = $('novelImportInput');
   var readerBack = $('novelReaderBackBtn');
   var chapterMenuBtn = $('novelChapterMenuBtn');
   var chapterDrawer = $('novelChapterDrawer');
   var chapterDrawerMask = $('novelChapterDrawerMask');
   var chapterDrawerClose = $('novelChapterDrawerClose');
   var menuBtn = $('novelMenuBtn');
   var menuClose = $('novelMenuClose');
   var menuOverlay = $('novelReaderMenu');
   var fsMinus = $('novelFontMinus'), fsPlus = $('novelFontPlus');
   var bgRow = $('novelBgColors');
   var bgInput = $('novelBgInput');
   var flipScroll = $('novelFlipScroll'), flipPage = $('novelFlipPage');
   var pickerClose = $('novelPickerClose');
   var pickerConfirm = $('novelPickerConfirm');
   var pickerOverlay = $('novelPickerOverlay');
   var actOverlay = $('novelBookActions');
   var actCover = $('novelActCover');
   var actRename = $('novelActRename');
   var actDelete = $('novelActDelete');
   var actCancel = $('novelActCancel');
   var coverInput = $('novelCoverInput');
   var renameOverlay = $('novelRenameModal');
   var renameInput = $('novelRenameInput');
   var renameOk = $('novelRenameOk');
   var renameCancel = $('novelRenameCancel');
   var content = $('novelReaderContent');
   if (back) back.addEventListener('click', goHome);
   /* 加号改为「导入/管理」菜单，绑定在补丁段 bindNovelMenu */
   if (importInput) importInput.addEventListener('change', function () {
     var f = this.files && this.files[0];
     this.value = '';
     importNovel(f);
   });
   if (readerBack) readerBack.addEventListener('click', closeReader);
   if (chapterMenuBtn) chapterMenuBtn.addEventListener('click', function () { openChapterDrawer(); });
   if (chapterDrawerClose) chapterDrawerClose.addEventListener('click', closeChapterDrawer);
   if (chapterDrawerMask) chapterDrawerMask.addEventListener('click', closeChapterDrawer);
   if (chapterDrawer) chapterDrawer.addEventListener('click', function (e) { if (e.target === chapterDrawer) closeChapterDrawer(); });
   if (menuBtn) menuBtn.addEventListener('click', function () { openSheet('novelReaderMenu'); });
   if (menuClose) menuClose.addEventListener('click', function () { closeSheet('novelReaderMenu'); });

}
 }
 /* ---------- 启动 ---------- */
 function boot() {
   bindCompanion();
   bindNovel();
 }
 if (document.readyState === 'loading') {
 /* ============================================================
    书架管理（画笔改封面书名）+ 段评系统（长按选段/圆圈计数/定时回复/永久保存）
    ============================================================ */
 var _manageMode = false;
 var _cmPending = null;   /* 待添加段评 {pidx, quote} */
 var _cmViewing = null;   /* 查看中的段评 id */
 var CM_PREFIX = 'akini_nvcm_';
 function cmLoad() {
   if (!_curBook) return [];
   try { return JSON.parse(lsGet(CM_PREFIX + _curBook.id, '[]')) || []; } catch (e) { return []; }
 }
 function cmSave(list) {
   if (!_curBook) return;
   lsSet(CM_PREFIX + _curBook.id, JSON.stringify(list));

}
 /* ---------- 书架管理模式 ---------- */
 function ensureManageDom() {
   if ($('aknvAddMenu')) return;
   var menu = document.createElement('div');
   menu.id = 'aknvAddMenu';
   menu.style.cssText = 'display:none;position:fixed;top:52px;right:10px;z-index:6013;background:#fff;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.16);overflow:hidden;min-width:120px';
   menu.innerHTML = '<button id="aknvMenuImport" type="button" style="display:block;width:100%;padding:13px 18px;background:#fff;border:none;font-size:15px;color:#1a1a1a;text-align:left;cursor:pointer;border-bottom:1px solid #f0f0f0">导入</button>'
     + '<button id="aknvMenuManage" type="button" style="display:block;width:100%;padding:13px 18px;background:#fff;border:none;font-size:15px;color:#1a1a1a;text-align:left;cursor:pointer">管理</button>';
   document.body.appendChild(menu);
   $('aknvMenuImport').addEventListener('click', function () {
     menu.style.display = 'none';
     var inp = $('novelImportInput');
     if (inp) inp.click();
   });
   $('aknvMenuManage').addEventListener('click', function () {
     menu.style.display = 'none';
     setManageMode(true);
   });
   document.addEventListener('click', function (e) {
     if (!e.target.closest || (!e.target.closest('#aknvAddMenu') && !e.target.closest('#novelAddBtn'))) menu.style.display = 'none';
   });
   var em = document.createElement('div');
   em.id = 'aknvEditModal';
   em.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:6014;align-items:center;justify-content:center';
   em.innerHTML = '<div style="width:84%;max-width:320px;background:#fff;border-radius:14px;padding:18px 16px 14px;box-sizing:border-box">'
     + '<div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:12px;text-align:center">编辑书籍</div>'
     + '<div style="display:flex;gap:14px;align-items:flex-start">'
     + '<div id="aknvEditCover" style="width:72px;height:96px;border-radius:8px;overflow:hidden;background:#eee;flex-shrink:0;cursor:pointer;position:relative"></div>'
     + '<div style="flex:1;min-width:0"><div style="font-size:12px;color:#999;margin-bottom:6px">书名</div>'
     + '<input id="aknvEditTitle" maxlength="60" style="width:100%;box-sizing:border-box;height:40px;border:1px solid #e0e0e0;border-radius:10px;padding:0 12px;font-size:15px;outline:0;color:#1a1a1a"/>'
     + '<div style="font-size:12px;color:#bbb;margin-top:8px">点左侧封面可更换</div></div></div>'
     + '<input accept="image/*" type="file" id="aknvEditCoverInput" style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0"/>'
     + '<div style="display:flex;gap:10px;margin-top:16px"><button id="aknvEditCancel" type="button" style="flex:1;height:42px;border-radius:10px;border:1px solid #e0e0e0;background:#f8f8f8;color:#555;font-size:15px;cursor:pointer">取消</button><button id="aknvEditOk" type="button" style="flex:1;height:42px;border-radius:10px;border:none;background:#1a1a1a;color:#fff;font-size:15px;font-weight:600;cursor:pointer">保存</button></div>'
     + '<button id="aknvEditDelete" type="button" style="width:100%;height:42px;margin-top:10px;border-radius:10px;border:1px solid #f3c2c2;background:#fff5f5;color:#e04040;font-size:15px;cursor:pointer">删除本书</button>'
     + '</div>';
   document.body.appendChild(em);
   $('aknvEditCancel').addEventListener('click', function () { em.style.display = 'none'; });
   em.addEventListener('click', function (e) { if (e.target === em) em.style.display = 'none'; });
   /* 管理界面删除本书（与长按菜单删除同一逻辑） */
   $('aknvEditDelete').addEventListener('click', function () {
     if (!_editBook) return;
     if (!confirm('确定删除《' + (_editBook.title || '') + '》吗？删除后无法恢复')) return;
     var id = _editBook.id;
     _books = _books.filter(function (b) { return b.id !== id; });
     saveBooks();
     try { window._idbStore && window._idbStore.remove && window._idbStore.remove(CONTENT_PREFIX + id); } catch (e) {}
     lsSet(PROGRESS_PREFIX + id, '0');
     lsSet(PAGEPROG_PREFIX + id, '0');
     em.style.display = 'none';
     window.__renderNovelShelf();
   });
   $('aknvEditCover').addEventListener('click', function () { $('aknvEditCoverInput').click(); });
   $('aknvEditCoverInput').addEventListener('change', function () {
     var f = this.files && this.files[0];
     if (!f || !_editBook) return;
     var fr = new FileReader();
     fr.onload = function () {

addBtn.innerHTML = '<span style="font-size:14px;color:#1a1a1a;white-space:nowrap">退出管理</span>';
       addBtn.style.width = 'auto';
       addBtn.style.padding = '0 4px';
     } else {
       addBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:24px;height:24px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
       addBtn.style.width = '32px';
       addBtn.style.padding = '0';
     }
   }
   window.__renderNovelShelf();
 }
 function openEditBook(bid) {
   ensureManageDom();
   _editBook = _books.filter(function (b) { return b.id === bid; })[0] || null;
   if (!_editBook) return;
   $('aknvEditTitle').value = _editBook.title || '';
   renderEditCover();
   $('aknvEditModal').style.display = 'flex';
 }
 /* ---------- 包装书架渲染：管理模式加画笔 ---------- */
 function injectPens() {
   if (!_manageMode) return;
   var grid = $('novelShelfGrid');
   if (!grid) return;
   Array.prototype.forEach.call(grid.querySelectorAll('.aknv-book'), function (el) {
     el.style.position = 'relative';
     if (el.querySelector('.aknv-editpen')) return;
     var pen = document.createElement('div');
     pen.className = 'aknv-editpen';
     pen.style.cssText = 'position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer';
     pen.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>';
     pen.addEventListener('click', function (e) {
       
       openEditBook(el.getAttribute('data-bid'));
     });
     el.appendChild(pen);
   });
 }
 var _origRenderShelf = window.__renderNovelShelf;
 window.__renderNovelShelf = function () {
   _origRenderShelf();
   /* loadBooks 为异步回调，延迟注入画笔角标 */
   setTimeout(injectPens, 80);
   setTimeout(injectPens, 300);
 };
 /* ---------- 绑定加号 → 菜单 ---------- */
 function bindNovelMenu() {
   ensureManageDom();
   ensureCmDom();
   bindCmSelection();
   var addBtn = $('novelAddBtn');
   if (addBtn && !addBtn._aknvMenuBound) {
     addBtn._aknvMenuBound = true;
     addBtn.addEventListener('click', function (e) {
       if (_manageMode) { setManageMode(false); return; }
       var menu = $('aknvAddMenu');
       if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
       
     }, true);
   }
 }
 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', function () { setTimeout(bindNovelMenu, 400); });
 } else {
   setTimeout(bindNovelMenu, 400);
 }
 /* ---------- 陪伴头像光环颜色自定义（RGB 三通道滑杆自由调色） ---------- */
 function hslToRgb(h, s, l) {
   s /= 100; l /= 100;
   var k = function (n) { return (n + h / 30) % 12; };
   var a = s * Math.min(l, 1 - l);
   var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
   return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
 }
   var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
   return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
 }
 function readHaloRgb() {
   var r = lsGet('akini_halo_r', ''), g = lsGet('akini_halo_g', ''), b = lsGet('akini_halo_b', '');
   if (r === '' || g === '' || b === '') {
     /* 旧版 HSL 数据一次性迁移为 RGB */
     var oh = parseInt(lsGet('akini_halo_hue', '335'), 10) || 0;
     var os = parseInt(lsGet('akini_halo_sat', '100'), 10); if (isNaN(os)) os = 100;
     var ol = parseInt(lsGet('akini_halo_light', '75'), 10); if (isNaN(ol)) ol = 75;
     var c = hslToRgb(oh, os, ol);
     r = String(c[0]); g = String(c[1]); b = String(c[2]);
     lsSet('akini_halo_r', r); lsSet('akini_halo_g', g); lsSet('akini_halo_b', b);
   }
   return { r: parseInt(r, 10) || 0, g: parseInt(g, 10) || 0, b: parseInt(b, 10) || 0 };
 }
 function applyHaloColor() {
   var c = readHaloRgb();
   var r = c.r, g = c.g, b = c.b;
   /* 浅色变体：与白色混合 25%，用于弧光尾段，同一颜色的明暗层次 */
   var r2 = Math.round(r + (255 - r) * 0.25), g2 = Math.round(g + (255 - g) * 0.25), b2 = Math.round(b + (255 - b) * 0.25);
   var st = document.getElementById('akiniHaloStyle');
   if (!st) { st = document.createElement('style'); st.id = 'akiniHaloStyle'; document.head.appendChild(st); }
   st.textContent = '.akcp-halo{border-color:rgba(' + r + ',' + g + ',' + b + ',.5)!important}'
     + '.akcp-halo::before{background:radial-gradient(circle,rgba(' + r + ',' + g + ',' + b + ',.38) 52%,rgba(' + r + ',' + g + ',' + b + ',.12) 66%,rgba(' + r + ',' + g + ',' + b + ',0) 74%)!important}'
     + '.akcp-halo::after{background:conic-gradient(from 0deg,rgba(' + r + ',' + g + ',' + b + ',0) 0deg,rgba(' + r + ',' + g + ',' + b + ',.95) 40deg,rgba(' + r2 + ',' + g2 + ',' + b2 + ',.95) 80deg,rgba(' + r + ',' + g + ',' + b + ',0) 125deg)!important}';
 }
 function ensureHaloDom() {
   if ($('akiniHaloModal')) return;
   var m = document.createElement('div');
   m.id = 'akiniHaloModal';
   m.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:6020;align-items:center;justify-content:center';
   m.innerHTML = '<div style="width:88%;max-width:340px;background:#fff;border-radius:16px;padding:18px 16px 14px;box-sizing:border-box">'

$('akiniHaloR').dispatchEvent(new Event('input'));
     $('akiniHaloModal').style.display = 'flex';
   });
 }
 applyHaloColor();
 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', function () { setTimeout(bindHaloMenu, 450); });
 } else {
   setTimeout(bindHaloMenu, 450);
 }
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   boot();
 }
})();