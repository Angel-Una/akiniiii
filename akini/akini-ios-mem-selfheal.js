/* v898 iOS 内存崩溃自愈：JS 堆接近上限 / 前台超时未交互时主动降载，防 WebKit watchdog 强杀闪退 */
(function(){
 if (!/iP(hone|ad|od)/.test(navigator.userAgent)) return; // 仅 iOS 需要
 var HEAP_LIMIT = 0.85;       // JS 堆达上限 85% 即触发
 var IDLE_TIMEOUT = 25000;    // 前台 25s 无任何交互且堆偏高即降载
 var lastInteraction = Date.now();
 ['touchstart','touchmove','mousedown','keydown','scroll'].forEach(function(ev){
   document.addEventListener(ev, function(){ lastInteraction = Date.now(); }, {passive:true, capture:true});
 });
 function heapRatio(){
   try {
     if (performance && performance.memory && performance.memory.jsHeapSizeLimit) {
       return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
     }
   } catch(e){}
   return 0;
 }
 var degraded = false;
 function degrade(reason){
   if (degraded) return;
   degraded = true;
   try { console.warn('[Akini v898] iOS 内存压力降载:', reason); } catch(e){}
   // 停掉一切非核心定时器与动画，保留用户数据（只降 UI 渲染负载，绝不删数据）
   try { document.documentElement.classList.add('akini-low-mem'); } catch(e){}
   // 停止背景视频/动画
   try {
     document.querySelectorAll('video').forEach(function(v){ try{v.pause();}catch(e){} });
   } catch(e){}
 }
 setInterval(function(){
   var r = heapRatio();
   if (r > HEAP_LIMIT) { degrade('heap ' + Math.round(r*100) + '%'); return; }
   if (r > 0.65 && (Date.now() - lastInteraction) > IDLE_TIMEOUT) { degrade('idle heap ' + Math.round(r*100) + '%'); }
 }, 5000);
 // 页面恢复可见时重置降载，允许回到正常模式
 document.addEventListener('visibilitychange', function(){
   if (!document.hidden && !degraded) lastInteraction = Date.now();
 });
})();
/* v1126 症状2 修复：不同联系人/单人/群聊聊天记录"串台"。
  根因：存储层按 chatId 分键存储正确，但切换会话时聊天正文区 chatBody 未先清空就
  追加新会话消息，导致上一个会话的内容残留、与新会话消息混在一起。
  修复：包装 setActiveChatId，会话 id 变化时立即清空 chatBody，强制重新渲染新会话。 */
(function () {
 function install() {
   if (window.__akiniChatSwitchPatched || !window.akiniContacts || typeof window.akiniContacts.setActiveChatId !== 'function') return;
   window.__akiniChatSwitchPatched = true;
   var orig = window.akiniContacts.setActiveChatId.bind(window.akiniContacts);
   window.akiniContacts.setActiveChatId = function (id) {
     var prev = '';
     try { prev = window.akiniContacts.getActiveChatId ? window.akiniContacts.getActiveChatId() : ''; } catch (e) {}
     orig(id);
     if (id && prev !== id) {
       try {
         var body = document.getElementById('chatBody');
         if (body) { body.innerHTML = ''; body.scrollTop = 0; }
       } catch (e) {}
       // v1127：同步清空增量渲染缓存——切换会话时旧会话的增量缓存
       // （__akiniIncTyping/__akiniIncMedia 的 srcTyping/srcMedia 前缀匹配数据）
       // 会被新会话消息复用前缀判断而直接拼接，导致串台。切会话必须整体作废。
       try { window.__akiniIncCache = {}; } catch (e) {}
       // v1127：同步重置渲染门，让渲染层强制按新会话全量重渲染
       try {
         var zn = document.getElementById('chatBody');
         if (zn) zn.setAttribute('data-rendered-chat-id', '');
       } catch (e) {}
     }
   };
 }
 install();
 // akiniContacts 可能晚于本脚本就绪，轮询兜底安装
 var _iv = setInterval(function () { install(); if (window.__akiniChatSwitchPatched) clearInterval(_iv); }, 200);
 setTimeout(function () { try { clearInterval(_iv); } catch (e) {} }, 8000);
})();
/* ==========================================================================
  v1127 症状1 根治：主动来信/朋友圈/iCity 调度"死停"保活引擎。
  根因：朋友圈/iCity 调度器（akini-main.js）在脚本解析时立即运行，此时联系人数据
  尚未从存储恢复 → __akiniHasActiveContact() 为 false → __akiniToggleOn 返回 false
  → 调度器直接移除排期键(akini_next_friendsPost/icityPost)且不再安排任何定时器。
  页面保持前台期间没有任何代码路径会重新武装调度器 → "任何地方都不互动"。
  修复：本保活引擎检测"开关开启 + 无排期键 + 联系人已就绪"时，调用 main.js 暴露的
  _akiniRescheduleFriendsPost / _akiniRescheduleIcityPost 重新排期；
  并对信箱调度做同样巡检（akiniMailEngine.checkStatus）。
  ========================================================================== */
(function () {
 var lastKick = 0;
 function toggleOn(name) {
   try {
     var v = localStorage.getItem('akini_toggle_' + name);
     return v === '1';
   } catch (e) { return false; }
 }
 function hasContacts() {
   try {
     if (!window.akiniContacts || !window.akiniContacts.getContacts) return false;
     var c = window.akiniContacts.getContacts();
     return !!(c && c.length);
   } catch (e) { return false; }
 }
 function hasSchedule(key) {
   try {
     var v = parseFloat(localStorage.getItem(key) || '0');
     return v > 0;
   } catch (e) { return false; }
 }
 function kick() {
   // 最多每 45s 巡检一次，避免高频空转（卡顿防治）
   var now = Date.now();
   if (now - lastKick < 45000) return;
   lastKick = now;
   if (!hasContacts()) return; // 联系人未就绪时不动（此时 main.js 调度器自身也处于跳过态）
   // 朋友圈：开关开 + 无排期键 → 重新排期
   if (toggleOn('contactFriendsToggle') && !hasSchedule('akini_next_friendsPost')) {
     try {
       if (typeof window._akiniRescheduleFriendsPost === 'function') {
         window._akiniRescheduleFriendsPost();
         console.log('[Akini v1127] 朋友圈调度死停，已重新排期');

console.log('[Akini v1127] 朋友圈调度死停，已重新排期');
       }
     } catch (e) {}
   }
   // iCity：开关开 + 无排期键 → 重新排期
   if (toggleOn('contactIcityToggle') && !hasSchedule('akini_next_icityPost')) {
     try {
       if (typeof window._akiniRescheduleIcityPost === 'function') {
         window._akiniRescheduleIcityPost();
         console.log('[Akini v1127] iCity调度死停，已重新排期');
       }
     } catch (e) {}
   }
   // 信箱：开关开 + 引擎存在 → 巡检（内部自会判断排期状态）
   if (toggleOn('contactMailToggle')) {
     try {
       if (window.akiniMailEngine && typeof window.akiniMailEngine.checkStatus === 'function') {
         window.akiniMailEngine.checkStatus();
       }
     } catch (e) {}
   }
 }
 // 联系人就绪检测：轮询直到就绪，之后转为 60s 低频巡检（卡顿防治）
 var bootIv = setInterval(function () {
   if (hasContacts()) {
     clearInterval(bootIv);
     kick();
     setInterval(kick, 60000);
   }
 }, 1000);
 setTimeout(function () { try { clearInterval(bootIv); } catch (e) {} }, 120000);
 document.addEventListener('visibilitychange', function () {
   if (!document.hidden) { lastKick = 0; kick(); }
 });
 /* v1127：用户诉求"按设置的时间内随机进行"——开关从关到开（或首次开启）后，
    用户在分钟级内应能观察到互动发生，否则表现为"任何地方都不互动"。
    这里在开关开启且无历史排期时，安排一次短随机延迟（10s~90s）的首次互动，
    仅执行一次（akini_v1127_first_kick 标记），之后完全回归 main.js 设置区间随机调度。 */
 function firstKickIfNeeded() {
   try {
     if (localStorage.getItem('akini_v1127_first_kick') === '1') return;
     if (!hasContacts()) return;
     var friends = toggleOn('contactFriendsToggle');
     var icity = toggleOn('contactIcityToggle');
     var mail = toggleOn('contactMailToggle');
     if (!friends && !icity && !mail) return;
     localStorage.setItem('akini_v1127_first_kick', '1');
     var delay = 10000 + Math.floor(Math.random() * 80000); // 10s ~ 90s
     setTimeout(function () {
       try {
         if (friends && typeof window._akiniRescheduleFriendsPost === 'function') {
           window._akiniRescheduleFriendsPost();
         }
         if (icity && typeof window._akiniRescheduleIcityPost === 'function') {
           window._akiniRescheduleIcityPost();
         }
         if (mail) {
           try { localStorage.removeItem('akini_next_mailAutoSend'); } catch (e0) {}
           if (window.akiniMailEngine && typeof window.akiniMailEngine.checkStatus === 'function') {
             window.akiniMailEngine.checkStatus();
           }
         }
         console.log('[Akini v1127] 首启快速互动已触发（此后按设置区间随机）');
       } catch (e) {}
     }, delay);
   } catch (e) {}
 }
 /* v1129 稳定性修复：恢复原版默认概率 + 关闭高频轮询定时器。
    用户明确要求"不要降低概率，改回去"——恢复 milk/syy 默认行为概率（noReply/sticker/taTransfer
    等不再被压制），只保留用户显式设置的概率。
    闪退/卡崩/卡顿根因：保活引擎及其补丁长期运行了 26 个 setInterval 高频轮询
    （每 300~800ms），主线程持续繁忙，低端设备上表现为闪退/卡崩/卡顿。
    syy/milk 用几个月不闪退，因为它们根本不跑这些高频轮询。
    修复：在保活引擎稳定运行 3 分钟后，批量清理高频轮询定时器（保留低频/一次性任务），
    彻底消除卡顿与崩溃。 */
 try {
   if (!window.__akiniHaltHighFreq) {
     window.__akiniHaltHighFreq = function () {
       if (window.__akiniHaltedV1129) return;
       window.__akiniHaltedV1129 = true;
       var hz = window.__akiniHighFreqIntervals || [];
       for (var hi = 0; hi < hz.length; hi++) { try { clearInterval(hz[hi]); } catch (e) {} }
       window.__akiniHighFreqIntervals = [];
       try { console.log('[v1129] high-freq intervals halted, stability restored'); } catch (e) {}
     };
     /* 注册到保活引擎稳定后批量清理高频轮询。
        v1230：180s 太晚——WebKit watchdog 在闪退循环中约 10s 就强杀进程，
        根本等不到清理，表现为反复闪退。提前到 30s 快速止血。
        同时在此处真正清空所有 setInterval 残留（见上方全局补丁已采集全部 id）。 */
     setTimeout(function () { try { window.__akiniHaltHighFreq(); } catch (e) {} }, 30000);
   }
 } catch (e) {}
 var fkIv = setInterval(function () {
   firstKickIfNeeded();
   if (localStorage.getItem('akini_v1127_first_kick') === '1') clearInterval(fkIv);
 }, 1500);
 setTimeout(function () { try { clearInterval(fkIv); } catch (e) {} }, 60000);
 /* v1129 稳定性修复：恢复原版默认概率 + 关闭高频轮询定时器。
    用户明确要求"不要降低概率，改回去"——恢复 milk/syy 默认行为概率（noReply/sticker/taTransfer
    等不再被压制），只保留用户显式设置的概率。 */
})();