/* ===== 主动发消息调度初始化（对齐 syy：开关由用户决定，不强制关闭）：
   回复（contactReplyToggle，默认开）与主动发消息（contactActiveMsgToggle，默认关）已分离。
   - 默认关由 core 的 t("contactActiveMsgToggle", !1) 负责，不再在这里暴力覆盖用户的 "1"；
   - 只清理旧版遗留的 __activeMsgTimer 定时器，并在存储恢复完成后通知 engine 按真实开关值重排。
   - 不再在页面隐藏时杀定时器（对齐 syy 的 setInterval 模型，避免回前台后第一条消息被无限推迟）。 ===== */
(function(){
  function killActiveMsg(){
    try{ if(window.__activeMsgTimer){ clearTimeout(window.__activeMsgTimer); window.__activeMsgTimer = null; } }catch(e){}
    try{ if(window.__akiniActiveMsgTimer){ clearTimeout(window.__akiniActiveMsgTimer); window.__akiniActiveMsgTimer = null; } }catch(e){}
    try{ window._akiniActiveMsgAction = null; }catch(e){}
  }
  window.__akiniKillActiveMsg = killActiveMsg;
  killActiveMsg();
  // 存储恢复完成后，按用户真实的开关值重排定时器（用户开着就让它跑）
  var waited = 0;
  var iv = setInterval(function(){
    waited += 200;
    if(window.__akiniStorageRestored || window.__akiniRestoreSettled || waited > 10000){
      clearInterval(iv);
      try{
        if(typeof window._akiniRescheduleActiveMsg === "function") window._akiniRescheduleActiveMsg();
      }catch(e){}
    }
  }, 200);
})();
/* ===== 聊天消息弹窗兜底：移动端触摸轻微抖动让 akini-core 的 s 标志置 true，
   click 处理器直接 return 不弹菜单。这里直接派发 contextmenu（core 的 contextmenu
   处理器不检查 s，会设置内部 n 状态并弹出菜单），再 stopImmediatePropagation 防止
   core 的 click 处理器把菜单关掉。按钮（复制/引用/收藏/删除）全部交给 core 原生处理，
   不再重复绑定，避免 core 的 n 状态被覆盖导致按钮失效。 ===== */
(function(){
  function bind(){
    if(window.__akiniCtxMenuFallback) return;
    window.__akiniCtxMenuFallback = true;
    document.addEventListener('click', function(e){
      try{
        if(document.body.classList.contains('akini-fav-selecting')) return;
        if(e.target.closest && e.target.closest('#msgContextMenu')) return;
        var b = e.target.closest ? e.target.closest('.bubble') : null;
        if(!b) return;
        /* 自带点击逻辑的卡片放行：一起听总结/邀请、商店代付赠送、问卷答题。
           这些卡片的中断会让自身 onclick / 问卷委托失效，只剩消息右键菜单。 */
        if(b.classList.contains('music-end-bubble') || b.classList.contains('music-invite-bubble') || b.classList.contains('shop-card-bubble') || b.classList.contains('survey-bubble') || b.classList.contains('transfer-bubble') || b.classList.contains('sticker-bubble') || b.classList.contains('redpacket-bubble')) return;
        var chatBody = document.getElementById('chatBody');
        if(!chatBody || !chatBody.contains(b)) return;
        var row = b.closest('.msg-row');
        if(!row || row.classList.contains('system')) return;
        var menu = document.getElementById('msgContextMenu');
        if(menu && menu.style.display === 'block') return;
        e.stopImmediatePropagation();
        /* 派发 contextmenu 让 core 设置内部 n 状态并弹出菜单，按钮由 core 原生处理 */
        try{
          var ev;
          if(window.MouseEvent){
            ev = new MouseEvent('contextmenu', {bubbles:true, cancelable:true, clientX: e.clientX, clientY: e.clientY});
          } else {
            ev = document.createEvent('MouseEvents');
            ev.initMouseEvent('contextmenu', true, true, window, 1, e.screenX||0, e.screenY||0, e.clientX||0, e.clientY||0, false, false, false, false, 0, null);
          }
          b.dispatchEvent(ev);
        }catch(err){}
      }catch(_){}
    }, true);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
/* ===== akini-video.js ===== */
!function(){function t(){var t=document.getElementById("testPushBtn");t&&!t._akiniBound&&(t._akiniBound=1,t.addEventListener("click",function(){if("Notification"in window){var t=function(){var t={body:"这是一条测试通知，推送功能正常",icon:"./favicon.png",tag:"akini_test_"+Date.now(),renotify:!0};if(window.__akiniSystemNotify)window.__akiniSystemNotify("Akini · 测试推送",t);else try{new Notification("Akini · 测试推送",t)}catch(t){alert("通知发送失败："+t.message)}};if("granted"!==Notification.permission)if("denied"!==Notification.permission){var e=!1,n=function(n){if(!e)if(e=!0,"granted"===n)t();else{var i=/iP(hone|ad|od)/.test(navigator.userAgent||"");alert(i?"未获得通知权限。如果没有弹出系统授权框：请确认 iOS ≥ 16.4，并且是从主屏幕图标（不是浏览器标签页）打开的 Akini；已拒绝过的话请到「设置 → 通知 → Akini」里手动开启":"请先允许通知权限后再测试")}};try{var i=Notification.requestPermission(function(t){n(t)});i&&i.then&&i.then(n).catch(function(){n(Notification.permission)})}catch(t){n(Notification.permission)}setTimeout(function(){e||n(Notification.permission)},6e3)}else{var a=/iP(hone|ad|od)/.test(navigator.userAgent||"");alert(a?"通知权限之前被拒绝了。请打开 iPhone「设置 → 通知」，找到 Akini（主屏幕图标那个），打开「允许通知」，再回来测试":"通知权限已被拒绝，请在浏览器地址栏左侧的锁形图标 → 网站设置 → 通知中改为「允许」后再测试")}else t()}else alert("当前浏览器不支持系统通知")}))}function e(){var t=document.getElementById("openAndroidKeepAliveModalBtn"),e=document.getElementById("androidKeepAliveModal"),n=document.getElementById("androidKeepAliveModalClose"),i=document.getElementById("androidTutorialGotItBtn"),a=document.getElementById("androidTutorialTestPushBtn");function r(t){e.style.display="none"}e&&(t&&!t._akiniBound&&(t._akiniBound=!0,t.addEventListener("click",function(t){e.style.display="flex"})),n&&!n._akiniBound&&(n._akiniBound=!0,n.addEventListener("click",r)),i&&!i._akiniBound&&(i._akiniBound=!0,i.addEventListener("click",r)),e.addEventListener("click",function(t){t.target===e&&r(t)}),a&&!a._akiniBound&&(a._akiniBound=!0,a.addEventListener("click",function(t){var e=document.getElementById("testPushBtn");e&&e.click()})))}function n(){var t=document.getElementById("openIOSKeepAliveModalBtn"),e=document.getElementById("iosKeepAliveModal"),n=document.getElementById("iosKeepAliveModalClose"),i=document.getElementById("iosTutorialGotItBtn"),a=document.getElementById("iosTutorialTestPushBtn");function r(t){e.style.display="none"}e&&(t&&!t._akiniBound&&(t._akiniBound=!0,t.addEventListener("click",function(t){e.style.display="flex"})),n&&!n._akiniBound&&(n._akiniBound=!0,n.addEventListener("click",r)),i&&!i._akiniBound&&(i._akiniBound=!0,i.addEventListener("click",r)),e.addEventListener("click",function(t){t.target===e&&r(t)}),a&&!a._akiniBound&&(a._akiniBound=!0,a.addEventListener("click",function(t){var e=document.getElementById("testPushBtn");e&&e.click()})))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",t):t(),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",e):e(),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",n):n(),(document.getElementById("app-music")||document).addEventListener("touchmove",function(t){try{var e=document.getElementById("app-music");if(!e||"none"===e.style.display||!e.classList.contains("show"))return;var n=t.target;if(!n||!e.contains(n))return;if(n.closest&&n.closest("#musicPlaylistContainer,#musicContactList,#musicMenuPanel,#musicChatModal,.music-scrollable,input,textarea,button"))return;t.preventDefault()}catch(t){}},{passive:!1})}(),function(){var t=!1,e=[],n=null,i=null,a="akini_watch_session";function _saveSession(v){try{localStorage.setItem(a,v)}catch(t){}try{window.akiniStore&&window.akiniStore.memorySet&&window.akiniStore.memorySet(a,String(v))}catch(t){}}function r(){try{if(!e.length)return void _saveSession('{"cleared":true}');var t=h("watchVideo"),n=h("watchFrame"),i=null;n&&"none"!==n.style.display&&n.src&&0!==n.src.indexOf("about:blank")?i={kind:"iframe",src:n.src}:t&&"none"!==t.style.display&&t.src&&!/^blob:/.test(t.src)&&(i={kind:"video",src:t.src});var _sms=!1;try{_sms=!!JSON.parse(localStorage.getItem(a)||"{}").sysMsgShown}catch(t){}_saveSession(JSON.stringify({partners:e,video:i,ts:Date.now(),sysMsgShown:_sms}))}catch(t){}}function o(){w()&&I();var t=h("watchVideo"),i=h("watchFrame");try{if(t){if(t.pause(),t.__hls){try{t.__hls.destroy()}catch(t){}t.__hls=null}t.removeAttribute("src"),t.load&&t.load(),t.style.display="none"}}catch(t){}try{i&&(i.src="about:blank",i.style.display="none")}catch(t){}var r=h("watchEmpty");r&&(r.style.display="flex");var o=h("watchControls");o&&(o.style.display="none");var c=h("watchDanmakuLayer");c&&(c.innerHTML=""),n&&(clearTimeout(n),n=null),l();var s=h("watchChatBody");s&&(s.innerHTML=""),e=[],_saveSession('{"cleared":true}');var d=h("watchArea");d&&(d.style.display="none")}function c(t){var e=t&&String(t).trim();return e&&/^(https?:|data:|blob:)/.test(e)?'<img src="'+e+'" alt="" style="width:100%;height:100%;object-fit:cover"/>':!e||window.__akiniIsDefaultAvatarToken&&window.__akiniIsDefaultAvatarToken(e)?window.__akiniLineAvatarImg?window.__akiniLineAvatarImg():"":m(e)}function s(t,e,n){var i=h("watchChatBody");if(i){var a=document.createElement("div");a.className="msg-row other",a.setAttribute("data-ts",String(__akiniNextTs()));var r=n?'<div class="bubble sticker-bubble" style="background:transparent;padding:0;box-shadow:none;border:none;"><img src="'+n+'" style="max-width:120px;max-height:120px;border-radius:8px;display:block;" alt=""/ data-preserve-inline="1"></div>':'<div class="bubble">'+m(e)+"</div>";a.innerHTML='<div class="msg-content-line"><div class="msg-avatar">'+c(t.avatar)+"</div>"+r+"</div>",i.appendChild(a);try{"function"==typeof window.__akiniProcessMsgMeta&&window.__akiniProcessMsgMeta(a)}catch(t){}i.scrollTop=i.scrollHeight,w()&&!n&&S((t.name?t.name+"：":"")+e);try{var o=h("watchArea");if(o&&"none"===o.style.display&&"function"==typeof window.showInAppNotif){try{window.__akiniIncrFeatureUnread&&window.__akiniIncrFeatureUnread("watch")}catch(t){}window.showInAppNotif({app:"观影",appIcon:"🎬",avatar:t&&t.avatar||"",name:t&&t.name||"观影伙伴",fullContent:!0,msg:n?"[表情包]":e,onTap:function(){try{window.__akiniOpenWatch&&window.__akiniOpenWatch()}catch(t){}}})}}catch(t){}}}function l(){var t=h("watchTypingFloat");t&&t.remove();var e=h("watchTypingRow");e&&e.remove()}function d(){if(e.length&&!n){var t=parseFloat(localStorage.getItem("akini_num_replyDelayMin")||"3"),i=parseFloat(localStorage.getItem("akini_num_replyDelayMax")||"7");t>=0||(t=3),i>=t||(i=Math.max(t,7));var a=1e3*(t+Math.random()*(i-t));!function(){var t=h("watchInputBar");if(t&&!h("watchTypingFloat")){var e=document.createElement("div");e.id="watchTypingFloat",e.className="akini-typing-float",e.style.cssText="position:absolute;left:14px;bottom:calc(100% + 8px);z-index:20;pointer-events:none;transition:opacity 0.2s ease;",e.innerHTML='<div class="akcp-typing"><span class="wt-dot"></span><span class="wt-dot"></span><span class="wt-dot"></span></div>',t.style.position="relative",t.appendChild(e)}}(),n=setTimeout(function(){n=null,l();h("watchArea");var t=Math.random(),i=t<.75?1:t<.95?2:3,a=e[Math.floor(Math.random()*e.length)];if(a&&Math.random()<.2){var r=function(t){var e=[];try{if("function"==typeof window.__akiniStickerSrcs)e=window.__akiniStickerSrcs(t);else{var n="function"==typeof window.getContactStickersSync?window.getContactStickersSync(t):[];(Array.isArray(n)?n:[]).forEach(function(t){var n="";"string"==typeof t?n=t:t&&"string"==typeof t.s?n=t.s:t&&(t.url||t.src||t.data)&&(n=String(t.url||t.src||t.data)),(!t||"object"!=typeof t||1!==t.b&&!0!==t.b&&"1"!==t.b)&&/^data:image\//.test(n)&&e.push(n)})}}catch(t){}return e}(a.id);r.length&&(s(a,"",r[Math.floor(Math.random()*r.length)]),i=Math.max(0,i-1))}var o=function(t){if(!(t<=0)){var n=e[Math.floor(Math.random()*e.length)],i=function(t){try{var e=((window.__wbRead?window.__wbRead("akini_wordbank",[]):JSON.parse(localStorage.getItem("akini_wordbank")||"[]"))||[]).filter(function(t){return!t.tab||"main"===t.tab});window.__wbFilter&&(e=window.__wbFilter(e,t)||[]);var n=[];return e.forEach(function(t){var e=String(t&&(t.text||t.content)||"").trim();e&&e.length<=60&&n.push(e)}),n.length?n[Math.floor(Math.random()*n.length)]:""}catch(t){return""}}(n&&n.id);i&&s(n,i),t>1&&setTimeout(function(){o(t-1)},900+900*Math.random())}};o(i)},a)}}function u(t){var e=h("watchChatBody");if(e){var n=document.createElement("div");n.className="msg-row system",n.style.cssText="text-align:center;margin:8px 0",n.innerHTML='<span style="display:inline-block;font-size:12px;color:#999;background:rgba(0,0,0,.05);border-radius:10px;padding:3px 10px">'+m(t)+"</span>",e.appendChild(n),e.scrollTop=e.scrollHeight}}function f(){var t=h("watchPickerList");if(t){var n=[];try{n=((window.akiniContacts&&window.akiniContacts.getContacts?window.akiniContacts.getContacts():[])||[]).filter(function(t){return t&&t.id&&"group"!==t.type})}catch(t){}t.innerHTML="",n.length||(t.innerHTML='<div style="text-align:center;color:#bbb;padding:60px 0;font-size:14px">还没有联系人，先去微信里添加吧</div>'),n.forEach(function(n){var i=e.some(function(t){return t.id===n.id}),a=document.createElement("div");a.style.cssText="display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid #f5f5f5;cursor:pointer;-webkit-tap-highlight-color:transparent",a.innerHTML='<div style="width:22px;height:22px;border-radius:50%;border:2px solid '+(i?"#1a1a1a":"#ddd")+";background:"+(i?"#1a1a1a":"#fff")+';color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+(i?"✓":"")+'</div><div style="width:42px;height:42px;border-radius:50%;overflow:hidden;background:#e8e8e8;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+c(n.avatar)+'</div><div style="flex:1;min-width:0;font-size:16px;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+m(n.name||"联系人")+"</div>",a.addEventListener("click",function(){var t=-1;e.forEach(function(e,i){e.id===n.id&&(t=i)}),t>=0?e.splice(t,1):e.push({id:n.id,name:n.name,avatar:n.avatar}),f()}),t.appendChild(a)});var i=h("watchPickerConfirm");i&&(i.textContent=e.length?"开始观影（"+e.length+"）":"开始观影")}}function y(){f();var d=window.__akiniDefaultContact&&window.__akiniDefaultContact();if(d){e=[{id:d.id,name:d.name,avatar:d.avatar}];try{r()}catch(x){}var wa=h("watchArea");if(wa)wa.style.display="flex";try{u((d.name||"联系人")+" 加入了一起观影");try{var _sy=JSON.parse(localStorage.getItem(a)||"{}");_sy.sysMsgShown=true;_saveSession(JSON.stringify(_sy))}catch(t){}}catch(x){}return}var t=h("watchContactPicker");if(t)t.style.display="flex";else{var wa2=h("watchArea");wa2&&(wa2.style.display="flex")}}function h(t){return document.getElementById(t)}function m(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}var v=!1;function w(){return v||!(!document.fullscreenElement&&!document.webkitFullscreenElement)}function g(t){var e=h("watchVideo"),n=h("watchFrame"),i=h("watchEmpty"),a=h("watchControls");i&&(i.style.display="none"),e&&(e.style.display="video"===t?"block":"none"),n&&(n.style.display="iframe"===t?"block":"none"),a&&(a.style.display="video"===t?"flex":"none")}function k(t){return t=Math.max(0,Math.floor(t||0)),Math.floor(t/60)+":"+("0"+t%60).slice(-2)}function _(){var t=h("watchVideo"),e=t&&!t.paused&&!t.ended,n=h("watchPlayIcon"),i=h("watchPauseIcon");n&&(n.style.display=e?"none":"block"),i&&(i.style.display=e?"block":"none")}function b(){window.__akiniPromptModal("粘贴视频链接","粘贴含 BV 号的链接或视频直链",function(t){if(null!=t&&(t=String(t).trim())){var e=t.match(/https?:\/\/[^\s"'<>]+/);if(e){var n=e[0].replace(/[，。；、]+$/,""),i=h("watchVideo"),a=h("watchFrame");try{i&&(i.pause(),i.removeAttribute("src"),i.load&&i.load())}catch(t){}a&&(a.src="about:blank");var o=n.match(/BV[0-9A-Za-z]{10}/);if(o){g("iframe");try{a.setAttribute("referrerpolicy","no-referrer")}catch(t){}var _bv=o[0],_bili="https://player.bilibili.com/player.html?isOutside=true&bvid="+_bv+"&p=1&autoplay=1&high_quality=1&danmaku=1";a.__akiniSeq=(a.__akiniSeq||0)+1;var _seq=a.__akiniSeq,_ok=!1;a.onload=function(){a.__akiniSeq===_seq&&(_ok=!0)};a.src=_bili;r();setTimeout(function(){if(_ok||a.__akiniSeq!==_seq)return;try{u("B站播放器没能加载出来：这条视频可能限制了站外播放或地区，点「确定」用浏览器打开原视频");var _go=confirm("B站播放器在这个浏览器里打不开（视频可能限制了站外播放/地区，或浏览器拦截了第三方内嵌）。\n\n要改用浏览器或哔哩哔哩App打开这条视频吗？");_go&&window.open(_bili.replace("&autoplay=1",""),"_blank")}catch(t){}},8000);return}if(/b23\.tv\//.test(n))alert("哔哩哔哩短链无法直接解析，请打开视频页复制含 BV 号的完整链接");else if(/douyin\.com\//.test(n))alert("抖音链接暂不支持导入");else if(/\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i.test(n)||/^https?:\/\//.test(n)){if(g("video"),/\.m3u8(\?|$)/i.test(n)&&window.Hls&&window.Hls.isSupported())try{i.__hls&&i.__hls.destroy();var c=new window.Hls;i.__hls=c,c.loadSource(n),c.attachMedia(i)}catch(t){i.src=n}else i.src=n;return i.play&&i.play().catch(function(){}),void r()}}else alert("没有识别到链接，请检查粘贴内容")}},{desc:"· 哔哩哔哩：含 BV 号的视频页链接（站内直接播放）\n· mp4/m3u8 视频直链（站内直接播放）\n\n链接仅本次有效，不会保存"})}function x(t,e){var n=h("watchChatBody");if(n){var i="";try{i=("function"==typeof window.getMyAvatar?window.getMyAvatar():"")||""}catch(t){}var a=document.createElement("div");a.className="msg-row me",a.setAttribute("data-ts",String(__akiniNextTs()));var r=e?'<div class="bubble sticker-bubble" style="background:transparent;padding:0;box-shadow:none;border:none;"><img src="'+e+'" style="max-width:120px;max-height:120px;border-radius:8px;display:block;" alt=""/ data-preserve-inline="1"></div>':'<div class="bubble">'+m(t)+"</div>";a.innerHTML='<div class="msg-content-line">'+r+'<div class="msg-avatar">'+i+"</div></div>",n.appendChild(a);try{"function"==typeof window.__akiniProcessMsgMeta&&window.__akiniProcessMsgMeta(a)}catch(t){}n.scrollTop=n.scrollHeight}}function S(t){var e=h("watchDanmakuLayer");if(e){var n=document.createElement("div");n.textContent=t;var i=8+62*Math.random();n.style.cssText="position:absolute;left:100%;top:"+i+"%;white-space:nowrap;font-size:16px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);pointer-events:none;will-change:transform;transition:transform 7s linear",e.appendChild(n),requestAnimationFrame(function(){requestAnimationFrame(function(){var t=e.clientWidth+n.offsetWidth+40;n.style.transform="translateX(-"+t+"px)"})}),setTimeout(function(){n.remove()},7300)}}function E(t){var e=h(t?"watchMsgInputFs":"watchMsgInput");if(e){var n=e.value.trim(),i=window.__watchPendingSticker||null;if(n||i){window.__watchPendingSticker=null,e.value="",e.__stickerHint&&(e.placeholder=e.__origPh||("msgInput"===e.id?"iMessage信息":"发送消息…"),e.__stickerHint=!1),x(n,i),n&&w()&&S(n),d();try{if(window.__akiniToggleOn&&window.__akiniToggleOn("readReceiptToggle")){var a=1500+2500*Math.random();setTimeout(function(){try{var t=h("watchChatBody");if(!t)return;t.querySelectorAll(".msg-row.me").forEach(function(t){if("1"!==t.getAttribute("data-had-read-receipt")){t.setAttribute("data-had-read-receipt","1"),t.removeAttribute("data-read-pending");var e=t.querySelector(":scope .msg-rr");if(!e){(e=document.createElement("span")).className="msg-rr",e.textContent="已读";var n=t.querySelector(":scope > .msg-content-line"),i=n&&n.querySelector(":scope > .bubble-wrap");i?i.appendChild(e):(n||t).appendChild(e)}e.style.visibility="visible"}})}catch(t){}},a)}}catch(t){}}}}function B(){var t=w(),e=h("watchDanmakuLayer"),n=h("watchFloatInputBar"),i=h("watchVideo"),a=h("watchFrame"),r=h("watchEmpty");e&&(e.style.display=t?"block":"none"),n&&(n.style.display=t?"flex":"none");var o=h("watchControls");o&&(o.style.bottom=t?"52px":"0"),[i,a,r].forEach(function(e){e&&(t?(e.style.aspectRatio="auto",e.style.height="100%",e.style.width="100%"):(e.style.height="",e.style.aspectRatio="16/9"))})}function I(){var t=h("watchVideoBox");if(t){if(v)return v=!1,t.classList.remove("watch-pseudo-fs"),document.body.style.overflow="",void B();if(w()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch(t){}}else{var e=t.requestFullscreen||t.webkitRequestFullscreen;if(!(!document.fullscreenEnabled&&!document.webkitFullscreenEnabled||!e)){try{var n=e.call(t);n&&n.catch&&n.catch(function(){})}catch(t){}try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape").catch(function(){})}catch(t){}}else v=!0,t.classList.add("watch-pseudo-fs"),document.body.style.overflow="hidden",B()}}}function M(){if(!t){t=!0;var a=h("watchVideo");h("watchPlayPause").addEventListener("click",function(){a&&(a.paused||a.ended?a.play&&a.play().catch(function(){}):a.pause())}),h("watchBack10").addEventListener("click",function(){a&&isFinite(a.duration)&&(a.currentTime=Math.max(0,a.currentTime-10))}),h("watchFwd10").addEventListener("click",function(){a&&isFinite(a.duration)&&(a.currentTime=Math.min(a.duration,a.currentTime+10))});var c=h("watchSeek"),s=!1;c.addEventListener("input",function(){s=!0,a&&isFinite(a.duration)&&a.duration>0&&(a.currentTime=parseFloat(c.value)/1e3*a.duration)}),c.addEventListener("change",function(){s=!1}),a.addEventListener("timeupdate",function(){!s&&isFinite(a.duration)&&a.duration>0&&(c.value=String(Math.round(a.currentTime/a.duration*1e3)));var t=h("watchCurTime");t&&(t.textContent=k(a.currentTime))}),a.addEventListener("loadedmetadata",function(){var t=h("watchDurTime");t&&(t.textContent=k(a.duration))}),a.addEventListener("play",_),a.addEventListener("pause",_),a.addEventListener("ended",_),a.addEventListener("click",function(){a.paused||a.ended?a.play&&a.play().catch(function(){}):a.pause()}),h("watchBackBtn").addEventListener("click",function(){w()&&I();var t=h("watchVideo");try{t&&t.pause()}catch(t){}var e=h("watchDanmakuLayer");e&&(e.innerHTML=""),n&&(clearTimeout(n),n=null),l(),r(),h("watchArea").style.display="none"}),h("watchImportBtn").addEventListener("click",b),h("watchSendBtn").addEventListener("click",function(){E(!1)}),h("watchSendBtnFs").addEventListener("click",function(){E(!0)}),h("watchMsgInput").addEventListener("keydown",function(t){"Enter"===t.key&&E(!1)}),h("watchMsgInputFs").addEventListener("keydown",function(t){"Enter"===t.key&&E(!0)}),document.addEventListener("fullscreenchange",B),document.addEventListener("webkitfullscreenchange",B);var d=h("watchMenuOverlay"),f=h("watchMenuBtn");f&&f.addEventListener("click",function(t){d&&(d.style.display="flex")}),d&&d.addEventListener("click",function(t){t.target===d&&P()});var y=h("watchMenuCancel");y&&y.addEventListener("click",P);var m=h("watchMenuLocal");m&&m.addEventListener("click",function(){P();var t=h("watchLocalFileInput");t&&t.click()});var v=h("watchLocalFileInput");v&&v.addEventListener("change",function(){var t=this.files&&this.files[0];t&&function(t){if(t){var e=h("watchVideo"),n=h("watchFrame");try{i&&(URL.revokeObjectURL(i),i=null)}catch(t){}try{e&&(e.pause(),e.removeAttribute("src"),e.load&&e.load())}catch(t){}n&&(n.src="about:blank"),i=URL.createObjectURL(t),g("video"),e&&(e.src=i,e.play&&e.play().catch(function(){})),u("已导入本地视频："+(t.name||"视频")),r()}}(t),this.value=""});var L=h("watchMenuExit");L&&L.addEventListener("click",function(){P(),o()});var C=h("watchPickerBackBtn");C&&C.addEventListener("click",function(){var t=h("watchContactPicker");t&&(t.style.display="none")});var T=h("watchPickerConfirm");T&&T.addEventListener("click",function(){if(e.length){var t=h("watchContactPicker");t&&(t.style.display="none");var n=h("watchArea");n&&(n.style.display="flex"),p();try{"function"==typeof window.__akiniRefreshChatMeta&&window.__akiniRefreshChatMeta()}catch(t){}u(e.map(function(t){return t.name||"联系人"}).join("、")+" 加入了一起观影");try{var _ss=JSON.parse(localStorage.getItem(a)||"{}");_ss.sysMsgShown=true;_saveSession(JSON.stringify(_ss))}catch(t){}r()}else window.__akiniCenterModal("提示","先选择至少 1 位想一起看的人")})}function P(){d&&(d.style.display="none")}}window.__watchSendStickerDirect=function(t){x("",t),d()},window.__akiniOpenWatch=function(){try{try{window.__akiniClearFeatureUnread&&window.__akiniClearFeatureUnread("watch")}catch(t){}M();try{"function"==typeof window.applyBubbleCss&&window.applyBubbleCss(localStorage.getItem("akini_bubble_css")||"")}catch(t){}var t=function(){try{var t=JSON.parse(localStorage.getItem(a)||"null");return t&&t.partners&&t.partners.length?t:null}catch(t){return null}}();if(t){e=t.partners.filter(function(t){return t&&t.id});var n=h("watchArea");n&&(n.style.display="flex"),p();if(!t.sysMsgShown){try{u(e.map(function(t){return t.name||"联系人"}).join("、")+" 加入了一起观影")}catch(t){}try{var _sess=JSON.parse(localStorage.getItem(a)||"{}");_sess.sysMsgShown=true;_saveSession(JSON.stringify(_sess))}catch(t){}}try{var i=h("watchVideo"),r=h("watchFrame");!(r&&"none"!==r.style.display&&r.src&&0!==r.src.indexOf("about:blank")||i&&"none"!==i.style.display&&!!i.src)&&t.video&&t.video.src&&("iframe"===t.video.kind?(g("iframe"),r.src=t.video.src):(g("video"),i.src=t.video.src,i.play&&i.play().catch(function(){})))}catch(t){}try{"function"==typeof window.__akiniRefreshChatMeta&&window.__akiniRefreshChatMeta()}catch(t){}return}y()}catch(t){var o=h("watchArea");o&&(o.style.display="flex")}}}(),function(){"use strict";function t(t){return"icity"===t?"akini_icity_notifications":"akini_friends_notifications"}function e(e){try{var n=localStorage.getItem(t(e));return null==n&&(n=localStorage.getItem(t(e)+"_backup")),JSON.parse(n||"[]")}catch(t){return[]}}function n(e,n){try{var i=JSON.stringify(n);localStorage.setItem(t(e),i);try{localStorage.setItem(t(e)+"_backup",i)}catch(t){}}catch(t){}}function i(t,e){var n=function(t){var e=document.getElementById(t);if(!e)return null;var n=e.querySelector(".icon-wrap")||e;n.style.position="relative",n.style.overflow="visible";var i=n.querySelector(".home-badge");return i||((i=document.createElement("span")).className="home-badge",i.setAttribute("data-count","0"),i.textContent="",n.appendChild(i)),i}(t);n&&(e>0?(n.textContent=e>99?"99+":String(e),n.setAttribute("data-count",String(e)),n.style.setProperty("display","inline-flex","important"),n.style.setProperty("visibility","visible","important"),n.style.setProperty("opacity","1","important"),n.style.alignItems="center",n.style.justifyContent="center"):(n.textContent="",n.setAttribute("data-count","0"),n.style.setProperty("display","none","important"),n.style.setProperty("visibility","hidden","important"),n.style.setProperty("opacity","0","important")))}function a(t){try{return Math.max(0,parseInt(localStorage.getItem("akini_"+t+"_unread")||"0",10)||0)}catch(t){return 0}}function r(t){var n=document.getElementById("icity"===t?"icityNotifBadge":"friendsNotifBadge");if(n){var i=e(t).filter(function(t){return!t.read}).length;i>0?(n.textContent=i>99?"99+":String(i),n.setAttribute("data-count",String(i)),n.style.setProperty("display","inline-flex","important"),n.style.setProperty("visibility","visible","important"),n.style.setProperty("opacity","1","important"),n.style.alignItems="center",n.style.justifyContent="center",n.style.background="#ffffff",n.style.color="#1a1a1a",n.style.border="1px solid rgba(0,0,0,.1)",n.style.boxShadow="0 1px 4px rgba(0,0,0,.18)",n.style.fontWeight="600"):(n.textContent="",n.setAttribute("data-count","0"),n.style.setProperty("display","none","important"),n.style.setProperty("visibility","hidden","important"),n.style.setProperty("opacity","0","important"))}}function o(){try{var t=localStorage.getItem("akini_mail_seen_count");if(null!==t){var e=parseInt(t,10)||0,n=JSON.parse(localStorage.getItem("akini_mail_received")||"[]");if(e>0&&Array.isArray(n)&&n.length){for(var i=0;i<Math.min(e,n.length);i++)n[i].read=!0,n[i].isRead=!0;localStorage.setItem("akini_mail_received",JSON.stringify(n))}localStorage.removeItem("akini_mail_seen_count")}}catch(t){}try{var a=parseFloat(localStorage.getItem("akini_mail_latest_read_ts")||"0")||0;if(a>0){for(var r=JSON.parse(localStorage.getItem("akini_mail_received")||"[]"),o=!1,c=0;c<r.length;c++){var s=r[c];s&&!s.read&&!s.isRead&&s.ts&&s.ts<=a&&(s.read=!0,s.isRead=!0,o=!0)}o&&localStorage.setItem("akini_mail_received",JSON.stringify(r))}}catch(t){}try{var l=parseFloat(localStorage.getItem("akini_mail_latest_read_ts")||"0")||0,d=null;try{d=window.akiniStore&&window.akiniStore.memoryGet?window.akiniStore.memoryGet("akini_mail_received"):null}catch(t){}if(l>0&&d){for(var u=JSON.parse(d),p=!1,f=0;f<u.length;f++){var y=u[f];y&&!y.read&&!y.isRead&&y.ts&&y.ts<=l&&(y.read=!0,y.isRead=!0,p=!0)}if(p){var h=JSON.stringify(u);try{localStorage.setItem("akini_mail_received",h)}catch(t){}try{window.akiniStore&&window.akiniStore.memorySet&&window.akiniStore.memorySet("akini_mail_received",h)}catch(t){}}}}catch(t){}}function c(t){var i=document.getElementById("icity"===t?"icityNotifList":"friendsNotifList");if(i){var a=e(t).slice().reverse();if(i.innerHTML="",a.length){a.forEach(function(e){var n=document.createElement("div");n.style.cssText="background:#fff;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;cursor:pointer;-webkit-tap-highlight-color:transparent;border-bottom:1px solid #f0f0f0;";var a=function(t,e){try{if("icity"===t){for(var n=localStorage.getItem("akini_icity_diaries"),i=n?JSON.parse(n):[],a=0;a<i.length;a++)if(String(i[a]&&i[a].id)===String(e)){var r=i[a];return{img:r.images&&r.images[0]||"",text:(r.text||"").trim()}}}else for(var o=window.__akiniGetPosts?window.__akiniGetPosts():[],c=0;c<o.length;c++)if(String(o[c]&&o[c].id)===String(e)){var s=o[c];return{img:s.img||s.images&&s.images[0]||"",text:(s.text||s.content||"").trim()}}}catch(t){}return{img:"",text:""}}(t,e.momentId),r="like"===e.type?'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;min-width:18px;min-height:18px;flex-shrink:0;display:inline-block;vertical-align:middle;"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>':'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;min-width:18px;min-height:18px;flex-shrink:0;display:inline-block;vertical-align:middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',o="";o="reply"===e.type?'<span style="font-size:12px;color:#888;flex-shrink:0;">回复了'+String(e.replyTo||"").replace(/</g,"&lt;")+"：</span>"+(e.sticker?'<img src="'+e.sticker+'" style="width:26px;height:26px;object-fit:contain;border-radius:4px;flex-shrink:0;" alt=""/>':'<span style="font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">'+String(e.text||"").replace(/</g,"&lt;")+"</span>"):e.sticker?'<img src="'+e.sticker+'" style="width:28px;height:28px;object-fit:contain;border-radius:4px;flex-shrink:0;" alt=""/>':e.text?'<span style="font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">'+String(e.text).replace(/</g,"&lt;")+"</span>":"";var c,s,l=a.img?'<div style="width:56px;height:56px;border-radius:6px;overflow:hidden;flex-shrink:0;background:#eee;"><img src="'+a.img+'" style="width:100%;height:100%;object-fit:cover;" alt=""/></div>':'<div style="width:72px;flex-shrink:0;font-size:12px;color:#666;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all;">'+(a.text||"").replace(/</g,"&lt;")+"</div>";n.innerHTML='<div style="width:40px;height:40px;border-radius:50%;background:#eee;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'+(c=("string"==typeof e.avatar?e.avatar:""),s=40,(c&&0===c.indexOf("data:")?'<img src="'+c+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt=""/>':(window.__akiniLineAvatarImg?window.__akiniLineAvatarImg():""))+'</div><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">')+(e.name||"对方")+'</div><div style="display:flex;align-items:center;gap:6px;margin-top:5px;min-width:0;width:100%;overflow:hidden;">'+r+o+'</div><div style="font-size:11px;color:#bbb;margin-top:5px;">'+function(t){if(window.__akiniNaturalTime)return window.__akiniNaturalTime(t);try{var e=new Date(t),n=Date.now()-t;return n<6e4?"刚刚":n<36e5?Math.floor(n/6e4)+"分钟前":n<864e5?Math.floor(n/36e5)+"小时前":e.getMonth()+1+"月"+e.getDate()+"日"}catch(t){return""}}(e.ts)+"</div></div>"+l,n.addEventListener("click",function(){!function(t,e){var n=document.getElementById("icity"===t?"icityNotifModal":"friendsNotifModal");if(n&&(n.style.display="none"),"icity"===t){try{window.navTo&&window.navTo("icity")}catch(t){}setTimeout(function(){try{window.akiniGoIcityTab&&window.akiniGoIcityTab("1")}catch(t){}setTimeout(function(){var t=document.querySelector('[data-diary-id="'+e+'"]');t&&(t.scrollIntoView({behavior:"smooth",block:"center"}),t.style.transition="box-shadow .3s",t.style.boxShadow="0 0 0 2px #4a90e2",setTimeout(function(){t.style.boxShadow=""},1600))},320)},80)}else{try{window.navTo&&window.navTo("friends")}catch(t){}setTimeout(function(){try{for(var t=(window.__akiniGetPosts?window.__akiniGetPosts():[]).filter(function(t){return"icity"!==t.source}).sort(function(t,e){return(e.ts||0)-(t.ts||0)}),n=-1,i=0;i<t.length;i++)if(String(t[i].id)===String(e)){n=i;break}if(n>=0){var a=document.querySelector('.post-item[data-idx="'+n+'"]');if(a){a.scrollIntoView({behavior:"smooth",block:"center"});var r=document.createElement("div");r.className="jump-highlight-layer",r.style.cssText="position:absolute;inset:0;border:2px solid #1a1a1a;border-radius:10px;background:rgba(0,0,0,0.04);pointer-events:none;z-index:10;box-sizing:border-box;";var o=a.style.position;"static"===getComputedStyle(a).position&&(a.style.position="relative"),a.appendChild(r),setTimeout(function(){try{r.remove()}catch(t){}a.style.position=o||""},2e3)}}}catch(t){}},320)}}(t,e.momentId)}),i.appendChild(n)});var r=e(t),o=!1;r.forEach(function(t){t.read||(t.read=!0,o=!0)}),o&&n(t,r),window.__updateHomeBadges()}else i.innerHTML='<div style="color:#999;text-align:center;padding:60px 20px;font-size:14px;">还没有新消息</div>'}}function s(t){var e=document.getElementById("icity"===t?"icityNotifModal":"friendsNotifModal");if(e){try{e.style.setProperty("z-index","2147483640","important")}catch(t){e.style.zIndex="9600"}try{e.classList.add("open")}catch(t){}c(t),e.style.display="flex"}}function l(){var t=document.getElementById("friendsNotifBtn");t&&!t.__bound&&(t.__bound=1,t.addEventListener("click",function(t){t.preventDefault(),s("friends")}));var e=document.getElementById("icityNotifBtn");e&&!e.__bound&&(e.__bound=1,e.addEventListener("click",function(t){t.preventDefault(),s("icity")}));var n=document.getElementById("friendsNotifBack");n&&!n.__bound&&(n.__bound=1,n.addEventListener("click",function(){var t=document.getElementById("friendsNotifModal");if(t){try{t.classList.remove("open")}catch(t){}t.style.display="none"}}));var i=document.getElementById("icityNotifBack");i&&!i.__bound&&(i.__bound=1,i.addEventListener("click",function(){var t=document.getElementById("icityNotifModal");if(t){try{t.classList.remove("open")}catch(t){}t.style.display="none"}}))}window.__akiniPushNotif=function(t,i,a,r,o,c,s){try{if("friends"!==t&&"icity"!==t)return;var l=e(t),d={id:"n_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),type:i,name:a||"对方",avatar:r||"",text:String(o||"").slice(0,60),momentId:String(c||""),ts:Date.now(),read:!1};s&&s.sticker&&(d.sticker=s.sticker),s&&s.replyTo&&(d.replyTo=s.replyTo),l.push(d),l.length>100&&(l=l.slice(-100)),n(t,l),window.__updateHomeBadges&&window.__updateHomeBadges()}catch(t){}},window.__akiniMarkNotifsRead=function(t){try{if("friends"!==t&&"icity"!==t)return;var i=document.getElementById("icity"===t?"icityNotifModal":"friendsNotifModal");if(!i||"none"===i.style.display||!i.classList.contains("open"))return;for(var a=e(t),r=!1,o=0;o<a.length;o++)a[o].read||(a[o].read=!0,r=!0);r&&(n(t,a),window.__updateHomeBadges&&window.__updateHomeBadges())}catch(t){}},window.__akiniIncrFeatureUnread=function(t,e){try{var n="akini_"+t+"_unread",i=Math.max(0,parseInt(localStorage.getItem(n)||"0",10)||0)+(e||1);localStorage.setItem(n,String(i)),window.__updateHomeBadges&&window.__updateHomeBadges()}catch(t){}},window.__akiniClearFeatureUnread=function(t){try{localStorage.setItem("akini_"+t+"_unread","0"),window.__updateHomeBadges&&window.__updateHomeBadges()}catch(t){}},window.__updateHomeBadges=function(){var t={};try{window.akiniContacts&&window.akiniContacts.getSessions&&(t=window.akiniContacts.getSessions()||{})}catch(t){}try{var n=0;Object.keys(t).forEach(function(e){n+=Number(t[e].unread||0)}),i("appBtnChat",n)}catch(t){}try{var o=[];try{o=JSON.parse(localStorage.getItem("akini_mail_received")||"[]")}catch(t){}var c=o.filter(function(t){return!(t&&(t.read||t.isRead))}).length;i("appBtnMail",Math.max(0,c))}catch(t){}try{var s=e("friends").filter(function(t){return!t.read}).length+a("friends");i("appBtnFriends",Math.max(0,s))}catch(t){}try{var l=e("icity").filter(function(t){return!t.read}).length+a("icity");i("appBtnIcity",Math.max(0,l))}catch(t){}try{i("appBtnWatch",a("watch"))}catch(t){}try{i("appBtnCompanion",a("companion"))}catch(t){}try{var d=document.getElementById("chatBackUnreadBadge");if(d){var u="";if("function"==typeof window.__akiniIsChatActive){var p=window.akiniContacts&&window.akiniContacts.getActiveChatIdStrict?window.akiniContacts.getActiveChatIdStrict():window.akiniContacts&&window.akiniContacts.getActiveChatId?window.akiniContacts.getActiveChatId():"";p&&window.__akiniIsChatActive(p)&&(u=String(p))}var f=0;Object.keys(t).forEach(function(e){u?String(e)!==u&&(f+=Number(t[e].unread||0)):f+=Number(t[e].unread||0)}),f>0?(d.textContent=f>99?"99+":String(f),d.setAttribute("data-count",String(f)),d.style.setProperty("display","inline-flex","important"),d.style.setProperty("visibility","visible","important"),d.style.setProperty("opacity","1","important")):(d.textContent="",d.setAttribute("data-count","0"),d.style.setProperty("display","none","important"),d.style.setProperty("visibility","hidden","important"),d.style.setProperty("opacity","0","important"))}}catch(t){}try{r("friends")}catch(t){}try{r("icity")}catch(t){}try{var y=document.querySelectorAll(".chat-list-item");y&&y.length&&y.forEach(function(e){var n=e.getAttribute("data-id")||e.getAttribute("data-chat-id");if(n){var i=t[n]||{},a=Number(i.unread||0),r=e.querySelector(".cli-unread-badge");if(a>0){if(!r){var o=e.querySelector(".cli-avatar-wrap")||e.querySelector(".cli-avatar");o&&(o.style.position="relative",o.style.overflow="visible"),o&&((r=document.createElement("span")).className="cli-unread-badge",o.appendChild(r))}r&&(r.textContent=a>99?"99+":String(a),r.setAttribute("data-count",String(a)),r.style.setProperty("display","inline-flex","important"),r.style.setProperty("visibility","visible","important"),r.style.setProperty("opacity","1","important"))}else r&&(r.textContent="",r.setAttribute("data-count","0"),r.style.setProperty("display","none","important"),r.style.setProperty("visibility","hidden","important"),r.style.setProperty("opacity","0","important"))}})}catch(t){}},window.__openFriendsNotifCenter=function(){s("friends")},window.__openIcityNotifCenter=function(){s("icity")},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",l):l();setInterval(function(){document.hidden||(o(),window.__updateHomeBadges&&window.__updateHomeBadges())},1e4);document.addEventListener("visibilitychange",function(){document.hidden||(o(),window.__updateHomeBadges())}),setTimeout(window.__updateHomeBadges,1200)}();
;
/* ===== akini-stickers.js ===== */
/* 补发内容时间戳回写——离线期间应发的内容，时间用计划时间而非上线时间 */
window.__akiniBackdateTs = 0;
window.__akiniNowTs = function () {
  var b = window.__akiniBackdateTs || 0;
  var now = Date.now();
  if (b && b < now - 30000) return b + Math.floor(Math.random() * 90000);
  return now;
};



/* ==================== 字卡库表情包模块 + 评论输入栏表情包按钮 ==================== */
(function () {
  'use strict';
  if (window.__akiniStickerModuleReady) return;
  window.__akiniStickerModuleReady = true;

  function _stkKey(cid) { return 'akini_stickers_' + cid; }
  /* 读取顺序：内存镜像 → localStorage。大表情包库会被存储层分流到内存+IndexedDB，
     只读 localStorage 会读到空数组，表现为"添加成功但列表不显示" */
  function _rawRead(k) {
    try {
      if (window.akiniStore && window.akiniStore.memoryGet) {
        var m = window.akiniStore.memoryGet(k);
        if (m != null && m !== '') return m;
      }
    } catch (e) {}
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  /* 表情包/问卷各自一块独立面板，与主字卡模块的 #wbContent 同级。
     主字卡切 tab 重绘只清空自己的 #wbContent，不会波及这两块面板；
     表情包与问卷互切也只是显示/隐藏，不重建——切 tab、点工具都不再闪。 */
  function _makePanel(id) {
    var p = document.getElementById(id);
    if (p) return p;
    var base = document.getElementById('wbContent');
    if (!base || !base.parentNode) return null;
    p = document.createElement('div');
    p.id = id;
    p.className = base.className || 'wb-content';
    p.style.display = 'none';
    base.parentNode.insertBefore(p, base.nextSibling);
    return p;
  }
  function _wbPanel() { return _makePanel('wbStkPanel'); }
  function _wbSrvPanel() { return _makePanel('wbSrvPanel'); }
  function _wbPanelShow(tab) {
    var stk = tab === 'sticker';
    var srv = tab === 'survey';
    var p = _wbPanel();
    var s = _wbSrvPanel();
    var base = document.getElementById('wbContent');
    if (p) p.style.display = stk ? '' : 'none';
    if (s) s.style.display = srv ? '' : 'none';
    if (base) base.style.display = (stk || srv) ? 'none' : '';
    /* 主字卡模块切 tab 时会重绘 #wbGroupFilter/#addWordBtn，用 overlay 级类强制隐藏 */
    var ov = document.getElementById('wordbankOverlay');
    if (ov) ov.classList.toggle('wb-panel-mode', stk || srv);
  }
  var _stkRev = 0;
  /* 数据模型升级：每条为 {s:图片dataURL, g:分组id, b:是否屏蔽}，兼容旧版纯字符串数组 */
  function _stkOne(it) {
    if (typeof it === 'string') return it.trim() ? { s: it, g: '', b: 0 } : null;
    if (it && typeof it === 'object' && it.s) return { s: String(it.s), g: it.g ? String(it.g) : '', b: it.b ? 1 : 0 };
    return null;
  }
  function _stkRead(cid) {
    var key = _stkKey(cid);
    try {
      var c = window.__csCache && window.__csCache[key];
      if (Array.isArray(c) && c.length) return c.map(_stkOne).filter(Boolean);
    } catch (e0) {}
    try {
      var a = JSON.parse(_rawRead(key) || '[]');
      if (Array.isArray(a)) return a.map(_stkOne).filter(Boolean);
    } catch (e) {}
    return [];
  }
  /* 表情包库是大图片键，启动时可能只驻留在 IndexedDB：把 IDB 里的数据回填到
     __csCache（聊天表情包面板的同步读取源）与内存镜像，刷新后列表和发送都不会空。 */
  function _hydrateStickers() {
    var IDB = window._idbStore;
    if (!IDB || typeof IDB.keys !== 'function') {
      /* 没有 IDB 时可同步读到的就是全部真实数据：水合视为已完成 */
      window.__stkHydratedDone = true;
      _stkFixLegacyRole();
      return;
    }
    var _pending = 0;
    var _finish = function () {
      if (_pending > 0 || window.__stkHydratedDone) return;
      window.__stkHydratedDone = true;
      /* 水合结束才做一次性角色归位：此时两端是否为空是可信的，
         不会把用户后来导入（显式指定 o="me"）的表情包误搬走 */
      _stkFixLegacyRole();
      try { if (window.__wbTab === 'sticker') renderStickerTab(); } catch (eR) {}
    };
    try {
      IDB.keys(function (keys) {
        (keys || []).forEach(function (k) {
          k = String(k);
          if (k.indexOf('akini_stickers_') !== 0 || k.indexOf('_backup') >= 0) return;
          try {
            if (window.__csCache && window.__csCache[k] && window.__csCache[k].length) return;
          } catch (e) {}
          var mem = null;
          try { mem = window.akiniStore && window.akiniStore.memoryGet ? window.akiniStore.memoryGet(k) : null; } catch (e) {}
          if (mem) {
            try {
              var ma = JSON.parse(mem);
              if (Array.isArray(ma) && ma.length) {
                window.__csCache = window.__csCache || {};
                window.__csCache[k] = ma;
                return;
              }
            } catch (e) {}
          }
          /* localStorage 里的值比 IDB 新时以 LS 为准 */
          try {
            var raw = localStorage.getItem(k);
            if (raw && raw.length > 2) {
              var la = JSON.parse(raw);
              if (Array.isArray(la) && la.length) {
                window.__csCache = window.__csCache || {};
                window.__csCache[k] = la;
                return;
              }
            }
          } catch (eLS) {}
          try {
            _pending++;
            IDB.get(k, function (v) {
              _pending--;
              try {
                if (!v) return;
                var arr = [];
                try { arr = JSON.parse(v); } catch (e) { return; }
                if (!Array.isArray(arr) || !arr.length) return;
                window.__csCache = window.__csCache || {};
                window.__csCache[k] = arr;
                try { if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet(k, v); } catch (e) {}
                if (k === _stkKey(_getCid()) && window.__wbTab === 'sticker') renderStickerTab();
              } finally { _finish(); }
            });
          } catch (eG) { _pending--; }
        });
        _finish();
      });
    } catch (e) {}
  }
  function _stkWrite(cid, arr) {
    _stkRev++;
    /* 同步刷新 getContactStickersSync 的 __csCache，保证添加/删除后聊天/观影/陪伴立即读到最新 */
    try { window.__csCache = window.__csCache || {}; window.__csCache['akini_stickers_' + cid] = arr; } catch (e0) {}
    /* 优先走 akiniStore（超 200KB 自动分流内存+IndexedDB，不再受 localStorage 5MB 上限限制，表情包随便加） */
    if (window.akiniStore && window.akiniStore.setJson) {
      try { window.akiniStore.setJson(_stkKey(cid), arr); return; } catch (e) {}
    }
    try { localStorage.setItem(_stkKey(cid), JSON.stringify(arr)); }
    catch (e) {
      if (window.__akiniCenterModal) window.__akiniCenterModal('存储失败', '图片过大，请换一张小图');
    }
  }
  /* ---- 表情包独立分组（与主字卡/emoji/拍一拍平级的独立模块，分组互不影响） ---- */
  /* 分组按联系人完全独立——每个联系人（含"我"）各自一套分组，存 akini_stk_groups_<cid>；
     旧的全局 akini_stk_groups 仅在首次访问时迁移拷贝，之后各联系人独立演化 */
  function _stkGKey(cid) { return 'akini_stk_groups_' + (cid || _getCid()); }
  function _stkGRead(cid) {
    cid = cid || _getCid();
    try {
      var raw = null;
      try { raw = _rawRead(_stkGKey(cid)); } catch (e0) {}
      if (raw != null) {
        var g = JSON.parse(raw);
        if (Array.isArray(g)) return g.filter(function (x) { return x && x.name; });
      }
      var legacy = JSON.parse(localStorage.getItem('akini_stk_groups') || '[]');
      if (Array.isArray(legacy) && legacy.length) {
        var arr = legacy.filter(function (x) { return x && x.name; });
        try { localStorage.setItem(_stkGKey(cid), JSON.stringify(arr)); } catch (e2) {}
        return arr;
      }
    } catch (e) {}
    return [];
  }
  function _stkGWrite(arr, cid) { _stkRev++; try { localStorage.setItem(_stkGKey(cid || _getCid()), JSON.stringify(arr)); } catch (e) {} }
  function _stkGName(gid) {
    var g = _stkGRead();
    for (var i = 0; i < g.length; i++) if (String(g[i].id) === String(gid)) return g[i].name;
    return '';
  }
  /* 读取指定联系人分组（导出用，不切换当前 cid）；首次访问触发旧全局分组迁移拷贝 */
  window.__akiniStkGroupsOf = function (cid) {
    try {
      var raw = _rawRead('akini_stk_groups_' + cid);
      if (raw == null) {
        raw = localStorage.getItem('akini_stk_groups') || '[]';
        var legacy = JSON.parse(raw || '[]');
        var arr = Array.isArray(legacy) ? legacy.filter(function (x) { return x && x.name; }) : [];
        if (arr.length) { try { localStorage.setItem('akini_stk_groups_' + cid, JSON.stringify(arr)); } catch (e2) {} }
        return arr;
      }
      var g = JSON.parse(raw || '[]');
      return Array.isArray(g) ? g.filter(function (x) { return x && x.name; }) : [];
    } catch (e) { return []; }
  };
  /* 写入指定联系人分组（导入恢复用） */
  window.__akiniStkGroupsWrite = function (cid, arr) {
    if (!cid || !Array.isArray(arr)) return;
    try { localStorage.setItem('akini_stk_groups_' + cid, JSON.stringify(arr)); } catch (e) {}
  };
  function _stkAllCids() {
    var ids = ['me'];
    try {
      var cs = (window.akiniContacts && window.akiniContacts.getContacts) ? window.akiniContacts.getContacts() : [];
      cs.forEach(function (c) { if (c && c.id != null && ids.indexOf(String(c.id)) < 0) ids.push(String(c.id)); });
    } catch (e) {}
    return ids;
  }
  function _esc(s) { return String(s || '').replace(/</g, '&lt;'); }
  function _avHtml(av, size) {
    if (av && /^(data:|https?:|blob:|\/)/.test(av)) return '<img src="' + av + '" decoding="sync" style="width:100%;height:100%;object-fit:cover;" alt=""/>';
    /* 默认头像（emoji/空）统一走 nt()：与聊天页同款人形线条 SVG 兜底 */
    if (typeof window.nt === 'function') return window.nt(av || '', size || 40);
    return '<span style="font-size:' + Math.round((size || 40) * 0.45) + 'px;">' + (av || '') + '</span>';
  }
  function _myAvatar() {
    try {
      if (typeof window.getMyAvatar === 'function') { var a = window.getMyAvatar(); if (a) return a; }
    } catch (e) {}
    return localStorage.getItem('akini_my_avatar') || (window.__akiniAvatarCache && window.__akiniAvatarCache.my) || '';
  }

  var _curCid = null;
  var _cidPickedInSession = false; /* 本次会话内是否手动点过头像（只有手动点"我"才固定在"我"名下） */
  /* 默认角色：当前聊天对象 → 默认联系人 → 第一个联系人 → 我。
     以前固定回退 'me'，导致给默认联系人存的表情包全被算到自己名下。 */
  function _defaultCid() {
    try {
      var cs = (window.akiniContacts && window.akiniContacts.getContacts) ? (window.akiniContacts.getContacts() || []) : [];
      var active = (window.akiniContacts && window.akiniContacts.getActiveChatId) ? window.akiniContacts.getActiveChatId() : null;
      var pick = null, i;
      if (active) {
        for (i = 0; i < cs.length; i++) if (cs[i] && String(cs[i].id) === String(active)) { pick = cs[i]; break; }
      }
      if (!pick) for (i = 0; i < cs.length; i++) if (cs[i] && cs[i].isDefault) { pick = cs[i]; break; }
      if (!pick && cs.length) pick = cs[0];
      if (pick && pick.id != null) return String(pick.id);
    } catch (e) {}
    return 'me';
  }
  /* 每次读取都以持久化的当前联系人键为准，避免内存里的旧值把切换卡死。
     旧版把默认角色固定成「我」并持久化了 'me'，这里用 akini_wb_sticker_cid_manual 区分
     「用户真的点过 '我'」和「旧版自动写进去的 'me'」：只有前者才信任 'me'。 */
  function _cidValid(cid) {
    if (!cid || cid === 'me') return true;
    try {
      var cs = (window.akiniContacts && window.akiniContacts.getContacts) ? (window.akiniContacts.getContacts() || []) : [];
      for (var i = 0; i < cs.length; i++) if (cs[i] && String(cs[i].id) === String(cid)) return true;
    } catch (e) {}
    return false;
  }
  function _getCid() {
    try {
      var v = localStorage.getItem('akini_wb_sticker_cid');
      var manual = localStorage.getItem('akini_wb_sticker_cid_manual') === '1';
      if (v && (manual || v !== 'me')) {
        if (_cidValid(v)) { _curCid = v; return v; }
        /* 指向已被清理的多人分身：清掉设置，回落到默认联系人 */
        localStorage.removeItem('akini_wb_sticker_cid');
        localStorage.removeItem('akini_wb_sticker_cid_manual');
      }
    } catch (e) {}
    if (_curCid && (_cidPickedInSession || _curCid !== 'me') && _cidValid(_curCid)) return _curCid;
    _curCid = null;
    return _defaultCid();
  }
  function _setCid(cid) {
    _curCid = cid;
    _cidPickedInSession = true;
    try {
      localStorage.setItem('akini_wb_sticker_cid', cid);
      localStorage.setItem('akini_wb_sticker_cid_manual', '1');
    } catch (e) {}
  }

  /* ---- 字卡库表情包面板：两行工具下面横排小头像（可滑动切换）+ 分组筛选条 + 每行四个网格 ---- */
  /* 表情包模块状态：分组筛选/搜索词/多选/屏蔽 */
  var _stkFilterGid = '';      /* ''=全部 '__ungrouped__'=未分组 其余=分组id */
  var _stkQuery = '';
  var _stkSelMode = false;
  var _stkBlockMode = false;
  var _stkSel = {};            /* idx -> true */

  /* 表情包 tab 时隐藏字卡专用分组筛选条/底部文字新增按钮（表情包分组筛选在内容区内自绘），工具栏恒显示 */
  function _applyStickerChrome(on) {
    var tb = document.querySelector('#wordbankOverlay .wb-toolbar');
    if (tb) tb.style.display = ''; /* 用户明确要求恢复表情包模块工具栏显示，绝不隐藏 */
    var gf = document.getElementById('wbGroupFilter');
    if (gf && on) gf.style.display = 'none';
    var addBtn = document.getElementById('addWordBtn');
    if (addBtn) addBtn.style.display = on ? 'none' : '';
    if (on) _syncModeBars();
  }

  function _syncModeBars() {
    var on = window.__wbTab === 'sticker';
    var sa = document.getElementById('wbSelectActions');
    var ba = document.getElementById('wbBlockActions');
    var cnt = Object.keys(_stkSel).length;
    if (sa) sa.style.display = (on && _stkSelMode) ? 'flex' : 'none';
    if (ba) ba.style.display = (on && _stkBlockMode) ? 'flex' : 'none';
    var db = document.getElementById('wbSelectDeleteBtn');
    if (db) db.textContent = '删除(' + cnt + ')';
    var bd = document.getElementById('wbBlockDoBtn');
    if (bd) bd.textContent = '屏蔽(' + cnt + ')';
    var bu = document.getElementById('wbBlockUndoBtn');
    if (bu) bu.textContent = '取消屏蔽(' + cnt + ')';
    var sb = document.getElementById('selectBtn');
    if (sb) { sb.style.background = (on && _stkSelMode) ? '#1a1a1a' : ''; sb.style.color = (on && _stkSelMode) ? '#fff' : ''; }
    var bb = document.getElementById('wbBlockBtn');
    if (bb) { bb.style.background = (on && _stkBlockMode) ? '#1a1a1a' : ''; bb.style.color = (on && _stkBlockMode) ? '#fff' : ''; }
  }

  function _stkExitModes() {
    _stkSelMode = false; _stkBlockMode = false; _stkSel = {};
    _syncModeBars();
  }

  function _stkFiltered(arr) {
    var out = [];
    arr.forEach(function (it, i) {
      if (_stkFilterGid === '__ungrouped__') { if (it.g) return; }
      else if (_stkFilterGid && String(it.g) !== String(_stkFilterGid)) return;
      if (_stkQuery) {
        var gn = (it.g ? _stkGName(it.g) : '未分组').toLowerCase();
        if (gn.indexOf(_stkQuery.toLowerCase()) < 0) return;
      }
      out.push({ it: it, idx: i });
    });
    return out;
  }

  
  /* 字卡库【问卷】Tab 工具栏 */
  var _srvFilterGid = '';      /* ''=全部 '__ungrouped__'=未分组 其余=分组id */
  var _srvQuery = '';
  var _srvSelMode = false;
  var _srvBlockMode = false;
  var _srvSel = {};            /* sid -> true */
  var _srvRev = 0;
  function _srvActiveCid() {
    var cid = window.__currentWbSurveyCid || window.__wbSurveyContactId;
    if (!cid && window.akiniContacts && typeof window.akiniContacts.getContacts === 'function') {
      var cs = window.akiniContacts.getContacts() || [];
      if (cs[0]) cid = cs[0].id;
    }
    return cid || 'me';
  }
  function _srvRead() {
    try { var a = JSON.parse(localStorage.getItem('akini_surveys_' + _srvActiveCid()) || '[]'); if (Array.isArray(a)) return a; } catch (e) {}
    return [];
  }
  function _srvWrite(arr) { _srvRev++; try { localStorage.setItem('akini_surveys_' + _srvActiveCid(), JSON.stringify(arr)); } catch (e) {} }
  function _srvGRead() {
    var cid = _srvActiveCid();
    var perKey = 'akini_survey_groups_' + cid;
    try {
      var v = localStorage.getItem(perKey);
      if (v) { var a = JSON.parse(v); if (Array.isArray(a)) return a; }
    } catch (e) {}
    /* 兼容旧全局键：首次读取时把全局分组迁移到当前联系人名下，之后按联系人独立 */
    try {
      var old = localStorage.getItem('akini_survey_groups');
      if (old) {
        var arr = JSON.parse(old);
        if (Array.isArray(arr) && arr.length) {
          try { localStorage.setItem(perKey, old); } catch (eM) {}
          return arr;
        }
      }
    } catch (e) {}
    return [];
  }
  function _srvGWrite(arr) { _srvRev++; try { localStorage.setItem('akini_survey_groups_' + _srvActiveCid(), JSON.stringify(arr)); } catch (e) {} }
  function _srvGName(gid) {
    var gs = _srvGRead();
    for (var i = 0; i < gs.length; i++) if (String(gs[i].id) === String(gid)) return gs[i].name || '';
    return '';
  }
  function _srvSyncBars() {
    var on = window.__wbTab === 'survey';
    var sa = document.getElementById('wbSelectActions');
    var ba = document.getElementById('wbBlockActions');
    var cnt = Object.keys(_srvSel).length;
    if (sa) sa.style.display = (on && _srvSelMode) ? 'flex' : 'none';
    if (ba) ba.style.display = (on && _srvBlockMode) ? 'flex' : 'none';
    var db = document.getElementById('wbSelectDeleteBtn'); if (db) db.textContent = '删除(' + cnt + ')';
    var bd = document.getElementById('wbBlockDoBtn'); if (bd) bd.textContent = '屏蔽(' + cnt + ')';
    var bu = document.getElementById('wbBlockUndoBtn'); if (bu) bu.textContent = '取消屏蔽(' + cnt + ')';
    var sb = document.getElementById('selectBtn');
    if (sb) { var so = on && _srvSelMode; sb.style.background = so ? '#1a1a1a' : ''; sb.style.color = so ? '#fff' : ''; }
    var bb2 = document.getElementById('wbBlockBtn');
    if (bb2) { var bo = on && _srvBlockMode; bb2.style.background = bo ? '#1a1a1a' : ''; bb2.style.color = bo ? '#fff' : ''; }
  }
  function _srvExitModes() { _srvSelMode = false; _srvBlockMode = false; _srvSel = {}; _srvSyncBars(); }
  /* 多选/屏蔽只改已渲染卡片的边框与勾选角标，不重建列表，避免点工具时整屏闪烁 */
  function _srvPaintMode() {
    var box = document.getElementById('wbSrvPanel');
    if (!box) { _srvSyncBars(); return; }
    var show = _srvSelMode || _srvBlockMode;
    Array.prototype.forEach.call(box.querySelectorAll('.wb-survey-card'), function (card) {
      var sid = card.getAttribute('data-sid');
      var on = !!_srvSel[sid];
      card.style.borderColor = on ? '#1a1a1a' : '#eee';
      var chk = card.querySelector('.srv-chk');
      if (!show) { if (chk) chk.parentNode.removeChild(chk); return; }
      if (!chk) {
        chk = document.createElement('span');
        chk.className = 'srv-chk';
        chk.style.cssText = 'position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:50%;color:#fff;font-size:13px;line-height:19px;text-align:center;z-index:2;';
        card.appendChild(chk);
      }
      chk.style.border = '1.5px solid ' + (on ? '#1a1a1a' : '#ccc');
      chk.style.background = on ? '#1a1a1a' : '#fff';
      chk.innerHTML = on ? '&#10003;' : '';
    });
    _srvSyncBars();
  }
  /* 与 _stkTap 同款的元素级四通道绑定，tab 守卫改为 survey */
  /* 一处元素可能同时服务表情包与问卷两个 tab，各自带 tab 守卫；
     因此按元素登记多组处理器，点击时只执行守卫通过的那一组 */
  function _bindTap(el, fn, guard) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el || typeof fn !== 'function') return;
    var handlers = el.__akiniTapHandlers || (el.__akiniTapHandlers = []);
    for (var i = 0; i < handlers.length; i++) {
      if (handlers[i].fn === fn) { handlers[i].guard = guard; return; }
    }
    handlers.push({ fn: fn, guard: guard });
    if (el.__akiniTapBound) return;
    el.__akiniTapBound = 1;
    el.style.cursor = 'pointer';
    el.style.webkitTapHighlightColor = 'transparent';
    el.style.touchAction = 'manipulation';
    var sx = 0, sy = 0, moved = false, fired = false;
    function run(e) {
      var hs = el.__akiniTapHandlers || [];
      for (var j = 0; j < hs.length; j++) {
        var h = hs[j];
        if (h.guard && !h.guard()) continue;
        try { h.fn(e); } catch (err) {}
        return;
      }
    }
    el.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches[0]) {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; moved = false; fired = false;
      }
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0] &&
          (Math.abs(e.touches[0].clientX - sx) > 10 || Math.abs(e.touches[0].clientY - sy) > 10)) {
        moved = true;
      }
    }, { passive: true });
    el.addEventListener('touchcancel', function () { moved = false; fired = false; }, { passive: true });
    /* 用 touchend 而非 click：移动端 click 有 300ms 延迟且可能被其他模块的
       touchend preventDefault 吞掉；touchend 立即触发，体验跟手 */
    el.addEventListener('touchend', function (e) {
      if (moved) { moved = false; return; }
      fired = true;
      run(e);
    });
    el.addEventListener('click', function (e) {
      if (fired) { fired = false; return; }
      if (moved) { moved = false; return; }
      run(e);
    });
  }
  window.__akiniBindTap = _bindTap;
  function _srvTap(el, fn) {
    _bindTap(el, fn, function () { return window.__wbTab === "survey"; });
  }
  function _srvToggleSearch() {
    var bar = document.getElementById('wbSearchBar');
    if (!bar) return;
    var showing = bar.style.display !== 'none' && bar.style.display !== '';
    var ip = document.getElementById('wbSearchInput');
    if (showing) {
      bar.style.display = 'none';
      _srvQuery = '';
      if (ip) ip.value = '';
      renderSurveyWbTab();
    } else {
      bar.style.display = 'block';
      window.__wbSyncSearchScope && window.__wbSyncSearchScope();
      if (ip) { ip.placeholder = '搜索问卷标题或问题...'; try { ip.focus(); } catch (e) {} }
    }
  }
  function _srvToggleSelMode() {
    _srvSelMode = !_srvSelMode;
    if (_srvSelMode) _srvBlockMode = false;
    _srvSel = {};
    _srvPaintMode();
  }
  function _srvToggleBlockMode() {
    _srvBlockMode = !_srvBlockMode;
    if (_srvBlockMode) _srvSelMode = false;
    _srvSel = {};
    _srvPaintMode();
  }
  function _srvSelAll() {
    var arr = _srvRead();
    arr.forEach(function (s) { if (s && !s.deleted) _srvSel[s.id] = true; });
    _srvPaintMode();
  }
  function _srvEmptyGuard() {
    if (Date.now() - (window.__srvJustDone || 0) < 1500) return true;
    alert('请先选择问卷');
    return false;
  }
  /* 星星多选删除：删除问卷统一走星星工具 */
  var _srvDelInProgress = false;
  function _srvSelDelete() {
    if (_srvDelInProgress) return;
    var sids = Object.keys(_srvSel);
    if (!sids.length) { _srvEmptyGuard(); return; }
    _srvDelInProgress = true;
    window.__akiniCenterModal('确认', '确定删除选中的 ' + sids.length + ' 份问卷？', {
      confirm: true, okText: '删除', cancelText: '取消',
      onClose: function (ok) {
        setTimeout(function () { _srvDelInProgress = false; }, 1000);
        if (!ok) return;
        var arr = _srvRead();
        arr.forEach(function (s) { if (s && _srvSel[s.id]) s.deleted = true; });
        _srvWrite(arr);
        _srvSel = {};
        window.__srvJustDone = Date.now();
        renderSurveyWbTab();
      }
    });
  }
  function _srvPickGroupForSel(cb) {
    var groups = _srvGRead();
    if (!groups.length) { alert('请先通过工具栏「分组」创建问卷分组'); return; }
    var ov = document.createElement('div');
    ov.id = 'srvGroupPickOv';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:8400;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;';
    var h = '<div style="background:#fff;border-radius:16px;padding:20px;width:85%;max-height:60%;overflow-y:auto;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;">' +
      '<div style="font-size:16px;font-weight:600;color:#333">选择分组</div>';
    groups.forEach(function (g) {
      h += '<button type="button" data-gid="' + g.id + '" style="padding:10px 14px;background:#f5f5f5;border:none;border-radius:10px;font-size:14px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;">' + String(g.name).replace(/</g, "&lt;") + '</button>';
    });
    h += '<button type="button" data-cancel="1" style="padding:10px;background:#eee;border:none;border-radius:10px;font-size:14px;cursor:pointer;">取消</button></div>';
    ov.innerHTML = h;
    ov.addEventListener('click', function (e) {
      if (!ov.contains(e.target)) return;
      if (e.target === ov) { ov.remove(); return; }
      var b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      ov.remove();
      if (b.getAttribute('data-cancel')) return;
      cb(b.getAttribute('data-gid') || '');
    });
    document.body.appendChild(ov);
  }
  function _srvSelGroup() {
    var sids = Object.keys(_srvSel);
    if (!sids.length) { _srvEmptyGuard(); return; }
    _srvPickGroupForSel(function (gid) {
      var arr = _srvRead();
      arr.forEach(function (s) { if (s && _srvSel[s.id]) s.g = gid || ''; });
      _srvWrite(arr);
      _srvSel = {};
      window.__srvJustDone = Date.now();
      renderSurveyWbTab();
    });
  }
  function _srvBlockDo(blocked) {
    var sids = Object.keys(_srvSel);
    if (!sids.length) { _srvEmptyGuard(); return; }
    var arr = _srvRead();
    arr.forEach(function (s) { if (s && _srvSel[s.id]) s.b = blocked ? 1 : 0; });
    _srvWrite(arr);
    _srvSel = {};
    window.__srvJustDone = Date.now();
    renderSurveyWbTab();
  }
  /* 清除重复问卷：按 标题+全部问题文本 签名，保留最新一份 */
  function _srvDedup() {
    var arr = _srvRead();
    var seen = {};
    var removed = 0;
    for (var i = arr.length - 1; i >= 0; i--) {
      var s = arr[i];
      if (!s || s.deleted) continue;
      var sig = String(s.title || '').trim() + '||' + (s.questions || []).map(function (q) { return String(q.text || '').trim(); }).join('||');
      if (sig === '||') continue;
      if (seen[sig]) { s.deleted = true; removed++; }
      else seen[sig] = 1;
    }
    alert(removed > 0 ? '成功清除 ' + removed + ' 份重复问卷' : '没有重复问卷');
    if (removed > 0) { _srvSel = {}; _srvWrite(arr); renderSurveyWbTab(); }
  }
  /* 问卷分组管理弹窗 */
  function _srvRenderGroupModal() {
    var list = document.getElementById('srvGroupList');
    var empty = document.getElementById('srvGroupEmpty');
    if (!list) return;
    var groups = _srvGRead();
    var arr = _srvRead().filter(function (s) { return s && !s.deleted; });
    if (!groups.length) {
      list.innerHTML = ''; list.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }
    list.style.display = 'flex';
    if (empty) empty.style.display = 'none';
    var h = '';
    groups.forEach(function (g, gi) {
      var cnt = arr.filter(function (x) { return String(x.g) === String(g.id); }).length;
      h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8f8f8;border-radius:10px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;"><span style="font-size:14px;color:#333;font-weight:500;">' + String(g.name).replace(/</g, "&lt;") + '</span><span style="font-size:12px;color:#aaa;">' + cnt + '份</span></div>' +
        '<div style="display:flex;align-items:center;gap:2px;margin:-10px -12px -10px 0;">' +
        '<button type="button" class="srv-group-edit" data-gi="' + gi + '" style="background:none;border:none;color:#666;cursor:pointer;padding:10px 8px;min-width:36px;min-height:40px;touch-action:manipulation;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>' +
        '<button type="button" class="srv-group-del" data-gi="' + gi + '" style="background:none;border:none;color:#ff6b6b;font-size:16px;cursor:pointer;padding:10px 12px;min-width:40px;min-height:40px;touch-action:manipulation;">&#10005;</button></div></div>';
    });
    list.innerHTML = h;
    list.querySelectorAll('.srv-group-edit').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
                var gi = parseInt(this.getAttribute('data-gi'), 10);
        var gs = _srvGRead();
        if (isNaN(gi) || gi < 0 || gi >= gs.length) return;
        window.__akiniPromptModal('修改分组名称', '请输入新的分组名称', function (v) {
          if (!v || !v.trim()) return;
          var cur = _srvGRead();
          if (gi >= cur.length) return;
          cur[gi].name = v.trim();
          _srvGWrite(cur);
          _srvRenderGroupModal();
          renderSurveyWbTab();
        }, { value: gs[gi].name });
      });
    });
    list.querySelectorAll('.srv-group-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
                var gi = parseInt(this.getAttribute('data-gi'), 10);
        var gs = _srvGRead();
        if (isNaN(gi) || gi < 0 || gi >= gs.length) return;
        var gid = String(gs[gi].id);
        var gname = gs[gi].name;
        window.__akiniCenterModal('确认', '删除分组「' + gname + '」？组内问卷会变为未分组', {
          confirm: true, okText: '删除', cancelText: '取消',
          onClose: function (ok) {
            if (!ok) return;
            gs.splice(gi, 1);
            _srvGWrite(gs);
            var arr2 = _srvRead(); var dirty = false;
            arr2.forEach(function (x) { if (x && String(x.g) === gid) { x.g = ''; dirty = true; } });
            if (dirty) _srvWrite(arr2);
            if (String(_srvFilterGid) === gid) _srvFilterGid = '';
            _srvRenderGroupModal();
            renderSurveyWbTab();
          }
        });
      });
    });
  }
  function _srvOpenGroupModal() {
    var m = document.getElementById('srvGroupModal');
    if (!m) return;
    _srvRenderGroupModal();
    m.style.display = 'flex';
  }
  function _srvBindGroupModal() {
    var m = document.getElementById('srvGroupModal');
    if (!m || m.__bound) return;
    m.__bound = 1;
    m.addEventListener('click', function (e) { if (e.target === m) m.style.display = 'none'; });
    _srvTap('srvGroupClose', function () { m.style.display = 'none'; });
    _srvTap('srvGroupCreateBtn', function () {
      window.__akiniPromptModal('新建分组', '请输入问卷分组名称', function (name) {
        if (!name || !name.trim()) return;
        var gs = _srvGRead();
        gs.push({ id: Date.now(), name: name.trim() });
        _srvGWrite(gs);
        _srvRenderGroupModal();
        renderSurveyWbTab();
      });
    });
  }
  function _bindSurveyToolbar() {
    if (window.__srvToolbarBound) return;
    window.__srvToolbarBound = 1;
    _srvTap('searchBtn', _srvToggleSearch);
    _srvTap('wbSearchClose', function () {
      var bar = document.getElementById('wbSearchBar');
      if (bar) bar.style.display = 'none';
      _srvQuery = '';
      var ip = document.getElementById('wbSearchInput');
      if (ip) ip.value = '';
      if (window.__wbTab === 'survey') renderSurveyWbTab();
    });
    _srvTap('groupBtn', _srvOpenGroupModal);
    _srvTap('dedupBtn', _srvDedup);
    _srvTap('wbBlockBtn', _srvToggleBlockMode);
    _srvTap('selectBtn', _srvToggleSelMode);
    _srvTap('wbSelectAllBtn', _srvSelAll);
    _srvTap('wbSelectDeleteBtn', _srvSelDelete);
    _srvTap('wbSelectGroupBtn', _srvSelGroup);
    _srvTap('wbSelectCancelBtn', function () { _srvSelMode = false; _srvSel = {}; _srvPaintMode(); });
    _srvTap('wbBlockDoBtn', function () { _srvBlockDo(true); });
    _srvTap('wbBlockUndoBtn', function () { _srvBlockDo(false); });
    _srvTap('wbBlockExitBtn', function () { _srvBlockMode = false; _srvSel = {}; _srvPaintMode(); });
    /* 搜索输入：window 捕获阶段拦截，阻断主模块 input 处理器重绘主字卡列表 */
    window.addEventListener('input', function (e) {
      if (window.__wbTab !== 'survey') return;
      var t = e.target;
      if (!t || t.id !== 'wbSearchInput') return;
      _srvQuery = t.value.trim();
      renderSurveyWbTab();
    }, true);
    _srvBindGroupModal();
  }

  /* 字卡库【问卷】Tab 原生渲染，完全复刻表情包联系人横条逻辑（无我的，每个联系人独立问卷，右上角新增进创建问卷） */
  function renderSurveyWbTab() {
    var box = _wbSrvPanel();
    if (!box) return;
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

    /* 无联系人时使用默认联系人 */
    if (!contacts.length) {
      try {
        var dc = (window.__akiniDefaultContact && typeof window.__akiniDefaultContact === 'function') ? window.__akiniDefaultContact() : null;
        if (dc) contacts = [dc];
      } catch (e) {}
    }
    if (!contacts.length) {
      box.innerHTML = '<div style="text-align:center;color:#999;font-size:14px;padding:60px 20px;line-height:1.8;">还没有联系人<br/>请先在通讯录添加联系人后，再来为 TA 设置专属问卷</div>';
      _srvSyncBars();
      return;
    }

    /* 已移除联系人头像横条：问卷固定归属默认联系人，直接显示问卷列表 */
    var activeCid = '';
    try {
      var _defC = (window.__akiniDefaultContact && typeof window.__akiniDefaultContact === 'function') ? window.__akiniDefaultContact() : null;
      if (_defC && _defC.id) activeCid = _defC.id;
    } catch (e) {}
    if (!activeCid || !contacts.some(function (c) { return String(c.id) === String(activeCid); })) {
      var curChat = (window.akiniContacts && window.akiniContacts.getActiveChatId) ? window.akiniContacts.getActiveChatId() : "";
      if (curChat && contacts.some(function (c) { return String(c.id) === String(curChat); })) {
        activeCid = curChat;
      } else {
        activeCid = contacts[0].id;
      }
    }
    window.__currentWbSurveyCid = activeCid;
    window.__wbSurveyContactId = activeCid;

    var curContact = contacts.find(function (c) { return String(c.id) === String(activeCid); }) || contacts[0];
    var curName = (curContact && curContact.name) || "联系人";

    /* 内容签名：面板还是同一份内容时直接复用，切 tab 不重建头像与卡片，避免闪烁 */
    var _sigS = String(activeCid) + '\x1f' + _srvFilterGid + '\x1f' + _srvQuery + '\x1f' + _srvRev + '\x1f' + contacts.length + '\x1f' + curName;
    if (box.__srvSig === _sigS) {
      _srvPaintMode();
      return;
    }

    var h = '';

    var surveys = _srvRead();
    /* 字卡库仅显示用户创建的专属问卷素材；TA 发起的对话实例（srv_recv_）不在此显示，
       已经发到聊天的问卷（聊天记录里存在 data-survey-reply="0" 的邀请卡片）也不再混进字卡库 */
    var _sentSurvey = {};
    try {
      var _h = '';
      try { _h = (window.akiniContacts.getSession(activeCid) || {}).messagesHTML || ''; } catch (e0) {}
      if (!_h) { try { _h = localStorage.getItem('akini_chat_history_' + activeCid) || ''; } catch (e1) {} }
      var _re = /data-survey-id="([^"]+)"[^>]*data-survey-reply="0"/g, _m;
      while ((_m = _re.exec(_h))) _sentSurvey[_m[1]] = 1;
    } catch (e) {}
    var validList = surveys.filter(function (s) { return s && !s.deleted && String(s.id).indexOf('srv_recv_') !== 0 && !s.sentToChat && !_sentSurvey[String(s.id)]; });

    /* 问卷分组筛选条（与表情包同款 chips） */
    var groups = _srvGRead();
    if (groups.length) {
      var chip = function (gid, label, count) {
        var on2 = String(_srvFilterGid) === String(gid);
        return '<button type="button" class="wb-srv-chip wb-gf-btn' + (on2 ? ' active' : '') + '" data-gid="' + gid + '" style="flex-shrink:0;-webkit-tap-highlight-color:transparent;">' + label + (count != null ? '(' + count + ')' : '') + '</button>';
      };
      h += '<div style="display:flex;gap:6px;overflow-x:auto;margin:8px 16px 0;padding:5px;background:transparent;border-radius:14px;-webkit-overflow-scrolling:touch;box-sizing:border-box;flex-shrink:0;min-height:40px;">';
      h += chip('', '全部', null);
      h += chip('__ungrouped__', '未分组', validList.filter(function (x) { return !x.g; }).length);
      groups.forEach(function (g) {
        h += chip(g.id, String(g.name || '分组').replace(/</g, "&lt;"), validList.filter(function (x) { return String(x.g) === String(g.id); }).length);
      });
      h += '</div>';
    }

    /* 分组过滤 + 搜索过滤（标题/问题文本/分组名） */
    var shown = validList.filter(function (s) {
      if (_srvFilterGid === '__ungrouped__') { if (s.g) return false; }
      else if (_srvFilterGid && String(s.g) !== String(_srvFilterGid)) return false;
      if (_srvQuery) {
        var q = _srvQuery.toLowerCase();
        var hit = String(s.title || '').toLowerCase().indexOf(q) >= 0;
        if (!hit) hit = (s.questions || []).some(function (qq) { return String(qq.text || '').toLowerCase().indexOf(q) >= 0; });
        if (!hit) hit = String(s.g ? _srvGName(s.g) : '').toLowerCase().indexOf(q) >= 0;
        if (!hit) return false;
      }
      return true;
    });

    h += '<div style="padding:14px 16px;background:#fff;min-height:220px;width:100%;box-sizing:border-box;flex:1 1 auto;overflow-y:auto;">';
    if (!shown.length) {
      h += '<div style="text-align:center;color:#999;padding:48px 16px;font-size:14px;line-height:1.8;background:#fff;border-radius:12px;border:1px dashed #e0e0e0;">' +
        (validList.length ? '没有匹配的问卷' : ('「' + curName.replace(/</g, "&lt;") + '」还没有问卷<br/><span style="font-size:12px;color:#aaa;">点击右上角「+ 新增」为 TA 创建问卷</span>')) +
        '</div>';
    } else {
      shown.forEach(function (s) {
        var title = (s.title || "未命名问卷").replace(/</g, "&lt;");
        var qCount = (s.questions && s.questions.length) || 0;
        var qPreviews = (s.questions || []).slice(0, 2).map(function (q, qi) {
          return '<div style="font-size:12px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (qi + 1) + '. ' + String(q.text || '').replace(/</g, "&lt;") + '</div>';
        }).join('');
        var selOn = !!_srvSel[s.id];
        var inMode = _srvSelMode || _srvBlockMode;
        var gTag = s.g ? '<span style="display:inline-block;font-size:11px;color:#1a1a1a;background:#f0f0f0;border-radius:8px;padding:2px 8px;margin-top:6px;">' + String(_srvGName(s.g) || '分组').replace(/</g, "&lt;") + '</span>' : '';
        h += '<div class="wb-survey-card" data-sid="' + s.id + '" style="position:relative;background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.04);border:1.5px solid ' + (selOn ? '#1a1a1a' : '#eee') + ';' + (s.b ? 'opacity:.55;' : '') + '">' +
          (inMode ? '<span class="srv-chk" style="position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:50%;border:1.5px solid ' + (selOn ? '#1a1a1a' : '#ccc') + ';background:' + (selOn ? '#1a1a1a' : '#fff') + ';color:#fff;font-size:13px;line-height:19px;text-align:center;z-index:2;">' + (selOn ? '&#10003;' : '') + '</span>' : '') +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (inMode ? 'padding-right:28px;' : '') + '">' + title + '</div>' +
          '<div style="font-size:12px;color:#888;margin:3px 0 6px;">共 ' + qCount + ' 个问题' + (s.b ? ' · 已屏蔽' : '') + '</div>' +
          qPreviews + gTag +
          '</div></div>' +
          '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #f5f5f5;">' +
          '<button type="button" class="wb-survey-edit-btn" data-sid="' + s.id + '" style="padding:6px 14px;background:#1a1a1a;color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:500;cursor:pointer;">编辑</button>' +
          '</div></div>';
      });
    }
    h += '</div>';

    box.innerHTML = h;
    box.__srvSig = _sigS;
    _srvSyncBars();

    box.querySelectorAll('.wb-srv-chip').forEach(function (el) {
      _srvTap(el, function (e) {
        _srvFilterGid = el.getAttribute('data-gid') || '';
        _srvSel = {};
        renderSurveyWbTab();
      });
    });

    /* 多选/屏蔽模式下点击卡片=切换选中（星星删除/屏蔽均走此选择） */
    box.querySelectorAll('.wb-survey-card').forEach(function (card) {
      _srvTap(card, function (e) {
        if (!_srvSelMode && !_srvBlockMode) return;
        if (e.target && e.target.closest && (e.target.closest('.wb-survey-edit-btn') || e.target.closest('.wb-survey-del-btn'))) return;
        var sid = card.getAttribute('data-sid');
        if (_srvSel[sid]) delete _srvSel[sid]; else _srvSel[sid] = true;
        var on2 = !!_srvSel[sid];
        card.style.borderColor = on2 ? '#1a1a1a' : '#eee';
        var chk = card.querySelector('.srv-chk');
        if (chk) {
          chk.style.borderColor = on2 ? '#1a1a1a' : '#ccc';
          chk.style.background = on2 ? '#1a1a1a' : '#fff';
          chk.innerHTML = on2 ? '&#10003;' : '';
        }
        _srvSyncBars();
      });
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
      _srvTap(btn, function (e) {
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
      });
    });

  }
  window.renderSurveyWbTab = renderSurveyWbTab;
  /* 供外部（如联系人专属问卷保存路径 akini-survey-feature.js）在不走 _srvWrite 的
     情况下直接推进签名版本号，避免 renderSurveyWbTab 的内容签名缓存把新增问卷拦掉 */
  window.__srvBumpRev = function () { _srvRev++; };
  window.__openSurveyCreateForCurrentContact = function () {
    var cid = window.__currentWbSurveyCid;
    if (!cid && window.akiniContacts && window.akiniContacts.getContacts) {
      var cs = window.akiniContacts.getContacts() || [];
      if (cs[0]) cid = cs[0].id;
    }
    window.__surveyForContactConfig = cid || "";
    if (cid && window.akiniContacts && window.akiniContacts.setActiveChatId) {
      window.akiniContacts.setActiveChatId(cid);
    }
    if (typeof window.openSurveyCreate === "function") {
      /* 显式传 contact：这里是字卡库问卷右上角「为联系人新建专属问卷」，
         不传的话会被当成聊天加号的「我发给联系人回答」模式 */
      window.openSurveyCreate("contact");
    }
  };

  /* 选择/屏蔽模式只改已渲染格子的边框与勾选角标，不重建 img，避免点工具时整屏重绘闪烁 */
  function _stkPaintMode() {
    var box = document.getElementById('wbStkPanel');
    if (!box) { _syncModeBars(); return; }
    var show = _stkSelMode || _stkBlockMode;
    Array.prototype.forEach.call(box.querySelectorAll('.wb-stk-item'), function (el) {
      var idx = parseInt(el.getAttribute('data-idx'), 10);
      var on = !!_stkSel[idx];
      el.style.borderColor = on ? '#1a1a1a' : '#eee';
      var chk = el.querySelector('.stk-chk');
      if (!show) { if (chk) chk.parentNode.removeChild(chk); return; }
      if (!chk) {
        chk = document.createElement('span');
        chk.className = 'stk-chk';
        chk.style.cssText = 'position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;color:#fff;font-size:12px;line-height:17px;text-align:center;';
        el.appendChild(chk);
      }
      chk.style.border = '1.5px solid ' + (on ? '#1a1a1a' : '#ccc');
      chk.style.background = on ? '#1a1a1a' : 'rgba(255,255,255,.9)';
      chk.innerHTML = on ? '\u2713' : '';
    });
    _syncModeBars();
  }

  /* 面板内容签名：联系人/分组/搜索词/数据版本任一项变化才重建 DOM。
     已挂载的面板与签名一致时直接复用现有节点——不重造 <img>，切 tab 与点工具都不会闪。 */
  /* 旧版表情包默认角色被固定成「我」，导致导入/新增的表情包全落在 akini_stickers_me。
     一次性归位：用户从未手动切换过角色、默认联系人还没有表情包时，把这些表情包移给默认联系人。 */
  var _stkRoleFixing = false;
  function _stkFixLegacyRole() {
    if (_stkRoleFixing) return;
    try {
      if (localStorage.getItem('akini_stk_role_fix_v1') === '1') return;
      var manual = localStorage.getItem('akini_wb_sticker_cid_manual') === '1';
      var picked = localStorage.getItem('akini_wb_sticker_cid');
      /* 用户手动选过角色（含手动选「我」）或已选过具体联系人：不动用户的选择 */
      if (manual || (picked && picked !== 'me')) { localStorage.setItem('akini_stk_role_fix_v1', '1'); return; }
      var dc = _defaultCid();
      if (!dc || dc === 'me') return;
      var meArr = _stkRead('me');
      var dcArr = _stkRead(dc);
      /* 两边都为空：数据可能还在 IndexedDB 水合中，等下次渲染再试；
         水合已完成则说明确实没有旧数据，直接置位，避免以后把新导入的表情包误搬走 */
      if (!meArr.length && !dcArr.length) {
        if (window.__stkHydratedDone) { try { localStorage.setItem('akini_stk_role_fix_v1', '1'); } catch (eZ) {} }
        return;
      }
      if (meArr.length && !dcArr.length) {
        _stkRoleFixing = true;
        try { localStorage.setItem('akini_stk_role_fix_v1', '1'); } catch (e0) {}
        _stkWrite(dc, meArr);
        try {
          window._akiniAllowRemove = true;
          _stkWrite('me', []);
        } catch (e1) {} finally { window._akiniAllowRemove = false; }
        try { localStorage.setItem('akini_wb_sticker_cid', dc); localStorage.setItem('akini_wb_sticker_cid_manual', '1'); } catch (e2) {}
        try {
          var _co = window.akiniContacts && window.akiniContacts.getContactById ? window.akiniContacts.getContactById(dc) : null;
          var _tk = window.akiniToast || window.__akiniToast;
          _tk && _tk('已将表情包归位到「' + ((_co && _co.name) || '对方') + '」');
        } catch (e3) {}
      }
      try { localStorage.setItem('akini_stk_role_fix_v1', '1'); } catch (e4) {}
    } catch (e) {}
  }

  function renderStickerTab() {
    var box = _wbPanel();
    if (!box) return;
    _applyStickerChrome(true);
    _stkFixLegacyRole();
    var cid = _getCid();
    /* 单人陪伴：表情包角色只有默认联系人，多人功能及其历史数据均已移除 */
    var _dc0 = (window.__akiniDefaultContact && window.__akiniDefaultContact()) || null;
    var contacts = _dc0 ? [_dc0] : [];
    var myName = localStorage.getItem('akini_my_name') || '我';
    var _sig = cid + '\x1f' + _stkFilterGid + '\x1f' + _stkQuery + '\x1f' + contacts.length + '\x1f' + myName + '\x1f' + _stkRev;
    if (box.__stkSig === _sig && box.querySelector('.wb-stk-person')) {
      _stkPaintMode();
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
        /* 同步解码：重绘时图片在同一帧内就绪，不会先出现空白格再"闪"出图片 */
        '<img src="' + it.s + '" decoding="sync" style="width:100%;height:100%;object-fit:contain;" alt=""/>' +
        (inMode ? '<span class="stk-chk" style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;border:1.5px solid ' + (selOn ? '#1a1a1a' : '#ccc') + ';background:' + (selOn ? '#1a1a1a' : 'rgba(255,255,255,.9)') + ';color:#fff;font-size:12px;line-height:17px;text-align:center;">' + (selOn ? '✓' : '') + '</span>' : '') +
        (it.b ? '<span style="position:absolute;bottom:3px;right:3px;font-size:10px;color:#fff;background:rgba(0,0,0,.55);border-radius:6px;padding:1px 5px;">已屏蔽</span>' : '') +
        '</div>';
    });
    h += '</div>' + (shown.length ? '' : '<div style="text-align:center;color:#bbb;font-size:13px;padding:40px 0;">' + (arr.length ? '没有匹配的表情包' : '还没有表情包，点右上角「新增」添加图片') + '</div>') + '</div>';
    box.innerHTML = h;
    box.__stkSig = _sig;
    _syncModeBars();
    /* 容器级事件委托：touchend 捕获阶段。
       主字卡模块在 #wbContent 的 touchend（冒泡阶段）里对未滑动的触摸无条件 preventDefault，
       iOS 上这会抑制后续 click，导致头像切换/分组筛选/格子点击全部失效。
       捕获阶段先于冒泡执行，在此直接处理即可绕过。 */
    if (!window.__stkTapDelegated) {
      window.__stkTapDelegated = true;
      var _content = box;
      var _slop = { x: 0, y: 0, moved: false };
      _content.addEventListener('touchstart', function (ev) {
        var p = ev.touches && ev.touches[0];
        if (!p) return;
        _slop.x = p.clientX; _slop.y = p.clientY; _slop.moved = false;
      }, { passive: true, capture: true });
      _content.addEventListener('touchmove', function (ev) {
        var p = ev.touches && ev.touches[0];
        if (!p) return;
        if (Math.abs(p.clientX - _slop.x) > 10 || Math.abs(p.clientY - _slop.y) > 10) _slop.moved = true;
      }, { passive: true, capture: true });
      _content.addEventListener('touchcancel', function () { _slop.moved = false; }, { passive: true, capture: true });
      _content.addEventListener('touchend', function (ev) {
        if (window.__wbTab !== 'sticker') return;
        if (_slop.moved) { _slop.moved = false; return; }
        var t = ev.target && ev.target.closest ? ev.target : null;
        if (!t || !t.closest) return;
        var person = t.closest('.wb-stk-person');
        var chipEl = t.closest('.wb-stk-chip');
        var item = t.closest('.wb-stk-item');
        if (!person && !chipEl && !item) return;
        try {
          if (person) {
            _setCid(person.getAttribute('data-cid'));
            _stkSel = {};
            renderStickerTab();
            return;
          }
          if (chipEl) {
            _stkFilterGid = chipEl.getAttribute('data-gid') || '';
            _stkSel = {};
            renderStickerTab();
            return;
          }
          if (item) {
            var idx = parseInt(item.getAttribute('data-idx'), 10);
            if (isNaN(idx)) return;
            if (_stkSelMode || _stkBlockMode) {
              if (_stkSel[idx]) delete _stkSel[idx]; else _stkSel[idx] = true;
              var __on = !!_stkSel[idx];
              item.style.borderColor = __on ? '#1a1a1a' : '#eee';
              var __chk = item.querySelector('.stk-chk');
              if (__chk) {
                __chk.style.borderColor = __on ? '#1a1a1a' : '#ccc';
                __chk.style.background = __on ? '#1a1a1a' : 'rgba(255,255,255,.9)';
                __chk.textContent = __on ? '✓' : '';
              }
              _syncModeBars();
            } else {
              /* 普通点击不删除表情包：删除统一走星标选择模式 */
            }
          }
        } catch (x) {}
      }, true);
    }
  }

  /* ---- 删除确认 ---- */
  var _delTarget = null;
  function _askDelete(cid, idx) {
    _delTarget = { cid: cid, idx: idx };
    var sh = document.getElementById('wbStickerActionSheet');
    if (sh) sh.style.display = 'flex';
  }
  function _bindDeleteSheet() {
    var sh = document.getElementById('wbStickerActionSheet');
    var ok = document.getElementById('wbStickerDelConfirm');
    var no = document.getElementById('wbStickerDelCancel');
    if (!sh || sh.__bound) return;
    sh.__bound = 1;
    sh.addEventListener('click', function (e) { if (e.target === sh) sh.style.display = 'none'; });
    no && no.addEventListener('click', function () { sh.style.display = 'none'; });
    ok && ok.addEventListener('click', function () {
      if (_delTarget) {
        var arr = _stkRead(_delTarget.cid);
        if (_delTarget.idx >= 0 && _delTarget.idx < arr.length) {
          arr.splice(_delTarget.idx, 1);
          _stkWrite(_delTarget.cid, arr);
        }
      }
      _delTarget = null;
      sh.style.display = 'none';
      renderStickerTab();
    });
  }

  /* ---- 源头：表情包/问卷 tab 不显示导出/导入按钮 ----
     只切换 display，绝不 remove/重建节点：core 启动时把 change 监听绑在原始
     #wbImportInput 上，节点一旦被重建，导入就永久失效（点了没反应）。
     节点常驻 DOM（隐藏态是不可见的），导入监听才始终有效。 */
  window.__wbSyncIOButtons = function () {
    try {
      var _tab = window.__wbTab || 'main';
      var _hide = (_tab === 'sticker' || _tab === 'survey');
      ['wbExportBtn', 'wbImportBtn', 'wbImportInput'].forEach(function (id) {
        var _e = document.getElementById(id);
        if (_e) _e.style.display = _hide ? 'none' : '';
      });
    } catch (_e) {}
  };

  /* ---- tab 切换跟踪 ---- */
  function _syncTab(tabName) {
    var tabs = document.querySelector('.wb-tabs');
    var prev = window.__wbTab || 'main';
    /* 只有显式传入 tabName 时才切换；否则只同步 DOM 激活态，避免把已切换的 tab 又改回去 */
    if (tabName) {
      window.__wbTab = tabName;
    } else {
      window.__wbTab = window.__wbTab || 'main';
    }
    /* 同步 .active 类，确保与 window.__wbTab 一致 */
    if (tabs) {
      var tbs = tabs.querySelectorAll('.tab');
      tbs.forEach(function (b) {
        if ((b.getAttribute('data-tab') || 'main') === window.__wbTab) b.classList.add('active');
        else b.classList.remove('active');
      });
    }
    /* 分组管理弹窗标题按当前模块命名（表情包 tab 用独立的 stkGroupModal，标题已静态写好） */
    try {
      var _gmT = document.querySelector('#groupModal .title');
      if (_gmT) _gmT.textContent = ({ main: '主字卡', emoji: 'Emoji', pat: '拍一拍', bubble: '小气泡' }[window.__wbTab] || '主字卡') + '分组管理';
    } catch (e) {}
    var on = window.__wbTab === 'sticker';
    if (!on && prev === 'sticker') { _stkExitModes(); _stkQuery = ''; }
    if (window.__wbTab !== 'survey' && prev === 'survey') {
      _srvExitModes(); _srvQuery = ''; _srvFilterGid = '';
      var _srvSb = document.getElementById('wbSearchBar');
      if (_srvSb) _srvSb.style.display = 'none';
      var _srvSi = document.getElementById('wbSearchInput');
      if (_srvSi) _srvSi.value = '';
    }
    var _sa = document.getElementById('wbSelectActions');
    var _ba = document.getElementById('wbBlockActions');
    if (_sa) _sa.style.display = 'none';
    if (_ba) _ba.style.display = 'none';
    _applyStickerChrome(on);
    window.__wbSyncSearchScope && window.__wbSyncSearchScope();
    var isSurvey = window.__wbTab === 'survey';
    /* 表情包/问卷 tab 不提供导入/导出：直接把按钮从 DOM 移除（不是 display:none），
       切回其他 tab 时再插回工具栏 */
    try { window.__wbSyncIOButtons && window.__wbSyncIOButtons(); } catch (eTabBtn) {}
    /* 表情包/问卷各用独立面板：#wbContent 留给主字卡模块随意重绘，互不干扰 */
    _wbPanelShow(window.__wbTab);
    if (on) { renderStickerTab(); }
    else if (isSurvey) {
      _bindSurveyToolbar();
      if (typeof renderSurveyWbTab === 'function') renderSurveyWbTab();
    } else {
      /* 主字卡 / Emoji / 拍一拍：直接同步渲染，不再走 "正在加载..." + setTimeout 的闪烁链路 */
      try { window.__wbRenderList && window.__wbRenderList(); } catch (e) {}
      /* 分组条按当前 tab 独立渲染：切回主字卡时它可能被 wb-panel-mode 隐藏过，
         且不能残留上一个 tab 的分组，必须重新渲染一次 */
      try { window.__wbRenderGroupFilter && window.__wbRenderGroupFilter(); } catch (eGf) {}
    }
  }
  function _bindTabs() {
    var tabs = document.querySelector('.wb-tabs');
    if (!tabs || tabs.__stkBound) return;
    tabs.__stkBound = 1;
    /* touchend 捕获阶段：立即按点击的 tab 切换（绕过 core 的 10px 滑动过滤可能导致 click 不触发的问题） */
    tabs.addEventListener('touchend', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('.tab') : null;
      if (t) {
        var name = t.getAttribute('data-tab') || 'main';
        _syncTab(name);
      }
    }, true);
    /* click 兜底：只同步 DOM 激活态与重绘 */
    tabs.addEventListener('click', function () { _syncTab(); });
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
      var cnt = arr.filter(function (x) { return String(x.g) === String(g.id); }).length;
      /* 行样式与其他三个 tab 的分组管理完全一致（同款内联样式，仅单位用"张"） */
      h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8f8f8;border-radius:10px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;"><span style="font-size:14px;color:#333;font-weight:500;">' + _esc(g.name) + '</span><span style="font-size:12px;color:#aaa;">' + cnt + '张</span></div>' +
        '<div style="display:flex;align-items:center;gap:2px;margin:-10px -12px -10px 0;">' +
        '<button type="button" class="stk-group-edit" data-gi="' + gi + '" title="修改分组名称" style="background:none;border:none;color:#666;cursor:pointer;padding:10px 8px;min-width:36px;min-height:40px;touch-action:manipulation;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>' +
        '<button type="button" class="stk-group-del del-group" data-gi="' + gi + '" style="background:none;border:none;color:#ff6b6b;font-size:16px;cursor:pointer;padding:10px 12px;min-width:40px;min-height:40px;touch-action:manipulation;">✕</button></div></div>';
    });
    list.innerHTML = h;
    list.querySelectorAll('.stk-group-edit').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
                var gi = parseInt(this.getAttribute('data-gi'), 10);
        var gs = _stkGRead();
        if (isNaN(gi) || gi < 0 || gi >= gs.length) return;
        window.__akiniPromptModal('修改分组名称', '请输入新的分组名称', function (v) {
          if (!v || !v.trim()) return;
          var cur = _stkGRead();
          if (gi >= cur.length) return;
          cur[gi].name = v.trim();
          _stkGWrite(cur);
          _stkRenderGroupModal();
          renderStickerTab();
        }, { value: gs[gi].name });
      });
    });
    list.querySelectorAll('.stk-group-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
                var gi = parseInt(this.getAttribute('data-gi'), 10);
        var gs = _stkGRead();
        if (isNaN(gi) || gi < 0 || gi >= gs.length) return;
        var gid = String(gs[gi].id);
        var gname = gs[gi].name;
        window.__akiniCenterModal('确认', '删除分组「' + gname + '」？组内表情包会变为未分组', {
          confirm: true,
          okText: '删除',
          cancelText: '取消',
          onClose: function (ok) {
            if (!ok) return;
            gs.splice(gi, 1);
            _stkGWrite(gs);
            _stkAllCids().forEach(function (c) {
              var a2 = _stkRead(c), dirty = false;
              a2.forEach(function (x) { if (String(x.g) === gid) { x.g = ''; dirty = true; } });
              if (dirty) _stkWrite(c, a2);
            });
            if (String(_stkFilterGid) === gid) _stkFilterGid = '';
            _stkRenderGroupModal();
            renderStickerTab();
          }
        });
      });
    });
  }
  function _stkOpenGroupModal() {
    var m = document.getElementById('stkGroupModal');
    if (!m) return;
    _stkRenderGroupModal();
    m.style.display = 'flex';
  }
  function _bindStkGroupModal() {
    var m = document.getElementById('stkGroupModal');
    if (!m || m.__bound) return;
    m.__bound = 1;
    m.addEventListener('click', function (e) { if (e.target === m) m.style.display = 'none'; });
    /* 关闭/新建统一走 _cap 捕获 */
    _stkTap('stkGroupClose', function () { m.style.display = 'none'; });
    _stkTap('stkGroupCreateBtn', function () {
      window.__akiniPromptModal('新建分组', '请输入表情包分组名称', function (name) {
        if (!name || !name.trim()) return;
        var gs = _stkGRead();
        gs.push({ id: Date.now(), name: name.trim() });
        _stkGWrite(gs);
        _stkRenderGroupModal();
        renderStickerTab();
      });
    });
  }

  /* 多选「加入分组」选择面板 */
  function _stkPickGroupForSel(cb) {
    var groups = _stkGRead();
    if (!groups.length) { alert('请先通过工具栏「分组」创建分组'); return; }
    var ov = document.createElement('div');
    ov.id = 'stkGroupPickOv';
    /* 与其他三个 tab 的「选择分组」弹窗样式统一（居中白卡 + wb-pick-group-btn） */
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:8400;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;';
    var h = '<div style="background:#fff;border-radius:16px;padding:20px;width:85%;max-height:60%;overflow-y:auto;display:flex;flex-direction:column;gap:12px;box-sizing:border-box;">' +
      '<div style="font-size:16px;font-weight:600;color:#333">选择分组</div>';
    groups.forEach(function (g) {
      h += '<button type="button" data-gid="' + g.id + '" class="wb-pick-group-btn" style="padding:10px 14px;background:#f5f5f5;border:none;border-radius:10px;font-size:14px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;">' + _esc(g.name) + '</button>';
    });
    h += '<button type="button" data-cancel="1" style="padding:10px;background:#eee;border:none;border-radius:10px;font-size:14px;cursor:pointer;">取消</button></div>';
    ov.innerHTML = h;
    ov.addEventListener('click', function (e) {
      /* 创建本弹窗的原始点击会继续冒泡经过 body，closest('button') 会误匹配工具栏按钮导致弹窗闪关并被移到未分组；
         只响应发生在弹窗内部的点击 */
      if (!ov.contains(e.target)) return;
      if (e.target === ov) { ov.remove(); return; }
      var b = e.target && e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      ov.remove();
      if (b.getAttribute('data-cancel')) return;
      cb(b.getAttribute('data-gid') || '');
    });
    document.body.appendChild(ov);
  }

  /* 表情包不再提供独立导入/导出 */

  /* 查重：按图片内容去除当前角色重复表情包 */
  function _stkDedup() {
    var cid = _getCid();
    var arr = _stkRead(cid);
    var seen = {};
    var out = [];
    arr.forEach(function (it) { if (!seen[it.s]) { seen[it.s] = 1; out.push(it); } });
    var removed = arr.length - out.length;
    alert(removed > 0 ? '成功去重 ' + removed + ' 张表情包' : '没有重复表情包');
    if (removed > 0) { _stkWrite(cid, out); _stkSel = {}; renderStickerTab(); }
  }

  /* 搜索栏顶部显示当前搜索范围（主字卡/Emoji/拍一拍/表情包） */
  window.__wbSyncSearchScope = function () {
    var el = document.getElementById('wbSearchScope');
    var ip = document.getElementById('wbSearchInput');
    var map = { main: '主字卡', emoji: 'Emoji', pat: '拍一拍', sticker: '表情包', bubble: '小气泡', survey: '问卷' };
    var phMap = { main: '搜索字卡...', emoji: '搜索字卡...', pat: '搜索字卡...', bubble: '搜索小气泡...', sticker: '按分组名搜索表情包...', survey: '搜索问卷标题或问题...' };
    var tab = window.__wbTab || 'main';
    if (el) el.textContent = '搜索范围：' + (map[tab] || '主字卡');
    if (ip) ip.placeholder = phMap[tab] || '搜索字卡...';
  };

  function _stkToggleSearch() {
    var bar = document.getElementById('wbSearchBar');
    if (!bar) return;
    var showing = bar.style.display !== 'none' && bar.style.display !== '';
    var ip = document.getElementById('wbSearchInput');
    if (showing) {
      bar.style.display = 'none';
      _stkQuery = '';
      if (ip) ip.value = '';
      renderStickerTab();
    } else {
      bar.style.display = 'block';
      window.__wbSyncSearchScope();
      if (ip) { ip.placeholder = '按分组名搜索表情包...'; try { ip.focus(); } catch (e) {} }
    }
  }
  function _stkToggleSelMode() {
    _stkSelMode = !_stkSelMode;
    if (_stkSelMode) _stkBlockMode = false;
    _stkSel = {};
    _stkPaintMode();
  }
  function _stkToggleBlockMode() {
    _stkBlockMode = !_stkBlockMode;
    if (_stkBlockMode) _stkSelMode = false;
    _stkSel = {};
    _stkPaintMode();
  }
  function _stkSelAll() {
    var arr = _stkRead(_getCid());
    _stkFiltered(arr).forEach(function (row) { _stkSel[row.idx] = true; });
    _stkPaintMode();
  }
  /* 操作成功后 1.5s 内的空选择静默忽略 */
  function _stkEmptyGuard() {
    if (Date.now() - (window.__stkJustDone || 0) < 1500) return true;
    alert('请先选择表情包');
    return false;
  }
  var _stkDelInProgress = false;
  function _stkSelDelete() {
    if (_stkDelInProgress) return;
    var idxs = Object.keys(_stkSel).map(Number).sort(function (a, b) { return b - a; });
    if (!idxs.length) { _stkEmptyGuard(); return; }
    _stkDelInProgress = true;
    window.__akiniCenterModal('确认', '确定删除选中的 ' + idxs.length + ' 张表情包？', {
      confirm: true,
      okText: '删除',
      cancelText: '取消',
      onClose: function (ok) {
        setTimeout(function () { _stkDelInProgress = false; }, 1000);
        if (!ok) return;
        var cid = _getCid();
        var arr = _stkRead(cid);
        idxs.forEach(function (i) { if (i >= 0 && i < arr.length) arr.splice(i, 1); });
        _stkWrite(cid, arr);
        _stkSel = {};
        window.__stkJustDone = Date.now();
        renderStickerTab();
      }
    });
  }
  function _stkSelGroup() {
    var idxs = Object.keys(_stkSel).map(Number);
    if (!idxs.length) { _stkEmptyGuard(); return; }
    _stkPickGroupForSel(function (gid) {
      var cid = _getCid();
      var arr = _stkRead(cid);
      idxs.forEach(function (i) { if (arr[i]) arr[i].g = gid || ''; });
      _stkWrite(cid, arr);
      _stkSel = {};
      window.__stkJustDone = Date.now();
      renderStickerTab();
    });
  }
  function _stkBlockDo(blocked) {
    var idxs = Object.keys(_stkSel).map(Number);
    if (!idxs.length) { _stkEmptyGuard(); return; }
    var cid = _getCid();
    var arr = _stkRead(cid);
    idxs.forEach(function (i) { if (arr[i]) arr[i].b = blocked ? 1 : 0; });
    _stkWrite(cid, arr);
    _stkSel = {};
    window.__stkJustDone = Date.now();
    renderStickerTab();
  }

  function _bindStickerToolbar() {
    if (window.__stkToolbarBound) return;
    window.__stkToolbarBound = 1;
    _stkTap('searchBtn', _stkToggleSearch);
    _stkTap('wbSearchClose', function () {
      var bar = document.getElementById('wbSearchBar');
      if (bar) bar.style.display = 'none';
      _stkQuery = '';
      var ip = document.getElementById('wbSearchInput');
      if (ip) ip.value = '';
      renderStickerTab();
    });
    _stkTap('groupBtn', _stkOpenGroupModal);
    _stkTap('dedupBtn', _stkDedup);
    /* 字卡库统一导入完成后，供 core 刷新表情包面板 */
    window.__wbRenderStickerTab = renderStickerTab;
    /* 统一导入是 core 直接写 akini_stickers_*，不会经过 _stkWrite：
       这里清掉同步缓存并重绘，避免表情包面板/聊天读到导入前的旧数据 */
    window.__wbRefreshStickers = function () {
      _stkRev++;
      try {
        if (window.__csCache) {
          Object.keys(window.__csCache).forEach(function (k) {
            if (k.indexOf('akini_stickers_') === 0) delete window.__csCache[k];
          });
        }
      } catch (e) {}
      renderStickerTab();
    };
    _stkTap('wbBlockBtn', _stkToggleBlockMode);
    _stkTap('selectBtn', _stkToggleSelMode);
    _stkTap('wbSelectAllBtn', _stkSelAll);
    _stkTap('wbSelectDeleteBtn', _stkSelDelete);
    _stkTap('wbSelectGroupBtn', _stkSelGroup);
    _stkTap('wbSelectCancelBtn', function () { _stkSelMode = false; _stkSel = {}; _stkPaintMode(); });
    _stkTap('wbBlockDoBtn', function () { _stkBlockDo(true); });
    _stkTap('wbBlockUndoBtn', function () { _stkBlockDo(false); });
    _stkTap('wbBlockExitBtn', function () { _stkBlockMode = false; _stkSel = {}; _stkPaintMode(); });
    /* 搜索输入：拦截主模块处理器，避免其重绘覆盖表情包网格 */
    window.addEventListener('input', function (e) {
      if (window.__wbTab !== 'sticker') return;
      var t = e.target;
      if (!t || t.id !== 'wbSearchInput') return;
      _stkQuery = t.value.trim();
      renderStickerTab();
    }, true);
    /* 搜索栏被任一模块打开时同步顶部搜索范围标签 */
    var sb = document.getElementById('wbSearchBar');
    if (sb && window.MutationObserver) {
      var smo = new MutationObserver(function () { window.__wbSyncSearchScope && window.__wbSyncSearchScope(); });
      smo.observe(sb, { attributes: true, attributeFilter: ['style'] });
    }
    _bindStkGroupModal();
  }


  /* ---- 表情包专属添加弹窗逻辑 ---- */
  var _pendingStickerFiles = [];

  function _renderStickerPreviews() {
    var grid = document.getElementById('wbStickerPreviewGrid');
    var countEl = document.getElementById('wbStickerPickedCount');
    var clearBtn = document.getElementById('wbStickerClearAll');
    if (!grid) return;
    if (countEl) countEl.textContent = String(_pendingStickerFiles.length);
    if (clearBtn) clearBtn.style.display = _pendingStickerFiles.length > 0 ? 'inline-block' : 'none';
    if (!_pendingStickerFiles.length) {
      grid.innerHTML = '<div id="wbStickerEmptyTip" style="grid-column:1/-1;text-align:center;color:#bbb;font-size:13px;padding:36px 0;">未选择任何图片</div>';
      return;
    }
    var html = '';
    _pendingStickerFiles.forEach(function (dataUrl, idx) {
      html += '<div style="position:relative;width:100%;aspect-ratio:1/1;min-height:64px;height:auto;background:#fff;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;box-sizing:border-box;">' +
        '<img src="' + dataUrl + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;" alt=""/>' +
        '<button type="button" class="wb-stk-del-item" data-idx="' + idx + '" style="position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,0.65);color:#fff;border:none;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;z-index:2;">✕</button>' +
        '</div>';
    });
    grid.innerHTML = html;
    grid.querySelectorAll('.wb-stk-del-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
                var i = parseInt(this.getAttribute('data-idx'), 10);
        if (!isNaN(i) && i >= 0 && i < _pendingStickerFiles.length) {
          _pendingStickerFiles.splice(i, 1);
          _renderStickerPreviews();
        }
      });
    });
  }

  function _openAddStickerModal() {
    _pendingStickerFiles = [];
    var modal = document.getElementById('addStickerModal');
    if (!modal) return;
    _renderStickerPreviews();
    /* 填充「添加进分组」下拉 */
    var sel = document.getElementById('wbStickerGroupSelect');
    if (sel) {
      var oh = '<option value="">-- 不分组 --</option>';
      _stkGRead().forEach(function (g) { oh += '<option value="' + g.id + '">' + _esc(g.name) + '</option>'; });
      sel.innerHTML = oh;
    }
    modal.style.display = 'flex';
    modal.classList.add('show');
  }
  window.__initAddStickerModal = _openAddStickerModal;
  window.__openAddStickerModal = _openAddStickerModal;

  function _bindAddStickerModalEvents() {
    var modal = document.getElementById('addStickerModal');
    if (!modal || modal.__boundStkEvents) return;
    modal.__boundStkEvents = 1;

    var input = document.getElementById('wbStickerMultiInput');
    if (input) {
      input.addEventListener('change', function () {
        var files = Array.from(this.files || []);
        this.value = '';
        if (!files.length) return;
        var pending = files.length;
        files.forEach(function (file) {
          var reader = new FileReader();
          reader.onload = function (ev) {
            if (ev.target && ev.target.result) {
              _pendingStickerFiles.push(ev.target.result);
            }
            pending--;
            if (pending <= 0) {
              _renderStickerPreviews();
            }
          };
          reader.readAsDataURL(file);
        });
      });
    }

    var clearBtn = document.getElementById('wbStickerClearAll');
    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
                _pendingStickerFiles = [];
        _renderStickerPreviews();
      });
    }

    var cancelBtn = document.getElementById('cancelAddSticker');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function (e) {
                _pendingStickerFiles = [];
        modal.style.display = 'none';
        modal.classList.remove('show');
      });
    }

    var confirmBtn = document.getElementById('confirmAddSticker');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function (e) {
                if (!_pendingStickerFiles.length) {
          alert('请先选择要添加的表情包图片');
          return;
        }
        var gidSel = document.getElementById('wbStickerGroupSelect');
        var gid = gidSel ? (gidSel.value || '') : '';
        var cid = _getCid();
        var arr = _stkRead(cid);
        var _addCnt = _pendingStickerFiles.length;
        _pendingStickerFiles.forEach(function (s) {
          arr.push({ s: s, g: gid, b: 0 });
        });
        _stkWrite(cid, arr);
        _pendingStickerFiles = [];
        modal.style.display = 'none';
        modal.classList.remove('show');
        renderStickerTab();
        var _roleName = '我';
        if (cid !== 'me') {
          try {
            var _co = window.akiniContacts && window.akiniContacts.getContactById ? window.akiniContacts.getContactById(cid) : null;
            if (_co && _co.name) _roleName = _co.name;
          } catch (e2) {}
        }
        window.__akiniToast && window.__akiniToast('✓ 成功添加 ' + _addCnt + ' 个表情包到「' + _roleName + '」');
      });
    }
  }

  /* ---- 右上角新增：表情包 tab 时弹出添加表情包弹窗 ---- */
  function _bindAdd() {
    _bindAddStickerModalEvents();
    /* iOS 上 inline onclick 可能因 touchend 抑制而不触发，这里在捕获阶段直接接管 */
    var addBtn = document.querySelector('#wordbankOverlay .wb-head-add');
    if (addBtn && !addBtn.__stkBound) {
      addBtn.__stkBound = 1;
      var openPicker = function (e) {
        if (window.__wbTab !== 'sticker') return;
                var now = Date.now();
        if (addBtn.__stkLock && now - addBtn.__stkLock < 700) return;
        addBtn.__stkLock = now;
        _openAddStickerModal();
      };
      addBtn.addEventListener('pointerdown', openPicker, true);
      addBtn.addEventListener('touchend', openPicker, true);
      addBtn.addEventListener('click', openPicker, true);
    }
  }

  /* ---- 通用表情包选择面板（评论/观影输入栏用，读「我」的表情包库） ---- */
  var _pickCb = null;
  window.__openStickerPickPanel = function (onPick) {
    _pickCb = onPick;
    var p = document.getElementById('stickerPickPanel');
    var g = document.getElementById('stickerPickGrid');
    if (!p || !g) return;
    var arr = _stkRead('me').filter(function (it) { return !it.b; });
    if (!arr.length) {
      try {
        var gb = JSON.parse(localStorage.getItem('akini_stickers') || '[]');
        if (Array.isArray(gb)) arr = gb.map(_stkOne).filter(Boolean).filter(function (it) { return !it.b; });
      } catch (e) {}
    }
    var h = '';
    arr.forEach(function (it, i) {
      /* 弃用 aspect-ratio（旧 Android WebView 不支持会导致 item 高度塌陷、图片全部堆叠），
         改用 padding-bottom:100% 方形兼容写法 */
      h += '<div class="stk-pick-item" data-idx="' + i + '" style="width:100%;height:0;padding-bottom:100%;background:#f7f7f7;border-radius:10px;overflow:hidden;position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent;"><img src="' + it.s + '" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;" alt=""/></div>';
    });
    g.innerHTML = h || '<div style="grid-column:1/-1;text-align:center;color:#bbb;font-size:13px;padding:36px 0;">还没有表情包，去「字卡库 → 表情包」添加</div>';
    g.querySelectorAll('.stk-pick-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var it = arr[parseInt(this.getAttribute('data-idx'), 10)];
        p.style.display = 'none';
        if (it && _pickCb) _pickCb(it.s);
      });
    });
    /* 观影全屏时面板移到全屏元素内（Fullscreen API 下 body 级 fixed 元素不可见/布局异常） */
    try {
      var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl && p.parentElement !== fsEl) { p.__origParent = p.parentElement; fsEl.appendChild(p); }
      else if (!fsEl && p.__origParent && p.parentElement !== p.__origParent) { p.__origParent.appendChild(p); }
    } catch (e) {}
    p.style.display = 'flex';
  };
  function _bindPickPanel() {
    var p = document.getElementById('stickerPickPanel');
    var c = document.getElementById('stickerPickClose');
    if (!p || p.__bound) return;
    p.__bound = 1;
    p.addEventListener('click', function (e) { if (e.target === p) p.style.display = 'none'; });
    c && c.addEventListener('click', function () { p.style.display = 'none'; });
  }

  /* ---- 三处输入栏表情包按钮 ---- */
  function _restorePh(input) {
    if (input && input.__stickerHint) {
      input.placeholder = input.__origPh || (input.id === 'msgInput' ? 'iMessage信息' : '发送消息…');
      input.__stickerHint = false;
    }
  }
  /* 确保微信输入栏恒为「iMessage信息」，绝不变成「发送消息」。
     用 MutationObserver 监听 placeholder / data-quote 属性变化即时修正，
     替代原来的 4s 轮询。 */
  try {
    var _msgInp = document.getElementById('msgInput');
    if (_msgInp) {
      if (!_msgInp.hasAttribute('data-quote')) _msgInp.placeholder = 'iMessage信息';
      try {
        new MutationObserver(function () {
          try {
            if (_msgInp && !_msgInp.hasAttribute('data-quote') && _msgInp.placeholder !== 'iMessage信息') {
              _msgInp.placeholder = 'iMessage信息';
            }
          } catch (_) {}
        }).observe(_msgInp, { attributes: true, attributeFilter: ['placeholder', 'data-quote'] });
      } catch (_) {}
    /* 第一屏卡片背景"内联 !important"钉死——美化主题的 ID 选择器优先级高于样式表规则，
       顶部始终透出 banner；内联 important 是作者样式天花板，任何主题都压不过。
       同值重复写入无副作用（浏览器对相同赋值不触发重绘） */
    try {
      var _s1pin = function () {
        try {
          var _el = document.querySelector('#screen1 .s1-frosted-content') || document.querySelector('.s1-frosted-content');
          if (!_el) return;
          _el.style.setProperty('background', 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 42%, rgba(255,255,255,0.75) 58%, rgba(255,255,255,0.75) 66%, rgba(255,255,255,0.3) 86%, rgba(255,255,255,0) 100%)', 'important');
          _el.style.setProperty('backdrop-filter', 'none', 'important');
          _el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
          _el.style.setProperty('box-shadow', 'none', 'important');
          /* 用户要求：图标回到原位 */
        } catch (_) {}
      };
      _s1pin();
    } catch (_) {}
    }
  } catch (_) {}
  function _markPending(input, key, src) {
    window[key] = src;
    if (input) {
      if (!input.__origPh) input.__origPh = input.placeholder || '';
      input.placeholder = '[表情包] 已选好，点发送';
      input.__stickerHint = true;
      if (!input.__phBound) {
        input.__phBound = 1;
        input.addEventListener('input', function () { _restorePh(this); });
      }
    }
  }
  function _bindStickerBtns() {
    var fb = document.getElementById('friendsCommentStickerBtn');
    if (fb && !fb.__bound) {
      fb.__bound = 1;
      fb.addEventListener('click', function (e) {
                window.__openStickerPickPanel(function (src) {
          _markPending(document.getElementById('friendsCommentInput'), '__friendsPendingSticker', src);
        });
      });
    }
    var ib = document.getElementById('icityDetailCommentStickerBtn');
    if (ib && !ib.__bound) {
      ib.__bound = 1;
      ib.addEventListener('click', function (e) {
                window.__openStickerPickPanel(function (src) {
          _markPending(document.getElementById('icityDetailCommentInput'), '__icityPendingSticker', src);
        });
      });
    }
    var wb = document.getElementById('watchStickerBtn');
    if (wb && !wb.__bound) {
      wb.__bound = 1;
      wb.addEventListener('click', function (e) {
                window.__openStickerPickPanel(function (src) {
          /* 观影聊天选择表情包直接发送 */
          if (typeof window.__watchSendStickerDirect === 'function') {
            window.__watchSendStickerDirect(src);
          } else {
            _markPending(document.getElementById('watchMsgInput'), '__watchPendingSticker', src);
            var sb = document.getElementById('watchSendBtn');
            if (sb) sb.click();
          }
        });
      });
    }
    /* 朋友圈评论弹窗：点遮罩关闭 + 发送后恢复占位 */
    var fm = document.getElementById('friendsCommentInputModal');
    if (fm && !fm.__stkBound) {
      fm.__stkBound = 1;
      fm.addEventListener('click', function (e) { if (e.target === fm) fm.style.display = 'none'; });
    }
    /* 提交后恢复输入框占位提示 */
    ['friendsCommentSubmit', 'icityDetailCommentSend'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b && !b.__phBound) {
        b.__phBound = 1;
        b.addEventListener('click', function () {
          setTimeout(function () {
            _restorePh(document.getElementById('friendsCommentInput'));
            _restorePh(document.getElementById('icityDetailCommentInput'));
          }, 50);
        });
      }
    });
  }

  /* 字卡库的通用重绘入口只认主字卡/Emoji/拍一拍——在表情包与问卷 tab 下调用它会把
     已渲染好的面板整块换成"列表空空如也"。这里按当前 tab 分流，外部调用（打开字卡库、
     切回 App 等）不再冲掉表情包/问卷面板。 */
  function _installRenderRouter() {
    var origList = window.__wbRenderList;
    if (typeof origList === 'function' && !origList.__akiniRouted) {
      var routedList = function () {
        if (window.__wbTab === 'sticker') { _wbPanelShow('sticker'); renderStickerTab(); return; }
        if (window.__wbTab === 'survey') { _wbPanelShow('survey'); renderSurveyWbTab(); return; }
        _wbPanelShow(window.__wbTab);
        return origList.apply(this, arguments);
      };
      routedList.__akiniRouted = 1;
      window.__wbRenderList = routedList;
    }
    var origWb = window.renderWordbank;
    if (typeof origWb === 'function' && !origWb.__akiniRouted) {
      var routedWb = function () {
        if (window.__wbTab === 'sticker') { _wbPanelShow('sticker'); renderStickerTab(); return; }
        if (window.__wbTab === 'survey') { _wbPanelShow('survey'); renderSurveyWbTab(); return; }
        _wbPanelShow(window.__wbTab);
        return origWb.apply(this, arguments);
      };
      routedWb.__akiniRouted = 1;
      window.renderWordbank = routedWb;
    }
  }

  function _init() {
    _installRenderRouter();
    _bindTabs(); _bindAdd(); _bindDeleteSheet(); _bindPickPanel(); _bindStickerBtns();
    _bindStickerToolbar();
    _syncTab();
    _hydrateStickers();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();
  setTimeout(_init, 800);
})();

;
/* ===== akini-chatpanel.js ===== */
function __akiniBindSplashEntry(){var t=document.getElementById("openSplashNoticeBtn");t&&(t.onclick=function(t){t&&t.preventDefault(),window.__akiniOpenSplashNotice()})}window.__akiniOpenSplashNotice=function(){try{var t=document.getElementById("akiniSiteNoticeModal");t&&(t.style.display="flex")}catch(t){console.error(t)}};window.__akiniCloseSplashNotice=function(){try{var t=document.getElementById("akiniSiteNoticeModal");t&&(t.style.display="none")}catch(t){}};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",__akiniBindSplashEntry):__akiniBindSplashEntry();
!function(){"use strict";function t(){document.querySelectorAll('input[type="file"]').forEach(function(t){t.classList.contains("akini-file-offscreen")||"none"!==window.getComputedStyle(t).display||(t.classList.add("akini-file-offscreen"),t.style.display="")})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",t):t(),setTimeout(t,2e3)}(),window.__akiniNotifyUnreadChanged=function(){try{"function"==typeof window.__updateHomeBadges&&window.__updateHomeBadges()}catch(t){}try{"function"==typeof window.__akiniUpdateChatBackBadge&&window.__akiniUpdateChatBackBadge()}catch(t){}try{"function"==typeof window.__akiniRefreshChatListBadges&&window.__akiniRefreshChatListBadges()}catch(t){}try{var t=window.akiniContacts&&window.akiniContacts.getSessions&&window.akiniContacts.getSessions()||{},e=document.querySelectorAll(".chat-list-item");e&&e.length&&e.forEach(function(e){var n=e.getAttribute("data-id")||e.getAttribute("data-chat-id");if(n){var a=t[n]||{},i=Number(a.unread||0),o=e.querySelector(".cli-unread-badge");if(i>0){if(!o){var r=e.querySelector(".cli-avatar-wrap")||e.querySelector(".cli-avatar");r&&(r.style.position="relative",r.style.overflow="visible",(o=document.createElement("span")).className="cli-unread-badge",r.appendChild(o))}o&&(o.textContent=i>99?"99+":String(i),o.setAttribute("data-count",String(i)),o.style.setProperty("display","inline-flex","important"),o.style.setProperty("visibility","visible","important"),o.style.setProperty("opacity","1","important"))}else o&&(o.textContent="",o.setAttribute("data-count","0"),o.style.setProperty("display","none","important"),o.style.setProperty("visibility","hidden","important"),o.style.setProperty("opacity","0","important"))}})}catch(t){}},window.__akiniUnreadTickerStarted||(window.__akiniUnreadTickerStarted=!0),function(){"use strict";function t(t){return String(null==t?"":t).replace(/[&<>"']/g,function(t){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[t]})}function e(t){return(t<10?"0":"")+t}function n(){try{return(localStorage.getItem("akini_my_name")||"我").trim()||"我"}catch(t){return"我"}}function a(){try{return(localStorage.getItem("akini_ta_name")||"对方").trim()||"对方"}catch(t){return"对方"}}function i(){return window.akiniContacts&&window.akiniContacts.getActiveChatId?window.akiniContacts.getActiveChatId():null}function o(){var t=i(),e=[];if(t&&window.akiniContacts&&window.akiniContacts.getSession){var n=window.akiniContacts.getSession(t),a=n&&n.messagesHTML||"";if(a){var o=document.createElement("div");o.innerHTML=a,e=Array.prototype.slice.call(o.querySelectorAll(".msg-row")).filter(function(t){return!t.classList.contains("system")})}}return{chatId:t,rows:e}}function r(t){var e=t.classList.contains("me"),i=t.querySelector(".msg-avatar"),o=i?i.innerHTML:"",r="",c=t.querySelector(".msg-sender-name");if(c)r=(c.textContent||"").trim();else{var l=t.querySelector(".msg-avatar[data-sender-name]");l&&(r=l.getAttribute("data-sender-name")||"")}var s=e?n():r||a(),d=t.querySelector(".bubble"),g="";if(d)if(d.classList.contains("transfer-bubble"))g="【转账】";else if(d.classList.contains("survey-bubble"))g="【问卷】";else if(d.classList.contains("shop-card-bubble")){var u=(d.querySelector(".shop-card-bubble-title")?d.querySelector(".shop-card-bubble-title").textContent:"")||d.textContent||"";g=-1!==u.indexOf("帮付")||-1!==u.indexOf("代付")?"【物品代付】":-1!==u.indexOf("赠送")?"【物品赠送】":"【卡片】"}else if(d.querySelector("img:not(.quote-sticker-thumb)"))g="【表情包】";else{var m=d.querySelector(".quote-bubble"),f=(d.innerText||"").trim();m&&(f=f.replace((m.innerText||"").trim(),"").trim()),g=f}return{isMe:e,name:s,avatarHtml:o,text:g,ts:parseInt(t.getAttribute("data-ts"),10)||0,bubbleEl:d}}function c(t,e,n,a){n=n||38;var i="";if(t)try{"function"==typeof window.getMyAvatar&&(i=window.getMyAvatar()),i||(i=localStorage.getItem("akini_my_avatar")||""),!i&&window.__akiniAvatarCache&&(i=window.__akiniAvatarCache.my||"")}catch(t){}else{var _e=String(null==e?"":e).trim();try{if(window.akiniContacts&&window.akiniContacts.getContacts){var o=null;if(_e){o=(window.akiniContacts.getContacts()||[]).find(function(t){return t&&(t.name===_e||t.remark===_e)})}else{o=(window.akiniContacts.getContacts()||[]).find(function(t){return t&&t.isDefault})}o&&o.avatar&&(i=o.avatar)}}catch(t){}if(!i&&_e){if(a&&"string"==typeof a&&a.indexOf("<img")>=0)return'<div style="width:'+n+"px;height:"+n+'px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'+a+"</div>";var _c=(_e).slice(0,1).toUpperCase();return'<div style="width:'+n+"px;height:"+n+'px;border-radius:50%;background:#e5e5ea;color:#666;font-size:'+Math.round(.45*n)+'px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+_c+"</div>"}if(!i)try{"function"==typeof window.getTaAvatar&&(i=window.getTaAvatar()),i||(i=localStorage.getItem("akini_ta_avatar")||""),!i&&window.__akiniAvatarCache&&(i=window.__akiniAvatarCache.ta||"")}catch(t){}}if(i&&"string"==typeof i&&i.trim()){var r=i.trim();return 0===r.indexOf("<img")?'<div style="width:'+n+"px;height:"+n+'px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'+r+"</div>":'<div style="width:'+n+"px;height:"+n+'px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#f0f0f2;"><img src="'+r+'" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.onerror=null;this.parentElement.style.background=\'#d1d1d6\';"/></div>'}if(a&&"string"==typeof a&&a.indexOf("<img")>=0)return'<div style="width:'+n+"px;height:"+n+'px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">'+a+"</div>";var c=(e||(t?"我":"Ta")).slice(0,1).toUpperCase();return'<div style="width:'+n+"px;height:"+n+"px;border-radius:50%;background:#e5e5ea;color:#666;font-size:"+Math.round(.45*n)+'px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+c+"</div>"}window.__akiniQuoteCardHtml=function(e,n,a,i){var o=String(null==e?"":e).trim()||"我",r=String(null==n?"":n).trim(),c=String(null==a?"":a),l=String(null==i?"":i);r.length>15&&(r=r.slice(0,15)+"…");var s='<span style="font-weight:600;white-space:nowrap;color:#333;flex-shrink:0;">'+(window.rt?rt(o):t(o))+"</span>",d=r?'<span style="white-space:nowrap;color:#333;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;max-width:220px;">：'+(window.rt?rt(r):t(r))+"</span>":"",g="";if(c||l){var u=c;if(!u&&l&&window.__akiniMedia&&window.__akiniMedia.getSync)try{u=window.__akiniMedia.getSync(l)||""}catch(t){u=""}u&&(g='<span style="color:#333;flex-shrink:0;">：</span><img class="quote-sticker-thumb" src="'+u+'" data-mh="'+(window.rt?rt(l):t(l))+'" style="width:20px;height:20px;border-radius:4px;object-fit:cover;flex-shrink:0;margin-left:1px;margin-right:2px;" alt="表情包"/>',d="")}return'<div class="quote-bubble" style="background:#fff!important;color:#333!important;border:none!important;border-radius:10px!important;padding:3px 8px!important;font-size:11px!important;line-height:1.3!important;box-shadow:0 1px 3px rgba(0,0,0,.1)!important;margin-top:2px!important;display:inline-flex!important;align-items:center!important;max-width:280px!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;box-sizing:border-box!important;">'+s+g+d+"</div>"};var l=null;function s(t){var e=document.getElementById("akiniRecordToast");e||((e=document.createElement("div")).id="akiniRecordToast",e.style.cssText="position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:rgba(0,0,0,.78);color:#fff;font-size:13px;padding:8px 16px;border-radius:20px;z-index:7250;pointer-events:none;transition:opacity .25s;max-width:80vw;",document.body.appendChild(e)),e.textContent=t,e.style.opacity="1",l&&clearTimeout(l),l=setTimeout(function(){e.style.opacity="0"},1800)}function d(t){return"akini_favs_"+t}function g(t){try{return JSON.parse(localStorage.getItem(d(t))||"[]")||[]}catch(t){return[]}}function u(t,e){try{return localStorage.setItem(d(t),JSON.stringify(e)),!0}catch(t){return s("存储空间不足，收藏失败"),!1}}var m=null,f="search";function p(){m&&(m.remove(),m=null)}function y(t){return'<div style="text-align:center;color:#999;font-size:13px;padding:40px 16px;line-height:1.8;">'+t+"</div>"}function v(){if(m){var e=m.querySelectorAll(".cr-tab");Array.prototype.forEach.call(e,function(t){var e=t.getAttribute("data-tab")===f;t.style.borderBottomColor=e?"#1a1a1a":"transparent",t.style.fontWeight=e?"600":"400"});var c=m.querySelector("#crSearchBox");if("search"===f){c.style.display="block",c.innerHTML='<input id="crSearchInput" placeholder="输入关键词搜索消息" style="width:100%;box-sizing:border-box;border:none;outline:0;background:#f2f2f2;border-radius:8px;padding:10px 12px;font-size:14px;color:#1a1a1a;" type="text" />';var l=c.querySelector("#crSearchInput");l.oninput=function(){x(l.value)},setTimeout(function(){try{l.focus()}catch(t){}},60),x("")}else c.style.display="none","stats"===f?function(){var e=m?m.querySelector("#crContent"):null;if(!e)return;var c=o();if(!c.rows.length)return void(e.innerHTML=y("当前聊天还没有消息"));var l=i(),s=l&&window.akiniContacts?window.akiniContacts.getChatTarget(l):null,d=s&&"group"===s.type,g=0,u={};function f(t){return Object.keys(t).map(function(e){return{t:e,c:t[e]}}).sort(function(t,e){return e.c-t.c}).slice(0,5)}c.rows.forEach(function(t){var e=r(t),i=(e.text||"").trim();if(i&&"【转账】"!==i&&"【表情包】"!==i&&"【卡片】"!==i&&"【图片】"!==i&&"【语音】"!==i&&"【红包】"!==i&&0!==i.indexOf("【")){g++;var o=e.isMe?n():d&&e.name||a();u[o]||(u[o]={count:0,words:{}}),u[o].count++,e.text&&(u[o].words[e.text]=(u[o].words[e.text]||0)+1)}else 0});var p=Object.keys(u).map(function(e){return t(e)+" 发送 "+u[e].count+" 条"}).join(" · "),v='<div style="background:#fff;border-radius:14px;padding:16px 14px;margin-bottom:12px;"><div style="font-size:15px;color:#1a1a1a;line-height:1.6;">'+(d?"本群全员":"我们互相")+'一共发了 <span style="font-weight:700;color:#1a1a1a;font-size:20px;">'+g+'</span> 条消息</div><div style="font-size:12px;color:#999;margin-top:6px;line-height:1.4;">'+p+"</div></div>";function x(e,n,a){var i="";return a.length?a.forEach(function(e,n){i+='<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:7px 0;border-bottom:1px solid #f5f5f5;"><div style="flex:1;min-width:0;font-size:14px;color:#333;line-height:1.5;word-break:break-word;"><span style="color:#bbb;font-size:12px;margin-right:6px;">'+(n+1)+".</span>"+t(e.t)+'</div><div style="font-size:12px;color:#1a1a1a;flex-shrink:0;font-weight:600;">×'+e.c+"</div></div>"}):i='<div style="font-size:13px;color:#bbb;padding:10px 0 2px;">暂无内容统计</div>','<div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;"><div style="font-size:14px;font-weight:600;color:#1a1a1a;">'+e+'</div><div style="font-size:11px;color:#bbb;margin-top:3px;">'+n+'</div><div style="margin-top:8px;">'+i+"</div></div>"}Object.keys(u).forEach(function(e){var n=f(u[e].words);v+=x(t(e)+" 发送最多的内容 TOP5","按发送次数从高到低",n)}),e.innerHTML=v}():w()}}function x(n){var a=m?m.querySelector("#crContent"):null;if(a)if(n=(n||"").trim()){var l=o(),d=[];if(l.rows.forEach(function(t,e){var a=r(t);a.idx=e,a.text&&a.text.indexOf(n)>-1&&d.push(a)}),d.length){d.reverse();var g='<div style="font-size:12px;color:#999;padding:2px 4px 10px;">共 '+d.length+" 条结果</div>";d.forEach(function(a){var i,o;g+='<div class="cr-search-row" data-ts="'+(a.ts||0)+'" data-text="'+encodeURIComponent(a.text||"")+'" data-isme="'+(a.isMe?1:0)+'" style="display:flex;gap:10px;padding:10px;background:#fff;border-radius:12px;margin-bottom:8px;align-items:flex-start;cursor:pointer;">'+c(a.isMe,a.name,38,a.avatarHtml)+'<div style="flex:1;min-width:0;"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;"><div style="font-size:13px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+t(a.name)+'</div><div style="font-size:11px;color:#bbb;flex-shrink:0;">'+(i=a.ts,(o=new Date(Number(i)||Date.now())).getMonth()+1+"月"+o.getDate()+"日 "+e(o.getHours())+":"+e(o.getMinutes())+'</div></div><div style="font-size:14px;color:#333;line-height:1.5;margin-top:3px;word-break:break-word;">')+function(e,n){var a=t(e);if(!n)return a;var i=t(n).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");try{return a.replace(new RegExp(i,"g"),'<span style="color:#f08a00;font-weight:600;">$&</span>')}catch(t){return a}}(a.text,n)+"</div></div></div>"}),a.innerHTML=g;var u=a.querySelectorAll(".cr-search-row");Array.prototype.forEach.call(u,function(t){t.onclick=function(){var e=i(),n=parseInt(t.getAttribute("data-ts"),10)||0,a="";try{a=decodeURIComponent(t.getAttribute("data-text")||"")}catch(t){}var o="1"===t.getAttribute("data-isme");p(),window.__akiniJumpToChatMsg&&window.__akiniJumpToChatMsg(e,n,{text:a,isMe:o})||s("这条消息已不在当前聊天记录里")}})}else a.innerHTML=y("没有找到包含「"+t(n)+"」的消息")}else a.innerHTML=y("输入关键词，查找聊天里的消息")}function h(e){return'<div class="fav-bubble-inner" style="max-width:75%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.5;word-break:break-word;word-wrap:break-word;white-space:pre-wrap;box-sizing:border-box;background:#1a1a1a !important;color:#fff!important;display:inline-block;">'+function(e,n){var a=e&&e.length<=12e3?e:t(n||"【表情包】");try{var i=document.createElement("div");return i.innerHTML=a,i.querySelectorAll("*").forEach(function(t){t.style&&(t.style.maxWidth="100%")}),i.innerHTML}catch(t){return a}}(e.html,e.text)+"</div>"}function b(n){var a,i,o=n.items||[],r="",l=1===o.length;return o.forEach(function(e){r+=function(e,n){n=n||{};var a=c(e.isMe,e.name,32,e.avatarHtml),i='<div style="font-size:10px;color:#999;margin-bottom:3px;text-align:center;width:32px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+t(e.name)+"</div>",o=h(e),r='<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:32px;">'+i+a+"</div>",l=' class="fav-jump-row" data-ts="'+(e.ts||0)+'" data-text="'+encodeURIComponent(e.text||"")+'" data-isme="'+(e.isMe?1:0)+'" style="cursor:pointer;';return!n.single&&e.isMe?"<div"+l+'display:flex;flex-direction:column;align-items:flex-end;margin-bottom:12px;width:100%;box-sizing:border-box;"><div style="display:flex;gap:8px;align-items:flex-end;justify-content:flex-end;width:100%;">'+o+r+"</div></div>":"<div"+l+'display:flex;flex-direction:column;align-items:flex-start;margin-bottom:12px;width:100%;box-sizing:border-box;"><div style="display:flex;gap:8px;align-items:flex-end;width:100%;">'+r+o+"</div></div>"}(e,{single:l})}),'<div style="background:#fff;border-radius:14px;padding:12px;margin-bottom:12px;">'+r+'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;border-top:1px solid #f5f5f5;padding-top:8px;"><div style="font-size:11px;color:#bbb;">'+(a=n.ts,(i=new Date(Number(a)||Date.now())).getFullYear()+"年"+(i.getMonth()+1)+"月"+i.getDate()+"日 "+e(i.getHours())+":"+e(i.getMinutes())+'</div><button class="cr-fav-del" data-id="')+t(n.id)+'" style="background:none;border:none;font-size:11px;color:#bbb;cursor:pointer;padding:2px 6px;">删除</button></div></div>'}function w(){var t=m?m.querySelector("#crContent"):null;if(t){var e=g(i());if(e.length){var n="";e.forEach(function(t){n+=b(t)}),t.innerHTML=n;var a=t.querySelectorAll(".cr-fav-del");Array.prototype.forEach.call(a,function(t){t.onclick=function(){var e=t.getAttribute("data-id"),n=i();u(n,g(n).filter(function(t){return t.id!==e}))&&(s("已删除该收藏"),w())}});var o=t.querySelectorAll(".fav-jump-row");Array.prototype.forEach.call(o,function(t){t.onclick=function(e){if(!(e.target&&e.target.closest&&e.target.closest(".quote-bubble"))){var n=i(),a=parseInt(t.getAttribute("data-ts"),10)||0,o="";try{o=decodeURIComponent(t.getAttribute("data-text")||"")}catch(t){}var r="1"===t.getAttribute("data-isme");p(),window.__akiniJumpToChatMsg&&window.__akiniJumpToChatMsg(n,a,{text:o,isMe:r})||s("这条消息已不在当前聊天记录里")}}})}else t.innerHTML=y("还没有收藏的消息<br>长按任意消息 → 收藏，把喜欢的瞬间存进来")}}window.__akiniOpenRecordPanel=function(t){if(i()){p(),f=t||"search",(m=document.createElement("div")).id="chatRecordOverlay",m.style.cssText="position:fixed;inset:0;z-index:7000;background:#f5f5f6;display:flex;flex-direction:column;",m.innerHTML='<div style="display:flex;align-items:center;gap:6px;padding:12px 12px 10px;background:#fff;border-bottom:1px solid #eee;flex-shrink:0;"><button id="crBackBtn" aria-label="返回" style="background:none;border:none;font-size:26px;color:#1a1a1a;line-height:1;padding:2px 10px;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M15 18l-6-6 6-6"/></svg></button><div style="font-size:17px;font-weight:600;color:#1a1a1a;">聊天记录</div></div><div style="display:flex;background:#fff;border-bottom:1px solid #eee;flex-shrink:0;"><div class="cr-tab" data-tab="search" style="flex:1;text-align:center;padding:11px 0;font-size:13px;color:#1a1a1a;cursor:pointer;border-bottom:2px solid transparent;">搜索聊天记录</div><div class="cr-tab" data-tab="stats" style="flex:1;text-align:center;padding:11px 0;font-size:13px;color:#1a1a1a;cursor:pointer;border-bottom:2px solid transparent;">聊天记录总结</div><div class="cr-tab" data-tab="fav" style="flex:1;text-align:center;padding:11px 0;font-size:13px;color:#1a1a1a;cursor:pointer;border-bottom:2px solid transparent;">收藏消息内容</div></div><div id="crSearchBox" style="padding:10px 12px;background:#fff;flex-shrink:0;"></div><div id="crContent" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 12px 30px;min-height:0;"></div>',document.body.appendChild(m),m.querySelector("#crBackBtn").onclick=p;var e=m.querySelectorAll(".cr-tab");Array.prototype.forEach.call(e,function(t){t.onclick=function(){f=t.getAttribute("data-tab")||"search",v()}}),v()}else s("请先进入一个聊天")};var k=!1;function _(t){if(k){var e=t.target&&t.target.closest?t.target.closest(".msg-row"):null;if(e&&!e.classList.contains("system")){t.preventDefault(),e.classList.toggle("fav-selected");try{var n=document.getElementById("akiniFavTopBar"),a=document.querySelectorAll(".msg-row.fav-selected").length;n&&(n.innerHTML="<span>已选择 "+a+" 条消息</span>")}catch(t){}}}}function S(){k=!1,document.body.classList.remove("akini-fav-selecting");var t=document.getElementById("akiniFavTopBar");t&&t.remove();var e=document.getElementById("chatBody");e&&e.removeEventListener("click",_,!0);var n=document.getElementById("akiniFavBar");n&&n.remove();var a=document.querySelectorAll(".fav-circle");Array.prototype.forEach.call(a,function(t){t.remove()});var i=document.querySelectorAll(".msg-row.fav-selected");Array.prototype.forEach.call(i,function(t){t.classList.remove("fav-selected")})}function I(){var e=document.getElementById("chatBody");if(e){var n=e.querySelectorAll(".msg-row.fav-selected");if(n.length){var a=i();if(a){var o=[];Array.prototype.forEach.call(n,function(e){var n=r(e),a=n.bubbleEl?n.bubbleEl.innerHTML:"";a.length>12e3&&(a=t(n.text||"【表情包】"));var i=n.avatarHtml;i.length>6e3&&0!==i.indexOf("<img")&&(i=""),o.push({isMe:!!n.isMe,name:n.name,avatarHtml:i,html:a,ts:n.ts,text:n.text||""})}),o.sort(function(t,e){return(t.ts||0)-(e.ts||0)});var c=o.map(function(t){return new Promise(function(e){var n=t.avatarHtml||"";if(0===n.indexOf("<img")){var a,i=(a=String(n||"").match(/src="([^"]*)"/))?a[1]:"";!i||i.length<=6e3?e():function(t,e){var n=!1;function a(a){n||(n=!0,e(a||t))}try{if(!t||t.length<=6e3||!/^(data:|blob:)/i.test(t))return void a(t);var i=new Image;i.onload=function(){try{var e=96,n=document.createElement("canvas");n.width=e,n.height=e;var o=n.getContext("2d");o.fillStyle="#ececec",o.fillRect(0,0,e,e);var r=i.width||e,c=i.height||e,l=Math.min(r,c);o.drawImage(i,(r-l)/2,(c-l)/2,l,l,0,0,e,e);var s=n.toDataURL("image/jpeg",.85);a(s&&s.length>100&&s.length<t.length?s:t)}catch(e){a(t)}},i.onerror=function(){a(t)},i.src=t,setTimeout(function(){a(t)},2500)}catch(e){a(t)}}(i,function(n){n&&n!==i&&(t.avatarHtml=function(t){return'<img src="'+String(t).replace(/"/g,"&quot;")+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'}(n)),e()})}else e()})});Promise.all(c).then(function(){var t=g(a);t.unshift({id:"fav_"+Date.now()+"_"+Math.random().toString(36).slice(2,7),ts:Date.now(),items:o}),u(a,t)&&(S(),s("已收藏 "+o.length+" 条消息"))})}else s("请先进入一个聊天")}else s("还没有选择消息")}}window.__akiniEnterFavSelectMode=function(){if(!k)if(i()){var t=document.getElementById("chatBody");if(t){k=!0,function(){if(!document.getElementById("akiniFavSelectStyle")){var t=document.createElement("style");t.id="akiniFavSelectStyle",t.textContent="body.akini-fav-selecting .chat-body{padding-left:36px!important;padding-right:36px!important;transition:padding .2s ease;}body.akini-fav-selecting .fav-circle{width:16px;height:16px;border-radius:50%;border:1.8px solid #000;background:#fff;flex:0 0 auto;box-sizing:border-box;cursor:pointer;position:absolute;top:19px;transform:translateY(-50%);z-index:7250;box-shadow:0 1px 3px rgba(0,0,0,.15);}body.akini-fav-selecting .msg-row{position:relative;cursor:pointer;}body.akini-fav-selecting .msg-row.me .fav-circle{right:-26px;}body.akini-fav-selecting .msg-row.other .fav-circle{left:-26px;}body.akini-fav-selecting .msg-row.fav-selected .fav-circle{background:#000!important;border-color:#000!important;}body.akini-fav-selecting .chat-top-bar{display:none!important;}#akiniFavTopBar{position:sticky;top:0;left:0;right:0;z-index:7200;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.08);font-size:15px;color:#1a1a1a;font-weight:600;}body.dark-mode #akiniFavTopBar{background:#232326;color:#f2f2f2;box-shadow:0 1px 8px rgba(0,0,0,.4);}",document.head.appendChild(t)}}(),document.body.classList.add("akini-fav-selecting");var e=t.querySelectorAll(".msg-row"),n=0;if(Array.prototype.forEach.call(e,function(t){if(!t.classList.contains("system")&&!t.querySelector(".fav-circle")){var e=document.createElement("div");e.className="fav-circle",t.appendChild(e),n++}}),!n)return S(),void s("当前聊天没有可收藏的消息");var a=document.createElement("div");a.id="akiniFavBar",a.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:7150;display:flex;gap:12px;padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px));background:#fff;box-shadow:0 -3px 14px rgba(0,0,0,.1);",a.innerHTML='<button id="akiniFavCancel" style="flex:1;padding:12px 0;border:none;border-radius:10px;background:#f2f2f2;color:#333;font-size:15px;cursor:pointer;">取消</button><button id="akiniFavOk" style="flex:1;padding:12px 0;border:none;border-radius:10px;background:#000;color:#fff;font-size:15px;font-weight:600;cursor:pointer;">收藏</button>',document.body.appendChild(a);var o=document.querySelector(".chat-wrapper")||t.parentElement;if(o){var r=document.createElement("div");r.id="akiniFavTopBar",r.innerHTML="<span>已选择 0 条消息</span>";var c=o.querySelector(".chat-body")||o.firstElementChild;c&&c.parentElement===o?o.insertBefore(r,c):o.appendChild(r)}a.querySelector("#akiniFavCancel").onclick=function(){S()},a.querySelector("#akiniFavOk").onclick=I,t.addEventListener("click",_,!0),window.__akiniFavTipShown||(window.__akiniFavTipShown=!0,s("点击消息进行选择"))}else s("请先进入一个聊天")}else s("请先进入一个聊天")}}();let currentScreen=0,touchStartX=0,touchEndX=0;function switchHomeScreen(t){const e=document.querySelectorAll(".home-screen"),n=document.querySelectorAll(".home-indicator .dot");t<0||t>=e.length||(e.forEach((e,n)=>{n===t?(e.classList.add("active"),e.classList.remove("exit-left")):n<t?(e.classList.remove("active"),e.classList.add("exit-left")):(e.classList.remove("active"),e.classList.remove("exit-left"))}),n.forEach((e,n)=>{n===t?e.classList.add("active"):e.classList.remove("active")}),currentScreen=t)}function editS1Text(t){const e=document.getElementById("s1Text"+t);if(!e)return;const n=prompt("编辑文字：",e.textContent);if(null!==n&&""!==n.trim()){e.textContent=n.trim();try{const e=JSON.parse(localStorage.getItem("akini_s1_texts")||"{}");e["line"+t]=n.trim(),localStorage.setItem("akini_s1_texts",JSON.stringify(e))}catch(t){}}}function changeS1Photo(){const t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=function(t){const e=t.target.files[0];if(!e)return;const n=new FileReader;n.onload=function(t){const e=document.getElementById("s1PolaroidImg");if(e){e.style.backgroundImage=`url(${t.target.result})`,e.style.backgroundSize="cover",e.style.backgroundPosition="center";try{localStorage.setItem("akini_s1_photo",t.target.result);try{window.akiniStore&&window.akiniStore.set&&window.akiniStore.set("akini_s1_photo",t.target.result)}catch(t){}}catch(t){}}},n.readAsDataURL(e)},t.click()}function syncDualScreensData(){if(!document.hidden){try{const t=document.getElementById("s1AvatarCircle"),e=localStorage.getItem("akini_s1_avatar");t&&e&&t.__akiniLastCustom!==e&&(t.__akiniLastCustom=e,t.innerHTML=`<img src="${e}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`)}catch(t){}try{document.getElementById("previewBubbleLeft"),document.getElementById("previewBubbleRight"),localStorage.getItem("akini_last_chat")}catch(t){}}}function changeS1Cover(){const t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=function(t){const e=t.target.files[0];if(!e)return;const n=new FileReader;n.onload=function(t){const e=document.getElementById("s1CoverBg");if(e){e.style.backgroundImage=`url(${t.target.result})`;try{localStorage.setItem("akini_s1_cover",t.target.result)}catch(t){}}},n.readAsDataURL(e)},t.click()}function changeS1Avatar(){const t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=function(t){const e=t.target.files[0];if(!e)return;const n=new FileReader;n.onload=function(t){const e=document.getElementById("s1AvatarCircle");if(e){e.innerHTML=`<img src="${t.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;try{localStorage.setItem("akini_s1_avatar",t.target.result)}catch(t){}}},n.readAsDataURL(e)},t.click()}function initHomeMusicPlayerSection(){const t=document.getElementById("musicPlayerPlay"),e=document.getElementById("musicPlayerPrev"),n=document.getElementById("musicPlayerNext"),a=document.getElementById("musicPlayerTitle"),i=document.getElementById("musicPlayerArtist"),o=document.getElementById("musicPlayerCoverImg"),r=document.querySelector(".music-player-disc");document.getElementById("musicPlayerListenTime");e&&(e.onclick=function(t){const e=document.getElementById("musicPrevBtn");e&&e.click()}),n&&(n.onclick=function(t){const e=document.getElementById("musicNextBtn");e&&e.click()}),t&&(t.onclick=function(t){const e=document.getElementById("musicPlayBtn");e&&e.click()});try{!function(){if(document.hidden)return;const e=document.getElementById("musicSongName"),n=document.getElementById("musicArtist"),c=document.getElementById("musicCover"),l=document.getElementById("musicPlayBtn");document.getElementById("musicPlayerListenTime");var s=e&&e.textContent&&"一起听"!==e.textContent?e.textContent:"",d=n&&n.textContent&&"点击右上角导入歌单"!==n.textContent?n.textContent:"",g=c&&c.src&&!c.src.includes("data:image/gif")?c.src:"";if(!s||!g)try{var u=localStorage.getItem("akini_music_playlist"),m=parseInt(localStorage.getItem("akini_music_index")||"0",10)||0;if(u){var f=JSON.parse(u);if(Array.isArray(f)&&f.length>0){var p=f[m]||f[0];p&&(!s&&p.title&&(s=p.title),!d&&p.artist&&(d=p.artist),!g&&p.cover&&(g=p.cover))}}}catch(t){}s&&a&&a.textContent!==s&&(a.textContent=s),d&&i&&i.textContent!==d&&(i.textContent=d),g&&o&&o.src!==g&&(o.src=g);const y=function(){try{const t=document.getElementById("musicPlayIcon"),e=document.getElementById("musicPauseIcon");if(t&&e){if(e.style.display&&"none"!==e.style.display)return!0;if(t.style.display&&"none"!==t.style.display)return!1}}catch(t){}try{if("function"==typeof window.__akiniMusicIsPlaying)return window.__akiniMusicIsPlaying()}catch(t){}try{return"1"===localStorage.getItem("akini_music_playing")}catch(t){}return!(!l||!l.classList.contains("playing"))}();if(t&&t.__akiniLastPlaying!==y){t.__akiniLastPlaying=y;const e=t.querySelector(".play-icon"),n=t.querySelector(".pause-icon");y?(e&&(e.style.display="none"),n&&(n.style.display="block"),t.classList.add("playing"),r&&(r.style.animation="disc-spin 6s linear infinite")):(e&&(e.style.display="block"),n&&(n.style.display="none"),t.classList.remove("playing"),r&&(r.style.animation="none"))}try{const t=document.getElementById("musicPlayerLeftAvatar"),e=document.getElementById("musicPlayerRightAvatar"),n=document.getElementById("avatarLeft")||document.getElementById("myAvatarImg"),a=document.getElementById("avatarRight")||document.getElementById("taAvatarImg");if(t&&n){const e=n.querySelector("img")||n;!e||!e.src||t.querySelector("img")&&t.querySelector("img").src===e.src||(t.innerHTML=`<img src="${e.src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`)}if(e){let t="";try{const e=localStorage.getItem("akini_music_player_right_contact"),n=e&&window.akiniContacts&&window.akiniContacts.getContactById?window.akiniContacts.getContactById(e):null;n&&n.avatar&&window.renderAvatarHtml&&(t=window.renderAvatarHtml(n.avatar,64))}catch(t){}if(!t&&a){const e=a.querySelector("img")||a;e&&e.src&&(t=`<img src="${e.src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`)}t&&e.innerHTML!==t&&(e.innerHTML=t)}}catch(t){}}()}catch(t){}}window.switchHomeScreen=switchHomeScreen,document.addEventListener("DOMContentLoaded",function(){const t=document.getElementById("homeSlider");t&&(t.addEventListener("touchstart",function(t){touchStartX=t.changedTouches[0].screenX},{passive:!0}),t.addEventListener("touchend",function(t){touchEndX=t.changedTouches[0].screenX,function(){const t=touchStartX-touchEndX,e=50;if(Math.abs(t)<e)return;t>0&&0===currentScreen?switchHomeScreen(1):t<0&&1===currentScreen&&switchHomeScreen(0)}()},{passive:!0}))}),document.addEventListener("DOMContentLoaded",function(){try{const t=JSON.parse(localStorage.getItem("akini_s1_texts")||"{}");for(let e=1;e<=3;e++){let n=null;try{n=localStorage.getItem("akini_s1_custom_text_"+e)}catch(t){}const a=null!=n&&""!==n?n:t["line"+e];if(a){const t=document.getElementById("s1Text"+e);t&&(t.textContent=a)}}}catch(t){}try{const t=localStorage.getItem("akini_s1_photo");if(!t&&window.akiniStore&&window.akiniStore.get)try{window.akiniStore.get("akini_s1_photo",function(t){if(t){var e=document.getElementById("s1PolaroidImg");e&&(e.style.backgroundImage='url("'+t+'")');try{localStorage.setItem("akini_s1_photo",t)}catch(t){}}})}catch(t){}if(t){const e=document.getElementById("s1PolaroidImg");e&&(e.style.backgroundImage=`url(${t})`,e.style.backgroundSize="cover",e.style.backgroundPosition="center")}}catch(t){}!function(){if(document.hidden)return;const t=document.getElementById("s1AvatarCircle"),e=document.querySelector(".my-avatar")||document.getElementById("myAvatar");if(t&&e){var n=e.innerHTML,a=n.length+":"+(n.length>64?n.slice(-64):n);if(t.__akiniSyncFp===a)return;t.__akiniSyncFp=a,t.innerHTML=n}}()}),document.addEventListener("DOMContentLoaded",function(){syncDualScreensData()}),document.addEventListener("DOMContentLoaded",function(){try{const t=localStorage.getItem("akini_s1_cover");if(t){const e=document.getElementById("s1CoverBg");e&&(e.style.backgroundImage=`url(${t})`)}const e=localStorage.getItem("akini_s1_avatar");if(e){const t=document.getElementById("s1AvatarCircle");t&&(t.innerHTML=`<img src="${e}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`)}}catch(t){}}),document.addEventListener("DOMContentLoaded",function(){[{rowId:"changeCallBgBtnBeautify",inputId:"fileInputCallBgBeautify"},{rowId:"changeCallMiniBgBtnBeautify",inputId:"fileInputCallMiniBgBeautify"}].forEach(function(t){const e=document.getElementById(t.rowId),n=document.getElementById(t.inputId);e&&n&&(e.onclick=function(t){t.target!==n&&n.click()})});try{const t="";if(localStorage.getItem("akini_app_version")!==t){let e=0;for(let t=0;t<localStorage.length;t++){const n=localStorage.key(t),a=localStorage.getItem(n);a&&(e+=a.length)}if(e>35e5){const t=["akini_user_id","akini_chat_history","akini_s1_texts","akini_s1_cover","akini_s1_photo"];for(let e=localStorage.length-1;e>=0;e--){const n=localStorage.key(e);-1===t.indexOf(n)&&-1!==n.indexOf("temp")&&localStorage.removeItem(n)}}localStorage.setItem("akini_app_version",t)}}catch(t){console.warn("Storage check safely handled:",t)}}),window.triggerCoverUpload=function(){const t=document.getElementById("fileInputCoverBg");if(t)t.click();else{const t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=function(t){const e=t.target.files[0];if(!e)return;const n=new FileReader;n.onload=function(t){const e=document.getElementById("coverAreaMain");e&&(e.style.backgroundImage=`url(${t.target.result})`,e.style.backgroundSize="cover",e.style.backgroundPosition="center");try{localStorage.setItem("akini_cover_img",t.target.result)}catch(t){}},n.readAsDataURL(e)},t.click()}},window.triggerHomeBgUpload=function(){const t=document.getElementById("fileInputHomeBg");if(t)t.click();else{const t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=function(t){const e=t.target.files[0];if(!e)return;const n=new FileReader;n.onload=function(t){const e=document.getElementById("phoneFrame");e&&(e.style.backgroundImage=`url(${t.target.result})`,e.style.backgroundSize="cover",e.style.backgroundPosition="center",e.classList.add("has-custom-bg"));try{localStorage.setItem("akini_home_bg",t.target.result)}catch(t){}},n.readAsDataURL(e)},t.click()}},document.addEventListener("DOMContentLoaded",function(){initHomeMusicPlayerSection();try{const t=localStorage.getItem("akini_bg_img"),e=document.getElementById("bgArea");t&&e&&(e.style.backgroundImage=`url(${t})`,e.style.backgroundSize="cover",e.style.backgroundPosition="center")}catch(t){}}),window.editS1CustomText=function(t){let e="akini_s1_custom_text_"+t,n="",a="请输入文字内容：";var i=document.getElementById("s1Text1"),o=document.getElementById("s1Text2"),r=document.getElementById("s1Text3"),c=document.getElementById("s1TextLoc");function l(n){if(null!==n){n=String(n).trim()||"xxx";if(1===t){var el=document.getElementById("s1Text1");el&&(el.textContent=n)}else if(2===t){var el=document.getElementById("s1Text2");el&&(el.textContent=n)}else if(3===t){var el=document.getElementById("s1Text3");el&&(el.textContent=n)}else if(5===t){var el=document.getElementById("s1TextLoc");el&&(el.textContent=n)}setTimeout(function(){try{localStorage.setItem(e,n)}catch(t){}try{var a={};try{a=JSON.parse(localStorage.getItem("akini_s1_texts")||"{}")}catch(t){}a["line"+t]=n,localStorage.setItem("akini_s1_texts",JSON.stringify(a))}catch(t){}},0)}}if(1===t?(n=i&&i.textContent?i.textContent:"xxx",a="请输入第一行昵称/文字："):2===t?(n=o&&o.textContent?o.textContent:"xxx",a="请输入第二行文字："):3===t?(n=r&&r.textContent?r.textContent:"xxx",a="请输入第三行文字："):5===t&&(n=c&&c.textContent?c.textContent:"xxx",a="请输入定位文字："),"function"!=typeof window.__akiniPromptModal)try{l(prompt(a,"xxx"===n?"":n))}catch(t){}else window.__akiniPromptModal(a.replace("：",""),"请输入自定义文字",l,{value:"xxx"===n?"":n,maxLength:50})},window.editS1PolaroidNote=function(){var t=document.getElementById("s1PolaroidNote");let e=t&&t.textContent?t.textContent:"xxx";function n(t){if(null!==t){t=String(t).trim()||"xxx";var _el=document.getElementById("s1PolaroidNote");_el&&(_el.textContent=t);setTimeout(function(){try{localStorage.setItem("akini_s1_polaroid_note",t)}catch(t){}try{var e={};try{e=JSON.parse(localStorage.getItem("akini_s1_texts")||"{}")}catch(t){}e.note=t,localStorage.setItem("akini_s1_texts",JSON.stringify(e))}catch(t){}},0)}}if("function"!=typeof window.__akiniPromptModal)try{n(prompt("请输入小卡片左下角自定义文字：","xxx"===e?"":e))}catch(t){}else window.__akiniPromptModal("小卡片自定义文字","请输入小卡片左下角文字",n,{value:"xxx"===e?"":e,maxLength:30})},window.changeS1Photo=function(){const t=document.createElement("input");t.type="file",t.accept="image/*",t.onchange=function(t){const e=t.target.files[0];if(!e)return;const n=new FileReader;n.onload=function(t){const e=document.getElementById("s1PolaroidImg");if(e){e.style.backgroundImage=`url("${t.target.result}")`;try{localStorage.setItem("akini_s1_photo",t.target.result)}catch(t){}}},n.readAsDataURL(e)},t.click()},window.loadS1SavedTexts=function(){try{try{if("1"!==localStorage.getItem("akini_s1_migrated_")){localStorage.setItem("akini_s1_migrated_","1");var t=localStorage.getItem("akini_s1_custom_text_3"),e=localStorage.getItem("akini_s1_custom_text_4");if(null===t||""===t||localStorage.getItem("akini_s1_custom_text_2")||localStorage.setItem("akini_s1_custom_text_2",t),null!==e&&""!==e){var n=localStorage.getItem("akini_s1_custom_text_3");null!==n&&""!==n&&n!==t||localStorage.setItem("akini_s1_custom_text_3",e)}var a={};try{a=JSON.parse(localStorage.getItem("akini_s1_texts")||"{}")}catch(t){}!a.line2&&a.line3&&(a.line2=a.line3),!a.line4||a.line3&&a.line3!==a.line2||(a.line3=a.line4);try{localStorage.setItem("akini_s1_texts",JSON.stringify(a))}catch(t){}}}catch(t){}const r=localStorage.getItem("akini_s1_custom_text_1"),c=localStorage.getItem("akini_s1_custom_text_2"),l=localStorage.getItem("akini_s1_custom_text_3"),s=localStorage.getItem("akini_s1_custom_text_5"),d=localStorage.getItem("akini_s1_polaroid_note"),g=localStorage.getItem("akini_s1_photo");var i={};try{i=JSON.parse(localStorage.getItem("akini_s1_texts")||"{}")}catch(t){}var o=function(t,e){return null!=t&&""!==t?t:e||null};const u=o(r,i.line1),m=o(c,i.line2),f=o(l,i.line3),p=o(s,i.line5),y=o(d,i.note);u&&document.getElementById("s1Text1")&&(document.getElementById("s1Text1").textContent=u),m&&document.getElementById("s1Text2")&&(document.getElementById("s1Text2").textContent=m),f&&document.getElementById("s1Text3")&&(document.getElementById("s1Text3").textContent=f),p&&document.getElementById("s1TextLoc")&&(document.getElementById("s1TextLoc").textContent=p),y&&document.getElementById("s1PolaroidNote")&&(document.getElementById("s1PolaroidNote").textContent=y),g&&document.getElementById("s1PolaroidImg")&&(document.getElementById("s1PolaroidImg").style.backgroundImage=`url("${g}")`)}catch(t){}},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",window.loadS1SavedTexts):window.loadS1SavedTexts(),window.handleDayBgDirect=function(t){var e=t.target.files&&t.target.files[0];if(e){var n=new FileReader;n.onload=function(t){var e=t.target.result,n=document.getElementById("dayCardBg")||document.getElementById("bgArea");n&&(n.style.backgroundImage='url("'+e+'")',n.style.backgroundSize="cover",n.style.backgroundPosition="center");try{localStorage.setItem("akini_day_bg",e),localStorage.setItem("akini_anniv_bg",e)}catch(t){}},n.readAsDataURL(e),t.target.value=""}}
;
/* ===== akini-music.js ===== */
!function(){if(window.visualViewport){var e=window.visualViewport,t=0,_vvt=null;e.addEventListener("resize",function(){_vvt&&cancelAnimationFrame(_vvt),_vvt=requestAnimationFrame(i)}),e.addEventListener("scroll",function(){_vvt&&cancelAnimationFrame(_vvt),_vvt=requestAnimationFrame(i)}),document.addEventListener("visibilitychange",function(){document.hidden||setTimeout(i,120)})}function i(){try{var i=document.getElementById("app-chat");if(!i)return;if(!("none"!==i.style.display&&(null!==i.offsetParent||i.getClientRects().length>0)))return void(0!==t&&(i.style.transform="",i.style.paddingBottom="",t=0));var n=i.querySelector(".chat-input-bar-area")||i.querySelector(".chat-input-bar");if(!n)return;var a=n.getBoundingClientRect().bottom+t-(e.height+e.offsetTop),o=a>2?Math.min(a+8,420):0;if(o!==t&&(i.style.transform="",i.style.paddingBottom=o>0?o+"px":"",t=o,o>0))try{var r=document.getElementById("chatBody");r&&(r.scrollTop=r.scrollHeight)}catch(e){}}catch(e){}}}(),window.__akiniFilterDelPosts=function(e){try{if(!Array.isArray(e)||!e.length)return e;var t=[];try{t=JSON.parse(localStorage.getItem("akini_deleted_posts")||"[]")}catch(e){}if(!Array.isArray(t)||!t.length)return e;var i={};return t.forEach(function(e){i[String(e)]=1}),e.filter(function(e){return!(e&&e.id&&i[String(e.id)])})}catch(t){return e}},window.__akiniFilterDelIcity=function(e){try{if(!Array.isArray(e)||!e.length)return e;var t=[];try{t=JSON.parse(localStorage.getItem("akini_deleted_icity")||"[]")}catch(e){}if(!Array.isArray(t)||!t.length)return e;var i={};return t.forEach(function(e){i[String(e)]=1}),e.filter(function(e){return!(e&&e.id&&i[String(e.id)])})}catch(t){return e}},function(){window.__akiniNeLoggedIn=!1,window.__akiniGetNeSid=function(){return""},window.__akiniNeDbg=function(){},window.__akiniNeRefresh=function(){return Promise.resolve({loggedIn:!1})},window.__akiniNeLogoutLocal=function(){},window.__akiniNeLoadPl=function(){try{window._renderPlaylist&&window._renderPlaylist()}catch(e){}};window._akiniNeSongUrl=function(e){var b="";try{b=String(window.AKINI_NETEASE_PROXY||"").trim()}catch(_e){}b=(b||"https://api.mc666.org.cn").replace(/\/+$/,"");return fetch(b+"/song/url?id="+encodeURIComponent(String(e||""))+"&level=lossless&timestamp="+Date.now()).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(d){var f=d&&d.data&&d.data[0]||{};if(f&&f.url)return{url:f.url,trial:!!f.trial,level:f.level||"lossless"};var cd=f.code||403;return{code:cd,trial:!0,msg:404===cd?"该歌曲暂无版权/需要会员":"仅可试听"}})};function i(){try{var e=window.akiniContacts&&window.akiniContacts.getActiveChatId?window.akiniContacts.getActiveChatId():"",t=document.getElementById("chatBody");if(e&&t){var i="function"==typeof window.__akiniGetChatMem?window.__akiniGetChatMem(e):"";i&&i.length>(t.innerHTML||"").length+40&&(t.innerHTML=i,window.__akiniMedia&&window.__akiniMedia.resolve&&window.__akiniMedia.resolve(t),t.scrollTop=t.scrollHeight)}}catch(e){}}window.addEventListener("pageshow",function(){try{i()}catch(e){}try{window.__akiniRenderUserText&&window.__akiniRenderUserText()}catch(e){}try{window.__akiniApplyAvatarSwap&&window.__akiniApplyAvatarSwap()}catch(e){}});var btn=document.getElementById("musicMenuBtn");btn&&!btn._neBound&&(btn._neBound=1,btn.addEventListener("click",function(){setTimeout(function(){try{window._renderPlaylist&&window._renderPlaylist()}catch(e){}},250)}));},document.addEventListener("DOMContentLoaded",function(){var e=document.getElementById("musicChatInput");document.getElementById("musicChatModal"),e&&(e.addEventListener("click",function(t){t.stopPropagation();try{e.focus()}catch(e){}}),e.addEventListener("touchend",function(t){t.stopPropagation();try{e.focus()}catch(e){}}))}),function(){function e(){!function(){try{if(!window.__akiniNeLoggedIn)return;}catch(e){}}(),function(){try{var e=document.getElementById("musicPlaylistOverlay");if(!e)return;if("none"===e.style.display)return;"function"==typeof window._renderPlaylist&&window._renderPlaylist()}catch(e){}}()}setTimeout(e,2e3),setTimeout(e,5e3),setTimeout(e,1e4),window.addEventListener("pageshow",function(){setTimeout(e,300),setTimeout(e,1500)}),document.addEventListener("visibilitychange",function(){try{document.hidden&&setTimeout(function(){try{document.hidden&&window.__akiniMedia&&window.__akiniMedia.flushHalf()}catch(e){}},6e4)}catch(e){}});try{["musicMenuOverlay","musicPlaylistOverlay"].forEach(function(t){var i=document.getElementById(t);i&&window.MutationObserver&&new MutationObserver(function(){setTimeout(e,80)}).observe(i,{attributes:!0,attributeFilter:["style","class"]})})}catch(e){}}();
;
/* ===== akini-moments-engine.js ===== */
/*
 * akini-moments-engine.js
 * 朋友圈 / iCity 自动点赞/评论引擎
 * - 用户发布动态后，按"消息回复延迟"等待，随后所有联系人 100% 点赞 + 100% 评论
 * - 每个联系人只评论 1 条文字，评论内容仅来自用户字卡库，无兜底句库/表情
 * - 用户回复某联系人评论后，该联系人再回复 1 条（同样延迟）
 * - 联系人自己发朋友圈/iCity 时，有 20% 概率附带用户给 TA 添加的表情包（与评论表情包概率一致，仅贴文非评论）
 */
(function () {
  'use strict';
  if (window.__akiniMomentsEngineReady) return;
  window.__akiniMomentsEngineReady = true;

  // ========== 工具函数 ==========

  function getContacts() {
    return (window.akiniContacts && window.akiniContacts.getContacts) ? window.akiniContacts.getContacts() : [];
  }

  function getContactById(id) {
    if (!id) return null;
    var contacts = getContacts();
    for (var i = 0; i < contacts.length; i++) {
      if (contacts[i].id === id || String(contacts[i].id) === String(id)) return contacts[i];
    }
    return null;
  }

  // 朋友圈用微信设置的昵称头像；icity 用 icity 里设置的资料，两者不互通
  function getContactName(contact, app) {
    if (!contact) return '对方';
    if (app === 'icity' && window.getIcityContactProfile) {
      var p = window.getIcityContactProfile(contact.id);
      if (p && p.name) return p.name;
    }
    return contact.name || '对方';
  }

  function getContactAvatar(contact, app) {
    if (!contact) return '';
    if (app === 'icity' && window.getIcityContactProfile) {
      var p = window.getIcityContactProfile(contact.id);
      if (p && p.avatar) return p.avatar;
    }
    return contact.avatar || '';
  }

  // 读取该联系人自己的专属表情包（每个联系人只能用自己的库，绝不回退全局/别人）
  function getContactStickers(contactId) {
    if (!contactId) return [];
    try {
      if (typeof window.__akiniStickerSrcs === 'function') {
        var srcs = window.__akiniStickerSrcs(contactId);
        if (Array.isArray(srcs) && srcs.length) return srcs;
      }
      if (typeof window.getContactStickersSync === 'function') {
        var syncs = window.getContactStickersSync(contactId);
        if (Array.isArray(syncs) && syncs.length) {
          return syncs.map(function (it) {
            if (typeof it === 'string') return it;
            return (it && (it.s || it.url || it.src)) || '';
          }).filter(Boolean);
        }
      }
      var raw = localStorage.getItem('akini_stickers_' + contactId);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.map(function (it) {
          if (typeof it === 'string') return it;
          return (it && (it.s || it.url || it.src)) || '';
        }).filter(Boolean);
      }
    } catch (e) {}
    return [];
  }

  // 从字卡库取可用文字（排除拍一拍 pat）
  function getWordbankTexts() {
    var out = [];
    var seen = {};
    function addFromRaw(raw) {
      if (!raw) return;
      try {
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return;
        arr.forEach(function (item) {
          var t = typeof item === 'string' ? item : (item && item.text);
          if (!t || !String(t).trim()) return;
          var tab = ((item && item.tab) || '').toLowerCase();
          var type = ((item && item.type) || '').toLowerCase();
          if (tab === 'pat' || type === 'pat') return;
          var key = String(t).trim();
          if (!seen[key]) {
            seen[key] = true;
            out.push(key);
          }
        });
      } catch (e) {}
    }
    try {
      // 优先从内存缓存读取（与 akiniStore 同步），避免 localStorage 配额空时无法取到字卡
      if (window.akiniStore && window.akiniStore.memoryGet) {
        addFromRaw(window.akiniStore.memoryGet('akini_wordbank'));
      }
      // 兜底 localStorage
      var keys = Object.keys(localStorage);
      keys.forEach(function (k) {
        if (k.indexOf('akini_wordbank') === 0) {
          addFromRaw(localStorage.getItem(k));
        }
      });
    } catch (e) {}
    return out;
  }

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 使用与聊天回复相同的消息回复延迟
  function getMessageReplyDelay() {
    var min = parseFloat(localStorage.getItem('akini_num_replyDelayMin') || '2');
    var max = parseFloat(localStorage.getItem('akini_num_replyDelayMax') || '5');
    if (isNaN(min) || min < 0) min = 2;
    if (isNaN(max) || max < min) max = min;
    return Math.floor(1000 * (min + Math.random() * Math.max(0, max - min)));
  }

  // ========== 数据读写 ==========

  function getData(app) {
    if (app === 'icity') {
      return window.__akiniGetIcity ? window.__akiniGetIcity() : [];
    }
    return window.__akiniGetPosts ? window.__akiniGetPosts() : [];
  }

  function saveData(app, data) {
    try {
      if (app === 'icity') {
        if (window.__akiniSaveIcity) window.__akiniSaveIcity(data);
      } else {
        if (window.__akiniSavePosts) window.__akiniSavePosts(data);
      }
    } catch (e) {}
  }

  function render(app) {
    try {
      if (app === 'icity') {
        if (window._renderIcity) window._renderIcity();
        if (window.renderIcityProfileDiaries) {
          window.renderIcityProfileDiaries('icityMyProfileDiaries', 'me');
          window.renderIcityProfileDiaries('icityTaProfileDiaries', 'ta');
        }
      } else {
        if (window._renderPosts) window._renderPosts();
      }
    } catch (e) {}
  }

  function findMoment(data, momentId) {
    if (!data || !data.length) return null;
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].id) === String(momentId)) return data[i];
    }
    return null;
  }

  function notify(app, name, avatar, msg) {
    try {
      if (window.showInAppNotif) {
        window.showInAppNotif({
          app: app === 'icity' ? 'icity' : '朋友圈',
          avatar: avatar,
          name: name,
          fullContent: true,
          msg: msg,
          onTap: function () {}
        });
      }
    } catch (e) {}
  }

  // ========== 点赞/评论核心 ==========


  // ========== 互动通知记录（消息中心数据源） ==========

  function pushNotif(app, type, name, avatar, text, momentId, extra) {
    try {
      var key = app === 'icity' ? 'akini_icity_notifications' : 'akini_friends_notifications';
      var list = [];
      try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { list = []; }
      var item = {
        id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        type: type,
        name: name,
        avatar: avatar,
        text: text,
        momentId: String(momentId),
        ts: Date.now(),
        read: false
      };
      if (extra && extra.sticker) item.sticker = extra.sticker;
      if (extra && extra.replyTo) item.replyTo = extra.replyTo;
      list.push(item);
      if (list.length > 100) list = list.slice(-100);
      localStorage.setItem(key, JSON.stringify(list));
      if (window.__updateHomeBadges) window.__updateHomeBadges();
    } catch (e) {}
  }

  function likeMoment(moment, contact, app) {
    var name = getContactName(contact, app);
    var liked = false;
    if (app === 'icity') {
      moment.likers = moment.likers || [];
      if (moment.likers.indexOf(name) < 0) {
        moment.likers.push(name);
        moment.likes = (moment.likes || 0) + 1;
        liked = true;
      }
    } else {
      moment.likes = moment.likes || [];
      if (moment.likes.indexOf(name) < 0) {
        moment.likes.push(name);
        liked = true;
      }
    }
    if (liked) {
      var preview = (moment.content || moment.text || '').replace(/\n/g, ' ').slice(0, 30);
      pushNotif(app, 'like', name, getContactAvatar(contact, app), preview, moment.id);
    }
  }

  function commentMoment(moment, contact, replyTo, app) {
    var name = getContactName(contact, app);
    var avatar = getContactAvatar(contact, app);

    // 20% 概率附带该联系人专属表情包
    var stickers = getContactStickers(contact.id);
    if (stickers.length && Math.random() < 0.2) {
      var st = pickRandom(stickers);
      var scomment = {
        id: 'c_' + Math.random().toString(36).slice(2) + '_' + Date.now(),
        author: name,
        authorId: contact.id,
        text: '',
        sticker: st,
        ts: Date.now()
      };
      if (replyTo) scomment.replyTo = replyTo;
      if (app === 'icity') scomment.avatar = avatar;
      moment.comments = moment.comments || [];
      moment.comments.push(scomment);
      pushNotif(app, replyTo ? 'reply' : 'comment', name, avatar, '[表情包]', moment.id, { sticker: st, replyTo: replyTo });
      return true;
    }

    var texts = getWordbankTexts();
    if (!texts.length) return false;
    var text = pickRandom(texts);
    if (!text) return false;

    var comment = {
      id: 'c_' + Math.random().toString(36).slice(2) + '_' + Date.now(),
      author: name,
      authorId: contact.id,
      text: text,
      ts: Date.now()
    };
    if (replyTo) comment.replyTo = replyTo;
    if (app === 'icity') comment.avatar = avatar;

    moment.comments = moment.comments || [];
    moment.comments.push(comment);
    pushNotif(app, replyTo ? 'reply' : 'comment', name, avatar, text, moment.id, { replyTo: replyTo });
    return true;
  }

  // ========== 初始点赞/评论 ==========

  function doInitialReply(momentId, app) {
    var data = getData(app);
    var moment = findMoment(data, momentId);
    if (!moment) return;

    var contacts = getContacts();
    if (!contacts.length) return;

    var myName = app === 'icity'
      ? (localStorage.getItem('akini_icity_my_nick') || localStorage.getItem('akini_my_name') || '我')
      : (localStorage.getItem('akini_my_name') || '我');
    var didAnything = false;

    contacts.forEach(function (contact) {
      likeMoment(moment, contact, app);
      didAnything = true;
    });

    // compat 评论数量逻辑：总数按设置（空=随机1~3），打乱联系人、60% 概率参与且至少 1 人，逐人分 1~2 条
    var totalComments = getCommentCount();
    var shuffled = contacts.slice().sort(function () { return Math.random() - 0.5; });
    var repliers = [];
    for (var ri = 0; ri < shuffled.length; ri++) {
      if (Math.random() < 0.6) repliers.push(shuffled[ri]);
    }
    if (!repliers.length) repliers.push(shuffled[0]);
    var remaining = totalComments;
    var plan = [];
    for (var pi = 0; pi < repliers.length && remaining > 0; pi++) {
      var pc = pi === repliers.length - 1 ? remaining : (Math.random() < 0.5 ? 1 : Math.min(2, remaining));
      plan.push({ contact: repliers[pi], count: pc });
      remaining -= pc;
    }
    plan.forEach(function (p) {
      for (var ci = 0; ci < p.count; ci++) {
        if (commentMoment(moment, p.contact, null, app)) {
          didAnything = true;
          var _lc = moment.comments[moment.comments.length - 1];
          notify(app, getContactName(p.contact, app), getContactAvatar(p.contact, app), '评论了你的动态：' + (_lc.sticker ? '[表情包]' : String(_lc.text || '').slice(0, 20)));
        }
      }
    });

    if (didAnything) {
      saveData(app, data);
      render(app);
    }
  }

  // ========== 用户回复后再回复 ==========

  function doReplyToUser(momentId, contactId, replyToName, app) {
    var data = getData(app);
    var moment = findMoment(data, momentId);
    if (!moment) return;

    var contact = getContactById(contactId);
    if (!contact) return;

    if (commentMoment(moment, contact, replyToName, app)) {
      saveData(app, data);
      render(app);
      var _lc2 = moment.comments[moment.comments.length - 1];
      var _txt = _lc2.sticker ? '[表情包]' : String(_lc2.text || '');
      notify(app, getContactName(contact, app), getContactAvatar(contact, app), '回复了你的评论：' + _txt.slice(0, 20));
    }
  }

  // compat 评论数量：min/max 都留空 = 随机（70% 1条 / 20% 2条 / 10% 3条）；有值则区间随机（0~20）
  function getCommentCount() {
    var minS = localStorage.getItem('akini_num_commentCountMin');
    var maxS = localStorage.getItem('akini_num_commentCountMax');
    if (!minS && !maxS) {
      return Math.random() < 0.7 ? 1 : (Math.random() < 0.9 ? 2 : 3);
    }
    var min = minS ? Math.max(0, parseInt(minS, 10) || 0) : 0;
    var max = maxS ? Math.min(20, parseInt(maxS, 10) || 20) : 20;
    if (min > max) { var tmp = min; min = max; max = tmp; }
    if (min === max) return min;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  // ========== 联系人自己发朋友圈/iCity 时，10% 概率带表情包 ==========

  function maybeAttachSticker(contactId) {
    var stickers = getContactStickers(contactId);
    if (!stickers.length) return null;
    if (Math.random() >= 0.1) return null;
    return pickRandom(stickers);
  }

  // ========== 暴露接口 ==========

  window.akiniTriggerMomentAutoReply = function (momentId, app) {
    var delay = getMessageReplyDelay();
    setTimeout(function () {
      doInitialReply(momentId, app);
    }, delay);
  };

  // 用户评论/回复了朋友圈/iCity 后调用
  // momentId: 动态 id
  // contactIdOrName: 被回复的联系人 id 或名字；若是动态作者则表示这是一条新评论
  // app: 'friends' | 'icity'
  window.akiniOnMomentUserReply = function (momentId, contactIdOrName, app) {
    if (!momentId) return;
    var targetName = contactIdOrName || '';
    var contacts = getContacts();
    if (!contacts.length) return;

    var data = getData(app);
    var moment = findMoment(data, momentId);
    var authorName = moment ? (moment.author || '') : '';
    var myName = app === 'icity'
      ? (localStorage.getItem('akini_icity_my_nick') || localStorage.getItem('akini_my_name') || '我')
      : (localStorage.getItem('akini_my_name') || '我');

    // 判断是否是“单独回复某条联系人评论”：targetName 不是动态作者，视为单独回复
    var isTopLevelComment = !targetName || (authorName && targetName === authorName);

    if (isTopLevelComment) {
      // 新评论动态：所有联系人（排除“我”）都回复用户，按消息回复延迟设置（不要秒回）
      contacts.forEach(function (contact, idx) {
        if (!contact || contact.id === 'me' || contact.id === 'my') return;
        var delay = getMessageReplyDelay();
        setTimeout(function () {
          doReplyToUser(momentId, contact.id, myName, app);
        }, delay + idx * 600 + Math.floor(Math.random() * 300));
      });
      return;
    }

    // 单独回复某联系人评论：只有被回复的联系人回复
    var contact = getContactById(targetName);
    if (!contact) {
      for (var i = 0; i < contacts.length; i++) {
        if (getContactName(contacts[i], app) === targetName || (contacts[i] && contacts[i].name === targetName)) {
          contact = contacts[i];
          break;
        }
      }
    }
    if (!contact) return;

    var delay = getMessageReplyDelay();
    setTimeout(function () {
      doReplyToUser(momentId, contact.id, myName, app);
    }, delay);
  };

  window.akiniMomentMaybeAttachSticker = maybeAttachSticker;
  window.akiniMomentEngineActive = true;

  console.log('[akini-moments-engine] 朋友圈/iCity 点赞/评论引擎已加载（评论数量可调，20% 表情包评论，延迟=消息回复延迟）');
})();

;
/* ===== akini-mail-engine.js ===== */
(function () {
  "use strict";
  if (window.akiniMailEngine) return;

  function fmtDate() {
    return new Date().toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }
  function fmtDateAt(ts) {
    return new Date(ts).toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }

  // 记录最近活跃时间，用于离线补发来信时还原"离线期间"的时间段
  function markActive() {
    if(document.hidden) return;
    try { localStorage.setItem("akini_mail_last_active", String(Date.now())); } catch (e) {}
  }
  function lastActiveTs() {
    try { return parseInt(localStorage.getItem("akini_mail_last_active") || "0", 10) || 0; } catch (e) { return 0; }
  }

  // getSync 返回原始存储值（JSON 字符串或 null），统一解析成数组
  function _asArr(v) {
    if (!v) return [];
    if (typeof v === "string") {
      try { var a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    }
    return Array.isArray(v) ? v : [];
  }
  /* raw LS 权威读优先（内存镜像可能滞后），LS 无值再退内存/IDB */
  function _rawFirst(key) {
    try {
      if (window.akiniStore && window.akiniStore.rawLSGet) {
        var raw = window.akiniStore.rawLSGet(key);
        if (raw) return _asArr(raw);
      }
    } catch (e) {}
    return _asArr(window.akiniStore && window.akiniStore.getSync
      ? window.akiniStore.getSync(key, [])
      : []);
  }
  function getSent() { return _rawFirst("akini_mail_sent"); }
  function getReceived() { return _rawFirst("akini_mail_received"); }
  function saveSent(arr) {
    var n = JSON.stringify(arr || []);
    // 双通道落盘（LS + IDB 主/备），并登记 akini_key_mtime 供防回退守卫比对
    if (typeof window.saveMailSent === "function") { window.saveMailSent(arr); return; }
    try { localStorage.setItem("akini_mail_sent", n); } catch (eLS) {}
    if (window.akiniStore && window.akiniStore.set) window.akiniStore.set("akini_mail_sent", n);
    else if (window._idbStore && window._idbStore.set) {
      window._idbStore.set("akini_mail_sent", n);
    }
  }
  function saveReceived(arr) {
    var n = JSON.stringify(arr || []);
    // 核心修复（同 saveSent）：全链路双通道落盘 + mtime 登记，杜绝已读状态被旧值覆盖
    if (typeof window.saveMailReceived === "function") { window.saveMailReceived(arr); return; }
    try { localStorage.setItem("akini_mail_received", n); } catch (eLR) {}
    if (window.akiniStore && window.akiniStore.set) window.akiniStore.set("akini_mail_received", n);
    else if (window._idbStore && window._idbStore.set) {
      window._idbStore.set("akini_mail_received", n);
    }
  }
  /* 已读游标：每次读信都登记最新已读时刻，重启后任何"未读时间戳 ≤ 游标"的信
     强制视为已读——ID 匹配之外再加一道时间游标保险，双保险根治"点了已读下次又未读" */
  function stampLatestRead() {
    try { localStorage.setItem("akini_mail_latest_read_ts", String(Date.now())); } catch (e) {}
  }
  function latestReadTs() {
    return parseFloat(localStorage.getItem("akini_mail_latest_read_ts") || "0") || 0;
  }

  // 生成随机来信内容（compat envelope 式合成：字卡库随机 5-12 句，句号连接成段，
  // 并在随机 1-3 个句号后插入换行，形成信件排版）
  function genLetter(count) {
    count = parseInt(count, 10);
    if (isNaN(count) || count < 1) count = Math.floor(Math.random() * 8) + 5;
    if (!window.pickWordCards) return "";
    var raw = window.pickWordCards(count);
    if (!raw) return "";
    var sentences = raw.split("\n").filter(function (s) { return s && s.trim(); })
      .map(function (s) { return s.trim().replace(/。+$/, "") + "。"; });
    var content = sentences.join("");
    // 随机选 1-3 个句号位置插入换行（不拆分句子）
    var periodPositions = [];
    for (var i = 0; i < content.length; i++) {
      if (content[i] === "。") periodPositions.push(i);
    }
    var breakCount = Math.min(Math.floor(Math.random() * 3) + 1, periodPositions.length);
    var shuffled = periodPositions.sort(function () { return Math.random() - 0.5; });
    for (var b = 0; b < breakCount; b++) {
      var pos = shuffled[b] + 1;
      content = content.substring(0, pos) + "\n" + content.substring(pos);
      for (var j = b + 1; j < shuffled.length; j++) {
        if (shuffled[j] > pos - 1) shuffled[j]++;
      }
    }
    return content.trim();
  }

  // compat 照搬：回信内容生成（8~12 句，每句随机标点 20%「！」/20%「...」/其余「。」）
  function genReplyText() {
    if (!window.pickWordCards) return "";
    var count = Math.floor(Math.random() * 5) + 8;
    var raw = window.pickWordCards(count);
    if (!raw) return "";
    var sentences = raw.split("\n").filter(function (s) { return s && s.trim(); });
    var out = "";
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i].trim().replace(/[。！!]+$/, "");
      var r = Math.random();
      out += s + (r < 0.2 ? "！" : r < 0.4 ? "..." : "。");
    }
    return out;
  }

  // ========== 离线回信投递：检查所有已预约 replyTime 且到点的回信 ==========
  function checkStatus() {
    if(document.hidden) return;
    try {
      var now = Date.now();
      var sent = getSent();
      var changed = false;
      var delivered = [];
      for (var i = 0; i < sent.length; i++) {
        var s = sent[i];
        if (s && s.replyTime && !s.repliedByTa && now >= s.replyTime) {
          var recv = getReceived();
          recv.push({
            content: s.replyContent || genReplyText() || genLetter(),
            // 用回信预约时间作为显示时间，还原"离线期间"对方回信的时间段
            date: fmtDateAt(s.replyTime),
            ts: s.replyTime,
            from: s.replyFromName || s.to || "对方",
            fromId: s.replyFromId || s.toId,
            subtype: "reply",
            originalContent: s.content,
            read: false,
            isRead: false,
          });
          saveReceived(recv);
          s.repliedByTa = true;
          s.isRead = true;
          s.read = true;
          changed = true;
          delivered.push(s);
        } else if (s && s.replyTime && now >= s.replyTime && (!s.isRead || !s.repliedByTa)) {
          // 回信时间到达，确保寄信状态置为已读
          s.repliedByTa = true;
          s.isRead = true;
          s.read = true;
          changed = true;
        }
      }
      if (changed) saveSent(sent);
      // 每次投递/状态变更后推进已读游标（同 saveMailReceived 内逻辑）
      var _lrt2 = 0;
      try {
        (sent || []).forEach(function (m) {
          if (m && (m.read || m.isRead) && m.ts && m.ts > _lrt2) _lrt2 = m.ts;
        });
      } catch (eL3) {}
      if (_lrt2 > 0) {
        try {
          var _cur2 = parseFloat(localStorage.getItem("akini_mail_latest_read_ts") || "0") || 0;
          if (_lrt2 > _cur2) localStorage.setItem("akini_mail_latest_read_ts", String(_lrt2));
        } catch (eL4) {}
      }
      // 已读游标兜底：任何"未读但 ts ≤ 游标"的信（旧快照回填的）一律强制已读——
      // 用户明明读过，绝不允许旧数据让它再变未读
      try {
        var _curs = latestReadTs();
        if (_curs > 0) {
          var _recv = getReceived();
          var _recvChanged = false;
          for (var _ri = 0; _ri < _recv.length; _ri++) {
            var _rm = _recv[_ri];
            if (_rm && !(_rm.read || _rm.isRead) && _rm.ts && _rm.ts <= _curs) {
              _rm.read = true; _rm.isRead = true; _recvChanged = true;
            }
          }
          if (_recvChanged) saveReceived(_recv);
        }
      } catch (eCur) {}
      // 通知 UI（离线错过的回信静默入库：不弹通知不弹窗，就像它早就在信箱里）
      for (var d = 0; d < delivered.length; d++) {
        var s2 = delivered[d];
        if (s2.replyTime && now - s2.replyTime > 60000) continue;
        if (window.showInAppNotif) {
          // 头像实时从联系人取：预约时存的 replyAvatar 可能是换头像前的旧值
          var _rc = null;
          try { if (window.akiniContacts && s2.replyFromId) _rc = window.akiniContacts.getChatTarget(s2.replyFromId); } catch (e) {}
          var _rava = (_rc && _rc.avatar && String(_rc.avatar).trim()) || s2.replyAvatar || "";
          window.showInAppNotif({
            app: "信箱",
            avatar: window.nt ? window.nt(_rava, 40) : "",
            chatId: s2.replyFromId || "",
            name: s2.replyFromName || "对方",
            fullContent: true,
            msg: (s2.replyFromName || "对方") + "回复了你的信件",
            onTap: function () {
              if (window.o) window.o("mail");
              if (window.__mailShowTab) window.__mailShowTab("received");
            },
          });
        }
      }
      if (delivered.length && window.__renderMail) window.__renderMail();
    } catch (e) {
      console.warn("[akini-mail-engine] checkStatus error", e);
    }
  }

  // ========== 主动来信定时器（syy 自调度模型 + 离线补发） ==========
  // 模型：单一自调度定时器；开关关则 return；按用户设置的最小~最大范围随机取一个间隔；
  // 触发后发信并自调度下一次；排期写入 akini_next_mailAutoSend，离线错过的在启动/回到前台时补发。
  var autoTimer = null;

  // 时间段解析（HH:MM → 当天分钟数；跨午夜，时间段外不发、顺延到下一次进入时间段）
  function _parseMin(t) {
    var p = String(t || "").split(":");
    return parseInt(p[0] || "0", 10) * 60 + parseInt(p[1] || "0", 10);
  }
  function _rangeInfo() {
    var rStart = localStorage.getItem("akini_time_mail_start") || "";
    var rEnd = localStorage.getItem("akini_time_mail_end") || "";
    var start = _parseMin(rStart), end = _parseMin(rEnd);
    // 两个值都为 0 且未设置 → 视为全天允许
    var configured = !!((rStart || rEnd)) && !(start === 0 && end === 0 && !rStart && !rEnd);
    return { start: start, end: end, configured: configured };
  }
  function _nowMin() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  // 距离下一次进入时间段开始还有多少毫秒（全天允许返回 0）
  function _nextRangeDelay(info) {
    if (!info.configured) return 0;
    var cur = _nowMin();
    var start = info.start, end = info.end;
    var inRange = start <= end ? (cur >= start && cur <= end) : (cur >= start || cur <= end);
    if (inRange) return 0;
    // 跨午夜计算下一次 start
    var target;
    if (start <= end) target = cur < start ? start : start + 1440;
    else target = (cur >= end && cur < start) ? start : start + 1440;
    var diff = ((target - cur) + 1440) % 1440;
    if (diff <= 0) diff = 1;
    return diff * 60000;
  }

  // 计算下一封主动来信的随机延迟（毫秒），仅依据用户设置的间隔
  function _randomIntervalMs() {
    var minH = parseFloat(localStorage.getItem("akini_num_activeMailMin") || "");
    var maxH = parseFloat(localStorage.getItem("akini_num_activeMailMax") || "");
    var minMs, maxMs;
    if (!isNaN(minH) && minH > 0) {
      minMs = minH * 3600e3;
      maxMs = (!isNaN(maxH) && maxH >= minH ? maxH : minH) * 3600e3;
    } else {
      var min = parseFloat(localStorage.getItem("akini_num_mailAutoSendMin") || "30");
      var max = parseFloat(localStorage.getItem("akini_num_mailAutoSendMax") || "90");
      if (isNaN(min) || min < 1) min = 30;
      if (isNaN(max) || max < min) max = min + 30;
      minMs = min * 60e3;
      maxMs = max * 60e3;
    }
    return minMs + Math.random() * Math.max(0, maxMs - minMs);
  }

  function _toggleOn() {
    var tg = localStorage.getItem("akini_toggle_contactMailToggle");
    // 未显式开启时一律视为关闭，避免旧数据/未初始化导致联系人擅自来信
    if (tg === null) return false;
    return tg !== "0";
  }
  function _nextKey() { return "akini_next_mailAutoSend"; }
  function _readNext() {
    return parseFloat(localStorage.getItem(_nextKey()) || "0") || 0;
  }
  function _clearNext() {
    try { localStorage.removeItem(_nextKey()); } catch (e) {}
  }

  // 投递一封主动来信；ts 为计划发送时间（离线补发时用它还原"离线期间"的时间）
  function deliverActiveLetter(ts) {
    var c = window.__akiniDefaultContact ? window.__akiniDefaultContact() : null;
    if (!c && window.akiniContacts) {
      var contacts = window.akiniContacts.getContacts() || [];
      c = contacts[0] || null;
    }
    if (!c) return false;
    var content = genLetter();
    if (!content) return false;
    ts = ts || Date.now();
    var recv = getReceived();
    recv.push({
      content: content,
      date: fmtDateAt(ts),
      ts: ts,
      from: c.name,
      fromId: c.id,
      subtype: "letter",
      read: false,
      isRead: false,
    });
    saveReceived(recv);
    if (window.showInAppNotif) {
      window.showInAppNotif({
        app: "信箱",
        avatar: window.nt ? window.nt(c.avatar, 40) : "",
        chatId: c.id || "",
        name: c.name,
        fullContent: true,
        msg: c.name + "给你写了一封信",
        onTap: function () {
          if (window.o) window.o("mail");
          if (window.__mailShowTab) window.__mailShowTab("received");
        },
      });
    }
    if (window.__renderMail) window.__renderMail();
    return true;
  }

  function _arm(delay) {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = setTimeout(function () {
      autoTimer = null;
      _clearNext();
      if (!_toggleOn()) return;
      try { deliverActiveLetter(Date.now()); } catch (e) { console.warn("[akini-mail-engine] 发信异常", e); }
      manageAutoSendTimer();
    }, Math.max(1000, delay));
  }

  function manageAutoSendTimer() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (!_toggleOn()) { _clearNext(); return; }

    var info = _rangeInfo();
    var outDelay = info.configured ? _nextRangeDelay(info) : 0;
    // 不在允许时间段内：顺延到下一次进入时间段；否则按最小~最大范围随机取间隔
    var delay = outDelay > 0 ? outDelay : _randomIntervalMs();
    try { localStorage.setItem(_nextKey(), String(Date.now() + delay)); } catch (e) {}
    _arm(delay);
  }

  /* 离线补发：应用关闭期间错过的那一封，在启动/回到前台时补上（只补一封，避免刷屏） */
  function catchUpActiveLetter() {
    if (!_toggleOn()) { _clearNext(); return; }
    var next = _readNext();
    if (next <= 0 || Date.now() < next) return;
    _clearNext();
    try { deliverActiveLetter(next); } catch (e) { console.warn("[akini-mail-engine] 离线补发异常", e); }
    manageAutoSendTimer();
  }

  function start() {
    // 启动时先投递离线期间到点的回信与主动来信，再启动定时器
    checkStatus();
    catchUpActiveLetter();
    manageAutoSendTimer();
    // 每 30 秒巡检一次，确保应用保持打开时也能按时投递离线回信
    setInterval(checkStatus, 30000);
  }

  window.__akiniGenReplyText = genReplyText;

  window.akiniMailEngine = {
    checkStatus: checkStatus,
    start: start,
    markActive: markActive,
    deliverActiveLetter: deliverActiveLetter,
    catchUp: catchUpActiveLetter,
    // 设置页变更开关/间隔时调用：立即按新配置重排主动来信
    resetAutoSend: function () { catchUpActiveLetter(); manageAutoSendTimer(); },
  };

  // 等待数据恢复完成后启动
  function boot() {
    // 清理历史遗留键（保留 akini_next_mailAutoSend：它是离线补发的排期凭据）
    ["akini_mail_backfill_done", "akini_mail_engine_last_rearm"]
      .forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    if (window.__akiniBooted) { start(); return; }
    var waited = 0;
    var iv = setInterval(function () {
      waited += 200;
      if (window.__akiniBooted || waited > 8000) {
        clearInterval(iv);
        start();
      }
    }, 200);
  }
  boot();

  // 应用回到前台：刷新活跃时间、投递离线到点的回信，并补发离线错过的主动来信
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      if (window.akiniMailEngine && window.akiniMailEngine.checkStatus) window.akiniMailEngine.checkStatus();
      catchUpActiveLetter();
      markActive();
    }
  });
  // 周期性更新活跃时间（应用在前台时）
  setInterval(markActive, 60000);

  console.log("[akini-mail-engine] 信箱离线回信/主动来信引擎已加载（syy 自调度模型）");
})();
;
/* ===== akini-active-engine.js ===== */
/* 联系人主动行为调度：主动发消息（milk 模型）+ 开关变更后的重新排期 */
(function () {
  "use strict";
  if (window.__akiniActiveEngineReady) return;
  window.__akiniActiveEngineReady = true;

  /* 旧实现是一串自续期的 setTimeout，只有它自己会续命；清掉当前这一个就彻底停止。
     core 的启动排期可能晚于本脚本（慢设备恢复数据要十几秒），因此定时复核，
     否则两个引擎同时跑就会出现"联系人干啥都是两条"。 */
  function _killLegacy() {
    try {
      if (window.__activeMsgTimer) { clearTimeout(window.__activeMsgTimer); window.__activeMsgTimer = null; }
    } catch (e0) {}
    if (window._akiniActiveMsgAction) window._akiniActiveMsgAction = null;
    if (window._akiniRescheduleActiveMsg !== manage) window._akiniRescheduleActiveMsg = manage;
  }
  _killLegacy();

  var msgTimer = null;

  function _toggleOn() {
    if (!window.__akiniToggleOn) return false;
    return !!window.__akiniToggleOn("contactActiveMsgToggle", false);
  }

  /* 用户设置的最小~最大分钟数之间随机取一个间隔 */
  function _randomIntervalMs() {
    var minM = parseFloat(localStorage.getItem("akini_num_activeMsgMin") || "");
    var maxM = parseFloat(localStorage.getItem("akini_num_activeMsgMax") || "");
    if (!(minM > 0)) minM = 5;
    if (!(maxM >= minM)) maxM = minM;
    var minMs = minM * 60e3, maxMs = maxM * 60e3;
    return minMs + Math.random() * (maxMs - minMs);
  }

  function _defaultContact() {
    try {
      if (typeof window.__akiniDefaultContact === "function") {
        var c = window.__akiniDefaultContact();
        if (c && c.id != null) return c;
      }
    } catch (e) {}
    try {
      var cs = window.akiniContacts && window.akiniContacts.getContacts
        ? window.akiniContacts.getContacts() : null;
      if (cs && cs.length) return cs[0];
    } catch (e) {}
    return null;
  }

  /* 一次主动发消息：标记已读 + 连发 1~3 条（内容取自字卡库） */
  function _fire() {
    var c = _defaultContact();
    if (!c) return;
    if (typeof window.triggerTaReplyOnce === "function") window.triggerTaReplyOnce(c.id);
  }

  function _arm(delay) {
    if (msgTimer) clearTimeout(msgTimer);
    msgTimer = setTimeout(function () {
      msgTimer = null;
      if (!_toggleOn()) return;
      try { _fire(); } catch (e) { console.warn("[主动发消息] 发送异常", e); }
      manage();
    }, Math.max(5000, delay));
  }

  function manage() {
    _killLegacy();
    if (msgTimer) { clearTimeout(msgTimer); msgTimer = null; }
    if (!_toggleOn()) {
      /* 主动开关已关：硬关闭所有主动消息定时器，杜绝任何残留调度 */
      try { if (window.__akiniKillActiveMsg) window.__akiniKillActiveMsg(); } catch (e) {}
      return;
    }
    _arm(_randomIntervalMs());
  }

  /* 设置页改间隔时 core 会调这里 */
  window._akiniRescheduleActiveMsg = manage;

  /* core 的开关点击只写 akini_toggle_*，不会重排定时器；这里补齐四个主动行为开关 */
  var WATCHED = ["contactActiveMsgToggle", "contactFriendsToggle", "contactIcityToggle", "contactMailToggle"];
  function _rearmAll() {
    if (!_toggleOn()) {
      try { if (window.__akiniKillActiveMsg) window.__akiniKillActiveMsg(); } catch (e) {}
    }
    manage();
    try { if (typeof window._akiniRescheduleFriendsPost === "function") window._akiniRescheduleFriendsPost(); } catch (e) {}
    try { if (typeof window._akiniRescheduleIcityPost === "function") window._akiniRescheduleIcityPost(); } catch (e) {}
    try { if (window.akiniMailEngine && window.akiniMailEngine.resetAutoSend) window.akiniMailEngine.resetAutoSend(); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    var sw = t && t.closest ? t.closest(".toggle-switch") : null;
    if (!sw || WATCHED.indexOf(sw.id) < 0) return;
    setTimeout(_rearmAll, 0);
  }, false);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) { _killLegacy(); manage(); }
  });

  if (window.__akiniBooted) manage();
  else {
    var waited = 0;
    var iv = setInterval(function () {
      waited += 200;
      if (window.__akiniBooted || waited > 8000) { clearInterval(iv); manage(); }
    }, 200);
  }
  /* core 启动排期的延后触发点在启动后 1.5s/4s/9s 兜底清理即可；
     启动完成后旧定时器不会复活，删除 10s 常驻轮询（回前台时由 visibilitychange 再清一次）。 */
  [1500, 4000, 9000].forEach(function (ms) { setTimeout(_killLegacy, ms); });

  window.akiniActiveEngine = { reschedule: manage, fire: _fire };
})();

;
/* ===== akini-backup.js ===== */
/**
 * Akini 备份引擎：standard-main 风格 ZIP 导出/导入
 * 把 localStorage + IndexedDB 中的数据打包成 ZIP：backup.json + media/* 二进制
 * 避免单文件巨型 JSON 无法解析，导入后再把媒体内联回 data URL。
 */
(function (global) {
  "use strict";

  var MIN_MEDIA_CHARS = 800;

  function isDataMediaUrl(s) {
    return (
      typeof s === "string" &&
      s.length > MIN_MEDIA_CHARS &&
      /^data:(image|video|audio)\//i.test(s)
    );
  }

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function dataUrlToBinary(dataUrl) {
    if (typeof dataUrl !== "string") return null;
    var m = /^data:([^,]+),([\s\S]*)$/.exec(dataUrl);
    if (!m) return null;
    var header = m[1];
    var body = m[2].replace(/\s/g, "");
    var mime = header.split(";")[0].trim();
    var isB64 = /;base64/i.test(header);
    if (isB64) {
      try {
        var binary = atob(body);
        var len = binary.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return { mime: mime, bytes: bytes };
      } catch (e) {
        return null;
      }
    }
    try {
      return {
        mime: mime,
        bytes: new TextEncoder().encode(decodeURIComponent(body)),
      };
    } catch (e2) {
      return null;
    }
  }

  function uint8ToBase64Chunked(u8) {
    var CHUNK = 0x8000;
    var str = "";
    for (var i = 0; i < u8.length; i += CHUNK) {
      str += String.fromCharCode.apply(
        null,
        u8.subarray(i, Math.min(i + CHUNK, u8.length))
      );
    }
    return btoa(str);
  }

  function binaryToDataUrl(mime, u8) {
    return (
      "data:" + (mime || "application/octet-stream") + ";base64," + uint8ToBase64Chunked(u8)
    );
  }

  function deepCloneJsonSafe(obj) {
    try {
      return JSON.parse(
        JSON.stringify(obj, function (k, v) {
          if (v instanceof Date) return v.toISOString();
          return v;
        })
      );
    } catch (e) {
      return obj;
    }
  }

  function extractMediaTree(node, state) {
    if (!state) state = { store: {}, map: new Map(), n: 0 };
    if (node === null || node === undefined) return node;
    if (typeof node === "string") {
      if (isDataMediaUrl(node)) {
        var id = state.map.get(node);
        if (!id) {
          id = "m" + state.n++;
          state.map.set(node, id);
          state.store[id] = node;
        }
        return { __mRef: id };
      }
      return node;
    }
    if (Array.isArray(node))
      return node.map(function (x) {
        return extractMediaTree(x, state);
      });
    if (typeof node === "object") {
      if (node instanceof Date) return node.toISOString();
      var out = {};
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        out[k] = extractMediaTree(node[k], state);
      }
      return out;
    }
    return node;
  }

  function inlineMediaTree(node, store) {
    if (!store) store = {};
    if (node === null || node === undefined) return node;
    if (
      typeof node === "object" &&
      !Array.isArray(node) &&
      node.__mRef &&
      typeof node.__mRef === "string"
    ) {
      var blob = store[node.__mRef];
      return blob !== undefined && blob !== null ? blob : node;
    }
    if (Array.isArray(node))
      return node.map(function (x) {
        return inlineMediaTree(x, store);
      });
    if (typeof node === "object") {
      var o = {};
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        o[k] = inlineMediaTree(node[k], store);
      }
      return o;
    }
    return node;
  }

  function processLocalStorageValueForExport(str, state) {
    if (str == null) return str;
    if (typeof str !== "string") return str;
    if (isDataMediaUrl(str)) {
      var id = state.map.get(str);
      if (!id) {
        id = "m" + state.n++;
        state.map.set(str, id);
        state.store[id] = str;
      }
      // __raw 标记该值原本是普通字符串（data URL），导入时应还原为字符串而非 JSON
      return JSON.stringify({ __mRef: id, __raw: true });
    }
    try {
      var parsed = JSON.parse(str);
      var extracted = extractMediaTree(parsed, state);
      return JSON.stringify(extracted);
    } catch (e) {
      return str;
    }
  }

  function processLocalStorageValueForImport(str, store) {
    if (str == null) return str;
    if (typeof str !== "string") return str;
    try {
      var parsed = JSON.parse(str);
      // 原本就是 data URL 字符串的值，直接还原为 data URL 字符串
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        parsed.__mRef &&
        parsed.__raw === true
      ) {
        var blob = store[parsed.__mRef];
        return blob !== undefined && blob !== null ? String(blob) : str;
      }
      return JSON.stringify(inlineMediaTree(parsed, store));
    } catch (e) {
      return str;
    }
  }

  // 派生/快照键：仅排除极少数短生命周期的临时状态键，确保所有用户自定义背景、头像、设置、字卡、信件、记录等完整导出
  function isDerivedKey(k) {
    return (
      k === "akini_ls_dirty" ||
      k === "__aktest__"
    );
  }

  // 仅问卷不支持文件导出导入，备份时排除，导入时也跳过
  // 表情包可正常导出导入；涉及前缀: akini_surveys_ / akini_survey_groups_
  function isSurveyKey(k) {
    if (!k || typeof k !== "string") return false;
    return (
      k.indexOf("akini_surveys_") === 0 ||
      k.indexOf("akini_survey_groups_") === 0
    );
  }

  function collectLocalStorageSync() {
    var data = {};
    // 1) localStorage 全量（拦截层对关键键返回内存权威值）
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || isDerivedKey(key) || isSurveyKey(key)) continue;
        try {
          var v = localStorage.getItem(key);
          if (v != null) data[key] = v;
        } catch (e) {}
      }
    } catch (e) {}
    // 2) 内存镜像补充：大键（>200KB 图片/完整聊天记录）被配额策略移出 LS，只存在内存/IDB
    try {
      if (window.akiniStore && window.akiniStore.memoryKeys && window.akiniStore.memoryGet) {
        window.akiniStore.memoryKeys().forEach(function (k) {
          if (!k || isDerivedKey(k) || isSurveyKey(k)) return;
          var mv = window.akiniStore.memoryGet(k);
          if (mv != null && mv !== "") data[k] = mv; // 内存为权威层，覆盖 LS 残留旧值
        });
      }
    } catch (e) {}
    // 3) sessionStorage 应急副本补缺（仅补缺失，不覆盖）
    try {
      for (var j = 0; j < sessionStorage.length; j++) {
        var sk = sessionStorage.key(j);
        if (!sk || sk.indexOf("akini_") !== 0 || isDerivedKey(sk) || isSurveyKey(sk)) continue;
        if (data[sk] == null || data[sk] === "") {
          var sv = sessionStorage.getItem(sk);
          if (sv != null && sv !== "") data[sk] = sv;
        }
      }
    } catch (e) {}
    return data;
  }

  function collectIndexedDB(cb) {
    if (!window._idbStore || !window._idbStore.getAll) {
      cb && cb({});
      return;
    }
    try {
      window._idbStore.getAll(function (idbData) {
        var filtered = {};
        if (idbData && typeof idbData === "object") {
          for (var k in idbData) {
            if (!Object.prototype.hasOwnProperty.call(idbData, k)) continue;
            // 只剔除派生快照键；_backup/_cache 结尾的真实数据键全量保留（可能存有唯一完整副本）
            if (isDerivedKey(k) || isSurveyKey(k)) continue;
            filtered[k] = idbData[k];
          }
        }
        cb && cb(filtered);
      });
    } catch (e) {
      cb && cb({});
    }
  }

  function buildBackupPayload(done) {
    var lsData = collectLocalStorageSync();
    collectIndexedDB(function (idbData) {
      var state = { store: {}, map: new Map(), n: 0 };
      var lsOut = {};
      for (var k in lsData) {
        if (!Object.prototype.hasOwnProperty.call(lsData, k)) continue;
        lsOut[k] = processLocalStorageValueForExport(lsData[k], state);
      }
      var idbOut = {};
      for (var k2 in idbData) {
        if (!Object.prototype.hasOwnProperty.call(idbData, k2)) continue;
        // LS/内存为运行期权威：已覆盖的键跳过 IDB 版本；IDB 独有的键（含 _backup 完整副本）全部收录
        if (lsData[k2] != null) continue;
        idbOut[k2] = processLocalStorageValueForExport(idbData[k2], state);
      }
      done({
        type: "akini-backup-v5",
        formatVersion: 5,
        appName: "Akini",
        timestamp: new Date().toISOString(),
        localStorage: lsOut,
        indexedDB: idbOut,
        mediaStore: state.store,
      });
    });
  }

  function downloadBlob(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
  }

  /* iOS Safari 会把 a[download] 的 blob: 链接当作"打开文件"来导航，
     大 JSON 直接在标签页渲染 → 内存爆掉 → 页面被系统杀掉（用户看到的"闪退"）。
     优先走 Web Share Level 2（系统分享面板，可"存储到文件"）；不支持时回退传统下载。 */
  function saveBlobSmart(blob, fileName, done) {
    try {
      var f = new File([blob], fileName, {
        type: blob.type || "application/octet-stream",
      });
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator
          .share({ files: [f], title: fileName })
          .then(function () {
            done && done();
          })
          .catch(function (e) {
            if (e && e.name === "AbortError") return; // 用户主动取消分享，不算失败
            downloadBlob(blob, fileName);
            done && done();
          });
        return;
      }
    } catch (e) {}
    downloadBlob(blob, fileName);
    done && done();
  }

  function notify(title, body, type) {
    try {
      if (window.__akiniCenterModal) {
        window.__akiniCenterModal(title, body);
      } else if (typeof showNotification === "function") {
        showNotification(body, type || "info", 3000);
      } else {
        alert(body);
      }
    } catch (e) {}
  }

  function isZipArrayBuffer(ab) {
    if (!ab || ab.byteLength < 4) return false;
    var u = new Uint8Array(ab);
    return (
      u[0] === 0x50 &&
      u[1] === 0x4b &&
      (u[2] === 0x03 || u[2] === 0x05 || u[2] === 0x07) &&
      (u[3] === 0x04 || u[3] === 0x06 || u[3] === 0x08)
    );
  }

  function parseZipBackup(ab, done, errCb) {
    if (typeof JSZip === "undefined") {
      errCb && errCb("JSZip 未加载，无法读取 ZIP 备份");
      return;
    }
    JSZip.loadAsync(ab)
      .then(function (zip) {
        var jsonFile = zip.file("backup.json");
        if (!jsonFile) {
          var names = Object.keys(zip.files).filter(function (n) {
            var e = zip.files[n];
            return e && !e.dir && /\.json$/i.test(n);
          });
          if (names.length === 1) jsonFile = zip.file(names[0]);
        }
        if (!jsonFile) {
          errCb && errCb("ZIP 内未找到 backup.json");
          return;
        }
        jsonFile
          .async("string")
          .then(function (raw) {
            if (raw.length && raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
            try {
              var data = JSON.parse(raw);
              var idx = data.mediaIndex;
              if (
                data.formatVersion === 5 &&
                data.type === "akini-backup-v5" &&
                idx &&
                typeof idx === "object"
              ) {
                var built = {};
                var ids = Object.keys(idx);
                var pending = ids.length;
                if (pending === 0) {
                  data.mediaStore = built;
                  done(data);
                  return;
                }
                ids.forEach(function (id) {
                  var meta = idx[id];
                  var path = meta && meta.path ? meta.path : "media/" + id;
                  var zf = zip.file(path);
                  if (!zf) {
                    console.warn("[AkiniBackup] ZIP 缺少媒体文件", path);
                    pending--;
                    if (pending === 0) {
                      data.mediaStore = built;
                      done(data);
                    }
                    return;
                  }
                  var mimeMeta = meta && meta.mime ? meta.mime : "application/octet-stream";
                  if (mimeMeta === "text/plain+dataurl") {
                    zf.async("string").then(function (txt) {
                      built[id] = txt;
                      pending--;
                      if (pending === 0) {
                        data.mediaStore = built;
                        done(data);
                      }
                    });
                  } else {
                    zf.async("arraybuffer").then(function (buf) {
                      built[id] = binaryToDataUrl(mimeMeta, new Uint8Array(buf));
                      pending--;
                      if (pending === 0) {
                        data.mediaStore = built;
                        done(data);
                      }
                    });
                  }
                });
              } else {
                done(data);
              }
            } catch (e) {
              errCb && errCb("备份 JSON 解析失败：" + e.message);
            }
          })
          .catch(function (e) {
            errCb && errCb("读取 backup.json 失败：" + e.message);
          });
      })
      .catch(function (e) {
        errCb && errCb("ZIP 解析失败：" + e.message);
      });
  }

  function loadBackupFromArrayBuffer(ab, done, errCb) {
    if (isZipArrayBuffer(ab)) {
      parseZipBackup(ab, done, errCb);
      return;
    }
    /* 分块解码，每块之间让出主线程；解析后释放 text 引用 */
    try {
      var u8 = new Uint8Array(ab);
      var dec = new TextDecoder("utf-8");
      var CH = 1024 * 1024, text = "";
      var i = 0;
      function stepDecode() {
        try {
          var end = Math.min(i + CH, u8.length);
          text += dec.decode(u8.subarray(i, end), { stream: true });
          i = end;
          if (i < u8.length) { setTimeout(stepDecode, 0); return; }
          text += dec.decode();
          if (text.length && text.charCodeAt(0) === 0xfeff) text = text.slice(1);
          /* 解析也放异步：巨型 JSON.parse 同样冻结主线程数百毫秒~数秒 */
          setTimeout(function () {
            try {
              var data = JSON.parse(text);
              text = ""; /* 尽早释放，降低峰值内存 */
              u8 = null; ab = null;
              done(data);
            } catch (e2) {
              text = ""; u8 = null; ab = null;
              errCb && errCb("备份解析失败：" + e2.message);
            }
          }, 30);
        } catch (e1) {
          text = ""; u8 = null; ab = null;
          errCb && errCb("备份解码失败：" + e1.message);
        }
      }
      stepDecode();
    } catch (e) {
      errCb && errCb("备份解析失败：" + e.message);
    }
  }

  function exportBackupToFile() {
    notify("备份导出", "正在生成备份文件…", "info");
    buildBackupPayload(function (payload) {
      var dateStr = new Date().toISOString().slice(0, 10);
      var fileNameZip = "akini-backup-" + dateStr + ".zip";
      /* 修复备份导出下载失败——fileNameZip 从未定义导致 ReferenceError，
         且 fallbackJson 的提前 return 让 ZIP 分支成为死代码。改为正常走 ZIP 导出，
         ZIP 失败时自动回退 JSON。 */
      if (typeof JSZip !== "undefined") {
        try {
          var zip = new JSZip();
          var store = payload.mediaStore || {};
          var mediaIndex = {};
          for (var sid in store) {
            if (!Object.prototype.hasOwnProperty.call(store, sid)) continue;
            var url = store[sid];
            var parts = dataUrlToBinary(url);
            var path = "media/" + sid;
            if (parts && parts.bytes && parts.bytes.length) {
              zip.file(path, parts.bytes, { binary: true });
              mediaIndex[sid] = { path: path, mime: parts.mime };
            } else {
              var txtPath = path + ".txt";
              zip.file(txtPath, String(url));
              mediaIndex[sid] = { path: txtPath, mime: "text/plain+dataurl" };
            }
          }
          var jsonBody = {
            type: "akini-backup-v5",
            formatVersion: 5,
            appName: payload.appName || "Akini",
            timestamp: payload.timestamp,
            localStorage: payload.localStorage,
            indexedDB: payload.indexedDB,
            mediaIndex: mediaIndex,
          };
          zip.file("backup.json", "\uFEFF" + JSON.stringify(jsonBody));
          zip
            .generateAsync({
              type: "blob",
              compression: "DEFLATE",
              compressionOptions: { level: 6 },
            })
            .then(function (zipBlob) {
              downloadBlob(zipBlob, fileNameZip);
              notify(
                "导出成功",
                "已导出 ZIP：localStorage " +
                  Object.keys(payload.localStorage).length +
                  " 项，IndexedDB " +
                  Object.keys(payload.indexedDB).length +
                  " 项",
                "success"
              );
            })
            .catch(function (e) {
              console.error("[AkiniBackup] ZIP 导出失败", e);
              fallbackJson(payload, dateStr);
            });
          return;
        } catch (zipErr) {
          console.error("[AkiniBackup] ZIP 初始化失败", zipErr);
        }
      }
      fallbackJson(payload, dateStr);
    });
  }

  function fallbackJson(payload, dateStr) {
    var fileName = "akini-backup-all-" + dateStr + ".json";
    var str = "\uFEFF" + JSON.stringify(payload);
    var blob = new Blob([str], { type: "application/json;charset=utf-8" });
    saveBlobSmart(blob, fileName, function () {
      notify(
        "导出成功",
        "已全量导出所有设置与内容（含头像、背景图、聊天、字卡、自定义文字等全部数据）",
        "success"
      );
    });
  }

  function applyBackupToStorage(data, done, errCb) {
    window._restoringData = true;
    // 放行 AkiniPersist 的 clear/removeItem 拦截，确保旧数据被真正清空
    try { window._akiniAllowRemove = true; } catch (e) {}
    // 清空内存镜像 + IDB 待写队列：旧内存值会在拦截读取时遮蔽导入的新值
    try { if (window.akiniStore && window.akiniStore.wipeMemory) window.akiniStore.wipeMemory(); } catch (e) {}
    var lsRaw = (data && data.localStorage) || {};
    var idbRaw = (data && data.indexedDB) || {};
    var mediaStore = (data && data.mediaStore) || {};
    var backupKeyCount = Object.keys(lsRaw).length + Object.keys(idbRaw).length;
    if (backupKeyCount === 0) {
      window._restoringData = false;
      try { window._akiniAllowRemove = false; } catch (e) {}
      if (errCb) errCb("备份文件为空，未导入任何数据");
      return;
    }

    // 先拍回滚快照，导入失败时可恢复
    var rollback = {};
    try {
      for (var ri = 0; ri < localStorage.length; ri++) {
        var rk = localStorage.key(ri);
        if (rk) rollback[rk] = localStorage.getItem(rk);
      }
    } catch (e) {}
    function restoreRollback() {
      try { localStorage.clear(); } catch (e) {}
      for (var k in rollback) {
        try { localStorage.setItem(k, rollback[k]); } catch (e) {}
      }
    }

    function writeAll() {
      var count = 0;
      var pending = 0;
      var finished = false;
      function finishOk() {
        if (finished) return;
        finished = true;
        // 写入完成：落盘防抖队列立即冲刷，随后恢复拦截开关并回调（由调用方刷新页面）
        try { if (window.akiniStore && window.akiniStore.flushIdb) window.akiniStore.flushIdb(); } catch (e) {}
        // 修复"导入后重启数据全没"：导入改写了 localStorage，
        // 但启动恢复会先读本地快照（含旧数据），且 IDB 防抖队列可能尚未真正落盘。
        // 强制再冲刷一次并清理旧快照键，确保重启恢复读到的是导入后的新数据。
        try {
          if (window.akiniStore && window.akiniStore.flushIdb) window.akiniStore.flushIdb();
        } catch (e) {}
        try { localStorage.removeItem("akini_localstorage_snapshot"); } catch (e) {}
        try { localStorage.removeItem("akini_localstorage_snapshot_backup"); } catch (e) {}
        try { window._akiniAllowRemove = false; } catch (e) {}
        if (done) done(count);
      }

      function tryWrite(key, value) {
        if (value === null || value === undefined) return;
        if (isDerivedKey(key)) return; // 快照/派生键不导入，运行时自动再生
        if (isSurveyKey(key)) return; // 仅问卷不支持文件导入，跳过；表情包可正常导入
        count++;
        pending++;
        // localStorage 兜底（拦截层同步镜像到内存 + IDB 队列）
        try {
          localStorage.setItem(key, value);
        } catch (e) {}
        // IndexedDB 持久化
        try {
          if (window._idbStore && window._idbStore.set) {
            window._idbStore.set(key, value, function () {
              pending--;
              if (pending === 0) finishOk();
            });
          } else {
            pending--;
          }
        } catch (e) {
          pending--;
        }
        if (pending === 0) finishOk();
      }

      /* zzzx：分批写入（每批 25 键 + setTimeout 让出主线程），
         大备份导入时页面保持响应，不再假死/被系统误杀
         含媒体内联时单键处理成本高（几百KB字符串 JSON 往返），
         自适应降批：单键均值 >60KB 时每批只写 8 键，让出主线程更频繁 */
      var _wkeys = [];
      for (var key in lsRaw) {
        if (Object.prototype.hasOwnProperty.call(lsRaw, key)) _wkeys.push([lsRaw, key]);
      }
      for (var k2 in idbRaw) {
        if (Object.prototype.hasOwnProperty.call(idbRaw, k2)) _wkeys.push([idbRaw, k2]);
      }
      var _totalChars = 0;
      try {
        _wkeys.forEach(function (p) {
          var v = p[0][p[1]];
          _totalChars += typeof v === "string" ? v.length : 200;
        });
      } catch (e) {}
      var _batchSize = _wkeys.length && (_totalChars / _wkeys.length) > 61440 ? 8 : 25;
      var _wi = 0;
      (function step() {
        var end = Math.min(_wi + _batchSize, _wkeys.length);
        for (; _wi < end; _wi++) {
          var src = _wkeys[_wi][0], kk = _wkeys[_wi][1];
          tryWrite(kk, processLocalStorageValueForImport(src[kk], mediaStore));
        }
        if (_wi < _wkeys.length) { setTimeout(step, 0); return; }
        if (pending === 0) finishOk();
      })();
    }

    // 清空旧数据（localStorage + sessionStorage + IndexedDB 三层全清，防止旧数据混入）
    try {
      localStorage.clear();
    } catch (e) {}
    try {
      sessionStorage.clear();
    } catch (e) {}
    var importFail = function (msg) {
      restoreRollback();
      window._restoringData = false;
      try { window._akiniAllowRemove = false; } catch (e) {}
      if (errCb) errCb(msg);
    };
    if (window._idbStore && window._idbStore.clearAll) {
      try {
        window._idbStore.clearAll(function () {
          try { writeAll(); } catch (e) { importFail("导入写入失败：" + e.message); }
        });
      } catch (e) {
        importFail("清空旧数据失败：" + e.message);
      }
    } else {
      try { writeAll(); } catch (e) { importFail("导入写入失败：" + e.message); }
    }
  }

  function akImportBackup(file) {
    if (!file) return;
    /* 导入全程进度提示——大文件解析/写入耗时数秒，无提示会被用户当成卡死反复点击 */
    try {
      if (window.__akiniCenterModal) {
        window.__akiniCenterModal("正在导入", "正在读取备份文件（" + (file.size / 1048576 >= 1 ? (file.size / 1048576).toFixed(1) + " MB" : Math.round(file.size / 1024) + " KB") + "），请勿离开页面…");
      } else {
        notify("正在导入", "正在读取备份文件，请稍候…", "info");
      }
    } catch (e) {}
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var ab = ev.target.result;
        loadBackupFromArrayBuffer(
          ab,
          function (data) {
            function doImport() {
              try {
                if (window.__akiniCenterModal) {
                  window.__akiniCenterModal("正在导入", "正在写入数据，完成后页面将自动刷新…");
                } else {
                  notify("正在导入", "正在写入数据，请稍候…", "info");
                }
              } catch (e) {}
              applyBackupToStorage(
                data,
                function (count) {
                  notify(
                    "导入成功",
                    "成功导入 " + count + " 项数据，页面即将刷新",
                    "success"
                  );
                  // 导入写入完成后再次强制落盘 IDB，并延后刷新确保事务提交，
                  // 防止重启时 IDB 防抖队列未落盘导致导入数据丢失
                  try { if (window.akiniStore && window.akiniStore.flushIdb) window.akiniStore.flushIdb(); } catch (e) {}
                  setTimeout(function () {
                    location.reload();
                  }, 1500);
                },
                function (err) {
                  notify("导入失败", err, "error");
                }
              );
            }
            if (window.__akiniCenterModal) {
              window.__akiniCenterModal(
                "确认导入",
                "导入将覆盖当前全部本地数据，确定继续？",
                {
                  confirm: true,
                  onClose: function (ok) {
                    if (ok) doImport();
                  },
                }
              );
            } else if (confirm("导入将覆盖当前全部本地数据，确定继续？")) {
              doImport();
            }
          },
          function (err) {
            notify("导入失败", err, "error");
          }
        );
      } catch (e) {
        notify("导入失败", e.message, "error");
      }
    };
    reader.onerror = function () {
      notify("读取失败", "文件读取失败，请重试", "error");
    };
    reader.readAsArrayBuffer(file);
  }

  global.akExportBackup = exportBackupToFile;
  global.akImportBackup = akImportBackup;
  global.__akiniBackupEngineReady = true;

  function bindBackupButtons() {
    var exp = document.getElementById("exportBackupBtn");
    var imp = document.getElementById("importBackupInput");
    if (exp) exp.addEventListener("click", exportBackupToFile);
    if (imp) {
      imp.addEventListener("change", function () {
        akImportBackup(imp.files && imp.files[0]);
        imp.value = "";
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindBackupButtons);
  } else {
    setTimeout(bindBackupButtons, 0);
  }
})(window);

;
/* ===== akini-ta-phone.js ===== */
/**
 * TA的手机 - Akini 版
 * - 小手机样式的居中弹窗
 * - 打开后首先显示「所有创建过的联系人」网格：头像在上，名字在下
 * - 点击联系人后进入该联系人的桌面，显示三个应用：聊天 / 朋友圈 / iCity
 * - 点击应用后查看 TA 自动收藏的该联系人的对应数据
 * - 收藏逻辑参考 compat ta-phone.js：系统按概率自动收藏用户发过的聊天消息与朋友圈/iCity
 * - 数据按联系人维度存储：akini_ta_phone_<contactId> = { chat:[], moments:[], icity:[] }
 */
(function () {
  'use strict';

  var CHAT_CHANCE = 0.02;           // 聊天实时收藏概率 2%
  var MOMENTS_CHANCE = 0.10;        // 朋友圈实时收藏概率 10%
  var ICITY_CHANCE = 0.10;          // iCity 实时收藏概率 10%
  var MUSIC_CHANCE = 0.10;          // 网易云收藏概率 10%
  var CHAT_HISTORY_CHANCE = 0.03;   // 历史聊天收藏概率 3%
  var MOMENTS_HISTORY_CHANCE = 0.05;// 历史朋友圈收藏概率 5%
  var ICITY_HISTORY_CHANCE = 0.05;  // 历史 iCity 收藏概率 5%
  var MUSIC_HISTORY_CHANCE = 0.05;  // 历史网易云收藏概率 5%

  // 当前查看的联系人 id
  var currentContactId = null;
  // 当前 tab：'chat' | 'moments' | 'icity'
  var currentTab = 'chat';
  var chatSortMode = 'collected';

  /* ============ 工具 ============ */
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  function formatTime(ts) {
    var d = new Date(ts || Date.now());
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function getContacts() {
    try {
      if (window.akiniContacts && typeof window.akiniContacts.getContacts === 'function') {
        return window.akiniContacts.getContacts() || [];
      }
    } catch (e) {}
    return [];
  }

  function getContactById(id) {
    var list = getContacts();
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  // 随机选择一个“创建的联系人”（排除系统 me/my），用于收藏归属
  function pickRandomCreatedContact() {
    var list = getContacts().filter(function (c) {
      return c && c.id && c.id !== 'me' && c.id !== 'my';
    });
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function avatarHtml(c, size) {
    size = size || 48;
    var av = (c && c.avatar) || '';
    var style = 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f0f0f0;flex-shrink:0;';
    /* 默认/未设头像一律用线条人像 SVG（不再用 emoji） */
    var _badAv = av && /^(null|undefined|nan)$/i.test(String(av).trim());
    var isDef = !av || _badAv || (window.__akiniIsDefAv && window.__akiniIsDefAv(av));
    if (isDef && window.__akiniLineAvatarImg) {
      return '<div style="' + style + '">' + window.__akiniLineAvatarImg() + '</div>';
    }
    if (typeof av === 'string' && av.indexOf('data:') === 0) {
      return '<div style="' + style + '"><img src="' + av + '" style="width:100%;height:100%;object-fit:cover;" alt="头像"/></div>';
    }
    return '<div style="' + style + '">' + (window.__akiniLineAvatarImg ? window.__akiniLineAvatarImg() : '') + '</div>';
  }

  /* ============ 收藏存储（按联系人维度） ============ */
  function storageKey(contactId) { return 'akini_ta_phone_' + contactId; }

  var _colCache = {};
  function loadCollections(contactId) {
    if (_colCache[contactId]) return _colCache[contactId];
    try {
      // 统一走 akiniStore（内存缓存+IDB+localStorage），与朋友圈数据持久化逻辑一致
      var saved = window.akiniStore && window.akiniStore.getSync
        ? window.akiniStore.getSync(storageKey(contactId), null)
        : localStorage.getItem(storageKey(contactId));
      if (saved && typeof saved === 'string') {
        var parsed = JSON.parse(saved);
        _colCache[contactId] = {
          chat: Array.isArray(parsed.chat) ? parsed.chat : [],
          moments: Array.isArray(parsed.moments) ? parsed.moments : [],
          icity: Array.isArray(parsed.icity) ? parsed.icity : [],
          music: Array.isArray(parsed.music) ? parsed.music : [],
          calls: Array.isArray(parsed.calls) ? parsed.calls : []
        };
        return _colCache[contactId];
      }
    } catch (e) {}
    _colCache[contactId] = _colCache[contactId] || { chat: [], moments: [], icity: [], music: [], calls: [] };
    return _colCache[contactId];
  }

  function saveCollections(contactId, data) {
    var n = JSON.stringify(data);
    if (window.akiniStore && window.akiniStore.set) {
      window.akiniStore.set(storageKey(contactId), n);
    } else {
      try { localStorage.setItem(storageKey(contactId), n); } catch (e) {}
    }
  }

  /* 从字卡库随机抽一张字卡作为收藏备注 */
  function pickWordcardRemark() {
    try {
      var raw = localStorage.getItem('akini_wordbank');
      var wb = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(wb)) return '';
      wb = wb.filter(function (t) { return t && (!t.tab || t.tab === 'main') && String(t.text || t.content || '').trim(); });
      if (!wb.length) return '';
      var c = wb[Math.floor(Math.random() * wb.length)];
      return String(c.text || c.content || '').trim();
    } catch (e) { return ''; }
  }

  /* 通话记录不再存进"收藏"键（akini_ta_phone_<id>.calls），改存独立键 akini_ta_calls_<id>。
   用户反馈"通话记录不是收藏"——之前通话记录混进收藏数据结构，导致通话 tab 显示的是收藏而非全量通话记录 */
function _callKey(contactId) { return 'akini_ta_calls_' + contactId; }
function loadCallRecords(contactId) {
    try {
      var raw = window.akiniStore && window.akiniStore.getSync ? window.akiniStore.getSync(_callKey(contactId), null) : localStorage.getItem(_callKey(contactId));
      if (raw && typeof raw === 'string') { var p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
    } catch (e) {}
    return [];
  }
  function saveCallRecords(contactId, list) {
    try {
      var n = JSON.stringify(list || []);
      if (window.akiniStore && window.akiniStore.set) { window.akiniStore.set(_callKey(contactId), n); }
      else { try { localStorage.setItem(_callKey(contactId), n); } catch (e) {} }
    } catch (e) {}
  }
function addCallRecord(contactId, record) {
    if (!contactId || !record) return false;
    try {
      /* core 的某条接听链路不记录通话开始时间，挂断时会用 0 作起点，
         算出的时长是几百万分钟；用接听时刻重算，保证记录可信。 */
      var sec = Number(record.durationSec);
      if (!isFinite(sec) || sec > 86400) {
        sec = _callAnswerAt ? Math.max(0, Math.round((Date.now() - _callAnswerAt) / 1000)) : 0;
        if (sec > 86400) sec = 0;
        record.duration = (sec >= 60 ? String(Math.floor(sec / 60)).padStart(2, '0') + ':' : '00:') +
          String(sec % 60).padStart(2, '0');
        record.durationSec = sec;
      }
      _callAnswerAt = 0;
      var list = loadCallRecords(contactId);
      var data = { calls: list };
      var item = {
        id: Date.now() + Math.random(),
        duration: record.duration || '00:00',
        durationSec: record.durationSec || 0,
        avatar: record.avatar || '',
        name: record.name || 'TA',
        endTime: record.endTime || Date.now()
      };
      list.unshift(item);
      saveCallRecords(contactId, list);
      // 若当前正停留在该联系人的通话记录界面，立即无缝刷新
      if (currentContactId === contactId && currentTab === 'calls') {
        renderList();
      }
      return true;
    } catch (e) {
      console.warn('[TA手机] 添加通话记录失败', e);
      return false;
    }
  }

  /* 卡片类消息没有可读的正文：按气泡类型归一成【标签】。
     否则 textContent 会把整张卡片（题目/选项/时长/按钮文案）拼成一大块垃圾文本。 */
  function collectionCardLabel(bubble) {
    if (!bubble || !bubble.classList) return '';
    var c = bubble.classList;
    if (c.contains('survey-bubble')) return '【问卷】';
    if (c.contains('music-invite-bubble')) return '【一起听邀请】';
    if (c.contains('music-end-bubble')) return '【一起听总结】';
    if (c.contains('transfer-bubble')) return '【转账】';
    if (c.contains('redpacket-bubble')) return '【红包】';
    if (c.contains('shop-card-bubble')) {
      var t = (bubble.textContent || '').trim();
      return t.indexOf('代付') >= 0 ? '【物品代付】' : '【物品赠送】';
    }
    if (c.contains('sticker-bubble')) return '【表情包】';
    if (bubble.querySelector('img') && !(bubble.textContent || '').trim()) return '【图片】';
    return '';
  }

  function addCollection(contactId, type, content, originalTime, images) {
    if (!content || !content.trim()) return false;
    /* 严格归属到传入的联系人：微信消息只收藏对应窗口的，朋友圈/iCity/网易云各自独立收藏 */
    var targetId = contactId;
    if (!targetId) return false;
    var data = loadCollections(targetId);
    var dup = false;
    for (var i = 0; i < data[type].length; i++) {
      if (data[type][i].content === content.trim() && data[type][i].originalTime === originalTime) { dup = true; break; }
    }
    if (dup) return false;
    var item = {
      id: Date.now() + Math.random(),
      content: content.trim(),
      remark: pickWordcardRemark(),
      originalTime: originalTime || Date.now(),
      collectedTime: Date.now()
    };
    if (images && images.length) item.images = images.slice(0, 9);
    data[type].unshift(item);
    saveCollections(targetId, data);
    return true;
  }

  window.akiniTaPhoneCollectChat = function (contactId, text, timestamp) {
    if (!contactId || !text || !text.trim()) return;
    if (Math.random() < CHAT_CHANCE) addCollection(contactId, 'chat', text.trim(), timestamp || Date.now());
  };

  /* 统一按 DOM 行收藏：仅收藏我发的【纯文字】消息。
     转账、红包、问卷、一起听、物品、表情包、图片等卡片/富媒体一律不收。
     在 core.js 的 tt() 追加 .msg-row.me 后调用。 */
  window.__akiniTaPhoneCollectRows = function (contactId, container) {
    if (!contactId || !container || !container.querySelectorAll) return;
    var rows = container.querySelectorAll('.msg-row.me');
    if (!rows || !rows.length) return;
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      var bubble = row.querySelector('.bubble');
      if (!bubble) continue;
      // 卡片类消息（问卷/一起听/转账/红包/物品/表情包）一律跳过
      if (collectionCardLabel(bubble)) continue;
      // 含图片的消息（图片消息、图文消息）一律跳过
      var imgs = bubble.querySelectorAll('img');
      if (imgs && imgs.length) continue;
      var text = (bubble.textContent || '').trim();
      if (!text) continue;
      var ts = Date.now();
      try {
        var tAttr = row.getAttribute('data-ts') || bubble.getAttribute('data-ts');
        if (tAttr) { var p = parseInt(tAttr, 10); if (p && !isNaN(p)) ts = p; }
      } catch (e) {}
      if (Math.random() < CHAT_CHANCE) {
        addCollection(contactId, 'chat', text, ts);
      }
    }
  };

  window.akiniTaPhoneCollectMoment = function (contactId, text, timestamp, images) {
    if (!contactId || !text || !String(text).trim()) return;
    if (Math.random() < MOMENTS_CHANCE) addCollection(contactId, 'moments', String(text).trim(), timestamp || Date.now(), images);
  };

  window.akiniTaPhoneCollectIcity = function (contactId, text, timestamp, images) {
    if (!contactId || !text || !String(text).trim()) return;
    if (Math.random() < ICITY_CHANCE) addCollection(contactId, 'icity', String(text).trim(), timestamp || Date.now(), images);
  };

  // 联系人收藏用户添加的歌曲：track = {title, artist, cover, ...}
  function addMusicCollection(contactId, track, originalTime) {
    if (!track || !(track.title || track.name)) return false;
    var targetId = contactId;
    if (!targetId) return false;
    var data = loadCollections(targetId);
    var title = String(track.title || track.name || '').trim();
    var artist = String(track.artist || track.singer || '').trim();
    var cover = track.cover || track.pic || '';
    for (var i = 0; i < data.music.length; i++) {
      var it = data.music[i];
      if (it && it.track && it.track.title === title && it.track.artist === artist) return false;
    }
    data.music.unshift({
      id: Date.now() + Math.random(),
      track: { title: title, artist: artist, cover: cover },
      remark: pickWordcardRemark(),
      originalTime: originalTime || Date.now(),
      collectedTime: Date.now()
    });
    saveCollections(targetId, data);
    return true;
  }

  window.akiniTaPhoneCollectMusic = function (track, timestamp) {
    if (!track) return;
    /* 每个联系人独立判定是否收藏（各自 10% 概率），收藏到各自的手机 */
    var all = getContacts();
    for (var i = 0; i < all.length; i++) {
      if (all[i] && all[i].id && Math.random() < MUSIC_CHANCE)
        addMusicCollection(all[i].id, track, timestamp || Date.now());
    }
  };

  var _lastScanAt = 0;
  function scanHistory() {
    /* 节流：30 分钟内最多全量扫描一次，避免频繁打开 TA 手机时反复解析全部聊天 DOM 导致卡顿 */
    var now = Date.now();
    if (now - _lastScanAt < 30 * 60 * 1000) return;
    _lastScanAt = now;
    try {
      var contacts = getContacts();
      if (window.akiniContacts && typeof window.akiniContacts.getChatTarget === 'function') {
        contacts.forEach(function (c) {
          if (!c || !c.id) return;
          var target = window.akiniContacts.getChatTarget(c.id);
          if (!target || target.type !== 'contact') return;
          var session = window.akiniContacts.getSession(c.id);
          var html = session && session.messagesHTML ? session.messagesHTML : '';
          if (!html) return;
          var tmp = document.createElement('div');
          tmp.innerHTML = html;
          var meRows = tmp.querySelectorAll('.msg-row.me');
          /* 只收藏该联系人自己窗口的消息；每次扫描每人最多 1 条（从最新往旧，命中即停） */
          for (var ri = meRows.length - 1; ri >= 0; ri--) {
            var bubble = meRows[ri].querySelector('.bubble');
            if (!bubble) continue;
            /* 卡片消息收藏成【问卷】/【一起听邀请】等标签，纯文本消息才收藏正文 */
            var text = collectionCardLabel(bubble) || (bubble.textContent || '').trim();
            if (!text) continue;
            if (Math.random() < CHAT_HISTORY_CHANCE) { addCollection(c.id, 'chat', text, Date.now()); break; }
          }
        });
      }
      var posts = (typeof window.__akiniGetPosts === 'function') ? window.__akiniGetPosts() : [];
      var myPosts = [], myDiaries = [];
      if (Array.isArray(posts)) {
        var myName = localStorage.getItem('akini_my_name') || '我';
        posts.forEach(function (post) {
          if (!post || !post.text || !post.text.trim()) return;
          if (post.author && post.author !== myName) return;
          if (post.source === 'icity') myDiaries.push(post); else myPosts.push(post);
        });
      }
      var plist = [];
      try {
        var plistRaw = (window.akiniStore && window.akiniStore.getSync)
          ? window.akiniStore.getSync('akini_music_playlist', null)
          : localStorage.getItem('akini_music_playlist');
        plist = plistRaw ? JSON.parse(plistRaw) : [];
      } catch (e) {}
      if (!Array.isArray(plist)) plist = [];
      /* 朋友圈/iCity/网易云：每个联系人独立判定、各自收藏到自己的手机；
         每类每次扫描最多 1 条（从最新往旧扫，命中即停），不会一口气收藏一堆 */
      contacts.forEach(function (c) {
        if (!c || !c.id) return;
        for (var mi = myPosts.length - 1; mi >= 0; mi--) {
          if (Math.random() < MOMENTS_HISTORY_CHANCE) { addCollection(c.id, 'moments', myPosts[mi].text, myPosts[mi].ts || Date.now()); break; }
        }
        for (var di = myDiaries.length - 1; di >= 0; di--) {
          if (Math.random() < ICITY_HISTORY_CHANCE) { addCollection(c.id, 'icity', myDiaries[di].text, myDiaries[di].ts || Date.now()); break; }
        }
        for (var si = plist.length - 1; si >= 0; si--) {
          var t = plist[si];
          if (!t || !(t.title || t.name)) continue;
          if (Math.random() < MUSIC_HISTORY_CHANCE) { addMusicCollection(c.id, t, Date.now()); break; }
        }
      });
    } catch (e) {}
  }

  /* ============ 渲染 ============ */
  function getEl(id) { return document.getElementById(id); }

  var _statusBarTimer = null;
  var _batteryInstance = null;

  function applyDeviceBattery(level) {
    try {
      var levelEl = getEl('akiniTaPhoneBatLevel');
      if (!levelEl) return;
      var num = (typeof level === 'number' && !isNaN(level)) ? level : 0.9;
      var pct = Math.max(8, Math.min(100, Math.round(num * 100)));
      levelEl.style.width = pct + '%';
    } catch(e) {}
  }

  function syncBatteryOnce() {
    try {
      if (typeof navigator !== 'undefined' && navigator.getBattery) {
        navigator.getBattery().then(function(b) {
          _batteryInstance = b;
          applyDeviceBattery(b.level);
          b.onlevelchange = function() {
            applyDeviceBattery(b.level);
          };
        }).catch(function() {
          applyDeviceBattery(0.9);
        });
      } else {
        applyDeviceBattery(0.9);
      }
    } catch(e) {
      applyDeviceBattery(0.9);
    }
  }

  function updateStatusBar() {
    try {
      var timeEl = getEl('akiniTaPhoneTime');
      if (timeEl) {
        var d = new Date();
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        timeEl.textContent = hh + ':' + mm;
      }
      if (_batteryInstance && typeof _batteryInstance.level === 'number') {
        applyDeviceBattery(_batteryInstance.level);
      } else {
        syncBatteryOnce();
      }
    } catch(e) {}
  }

  function showContainer() {
    var c = getEl('akini-ta-phone-container');
    if (!c) {
      try { init(); } catch (e) { console.error('[TA手机] init失败', e); }
      c = getEl('akini-ta-phone-container');
    }
    if (!c) { console.warn('[TA手机] 容器注入失败'); return; }
    if (c.parentElement !== document.body) document.body.appendChild(c);
    c.style.display = 'flex';
    var _dc = window.__akiniDefaultContact && window.__akiniDefaultContact();
    if (_dc && _dc.id) { openContact(_dc.id); } else { showContactGrid(); }
    updateStatusBar();
    if (_statusBarTimer) clearTimeout(_statusBarTimer);
    /* 状态栏只显示分钟级时间，按"下一分钟边界"自续期 setTimeout：
       每分钟只醒一次，远比 5s 轮询省电；后台（document.hidden）自动暂停。 */
    _statusBarTimer = null;
    function _tickStatusBar() {
      _statusBarTimer = null;
      try { if (!document.hidden) updateStatusBar(); } catch (e) {}
      var now = new Date();
      var delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      if (delay < 1000) delay += 60000;
      _statusBarTimer = setTimeout(_tickStatusBar, delay);
    }
    _tickStatusBar();
  }

  function hideContainer() {
    var c = getEl('akini-ta-phone-container');
    if (c) c.style.display = 'none';
    if (_statusBarTimer) {
      clearTimeout(_statusBarTimer);
      _statusBarTimer = null;
    }
  }

  function hideAllViews() {
    var grid = getEl('akini-ta-phone-contact-grid');
    var desktop = getEl('akini-ta-phone-desktop');
    var listView = getEl('akini-ta-phone-list-view');
    if (grid) grid.style.display = 'none';
    if (desktop) desktop.style.display = 'none';
    if (listView) listView.style.display = 'none';
  }

  function showContactGrid() {
    hideAllViews();
    var grid = getEl('akini-ta-phone-contact-grid');
    if (grid) { grid.style.display = 'flex'; updateTitle('TA的手机'); renderContactGrid(); }
  }

  function openContact(contactId) {
    currentContactId = contactId;
    hideAllViews();
    var desktop = getEl('akini-ta-phone-desktop');
    if (desktop) desktop.style.display = 'flex';
    var c = getContactById(contactId);
    updateTitle((c && c.name && !/^(null|undefined|nan)$/i.test(String(c.name).trim())) ? c.name : 'TA的手机');
  }

  function showApp(tab) {
    if (!currentContactId) return;
    currentTab = tab;
    hideAllViews();
    var listView = getEl('akini-ta-phone-list-view');
    if (listView) listView.style.display = 'flex';
    var c = getContactById(currentContactId);
    var _cname = (c && c.name && !/^(null|undefined|nan)$/i.test(String(c.name).trim())) ? c.name + ' · ' : '';
    var tabTitle = '收藏';
    if (tab === 'chat') tabTitle = '聊天';
    else if (tab === 'moments') tabTitle = '朋友圈';
    else if (tab === 'music') tabTitle = '网易云';
    else if (tab === 'icity') tabTitle = 'iCity';
    else if (tab === 'calls') tabTitle = '通话记录';
    updateTitle(_cname + tabTitle);
    renderList();
  }

  function goBack() {
    var listView = getEl('akini-ta-phone-list-view');
    var desktop = getEl('akini-ta-phone-desktop');
    if (listView && listView.style.display !== 'none') {
      hideAllViews();
      if (desktop) desktop.style.display = 'flex';
      var c = getContactById(currentContactId);
      updateTitle((c && c.name && !/^(null|undefined|nan)$/i.test(String(c.name).trim())) ? c.name : 'TA的手机');
    } else if (desktop && desktop.style.display !== 'none') {
      hideContainer();
      currentContactId = null;
    } else {
      hideContainer();
      currentContactId = null;
    }
  }

  function updateTitle(text) {
    var el = getEl('akini-ta-phone-title');
    if (el) el.textContent = text;
  }

  function renderContactGrid() {
    var el = getEl('akini-ta-phone-contact-grid');
    if (!el) return;
    var contacts = getContacts();
    if (!contacts.length) {
      el.innerHTML = '<div class="akini-ta-phone-empty">还没有联系人，快去创建吧~</div>';
      return;
    }
    el.innerHTML = contacts.map(function (c) {
      return '<div class="akini-ta-phone-grid-item" onclick="window.AkiniTaPhone.openContact(\'' + c.id + '\')">' +
        avatarHtml(c, 56) +
        '<div class="akini-ta-phone-grid-name">' + escapeHtml(c.name || '联系人') + '</div>' +
      '</div>';
    }).join('');
  }

  function renderList() {
    var el = getEl('akini-ta-phone-list');
    if (!el || !currentContactId) return;
    var data = loadCollections(currentContactId);
    /* 通话记录走独立键（全量），其余 tab 仍读收藏数据 */
    var items = (currentTab === 'calls') ? loadCallRecords(currentContactId) : (data[currentTab] || []);
    var sortBar = getEl('akini-ta-phone-sort-bar');
    if (sortBar) sortBar.style.display = currentTab === 'chat' ? 'flex' : 'none';
    if (!items.length) {
      el.innerHTML = '<div class="akini-ta-phone-empty">' + (currentTab === 'calls' ? '暂无通话记录...' : 'TA 还没有收藏任何内容...') + '</div>';
      return;
    }
    /* 无备注的旧条目现场从字卡库补一张并持久化 */
    var needSave = false;
    items.forEach(function (it) {
      if (it && !it.remark) {
        var r = pickWordcardRemark();
        if (r) { it.remark = r; needSave = true; }
      }
    });
    if (needSave) saveCollections(currentContactId, data);
    var sorted = items.slice();
    // 所有数据统一按收藏时间倒序排列
    sorted.sort(function (a, b) { return (b.collectedTime || 0) - (a.collectedTime || 0); });
    if (currentTab === 'calls') {
      if (!items.length) {
        el.innerHTML = '<div class="akini-ta-phone-empty">暂无通话记录...</div>';
        return;
      }
      var sortedCalls = items.slice();
      sortedCalls.sort(function (a, b) { return (b.endTime || 0) - (a.endTime || 0); });
      /* 汇总：通话次数 + 通话累计时长（样板字段） */
      var _callCount = sortedCalls.length;
      var _totalSec = 0;
      sortedCalls.forEach(function (it) {
        var ds = Number(it && it.durationSec);
        if (!isFinite(ds) || ds < 0) {
          var parts = String((it && it.duration) || '00:00').split(':');
          if (parts.length === 2) ds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          else if (parts.length === 3) ds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
          else ds = 0;
        }
        if (isFinite(ds) && ds > 0) _totalSec += Math.min(ds, 86400);
      });
      var _th = Math.floor(_totalSec / 3600);
      var _tm = Math.floor((_totalSec % 3600) / 60);
      var _ts = _totalSec % 60;
      var _totalDur = (_th > 0 ? String(_th).padStart(2, '0') + ':' : '') + String(_tm).padStart(2, '0') + ':' + String(_ts).padStart(2, '0');
      var defAvatarHtml = (window.__akiniLineAvatarImg && typeof window.__akiniLineAvatarImg === 'function')
        ? window.__akiniLineAvatarImg()
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      /* 通话记录渲染：头像优先用 item.avatar（挂断时 core 已经把联系人头像塞进来），
         其次回落到当前联系人的头像，最后才用默认占位 SVG。之前 avBox 写死 defAvatarHtml，
         导致通话记录页头像永远显示默认占位。 */
      var _curContact = currentContactId ? getContactById(currentContactId) : null;
      var _curAvatar = (_curContact && _curContact.avatar) ? String(_curContact.avatar).trim() : '';
      el.innerHTML =
        '<div class="akini-ta-phone-call-summary" style="display:flex;gap:12px;margin-bottom:12px;">' +
          '<div style="flex:1;background:#f5f5f5;border:1px solid #e5e5e5;border-radius:12px;padding:12px 14px;text-align:center;">' +
            '<div style="font-size:11px;color:#888;margin-bottom:4px;">通话次数</div>' +
            '<div style="font-size:20px;font-weight:700;color:#111;">' + _callCount + ' 次</div>' +
          '</div>' +
          '<div style="flex:1;background:#f5f5f5;border:1px solid #e5e5e5;border-radius:12px;padding:12px 14px;text-align:center;">' +
            '<div style="font-size:11px;color:#888;margin-bottom:4px;">通话累计时长</div>' +
            '<div style="font-size:20px;font-weight:700;color:#111;">' + _totalDur + '</div>' +
          '</div>' +
        '</div>' +
        sortedCalls.map(function (item) {
        var _av = (item && item.avatar) ? String(item.avatar).trim() : '';
        if (!_av || /^(null|undefined|nan)$/i.test(_av)) _av = _curAvatar;
        var avBox;
        if (!_av || /^(null|undefined|nan)$/i.test(String(_av).trim())) {
          avBox = defAvatarHtml;
        } else {
          avBox = '<img src=' + "'" + escapeHtml(_av) + "'" + ' style=' + "'" + 'width:100%;height:100%;object-fit:cover;display:block;' + "'" + ' onerror=' + "'" + 'this.remove();' + "'" + '/>';
        }
        return '<div class="akini-ta-phone-item akini-ta-phone-call-item" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#f9f9f9;border-radius:14px;margin-bottom:10px;">' +
          '<div style="width:48px;height:48px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">' + avBox + '</div>' +
          '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">' +
            '<div style="font-size:15px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.name || 'TA') + '</div>' +
            '<div style="font-size:13px;color:#111;display:flex;align-items:center;gap:5px;">' +
              '<svg fill="none" height="15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="15" style="color:#111;flex-shrink:0;"><path d="m22 8-6 4 6 4V8Z"/><rect height="12" rx="2" width="14" x="2" y="6"/></svg>' +
              '<span style="color:#111;">通话时长 ' + escapeHtml(item.duration || '00:00') + '</span>' +
            '</div>' +
            '<div style="font-size:11px;color:#999;margin-top:2px;">' + formatTime(item.endTime) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      return;
    }
    if (currentTab === 'music') {
      el.innerHTML = sorted.map(function (item) {
        var t = item.track || {};
        var cover = t.cover
          ? '<img src="' + t.cover + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="封面"/>'
          : '<span style="font-size:20px;line-height:1;">🎵</span>';
        return '<div class="akini-ta-phone-item akini-ta-phone-music-item">' +
          '<button class="akini-ta-phone-item-delete" onclick="window.AkiniTaPhone.deleteCollection(\'' + currentContactId + '\',\'music\',' + item.id + ')" title="删除">×</button>' +
          '<div class="akini-ta-phone-music-row">' +
            '<div class="akini-ta-phone-music-disc">' + cover + '</div>' +
            '<div class="akini-ta-phone-music-meta">' +
              '<div class="akini-ta-phone-music-title">' + escapeHtml(t.title || '未知歌曲') + '</div>' +
              '<div class="akini-ta-phone-music-artist">' + escapeHtml(t.artist || '未知歌手') + '</div>' +
            '</div>' +
          '</div>' +
          (item.remark ? '<div class="akini-ta-phone-item-remark">备注：' + escapeHtml(item.remark) + '</div>' : '') +
          '<div class="akini-ta-phone-item-meta">收藏于: ' + formatTime(item.collectedTime) + '</div>' +
        '</div>';
      }).join('');
      return;
    }
    el.innerHTML = sorted.map(function (item) {
      /* 卡片类收藏只存了【问卷】/【一起听邀请】这类标签，用轻量 chip 展示，不再铺一大块正文 */
      var _content = String(item.content || '').trim();
      var _isCard = /^【[^】]{1,8}】$/.test(_content);
      return '<div class="akini-ta-phone-item">' +
        '<button class="akini-ta-phone-item-delete" onclick="window.AkiniTaPhone.deleteCollection(\'' + currentContactId + '\',\'' + currentTab + '\',' + item.id + ')" title="删除">×</button>' +
        '<div class="akini-ta-phone-item-time">' + formatTime(item.originalTime) + '</div>' +
        (_isCard
          ? '<div class="akini-ta-phone-item-cardtag">' + escapeHtml(_content) + '</div>'
          : '<div class="akini-ta-phone-item-text">' + escapeHtml(item.content) + '</div>') +
        (item.images && item.images.length
          ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' + item.images.map(function (im) {
              return '<img src="' + String(im).replace(/"/g, '&quot;') + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px;background:#eee" alt=""/>';
            }).join('') + '</div>'
          : '') +
        (item.remark ? '<div class="akini-ta-phone-item-remark">备注：' + escapeHtml(item.remark) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function deleteCollection(contactId, type, id) {
    window.__akiniCenterModal('是否要偷偷取消 TA 的收藏？', '', {
      confirm: true, okText: '好', cancelText: '取消',
      onClose: function (ok) {
        if (!ok) return;
        var data = loadCollections(contactId);
        data[type] = data[type].filter(function (item) { return item.id !== id; });
        saveCollections(contactId, data);
        renderList();
      }
    });
  }

  /* ============ 样式注入 ============ */
  function injectStyles() {
    if (getEl('akini-ta-phone-styles')) return;
    var style = document.createElement('style');
    style.id = 'akini-ta-phone-styles';
    style.textContent = [
      // 遮罩：浅灰色
      '.akini-ta-phone-container{position:fixed!important;inset:0!important;z-index:5500!important;display:flex;align-items:center;justify-content:center;background:rgba(245,245,245,0.92)!important;}',
      // 竖屏小手机外观
      '.akini-ta-phone-modal{width:min(76vw,340px);height:min(78vh,680px);max-height:680px;background:#fff;border-radius:44px;overflow:hidden;box-shadow:0 25px 70px rgba(0,0,0,0.22);display:flex;flex-direction:column;border:10px solid #111;}',
      // 灵动岛
      // 拟真状态栏与灵动岛
      '.akini-ta-phone-statusbar{display:flex;align-items:center;justify-content:space-between;padding:10px 18px 4px;width:100%;box-sizing:border-box;flex-shrink:0;user-select:none;}',
      '.akini-ta-phone-sb-left{flex:1;display:flex;align-items:center;justify-content:flex-start;min-width:0;}',
      '.akini-ta-phone-time{font-size:14.5px;font-weight:700;color:#000;letter-spacing:-0.3px;font-variant-numeric:tabular-nums;line-height:1;}',
      '.akini-ta-phone-notch{width:78px;height:23px;background:#000;border-radius:12px;flex-shrink:0;margin:0 4px;}',
      '.akini-ta-phone-sb-right{flex:1;display:flex;align-items:center;justify-content:flex-end;gap:7px;min-width:0;}',
      '.akini-ta-phone-signal{display:flex;align-items:flex-end;gap:2px;height:12px;padding-bottom:1px;}',
      '.akini-ta-phone-signal .bar{width:3px;background:#000;border-radius:0.8px;}',
      '.akini-ta-phone-signal .bar-1{height:3.5px;}',
      '.akini-ta-phone-signal .bar-2{height:6.2px;}',
      '.akini-ta-phone-signal .bar-3{height:9px;}',
      '.akini-ta-phone-signal .bar-4{height:12px;}',
      '.akini-ta-phone-battery-wrap{display:flex;align-items:center;}',
      '.akini-ta-phone-battery{width:22px;height:11.5px;border:1.6px solid #000;border-radius:3.8px;padding:1.2px;position:relative;display:flex;align-items:center;box-sizing:border-box;}',
      '.akini-ta-phone-battery::after{content:\'\';position:absolute;right:-2.8px;top:2.2px;width:1.6px;height:4.2px;background:#000;border-radius:0 1.2px 1.2px 0;}',
      '.akini-ta-phone-battery-level{height:100%;background:#000;border-radius:1.8px;transition:width 0.3s;}',
      '.akini-ta-phone-header{background:transparent;display:flex;align-items:center;justify-content:space-between;padding:8px 14px 10px;flex-shrink:0;}',
      '.akini-ta-phone-back{background:none;border:none;color:#999;font-size:24px;cursor:pointer;font-weight:400;line-height:1;padding:0 4px;}',
      '.akini-ta-phone-back:active{opacity:0.6;}',
      '.akini-ta-phone-title{font-size:15px;font-weight:600;color:#111;flex:1;text-align:center;}',
      // 联系人网格（首页图标风格）
      '.akini-ta-phone-contact-grid{display:none;flex:1;overflow-y:auto;padding:24px 16px 16px;gap:22px 16px;flex-wrap:wrap;align-content:flex-start;justify-content:center;background:#fff;}',
      '.akini-ta-phone-grid-item{display:flex;flex-direction:column;align-items:center;gap:7px;width:64px;cursor:pointer;}',
      '.akini-ta-phone-grid-item:active{opacity:0.7;}',
      '.akini-ta-phone-grid-name{font-size:12px;color:#666;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;}',
      // 联系人桌面（三个应用图标）
      '.akini-ta-phone-desktop{display:none;justify-content:flex-start;align-items:flex-start;flex-wrap:wrap;gap:26px 6%;padding:40px 24px;flex:1;background:#fff;align-content:flex-start;}',
      '.akini-ta-phone-app{display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;width:27%;flex-shrink:0;}',
      '.akini-ta-phone-app:active{opacity:0.7;}',
      '.akini-ta-phone-app-icon{width:56px;height:56px;display:flex;align-items:center;justify-content:center;color:#666;}',
      '.akini-ta-phone-app-icon svg{width:100%;height:100%;}',
      '.akini-ta-phone-app-name{font-size:12px;color:#666;}',
      // 列表视图
      '.akini-ta-phone-list-view{display:none;flex-direction:column;flex:1;min-height:0;overflow:hidden;background:#fff;}',
      '.akini-ta-phone-list{flex:1;overflow-y:auto;padding:12px 12px 16px;}',
      '.akini-ta-phone-list .akini-ta-phone-empty{padding-top:60px;}',
      '.akini-ta-phone-item{background:#f7f7f7;border-radius:12px;padding:12px;margin-bottom:8px;position:relative;}',
      '.akini-ta-phone-item-time{font-size:12px;color:#999;margin-bottom:4px;}',
      '.akini-ta-phone-item-text{font-size:14px;color:#111;line-height:1.5;word-break:break-all;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}',
      '.akini-ta-phone-item-cardtag{display:inline-block;font-size:12px;color:#333;background:#ededed;border-radius:6px;padding:3px 8px;line-height:1.4;}',
      '.akini-ta-phone-item-meta{font-size:11px;color:#bbb;margin-top:4px;}',
      '.akini-ta-phone-item-remark{font-size:12px;color:#999;margin-top:6px;line-height:1.5;word-break:break-word;}',
      '.akini-ta-phone-item-delete{position:absolute;top:8px;right:8px;background:none;border:none;color:#ccc;font-size:18px;cursor:pointer;line-height:1;}',
      '.akini-ta-phone-item-delete:hover{color:#ef4444;}',
      '.akini-ta-phone-empty{text-align:center;padding:40px 20px;color:#bbb;font-size:14px;}',
      '.akini-ta-phone-music-row{display:flex;align-items:center;gap:10px;padding-right:18px;}',
      '.akini-ta-phone-music-disc{width:44px;height:44px;flex-shrink:0;border-radius:50%;background:repeating-radial-gradient(#111 0,#111 3px,#222 4px,#222 5px);box-shadow:inset 0 0 0 4px #1a1a1a;display:flex;align-items:center;justify-content:center;overflow:hidden;}',
      '.akini-ta-phone-music-meta{min-width:0;flex:1;}',
      '.akini-ta-phone-music-title{font-size:14px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.akini-ta-phone-music-artist{font-size:12px;color:#888;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      ''
    ].join('');
    document.head.appendChild(style);
  }

  /* ============ DOM 注入 ============ */
  function injectDOM() {
    if (getEl('akini-ta-phone-container')) return;
    var container = document.createElement('div');
    container.id = 'akini-ta-phone-container';
    container.className = 'akini-ta-phone-container';
    container.style.display = 'none';
    container.onclick = function(e) {
      if (e.target === container) { hideContainer(); }
    };
    container.innerHTML =
      '<div class="akini-ta-phone-modal">' +
        '<div class="akini-ta-phone-statusbar">' +
          '<div class="akini-ta-phone-sb-left">' +
            '<span class="akini-ta-phone-time" id="akiniTaPhoneTime">14:52</span>' +
          '</div>' +
          '<div class="akini-ta-phone-notch"></div>' +
          '<div class="akini-ta-phone-sb-right">' +
            '<div class="akini-ta-phone-signal" title="蜂窝信号">' +
              '<span class="bar bar-1"></span>' +
              '<span class="bar bar-2"></span>' +
              '<span class="bar bar-3"></span>' +
              '<span class="bar bar-4"></span>' +
            '</div>' +
            '<div class="akini-ta-phone-battery-wrap">' +
              '<div class="akini-ta-phone-battery" title="设备电量">' +
                '<div class="akini-ta-phone-battery-level" id="akiniTaPhoneBatLevel" style="width:90%"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="akini-ta-phone-header">' +
          '<button class="akini-ta-phone-back" onclick="window.AkiniTaPhone.goBack()"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M15 18l-6-6 6-6"/></svg></button>' +
          '<span class="akini-ta-phone-title" id="akini-ta-phone-title">TA的手机</span>' +
          '<span style="width:32px;"></span>' +
        '</div>' +
        // 联系人网格
        '<div class="akini-ta-phone-contact-grid" id="akini-ta-phone-contact-grid"></div>' +
        // 联系人桌面（三个应用）
        '<div class="akini-ta-phone-desktop" id="akini-ta-phone-desktop">' +
          '<div class="akini-ta-phone-app" onclick="window.AkiniTaPhone.showApp(\'chat\')">' +
            '<div class="akini-ta-phone-app-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
            '<span class="akini-ta-phone-app-name">聊天</span>' +
          '</div>' +
          '<div class="akini-ta-phone-app" onclick="window.AkiniTaPhone.showApp(\'moments\')">' +
            '<div class="akini-ta-phone-app-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>' +
            '<span class="akini-ta-phone-app-name">朋友圈</span>' +
          '</div>' +
          '<div class="akini-ta-phone-app" onclick="window.AkiniTaPhone.showApp(\'icity\')">' +
            '<div class="akini-ta-phone-app-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>' +
            '<span class="akini-ta-phone-app-name">iCity</span>' +
          '</div>' +
          '<div class="akini-ta-phone-app" onclick="window.AkiniTaPhone.showApp(\'music\')">' +
            '<div class="akini-ta-phone-app-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
            '<span class="akini-ta-phone-app-name">网易云</span>' +
          '</div>' +
          '<div class="akini-ta-phone-app" onclick="window.AkiniTaPhone.showApp(\'calls\')">' +
            '<div class="akini-ta-phone-app-icon"><svg fill="none" height="42" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" viewBox="0 0 24 24" width="42"><path d="m22 8-6 4 6 4V8Z"/><rect height="12" rx="2" width="14" x="2" y="6"/></svg></div>' +
            '<span class="akini-ta-phone-app-name">通话记录</span>' +
          '</div>' +
        '</div>' +
        // 收藏列表
        '<div class="akini-ta-phone-list-view" id="akini-ta-phone-list-view">' +
          '<div class="akini-ta-phone-list" id="akini-ta-phone-list"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(container);
  }

  var _scanned = false;
  function init() {
    injectStyles();
    injectDOM();
    if (!_scanned) {
      _scanned = true;
      setTimeout(scanHistory, 2500);
    }
  }

  /* 通话计时兜底：接听按钮有一条处理只把状态置为已接听、没记录开始时间，
     表现为时长停在 00:00、挂断时写成"通话时长 29879345:39"。
     接听后复核计时是否真的在走，没走就补点 core 另一条接听链路（它会补记开始时间）。
     复核必须等真实计时跑满 2 秒：正常计时首秒也显示 00:00，过早补点会把开始时间重置。 */
  var _callAnswerAt = 0;
  var _callFixTries = 0;
  var _callFixTimer = null;

  function _callTimeText() {
    var el = document.getElementById('callTimeDisplay');
    var txt = el ? String(el.innerText || '').replace(/\s/g, '') : '';
    return /^\d+:\d+$/.test(txt) ? txt : '';
  }

  function ensureCallTicker() {
    _callFixTimer = null;
    var st = window._callState;
    if (!st || !st.active || !st.answered) { _callFixTries = 0; _callAnswerAt = 0; return; }
    if (_callTimeText() !== '00:00') return; // 已在正常计时
    if (_callFixTries >= 2) return;
    _callFixTries++;
    var mini = document.getElementById('callAnswerBtn');
    if (mini) mini.click();
    _callFixTimer = setTimeout(ensureCallTicker, 2500);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var hit = t && t.closest ? t.closest('#callAnswerBtnFull,#callAnswerBtn') : null;
    if (!hit) return;
    _callAnswerAt = Date.now();
    _callFixTries = 0;
    if (_callFixTimer) clearTimeout(_callFixTimer);
    _callFixTimer = setTimeout(ensureCallTicker, 2500);
  }, true);

  window.AkiniTaPhone = {
    showTaPhone: showContainer,
    hideTaPhone: hideContainer,
    goBack: goBack,
    openContact: openContact,
    showApp: showApp,
    deleteCollection: deleteCollection,
    addCallRecord: addCallRecord
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  setTimeout(init, 1500);
})();
;
/* ===== akini-storage-mgr.js ===== */
/**
 * Akini 储存数据页（数据管理）
 * 入口：设置页「储存数据」行 → 全屏页面
 * 功能：导出备份 / 导入备份 / 清除数据
 */
(function () {
  "use strict";

  var AREA_ID = "storageArea";

  function fmtSize(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + " MB";
    return (n / 1024 / 1024 / 1024).toFixed(2) + " GB";
  }

  /* 按 key 分类统计占用 —— 严格按用户定义：
     聊天记录 = 微信界面的聊天记录（chat_history / contacts / sessions / pending_reply 等）
     图片媒体 = 所有界面的图片数据（bg / avatar / cover / sticker / media / wallpaper / emoji 图）
     设置数据 = 所有界面的其他数据（settings / toggle / prob / wordbank / moments / icity / mail / survey / shop / font / theme / music 等）
     陪伴和观影 = 一次性的，结束后就没有了 → 不计入（akini_watch_* / akini_companion_* 直接跳过） */
  function categorizeKey(k) {
    if (!k) return null;
    /* 陪伴 / 观影：一次性，不计入 */
    if (/^akini_(watch_|companion_)/.test(k)) return null;
    /* 图片媒体：所有界面的壁纸、头像、封面、表情包、媒体缓存 */
    if (/^akini_.*(_bg|_avatar|_cover|_wallpaper)$/.test(k)) return "图片媒体";
    if (/^akini_(home_bg|my_avatar|ta_avatar|icity_my_avatar|icity_ta_avatar|friends_bg|call_bg|callmini_bg|call_mini_bg|cover_img|chat_bg|music_bg|day_bg|anniv_bg|watch_wallpaper)/.test(k)) return "图片媒体";
    if (/^akini_(stk|sticker|media_|emoji_img|wb_emoji)/.test(k)) return "图片媒体";
    /* 聊天记录：微信界面的聊天记录、联系人、会话、待回复 */
    if (/^akini_(chat_history_|chat_critical_|chat_meta_|contacts|sessions|last_chat|pending_reply|chat_backup_|active_chat)/.test(k)) return "聊天记录";
    /* 设置数据：其余全部（开关、概率、字卡库、朋友圈、iCity、信件、问卷、商店、字体、主题、音乐等） */
    return "设置数据";
  }

  /* 收集 localStorage 中各 key 的字节数（仅作 IDB 之外的补缺，避免与 IDB 镜像重复计数） */
  function computeLsBytes() {
    var map = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        var v = localStorage.getItem(k) || "";
        map[k] = (k.length + v.length) * 2; // UTF-16
      }
    } catch (e) {}
    return map;
  }

  /* 取浏览器真实配额与已用（navigator.storage.estimate，回退 webkitTemporaryStorage） */
  function getStorageEstimate() {
    return new Promise(function (resolve) {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then(function (r) {
            resolve({ usage: Number(r && r.usage) || 0, quota: Number(r && r.quota) || 0 });
          }).catch(function () { resolve({ usage: 0, quota: 0 }); });
          return;
        }
      } catch (e) {}
      try {
        if (navigator.webkitTemporaryStorage && navigator.webkitTemporaryStorage.queryUsageAndQuota) {
          navigator.webkitTemporaryStorage.queryUsageAndQuota(function (u, q) {
            resolve({ usage: Number(u) || 0, quota: Number(q) || 0 });
          }, function () { resolve({ usage: 0, quota: 0 }); });
          return;
        }
      } catch (e) {}
      resolve({ usage: 0, quota: 0 });
    });
  }

  /* 估算单个值的字节数：Blob/File 用 size，ArrayBuffer 用 byteLength，
     字符串按 UTF-16，其他用 JSON 序列化长度。只用于展示占用，不要求精确到字节。 */
  function valueBytes(v) {
    try {
      if (v == null) return 0;
      if (typeof v === "string") return v.length * 2;
      if (typeof Blob !== "undefined" && v instanceof Blob) return v.size;
      if (typeof ArrayBuffer !== "undefined" && v instanceof ArrayBuffer) return v.byteLength;
      if (v.buffer && v.buffer instanceof ArrayBuffer) return v.buffer.byteLength;
      var s = JSON.stringify(v);
      return s ? s.length * 2 : 0;
    } catch (e) { return 0; }
  }

  /* 异步计算所有 IndexedDB 数据库的实际占用，并按 key 分类归入三大类。
     打开失败的库跳过；返回 {total, cats, keys}，keys 为已统计的 key 集合（用于与 LS 去重）。 */
  function computeIdbSize() {
    return new Promise(function (resolve) {
      var result = { total: 0, cats: {}, keys: {} };
      var dbs = [];
      try {
        if (indexedDB && indexedDB.databases) {
          indexedDB.databases().then(function (list) {
            dbs = (list || []).filter(function (d) { return d && d.name; }).map(function (d) { return d.name; });
            nextDb();
          }).catch(function () { resolve(result); });
        } else { resolve(result); }
      } catch (e) { resolve(result); }

      function addCat(k, bytes) {
        var cat = /^akini_/.test(k) ? categorizeKey(k) : "设置数据";
        if (cat === null) return;
        result.cats[cat] = (result.cats[cat] || 0) + bytes;
        result.total += bytes;
        result.keys[k] = true;
      }

      function nextDb() {
        if (!dbs.length) { resolve(result); return; }
        var name = dbs.shift();
        try {
          var req = indexedDB.open(name);
          req.onerror = function () { nextDb(); };
          req.onblocked = function () { try { req.result && req.result.close(); } catch (e) {} nextDb(); };
          req.onsuccess = function () {
            var db = req.result;
            var stores = [];
            try {
              var names = db.objectStoreNames;
              for (var i = 0; i < names.length; i++) stores.push(names[i]);
            } catch (e) {}
            function nextStore() {
              if (!stores.length) {
                try { db.close(); } catch (e) {}
                nextDb();
                return;
              }
              var sn = stores.shift();
              try {
                var tx = db.transaction(sn, "readonly");
                var os = tx.objectStore(sn);
                var cnt = os.count();
                cnt.onsuccess = function () {
                  var total = Number(cnt.result) || 0;
                  if (total === 0) { nextStore(); return; }
                  var cursorReq = os.openCursor();
                  cursorReq.onsuccess = function (ev) {
                    var cur = ev.target.result;
                    if (cur) {
                      var k = cur.key;
                      var keyStr = (typeof k === "string") ? k : String(k);
                      addCat(keyStr, valueBytes(cur.value));
                      try { cur.continue(); } catch (e) { nextStore(); }
                    } else { nextStore(); }
                  };
                  cursorReq.onerror = function () { nextStore(); };
                };
                cnt.onerror = function () { nextStore(); };
              } catch (e) { nextStore(); }
            }
            nextStore();
          };
        } catch (e) { nextDb(); }
      }
    });
  }

  /* 渲染储存面板：先算完 localStorage + IndexedDB 再一次性渲染，避免"计算中…→数字"闪烁。
     DOM 只在首次构建，后续只更新数字与进度条宽度。 */
  var __storRendered = false;
  function renderStorage() {
    var body = document.getElementById("akStorBody");
    if (!body) return;

    if (!__storRendered) {
      body.innerHTML =
        '<div class="settings-card"><div class="card-title">网站内存空间</div>' +
          '<div class="ak-stor-total-wrap">' +
            '<div class="ak-stor-total-bar"><div class="ak-stor-total-fill" id="akStorTotalFill" style="width:0%"></div></div>' +
            '<div class="ak-stor-total-text" id="akStorTotalLine">储存总量 <b>计算中…</b></div>' +
          '</div>' +
          '<div class="ak-stor-divider">按内容分类</div>' +
          '<div id="akStorCatRows"></div>' +
          '<div class="ak-hint" style="margin-top:8px">点击「导出备份」可保存全部数据到文件</div>' +
        "</div>" +

        '<div class="settings-card"><div class="card-title">备份与恢复</div>' +
          '<div class="ak-hint" style="margin-top:0">数据每次变更已自动备份到浏览器本地库；换设备/清理浏览器前请先导出备份文件</div>' +
          '<div class="ak-btn-col">' +
            '<button class="ak-stor-btn primary" id="akStorExport" type="button">导出备份</button>' +
            '<button class="ak-stor-btn" id="akStorImport" type="button">导入备份</button>' +
            '<input type="file" id="akStorImportFile" accept=".zip,.json" class="akini-file-offscreen">' +
          "</div>" +
        "</div>" +

        '<div class="settings-card"><div class="card-title">清除数据</div>' +
          '<div class="ak-hint" style="margin-top:0">清空后聊天记录、联系人、朋友圈、iCity、贴纸、设置全部删除（含浏览器本地库），不可恢复</div>' +
          '<div class="ak-btn-col">' +
            '<button class="ak-stor-btn danger" id="akStorWipe" type="button">清除全部数据</button>' +
          "</div>" +
        "</div>";
      __storRendered = true;
      bindActions();
    }

    var totalLine = document.getElementById("akStorTotalLine");
    var totalFill = document.getElementById("akStorTotalFill");

    /* 总量行保持"计算中…"，分类行也先不渲染，等 IDB+LS+配额全部算完再一次性刷新，杜绝数字闪烁 */
    var lsMap = computeLsBytes();
    Promise.all([computeIdbSize(), getStorageEstimate()]).then(function (results) {
      var idbRes = results[0] || { cats: {}, keys: {} };
      var est = results[1] || { usage: 0, quota: 0 };

      /* 以 IDB 为准（所有 akini_ 关键键都镜像到 IDB），
         LS 只补充 IDB 里没有的 key（非 akini_ 或未镜像的），避免同一批数据被算两遍 */
      var mergedCats = { "聊天记录": 0, "图片媒体": 0, "设置数据": 0 };
      for (var c in idbRes.cats) {
        if (mergedCats.hasOwnProperty(c)) mergedCats[c] += idbRes.cats[c];
        else mergedCats[c] = idbRes.cats[c];
      }
      for (var lk in lsMap) {
        if (idbRes.keys[lk]) continue; /* IDB 已统计，跳过 */
        var lcat = /^akini_/.test(lk) ? categorizeKey(lk) : "设置数据";
        if (lcat === null) continue;
        mergedCats[lcat] = (mergedCats[lcat] || 0) + lsMap[lk];
      }

      var catTotal = (mergedCats["聊天记录"] || 0) + (mergedCats["图片媒体"] || 0) + (mergedCats["设置数据"] || 0);
      /* 源头修复：已用量 = 分类加总（Akini 自己的数据），不再用浏览器 estimate.usage。
         estimate.usage 把浏览器磁盘层残留的旧 vault / ServiceWorker 缓存 / CacheStorage 全算进来，
         用户清数据后 estimate 不怎么降，但分类加总确实归零——应该以用户自己的数据为准。 */
      var usedBytes = catTotal;
            /* 源头修复：已用量 = 分类加总（Akini 自己的数据）；总量 = 浏览器真实 estimate.quota。
         两个独立：已用量只算用户自己存的，总量用浏览器给的真实磁盘配额 */
      var quotaBytes = est.quota > 0 ? est.quota : 0;
      _renderCatRows(mergedCats);
      if (totalLine) {
        var totalTxt = quotaBytes > 0 ? (fmtSize(usedBytes) + ' / ' + fmtSize(quotaBytes)) : fmtSize(usedBytes);
        totalLine.innerHTML = '已用 <b>' + fmtSize(usedBytes) + '</b>' + (quotaBytes > 0 ? ' / 总量 <b>' + fmtSize(quotaBytes) + '</b>' : '');
      }
      if (totalFill) {
        var pct = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;
        totalFill.style.width = pct.toFixed(1) + "%";
      }
    }).catch(function () {
      /* 出错兜底：用分类之和渲染 */
      var mergedCats = { "聊天记录": 0, "图片媒体": 0, "设置数据": 0 };
      for (var lk2 in lsMap) {
        var lcat2 = /^akini_/.test(lk2) ? categorizeKey(lk2) : "设置数据";
        if (lcat2 === null) continue;
        mergedCats[lcat2] = (mergedCats[lcat2] || 0) + lsMap[lk2];
      }
      var t = (mergedCats["聊天记录"] || 0) + (mergedCats["图片媒体"] || 0) + (mergedCats["设置数据"] || 0);
      _renderCatRows(mergedCats);
      if (totalLine) totalLine.innerHTML = '已用 <b>' + fmtSize(t) + '</b>';
    });
  }

  function _renderCatRows(cats) {
    var catRowsEl = document.getElementById("akStorCatRows");
    if (!catRowsEl) return;
    var order = ["聊天记录", "图片媒体", "设置数据"];
    var maxCat = 1;
    order.forEach(function (c) { if ((cats[c] || 0) > maxCat) maxCat = cats[c]; });
    catRowsEl.innerHTML = order.filter(function (cat) {
      /* “其他（缓存）”只在确有差额时出现，避免固定多一行 0 字节 */
      return cat !== "其他（缓存）" || (cats[cat] || 0) > 0;
    }).map(function (cat) {
      var bytes = cats[cat] || 0;
      var pct = Math.max(1, Math.round(bytes / maxCat * 100));
      return '<div class="ak-stor-row">' +
        '<div class="ak-stor-cat">' + cat + '</div>' +
        '<div class="ak-stor-bar"><div class="ak-stor-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="ak-stor-size">' + fmtSize(bytes) + '</div>' +
      '</div>';
    }).join("");
  }

  function bindActions() {
    var $ = function (id) { return document.getElementById(id); };
    var note = function (msg) {
      try {
        if (window.__akiniCenterModal) window.__akiniCenterModal("储存数据", msg);
        else alert(msg);
      } catch (e) { alert(msg); }
    };

    var expBtn = $("akStorExport");
    if (expBtn) expBtn.onclick = function () {
      try {
        if (window.akExportBackup) window.akExportBackup();
        else note("备份模块加载中，请稍后再试");
      } catch (e) { note("导出失败：" + e.message); }
    };

    var impBtn = $("akStorImport");
    var impFile = $("akStorImportFile");
    if (impBtn && impFile) {
      impBtn.onclick = function () { impFile.click(); };
      impFile.onchange = function (ev) {
        var file = ev.target.files && ev.target.files[0];
        if (file && window.akImportBackup) window.akImportBackup(file);
        ev.target.value = "";
      };
    }

    var wipeBtn = $("akStorWipe");
if (wipeBtn) wipeBtn.onclick = function () {
      if (!confirm("确定要清空全部数据吗？\n聊天记录、联系人、朋友圈、iCity、贴纸、设置都会被删除，且无法恢复！")) return;
      if (!confirm("最后确认：真的要全部删除吗？建议先点「导出备份」留底。")) return;
      wipeBtn.disabled = true;
      wipeBtn.textContent = "正在清除…";
      // 全局清除标记：阻断一切 localStorage 写回与 IDB 备份，防止清除后数据复活
      try { window.__akiniWiping = true; } catch (e) {}
      // 放行 AkiniPersist 的删除/清空拦截，否则 localStorage.clear() 会把 akini_ 关键数据全部保留下来，清除失败
      try { window._akiniAllowRemove = true; } catch (e) {}
      // 立即清空内存镜像 + IDB 待写队列，防止刷新前的间隙旧数据被重新落盘
      try { if (window.akiniStore && window.akiniStore.wipeMemory) window.akiniStore.wipeMemory(); } catch (e) {}
      // 保险丝 cookie：即使本次刷新前 IDB 没清完，下次启动会再清一轮（由 akini-storage-safe.js 启动段消费）
      try { document.cookie = "akini_wipe_pending=1;path=/;max-age=600"; } catch (e) {}
      var reloaded = false;
      var doReload = function () {
        if (reloaded) return;
        reloaded = true;
        // core 式：换 URL 整页加载（?reset= 时间戳），bfcache 对 URL 变化不适用，旧页面无法从内存复活
        try { location.href = location.pathname + "?reset=" + Date.now(); }
        catch (e) { try { location.reload(true); } catch (e2) { location.reload(); } }
      };
      var clearLocal = function () {
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
        // 逐键强删残留（含非 akini_ 键）
        try {
          var rest = [];
          for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) rest.push(k); }
          rest.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        } catch (e) {}
        try {
          var srest = [];
          for (var j = 0; j < sessionStorage.length; j++) { var sk = sessionStorage.key(j); if (sk) srest.push(sk); }
          srest.forEach(function (k) { try { sessionStorage.removeItem(k); } catch (e) {} });
        } catch (e) {}
      };
      var finish = function () {
        // 所有 IDB 已删，最后清 localStorage 并立即刷新（顺序不能反，否则快照机制会在间隙写回）
        clearLocal();
        // core 式全量归0：清空所有可访问 cookie（含残留的标记/会话 cookie）
        try {
          document.cookie.split(";").forEach(function (c) {
            var n = String(c).split("=")[0].trim();
            if (n) document.cookie = n + "=;path=/;max-age=0";
      });
    } catch (e) {}
    try { document.cookie = "akini_wipe_pending=1;path=/;max-age=600"; } catch (e) {}
    /* zzl：不再注销 SW / 清空 Cache Storage 强制换新版本；数据清空后仅刷新一次进入干净状态 */
    setTimeout(doReload, 200);
  };
      var deleteAllIdb = function () {
        // 源头修复：清除数据 = 清 Akini 用到的所有浏览器存储层
        try { _idbStore && _idbStore.clearAll && _idbStore.clearAll(function () {}); } catch (e) {}
        try {
          if (indexedDB.databases) {
            indexedDB.databases().then(function (dbs) {
              (dbs || []).forEach(function (d) {
                if (d && d.name) { try { indexedDB.deleteDatabase(d.name); } catch (e) {} }
              });
            }).catch(function () {});
          }
        } catch (e) {}
        try { indexedDB.deleteDatabase("akini_img_db"); } catch (e) {}
        /* CacheStorage（ServiceWorker 缓存）一并清——浏览器 estimate.usage 会把它算进去 */
        try { if (window.caches && caches.keys) {
          caches.keys().then(function (names) { names.forEach(function (n) { try { caches.delete(n); } catch (e) {} }); }).catch(function () {});
        } } catch (e) {}
        finish();
      };
      // 云端备份同步删除（用户要求全部归0，防止重启后云恢复把数据复活）；最多等 2.5s，失败也不阻塞本地清理
      try {
        if (window.__akiniCloudBackup && window.__akiniCloudBackup.wipeCloud) {
          var cloudDone = false;
          var proceed = function () {
            if (cloudDone) return;
            cloudDone = true;
            try {
              if (window._idbStore && window._idbStore.clearAll) window._idbStore.clearAll(function () { deleteAllIdb(); });
              else deleteAllIdb();
            } catch (e) { deleteAllIdb(); }
          };
          Promise.race([
            window.__akiniCloudBackup.wipeCloud(),
            new Promise(function (res) { setTimeout(res, 2500); })
          ]).then(proceed).catch(proceed);
        } else if (window._idbStore && window._idbStore.clearAll) window._idbStore.clearAll(function () { deleteAllIdb(); });
        else deleteAllIdb();
      } catch (e) { deleteAllIdb(); }
      // 6 秒仍未完成则再补一轮清空后强制刷新
      setTimeout(function () {
        try { if (window._idbStore && window._idbStore.clearAll) window._idbStore.clearAll(function () {}); } catch (e) {}
        try { clearLocal(); } catch (e) {}
        setTimeout(doReload, 300);
      }, 6000);
    };
  }

  function buildArea() {
    if (document.getElementById(AREA_ID)) return;
    var anchor = document.getElementById("settingsArea");
    var d = document.createElement("div");
    d.id = AREA_ID;
    d.className = "settings-area ak-storage-area";
    d.style.display = "none";
    d.innerHTML =
      '<div class="settings-header">' +
        '<button class="back-btn" id="storageBackBtn" type="button" ' +
        'onclick="window.hideAll&&window.hideAll();window.showArea&&window.showArea(\'settingsArea\');return false;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<div class="title">储存数据</div>' +
      "</div>" +
      '<div class="settings-body" id="akStorBody"></div>';
    (anchor && anchor.parentNode ? anchor.parentNode : document.body).appendChild(d);
  }

  window.__openStorageMgr = function () {
    try {
      buildArea();
      if (window.hideAll) window.hideAll();
      if (window.showArea) window.showArea(AREA_ID);
      else { var e = document.getElementById(AREA_ID); if (e) e.style.display = "flex"; }
      renderStorage();
    } catch (err) {
      console.error("[StorageMgr] open error", err);
    }
  };
})();

;
/* ===== akini-cloud-backup.js ===== */
/*
 * akini-cloud-backup.js  0915 云端自动备份/恢复
 * 本地三层存储（内存/localStorage/IndexedDB）之上的云端保险：
 * - 修复：旧项目后端已暂停（SupabaseNotReady）导致备份彻底失效 → 切换到当前活跃项目
 * - 增强：头像/封面/会话/联系人等关键 key 永不因体积被剔除
 * - 防空覆盖：本地数据异常骤减（被浏览器清理）时禁止上传空壳覆盖云端，改为先恢复
 * - 恢复提前到脚本加载即发起，网络失败自动重试，恢复完成后立即刷新界面（含头像）
 * - 每 150 秒检测变化自动备份；切后台/关闭页面前立即备份（keepalive）
 */
(function () {
  "use strict";
  if (window.__akiniCloudBackupReady) return;
  window.__akiniCloudBackupReady = true;

  var SUPA_URL = "https://backend.miaoda.online/projects/supabase356066302944653312";
  var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMTA0MzIwMDIyLCJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwic3ViIjoiYW5vbiJ9.-sN1xREpzprJmdy1bxy9YnVRXjpHv-2WT7thmiit45c";
  var TABLE = "akini_cloud_backups";
  var MAX_PAYLOAD = 4.5 * 1024 * 1024; // 超出则剔除最大 value 的非关键 key
  var SKIP_RE = /^akini_(next_|last_)/; // 高频调度键不备份

  // 绝不因体积剔除的关键 key：会话索引/通讯录/头像/封面/名字/核心设置
  var PROTECT_EXACT = {
    akini_sessions: 1, akini_contacts: 1, akini_device_id: 1,
    akini_my_avatar: 1, akini_ta_avatar: 1,
    akini_icity_my_avatar: 1, akini_icity_ta_avatar: 1,
    akini_my_name: 1, akini_ta_name: 1, akini_home_bg: 1,
  };
  var PROTECT_PREFIX = ["akini_contact_avatar_"];
  function isProtectedKey(k) {
    if (PROTECT_EXACT[k]) return true;
    for (var i = 0; i < PROTECT_PREFIX.length; i++) {
      if (k.indexOf(PROTECT_PREFIX[i]) === 0) return true;
    }
    return false;
  }

  // ---- 设备 ID：本机唯一标识，多层冗余持久化（localStorage + cookie 十年），防止浏览器清理后无法关联云端备份 ----
  function getDeviceId() {
    var id = null;
    try { id = localStorage.getItem("akini_device_id"); } catch (e) {}
    if (!id) {
      // localStorage 被清理时从 cookie 找回，并回填 localStorage
      try {
        var m = (document.cookie || "").match(/(?:^|;\s*)akini_device_id=([^;]+)/);
        if (m && m[1]) id = decodeURIComponent(m[1]);
        if (id) { try { localStorage.setItem("akini_device_id", id); } catch (e) {} }
      } catch (e) {}
    }
    if (!id) {
      id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem("akini_device_id", id); } catch (e) {}
    }
    // 始终同步写 cookie（10 年）做第二重保障
    try { document.cookie = "akini_device_id=" + encodeURIComponent(id) + ";path=/;max-age=315360000;SameSite=Lax"; } catch (e) {}
    return id;
  }
  var DEVICE_ID = getDeviceId();

  // ---- 本地“空壳/默认值”判定 ----
  /* 启动顺序里，页面会先把默认数据（默认联系人“对方”、默认名字、空数组）写进本地，
     旧逻辑见到“本地非空”就跳过云端回填 → 云端真实数据永远进不来（表现为数据消失）。
     这里把这些默认值一律视为“空壳”，允许云端真实数据覆盖。 */
  var _DEFAULT_VALS = {
    akini_my_name: ["我", ""], akini_ta_name: ["梦角", "对方", "TA", ""],
    akini_my_status: ["在线", ""], akini_ta_status: ["在线", ""],
    akini_signature: [""], akini_friends_signature: [""]
  };
  function _isRealStr(v) { return !(v == null || v === "" || v === "null" || v === "undefined"); }
  function _isShellLocal(k, v) {
    if (!_isRealStr(v)) return true;
    var s = String(v);
    if (s === "[]" || s === "{}") return true;
    if (_DEFAULT_VALS[k] && _DEFAULT_VALS[k].indexOf(s) >= 0) return true;
    try {
      if (k === "akini_contacts") {
        var a = JSON.parse(s);
        if (!Array.isArray(a) || !a.length) return true;
        var real = a.filter(function (c) { return c && !c.isDefault && c.id !== "ta_default" && String(c.name || "") !== "对方"; });
        return !real.length; // 只剩默认联系人 = 空壳
      }
      if (k === "akini_groups" || k === "akini_sessions" || k === "akini_chat_sessions" || k === "akini_chat_pins" || k === "akini_home_avatars") {
        var o = JSON.parse(s);
        if (Array.isArray(o)) return !o.length;
        return !o || !Object.keys(o).length;
      }
      if (k.indexOf("akini_chat_history") === 0) {
        var msgs = JSON.parse(s);
        return !Array.isArray(msgs) || !msgs.length;
      }
    } catch (e) {}
    return false;
  }
  function _msgCount(v) { try { var a = JSON.parse(v); return Array.isArray(a) ? a.length : 0; } catch (e) { return 0; } }
  /* 删除墓碑：用户刚清空/删除某个键后，云端旧数据不能又把它拉回来 */
  function _isDeletedLocally(k, cloudAt) {
    try {
      var del = (window.__akiniSnap && window.__akiniSnap.isDeleted) ? window.__akiniSnap.isDeleted(k) : 0;
      if (del && cloudAt && del > cloudAt) {
        console.warn("[云备份] 本地已删除该键，拒绝用云端旧数据回填: " + k);
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ---- 收集全部 akini_ 数据 ----
  function collectAll() {
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("akini_") !== 0 || SKIP_RE.test(k)) continue;
        var v = localStorage.getItem(k);
        /* 跳过字面 "null"/"undefined" 脏值，防止把脏数据传上云端再回填到其他设备 */
        if (v != null && v !== "null" && v !== "undefined") data[k] = v;
      }
    } catch (e) {}
    // 内存镜像补充：大键（>200KB 图片等）只存在内存/IDB，必须全量遍历内存键，否则会漏备
    try {
      if (window.akiniStore && window.akiniStore.memoryKeys && window.akiniStore.memoryGet) {
        window.akiniStore.memoryKeys().forEach(function (k) {
          if (!k || k.indexOf("akini_") !== 0 || SKIP_RE.test(k)) return;
          var mv = window.akiniStore.memoryGet(k);
          if (mv != null && mv !== "") data[k] = mv;
        });
      }
    } catch (e) {}
    return data;
  }

  // ---- 体积控制：超出上限时剔除最大 value 的非关键 key（关键 key 绝不剔除）----
  function shrink(data) {
    var s = JSON.stringify(data);
    if (s.length <= MAX_PAYLOAD) return s;
    var entries = Object.keys(data).map(function (k) {
      return { k: k, size: (data[k] || "").length };
    });
    entries.sort(function (a, b) { return b.size - a.size; });
    for (var i = 0; i < entries.length && s.length > MAX_PAYLOAD; i++) {
      var k = entries[i].k;
      if (isProtectedKey(k)) continue;
      console.warn("[云备份] 数据过大，跳过备份: " + k + " (" + Math.round(entries[i].size / 1024) + "KB)");
      delete data[k];
      s = JSON.stringify(data);
    }
    return s;
  }

  var _lastBackupSig = "";
  var _backupTimer = null;
  var _backingUp = false;
  var _restoreDone = false;  // 本轮启动已确认云端状态（成功或确认无数据）
  var _cloudKeyCount = 0;    // 云端 key 数量（用于检测本地数据骤减）
  /* 后端返回 401/403/404（项目暂停、密钥失效）时进入冷却期。
     否则每次定时器都会先 collectAll() 全量遍历 localStorage 再 JSON.stringify
     最大 4.5MB 的 payload，然后才收到 403 —— 数据多的账号会周期性明显卡一下。 */
  var _cloudBlockedUntil = 0;
  var CLOUD_BLOCK_MS = 30 * 60 * 1000;

  function backup(immediate) {
    if (!immediate && Date.now() < _cloudBlockedUntil) return; // 后端不可用时不再空转
    if (window.__akiniWiping) return; // 清除数据期间禁止上传，避免把中间态写回云端
    if (_backingUp && !immediate) return;
    if (document.hidden && !immediate) return; // 页面在后台时不跑周期备份（切后台瞬间已有 immediate 备份兜底）
    if (_backupTimer) { clearTimeout(_backupTimer); _backupTimer = null; }
    var run = function () {
      try {
        var data = collectAll();
        var keys = Object.keys(data);
        if (!keys.length) return;
        // 防空覆盖 1：云端状态尚未确认且本地数据异常少（疑似刚被清理）→ 跳过，等待恢复流程
        if (!_restoreDone && keys.length < 8) {
          console.warn("[云备份] 云端状态未确认且本地数据过少，跳过本次备份");
          return;
        }
        // 防空覆盖 2：云端数据量明显多于本地（本地被浏览器清理过）→ 禁止上传空壳，改为触发恢复
        if (_cloudKeyCount >= 8 && keys.length < Math.max(8, Math.floor(_cloudKeyCount * 0.5))) {
          console.warn("[云备份] 检测到本地数据骤减（" + keys.length + "/" + _cloudKeyCount + "），跳过备份并触发恢复");
          restore();
          return;
        }
        var sig = keys.length + ":" + keys.reduce(function (a, k) { return a + (data[k] || "").length; }, 0);
        if (!immediate && sig === _lastBackupSig) return; // 无变化不传
        var payload = shrink(data);
        _backingUp = true;
        var bodyStr = JSON.stringify({ device_id: DEVICE_ID, payload: payload, updated_at: new Date().toISOString() });
        /* keepalive 请求体上限约 64KB，超限的即时备份改用普通 fetch（尽力送达），避免每次都静默失败 */
        var useKeepalive = !!immediate && bodyStr.length < 60000;
        fetch(SUPA_URL + "/rest/v1/" + TABLE, {
          method: "POST",
          headers: {
            apikey: SUPA_KEY,
            Authorization: "Bearer " + SUPA_KEY,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: bodyStr,
          keepalive: useKeepalive,
        }).then(function (r) {
          _backingUp = false;
          if (r.ok) {
            _lastBackupSig = sig;
            _cloudKeyCount = Math.max(_cloudKeyCount, keys.length);
            try { localStorage.setItem("akini_cloud_backup_at", String(Date.now())); } catch (e) {}
            backupBlobs(); // zzzx：顺带备份小说正文等大体积 IDB 内容
          } else {
            if (r.status === 401 || r.status === 403 || r.status === 404) {
              _cloudBlockedUntil = Date.now() + CLOUD_BLOCK_MS;
            }
            console.warn("[云备份] 备份失败 HTTP " + r.status);
          }
        }).catch(function () { _backingUp = false; });
      } catch (e) { _backingUp = false; }
    };
    // 卡崩修复：即时备份（切后台/关闭页面前）不再同步执行 collectAll+stringify 大负载，
    // 改为微任务延迟到下一轮事件循环，避免与 _akiniImmediateBackup / localStorage 拦截的 pagehide
    // 备份在同一时刻叠加触发，造成低端机 OOM 闪退
    if (immediate) setTimeout(run, 0);
    else _backupTimer = setTimeout(run, 3000);
  }

  /* ==================== zzzx 大体积内容云端保险 ====================
   * 小说正文等存在 IndexedDB 的大文本不在主 payload（4.5MB 上限）内，
   * iOS/Safari 清理 IndexedDB 后会永久丢失 → 逐键独立行备份到 akini_cloud_blobs 表。
   * 只补本地缺失、绝不覆盖；单条 >3MB 跳过。
   */
  var BLOB_TABLE = "akini_cloud_blobs";
  var BLOB_RE = /^akini_novel_content_/;
  var BLOB_MAX = 3 * 1024 * 1024;
  var _blobCache = {}; // key -> 本地内容长度（变化才上传，避免重复流量）

  function backupBlobs() {
    try {
      if (window.__akiniWiping) return;
      if (!window._idbStore || !window._idbStore.keys || !window._idbStore.get) return;
      window._idbStore.keys(function (ks) {
        if (!ks || !ks.length) return;
        var targets = [];
        for (var i = 0; i < ks.length; i++) {
          if (BLOB_RE.test(ks[i])) targets.push(ks[i]);
        }
        if (!targets.length) return;
        var idx = 0;
        (function next() {
          if (idx >= targets.length) return;
          var k = targets[idx++];
          window._idbStore.get(k, function (v) {
            try {
              if (typeof v === "string" && v.length > 0 && v.length <= BLOB_MAX && _blobCache[k] !== v.length) {
                _blobCache[k] = v.length;
                fetch(SUPA_URL + "/rest/v1/" + BLOB_TABLE, {
                  method: "POST",
                  headers: {
                    apikey: SUPA_KEY,
                    Authorization: "Bearer " + SUPA_KEY,
                    "Content-Type": "application/json",
                    Prefer: "resolution=merge-duplicates,return=minimal",
                  },
                  body: JSON.stringify({ device_id: DEVICE_ID, key: k, value: v, updated_at: new Date().toISOString() }),
                }).catch(function () { delete _blobCache[k]; }); // 失败下次重传
              }
            } catch (e) {}
            setTimeout(next, 300); // 逐本间隔上传，避免突发
          });
        })();
      });
    } catch (e) {}
  }

  function restoreBlobs() {
    try {
      if (!window._idbStore || !window._idbStore.get || !window._idbStore.set) return;
      fetch(SUPA_URL + "/rest/v1/" + BLOB_TABLE + "?device_id=eq." + encodeURIComponent(DEVICE_ID) + "&select=key,value", {
        headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
      }).then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) {
          if (!rows || !rows.length) return;
          var idx = 0, restored = 0;
          (function next() {
            if (idx >= rows.length) {
              if (restored > 0) console.warn("[云备份] 已从云端恢复 " + restored + " 项小说内容");
              return;
            }
            var row = rows[idx++];
            if (!row || !row.key || typeof row.value !== "string" || !row.value) { next(); return; }
            // 只补本地缺失的内容，绝不覆盖本地已有
            window._idbStore.get(row.key, function (local) {
              if (local === null || local === undefined || local === "") {
                window._idbStore.set(row.key, row.value, function () { restored++; setTimeout(next, 100); });
              } else {
                _blobCache[row.key] = (typeof local === "string") ? local.length : 0;
                setTimeout(next, 30);
              }
            });
          })();
        })
        .catch(function () {});
    } catch (e) {}
  }

  // ---- 启动恢复：只补本地缺失的 key，绝不覆盖本地已有数据 ----
  function restore() {
    try {
      // 清除数据后的首次启动（?reset= 时间戳）：用户要求全部归0，绝不从云端复活
      if (/[?&]reset=/.test(location.search || "")) {
        console.warn("[云备份] 检测到清除数据后的启动，跳过恢复");
        _restoreDone = true;
        return;
      }
      fetch(SUPA_URL + "/rest/v1/" + TABLE + "?device_id=eq." + encodeURIComponent(DEVICE_ID) + "&select=payload,updated_at", {
        headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
      }).then(function (r) {
        if (!r.ok) {
          _restoreDone = true;
          /* 读取就 403/401/404，说明后端不可用，没必要紧接着再 POST 一次全量备份 */
          if (r.status === 401 || r.status === 403 || r.status === 404) {
            _cloudBlockedUntil = Date.now() + CLOUD_BLOCK_MS;
            return;
          }
          backup();
          return;
        }
        return r.json();
      }).then(function (rows) {
        if (!rows) return;
        _restoreDone = true;
        restoreBlobs(); // zzzx：云端状态确认后，补回本地缺失的小说正文等大内容
        if (!rows.length || !rows[0].payload) { backup(); return; }
        var cloud = null;
        try { cloud = JSON.parse(rows[0].payload); } catch (e) { return; }
        if (!cloud || typeof cloud !== "object") return;
        var cloudKeys = Object.keys(cloud);
        _cloudKeyCount = cloudKeys.length;
        var _cloudUpdatedAt = 0;
        try { _cloudUpdatedAt = Date.parse(rows[0].updated_at) || 0; } catch (eUp) {}
        var missing = [];
        /* 图像键进入延迟批，等本地对账完成后再判断是否缺失 */
        var pendingImgs = [];
        cloudKeys.forEach(function (k) {
          if (!(cloud[k] && cloud[k] !== "null" && cloud[k] !== "undefined")) return;
          var _isImg = !!(window.__akiniImgWts && window.__akiniImgWts.isImg(k));
          if (_isImg && !window.__akiniStorageRestored) { pendingImgs.push(k); return; }
          var local = null;
          try { local = localStorage.getItem(k); } catch (e) {}
          var mem = null;
          try { if (window.akiniStore && window.akiniStore.memoryGet) mem = window.akiniStore.memoryGet(k); } catch (e) {}
          var cur = (typeof mem === "string" && mem !== "") ? mem : local;
          if (_isDeletedLocally(k, _cloudUpdatedAt)) return;
          /* 本地是空壳/默认值 → 允许云端真实数据回填（不再被启动默认值挡住） */
          if (_isShellLocal(k, cur)) { missing.push(k); return; }
          /* 聊天记录：本地可能只是被截断的尾部，云端更完整则回填全量 */
          if (k.indexOf("akini_chat_history") === 0) {
            if (_msgCount(cloud[k]) > _msgCount(cur)) missing.push(k);
          }
        });
        /* 时间戳仲裁：本地(cookie/LS 侧车)记录的写入时间比云端新(3s 容差) →
           云端是旧值，拒绝回填该键（本地曾有更新的数据） */
        function _wtsOk(k) {
          try {
            var isImg = !!(window.__akiniImgWts && window.__akiniImgWts.isImg(k));
            var lw = (window.__akiniImgWts && window.__akiniImgWts.local(k)) || 0;
            var cw = 0; try { cw = +(cloud["akini_wts_" + k] || 0) || 0; } catch (e1) {}
            /* 图片键：本地有新记录且云端不更新 → 拒绝回填(保护用户新图) */
            if (isImg) {
              if (lw > 0 && !(cw > lw)) { console.warn("[云备份] 拒绝用云端旧值覆盖本地更新的图片键: " + k); return false; }
            } else {
              /* 非图片键同样以时间戳仲裁——本地写入记录更新而云端不更新 → 拒绝回填(防数据回退) */
              if (lw > 0 && cw > 0 && lw > cw + 3000) { console.warn("[云备份] 本地有更新记录，拒绝旧值回填: " + k); return false; }
            }
          } catch (e) {}
          return true;
        }
        function _fill(k) {
          var val = cloud[k];
          var _isImg = !!(window.__akiniImgWts && window.__akiniImgWts.isImg(k)) || k.indexOf("akini_media_") === 0 || k.indexOf("akini_s1_") === 0 || k.indexOf("akini_s2_") === 0 || k.indexOf("avatar") >= 0 || k.indexOf("_bg") >= 0;
          /* 图片键以时间戳为唯一仲裁——仅当【云端确属更新】时才覆盖本地。
             核心规则：本地已有图片值时，必须有云端时间戳 cw 且 cw > lw 才允许覆盖；
             lw 为 0(侧车缺失)时一律以本地现有值为准，绝不回填旧值。
             修复"图片被重置/数据回退"——云恢复不再因内存时序或侧车缺失而回填旧图覆盖新图。 */
          if (_isImg) {
            try {
              var _mem = null;
              try { if (window.akiniStore && window.akiniStore.memoryGet) _mem = window.akiniStore.memoryGet(k); } catch (e0) {}
              var _hasLocal = _mem != null && _mem !== "" && _mem !== "null" && _mem !== "undefined";
              var _lw = 0;
              try { if (window.__akiniImgWts && window.__akiniImgWts.local) _lw = window.__akiniImgWts.local(k) || 0; } catch (e1) {}
              var _cw = 0; try { _cw = +(cloud["akini_wts_" + k] || 0) || 0; } catch (e2) {}
              var _cloudNewer = (_cw > 0) && (_cw > _lw);
              if (_hasLocal && !_cloudNewer) {
                console.warn("[云备份] 拒绝用云端值覆盖本地更新的图片键: " + k + " (lw=" + _lw + ",cw=" + _cw + ")");
                return;
              }
            } catch (e3) { /* 仲裁失败时保守不写图片，宁可漏填也不覆盖 */ return; }
          } else {
            /* 非图片键写入 localStorage，限制 40KB 防止 QuotaExceeded */
            try {
              if (typeof val === "string" && val.length > 40 * 1024) {
                console.warn("[云备份] 跳过向 localStorage 写入过大数据: " + k + " (" + Math.round(val.length / 1024) + "KB)");
              } else {
                localStorage.setItem(k, val);
              }
            } catch (e) {}
          }
          try { if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet(k, val); } catch (e) {}
          try { if (window._idbStore && window._idbStore.set) { window._idbStore.set(k, val); } } catch (e) {}
        }
        missing = missing.filter(_wtsOk);
        if (missing.length) {
          // 回填缺失 key：localStorage + 内存 + IDB 三层同时写入
          missing.forEach(_fill);
          console.warn("[云备份] 已从云端恢复 " + missing.length + " 项缺失数据");
          // 恢复完成后立即刷新界面（联系人/聊天/头像/预览），让恢复的数据即刻生效
          try { if (window.__akiniOnCriticalRestored) window.__akiniOnCriticalRestored(); } catch (e) {}
        }
        // 图像键延迟批：本地对账完成后再判断（最多等 30s），含两条通道——
        // ① 仍缺失且云端不旧于本地记录 → 回填；② 云端时间戳明显更新 → 即使本地非空也覆盖
        //    （破解"IDB 旧值先被 restoreAll 巩固进内存，云端新值永远进不来"的死锁）
        if (pendingImgs.length) {
          var _tries = 0;
          (function _waitStorage() {
            if (!window.__akiniStorageRestored && _tries++ < 100) { setTimeout(_waitStorage, 300); return; }
            var late = [], newer = [];
            pendingImgs.forEach(function (k) {
              var local = null;
              try { local = localStorage.getItem(k); } catch (e) {}
              var mem = null;
              try { if (window.akiniStore && window.akiniStore.memoryGet) mem = window.akiniStore.memoryGet(k); } catch (e) {}
              var hasLocal = mem != null && mem !== "" && mem !== "null" && mem !== "undefined";
              var empty = !hasLocal;
              var lw = (window.__akiniImgWts && window.__akiniImgWts.local(k)) || 0;
              var cw = 0; try { cw = +(cloud["akini_wts_" + k] || 0) || 0; } catch (e1) {}
              /* 仅在云端时间戳确实更新(cw>lw)时才覆盖本地，杜绝"巩固旧值"再被旧值覆盖 */
              if (cw > 0 && cw > lw) { newer.push(k); return; }
              if (empty && _wtsOk(k)) late.push(k);
            });
            var did = late.length + newer.length;
            if (did > 0) {
              late.forEach(_fill);
              newer.forEach(_fill);
              console.warn("[云备份] 图像键延迟批恢复 " + did + " 项" + (newer.length ? "（含 " + newer.length + " 项云端较新覆盖）" : ""));
              try { if (window.__akiniOnCriticalRestored) window.__akiniOnCriticalRestored(); } catch (e) {}
            }
          })();
        }
        // 缺失较多说明本地被清理过：回填后不自动刷新。
        // 去掉 location.reload()。iOS/PWA 上它会造成"恢复→刷新→再恢复"的
        // 白屏/闪屏循环，而回填的数据已经在内存里，下次启动自然会用上。
        if (missing.length >= 3) {
          console.warn("[云备份] 本地缺失 " + missing.length + " 项，已回填到内存（不再自动刷新）");
        }
      }).catch(function () {
        // 网络失败：不标记完成（防止空数据覆盖云端），10 秒后自动重试
        setTimeout(restore, 10000);
      });
    } catch (e) {}
  }

  // ---- 钩子 ----
  // 页面隐藏时不执行云备份，回前台后补跑
  var _pendingHideBackup = false;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      _pendingHideBackup = true; // 仅做标记，回前台补跑
    } else if (_pendingHideBackup) {
      _pendingHideBackup = false;
      setTimeout(function () { backup(false); }, 2000); // 回前台 2s 后补跑，避开 UI 恢复高峰
    }
  });
  // pagehide / beforeunload 不再触发备份：冻结窗口内的重序列化正是被杀原因；
  // 本地 IDB 已即时持久化，下次打开页面后 150s 周期内自动补上云端。
  // 每 150 秒周期检测（有变化才上传；切后台/关闭页面前仍有即时备份）
  // 60s 全量 collectAll+stringify 是主线程卡顿/掉帧大户，恢复 150s；后台时 backup(false) 内部已跳过
  setInterval(function () { backup(false); }, 150000);
  // 启动：立即发起恢复（不再延迟，尽早兜底），30 秒后开始周期备份
  restore();
  setTimeout(function () { backup(false); }, 30000);

  // ---- 清除云端备份：清除数据时调用，保证云端同样归0 ----
  function wipeCloud() {
    try {
      // zzzx：同步清空大体积内容表
      try {
        fetch(SUPA_URL + "/rest/v1/" + BLOB_TABLE + "?device_id=eq." + encodeURIComponent(DEVICE_ID), {
          method: "DELETE",
          headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
          keepalive: true,
        }).catch(function () {});
      } catch (e0) {}
      return fetch(SUPA_URL + "/rest/v1/" + TABLE + "?device_id=eq." + encodeURIComponent(DEVICE_ID), {
        method: "DELETE",
        headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
        keepalive: true,
      }).then(function (r) {
        if (r.ok) {
          _lastBackupSig = "";
          _cloudKeyCount = 0;
          try { localStorage.removeItem("akini_cloud_backup_at"); } catch (e) {}
        }
        return r.ok;
      }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  /* 强制云端恢复：用云端数据覆盖本地全部 akini_ 键（数据被默认值覆盖时的救命稻草）。
     仅在用户主动调用时执行，绝不自动触发。恢复完成后刷新页面生效。 */
  function forceRestore(done) {
    try {
      fetch(SUPA_URL + "/rest/v1/" + TABLE + "?device_id=eq." + encodeURIComponent(DEVICE_ID) + "&select=payload,updated_at", {
        headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY },
      }).then(function (r) {
        if (!r.ok) { if (done) done(false, "HTTP " + r.status); return; }
        return r.json();
      }).then(function (rows) {
        if (!rows || !rows.length || !rows[0].payload) { if (done) done(false, "云端无数据"); return; }
        var cloud = null;
        try { cloud = JSON.parse(rows[0].payload); } catch (e) { if (done) done(false, "解析失败"); return; }
        if (!cloud || typeof cloud !== "object") { if (done) done(false, "数据格式错误"); return; }
        var keys = Object.keys(cloud).filter(function (k) { return k && cloud[k] && cloud[k] !== "null" && cloud[k] !== "undefined"; });
        var ok = 0;
        keys.forEach(function (k) {
          try {
            var val = cloud[k];
            if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet(k, val);
            if (window._idbStore && window._idbStore.set) window._idbStore.set(k, val);
            if (typeof val === "string" && val.length < 40 * 1024) {
              try { localStorage.setItem(k, val); } catch (e) {}
            }
            ok++;
          } catch (e) {}
        });
        console.warn("[云备份] 强制恢复完成，共覆盖 " + ok + " 项数据，请刷新页面");
        if (done) done(true, ok);
      }).catch(function () { if (done) done(false, "网络错误"); });
    } catch (e) { if (done) done(false, String(e)); }
  }

  window.__akiniCloudBackup = { backup: backup, restore: restore, forceRestore: forceRestore, wipeCloud: wipeCloud, deviceId: DEVICE_ID };
  console.log("[云备份] 已启用，设备 " + DEVICE_ID);
})();

;
/* ===== akini-novel-companion.js ===== */
/* ============================================================
 * Akini 小说 & 陪伴 模块
 * 小说：导入 txt / 书架 3 列 / 长按换封面改名 / 选人共读 / 阅读页头像栏 + 三点菜单
 *       （背景、字号、翻页方式：下滑滚动 / 左右翻页；深色背景自动浅字）
 * 陪伴：选人（复刻网易云一起听）→ 双方头像 + 波形爱心 + 浅粉动态环 + 陪伴计时
 *       + 双方消息区（顶部渐变）+ 消息/表情线条输入栏 + ⋮（换背景带浅黑蒙层/退出）
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 通用工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function idbSet(k, v) { try { window._idbStore && window._idbStore.set(k, v, function () {}); } catch (e) {} }
  function idbGet(k, cb) {
    try {
      if (window._idbStore && window._idbStore.get) { window._idbStore.get(k, function (v) { cb(v == null ? null : v); }); return; }
    } catch (e) {}
    cb(null);
  }
  function lsSet(k, v) { try { Storage.prototype.setItem.call(localStorage, k, v); } catch (e) {} }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function isImgSrc(s) { return typeof s === 'string' && /^(data:|https?:|blob:)/.test(s); }
  /* 头像渲染统一走主程序 nt()：默认头像（空/emoji/文字）→ 线条人像 SVG，真实图片 → img（全局约定） */
  function avatarInner(url) {
    if (window.nt) { try { return window.nt(url || '', 40); } catch (e) {} }
    if (!isImgSrc(url) && window.__akiniLineAvatarImg) return window.__akiniLineAvatarImg();
    if (isImgSrc(url)) return '<img src="' + esc(url) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    return '';
  }
  function myAvatar() {
    var a = lsGet('akini_my_avatar', '');
    if (!a && window.__akiniAvatarCache && window.__akiniAvatarCache.my) a = window.__akiniAvatarCache.my;
    return a || '\uD83D\uDC31';
  }
  function contacts() {
    try { return (window.akiniContacts && window.akiniContacts.getContacts) ? (window.akiniContacts.getContacts() || []) : []; } catch (e) { return []; }
  }
  function contactById(id) {
    try { return (window.akiniContacts && window.akiniContacts.getContactById) ? window.akiniContacts.getContactById(id) : null; } catch (e) { return null; }
  }
  function goHome() { try { window.navTo('home'); } catch (e) { var h = $('homeArea'); if (h) h.style.display = 'flex'; } }
  function openSheet(id) { var e = $(id); if (!e) return; if (e.parentNode !== document.body) { try { document.body.appendChild(e); } catch (err) {} } e.style.display = 'flex'; }
  function closeSheet(id) { var e = $(id); if (e) e.style.display = 'none'; }

  /* ============================================================
   * 一、陪伴
   * ============================================================ */
  var COMPANION_KEY = 'akini_companion_state';
  var COMPANION_BG_KEY = 'akini_companion_bg';
  var _companionSel = null;
  var _companionTimer = null;
  var _companionBg = ''; /* 内存缓存，进入时从 IDB 读 */

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
    /* 陪伴气泡不显示头像，仅消息内容居中 */
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
  }
  function saveCompanionHistory(arr) { lsSet(COMPANION_HISTORY_KEY, JSON.stringify(arr)); }

  function pushCompanionHistory(st) {
    /* st: { cid, ts, msgs } → 记录对象名/时长/消息条数 */
    if (!st || !st.cid) return;
    var c = contactById(st.cid);
    var name = c ? (c.name || '未命名') : '对方';
    var durMs = Date.now() - (st.ts || Date.now());
    var msgs = st.msgs || [];
    var msgCount = msgs.length;
    /* 陪伴内容：从 r6 首页写入的 localStorage 读取 */
    var content = '';
    try { content = localStorage.getItem('akini_companion_content') || ''; } catch (e) {}
    /* 聊天记录总结：取最后一条文本消息片段，无文本则显示条数 */
    var summary = '';
    for (var i = msgs.length - 1; i >= 0; i--) {
      var m = msgs[i];
      if (m && m.text && String(m.text).trim()) { summary = String(m.text).trim(); break; }
    }
    if (!summary) summary = '共' + msgCount + '条消息';
    else if (summary.length > 30) summary = summary.substring(0, 30) + '…';
    var arr = companionHistory();
    arr.unshift({
      cid: st.cid,
      name: name,
      avatar: c ? (c.avatar || '') : '',
      duration: durMs,
      msgCount: msgCount,
      startTs: st.ts,
      endTs: Date.now(),
      content: content,
      summary: summary
    });
    /* 最多保留 100 条 */
    if (arr.length > 100) arr.length = 100;
    saveCompanionHistory(arr);
  }

  function renderCompanionHistory() {
    var list = $('companionHistoryList');
    if (!list) return;
    var arr = companionHistory();
    if (!arr.length) {
      list.innerHTML = '<div style="text-align:center;color:#bbb;font-size:14px;padding:60px 0;line-height:1.8">暂无陪伴历史</div>';
      return;
    }
    list.innerHTML = arr.map(function (h) {
      var dur = fmtDur(h.duration || 0);
      var d = h.startTs ? new Date(h.startTs) : null;
      var dateStr = d ? (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) : '';
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0">'
        + '<div style="width:44px;height:44px;border-radius:50%;background:#e8e8e8;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">' + avatarInner(h.avatar) + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:15px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(h.name) + '</div>'
        + '<div style="font-size:12px;color:#999;margin-top:2px">' + esc(dateStr) + '</div>'
        + '</div>'
        + '<div style="text-align:right;flex-shrink:0">'
        + '<div style="font-size:13px;color:#666">' + dur + '</div>'
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

  /* 陪伴界面与首页聊天预览、双人头像、一起听（含总结卡片/详情）共用「交换双方头像位置」开关，
     开启时左右头像互换，关闭时还原；开关切换后由 __akiniRefreshCompanionAvatars 即时刷新 */
  function companionSwapped() {
    try {
      if (typeof window.isSwapped === 'function') return !!window.isSwapped();
      var v = lsGet('akini_swap_avatar_pos', '0');
      return '1' === v || 'true' === v;
    } catch (e) { return false; }
  }
  function applyCompanionAvatars(c) {
    var myA = $('companionMyAvatar'), taA = $('companionTaAvatar');
    var mine = avatarInner(myAvatar()), other = avatarInner(c ? c.avatar : '');
    var sw = companionSwapped();
    if (myA) myA.innerHTML = sw ? other : mine;
    if (taA) taA.innerHTML = sw ? mine : other;
  }
  window.__akiniRefreshCompanionAvatars = function () {
    try {
      var st = companionState();
      if (!st || !st.cid) return;
      applyCompanionAvatars(contactById(st.cid));
    } catch (e) {}
  };

  function enterCompanionMain(st) {
    var c = contactById(st.cid);
    var name = c ? (c.name || '未命名') : '对方';
    applyCompanionAvatars(c);
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
    /* 退出陪伴后回到「开始陪伴」首页，不回手机首页（和退出一起听行为一致） */
    try {
      var compApp = document.getElementById('app-companion');
      if (compApp) { compApp.style.display = 'none'; compApp.classList.remove('show'); }
    } catch (e) {}
    if (typeof window.__akiniShowCompanionHome === 'function') {
      window.__akiniShowCompanionHome();
    } else {
      var compHome = document.getElementById('companionHomeOverlay');
      if (compHome) compHome.style.display = 'flex';
    }
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
    if (!Array.isArray(arr)) arr = [];
    try {
      var legacy = JSON.parse(lsGet('akini_stickers', '[]')) || [];
      if (Array.isArray(legacy) && legacy.length) arr = arr.concat(legacy);
    } catch (e) {}
    var out = [], seen = {};
    arr.forEach(function (it) {
      var s2 = '';
      if (typeof it === 'string') s2 = it;
      else if (it && typeof it.s === 'string') s2 = it.s;
      var blocked = it && typeof it === 'object' && (it.b === 1 || it.b === true || it.b === '1');
      /* 去重 key 用完整 dataURL——slice(0,64) 前缀撞车会误杀同规格图片 */
      if (!blocked && /^data:image\//.test(s2) && !seen[s2]) { seen[s2] = 1; out.push(s2); }
    });
    return out;
  }
  function companionStickerPool(cid) {
    /* 该联系人专属表情包（与观影 watchStickerPool 同数据源 getContactStickersSync） */
    var out = [];
    try {
      if (typeof window.__akiniStickerSrcs === 'function') {
        out = window.__akiniStickerSrcs(cid);
      } else {
        var own = typeof window.getContactStickersSync === 'function' ? window.getContactStickersSync(cid) : [];
        (Array.isArray(own) ? own : []).forEach(function (it) {
          var s2 = '';
          if (typeof it === 'string') s2 = it;
          else if (it && typeof it.s === 'string') s2 = it.s;
          var blocked = it && typeof it === 'object' && (it.b === 1 || it.b === true || it.b === '1');
          if (!blocked && /^data:image\//.test(s2)) out.push(s2);
        });
      }
    } catch (e) {}
    return out;
  }
  function showCompanionTyping() {
    /* 微信同款正在输入：消息区左下角、无头像、仅三点气泡 */
    var box = $('companionMsgs');
    if (!box || $('companionTyping')) return;
    var t = document.createElement('div');
    t.id = 'companionTyping';
    t.className = 'akcp-typing';
    t.innerHTML = '<span class="wt-dot"></span><span class="wt-dot"></span><span class="wt-dot"></span>';
    box.appendChild(t);
    box.scrollTop = box.scrollHeight;
  }
  function hideCompanionTyping() {
    var t = $('companionTyping');
    if (t) t.remove();
  }
  function scheduleCompanionReply(cid) {
    /* 回复节奏照搬微信/观影：设置页回复延迟范围（默认 2~5s）
       输入动态改为发消息后 ~0.4s 立即出现（微信真实体验是秒出），回复仍按延迟范围送达 */
    var dMin = parseFloat(lsGet('akini_num_replyDelayMin', '2'));
    var dMax = parseFloat(lsGet('akini_num_replyDelayMax', '5'));
    if (!(dMin >= 0)) dMin = 2;
    if (!(dMax >= dMin)) dMax = Math.max(dMin, 5);
    var delayMs = 1000 * (dMin + Math.random() * (dMax - dMin));
    setTimeout(function () { if (companionState()) showCompanionTyping(); }, 400);
    setTimeout(function () {
      hideCompanionTyping();
      var cur = companionState();
      if (!cur) return;
      /* 表情包：概率与 syy 聊天一致（20%），仅用该联系人自己的专属收藏，裸图无气泡 */
      var stkProb = 0.2;
      if (Math.random() < stkProb) {
        var pool = companionStickerPool(cur.cid);
        if (pool.length) {
          cur.msgs = cur.msgs || [];
          cur.msgs.push({ side: 'ta', img: pool[Math.floor(Math.random() * pool.length)], ts: Date.now() });
          saveCompanionState(cur);
          renderCompanionMsgs(true);
          __notifyCompanionMsg(cur.cid, '[表情包]');
          return;
        }
      }
      /* 文本回复：从该联系人字卡库抽取 */
      var t = '';
      try { t = window.pickWordCards ? window.pickWordCards(1, cur.cid) : ''; } catch (e) {}
      t = (t || '').split('\n')[0].trim();
      if (!t) return;
      cur.msgs = cur.msgs || [];
      cur.msgs.push({ side: 'ta', text: t, ts: Date.now() });
      saveCompanionState(cur);
      renderCompanionMsgs(true);
      __notifyCompanionMsg(cur.cid, t);
    }, delayMs);
  }
  /* 用户不在陪伴界面时，联系人消息触发局内通知（内部自动处理后台系统通知），与微信聊天一致 */
  function __notifyCompanionMsg(cid, msg) {
    try {
      var mv = $('companionMainView');
      if (!mv || mv.style.display !== 'none') return; /* 界面可见时无需通知 */
      if (typeof window.showInAppNotif !== 'function') return;
      var cc = getContactById(cid);
      /* 不在陪伴界面时计未读角标 */
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
    /* 已固定单人陪伴：没有默认联系人时直接回首页，不再显示选择页 */
    goHome();
  };
  window.companionState = companionState;

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
      this.value = '';
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        shrinkImage(fr.result, 750, 1334, function (url) {
          _companionBg = url;
          idbSet(COMPANION_BG_KEY, url);
          applyCompanionBg();
        });
      };
      fr.readAsDataURL(f);
    });

    if (msgInput) msgInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sendCompanionMsg(); }
    });

    if (emojiBtn) emojiBtn.addEventListener('click', function () {
      /* 表情面板 = 我给自己添加的表情包（字卡库-表情包 tab） */
      if (emojiGrid) {
        var pool = myStickerPool();
        if (pool.length) {
          emojiGrid.innerHTML = pool.map(function (s2, i) {
            return '<button type="button" class="akcp-stk" data-i="' + i + '" style="background:0 0;border:none;padding:4px;cursor:pointer;touch-action:manipulation"><img src="' + esc(s2) + '" style="width:62px;height:62px;object-fit:contain;display:block;pointer-events:none" alt="表情包"></button>';
          }).join('');
          Array.prototype.forEach.call(emojiGrid.querySelectorAll('.akcp-stk'), function (el) {
            el.addEventListener('click', function () {
              var s2 = pool[parseInt(el.getAttribute('data-i'), 10)];
              if (s2) sendCompanionMsg(s2);
              closeSheet('companionEmojiSheet');
            });
          });
        } else {
          emojiGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#999;font-size:13px;padding:34px 0;line-height:1.9">还没有表情包<br>去字卡库-表情包里添加吧</div>';
        }
      }
      openSheet('companionEmojiSheet');
    });
    if (emojiSheet) emojiSheet.addEventListener('click', function (e) { if (e.target === emojiSheet) closeSheet('companionEmojiSheet'); });
  }

  /* ============================================================
   * 二、小说
   * ============================================================ */
  var BOOKS_KEY = 'akini_novel_books';
  var CONTENT_PREFIX = 'akini_novel_content_';
  var PROGRESS_PREFIX = 'akini_novel_progress_';
  var PAGEPROG_PREFIX = 'akini_novel_pageprog_';
  var SETTING_KEY = 'akini_novel_reader_settings';

  var _books = [];
  var _booksLoaded = false;
  var _curBook = null;
  var _readerContact = null;
  var _readerContacts = []; /* 共读多选 */
  var _readerParas = [];
  var _readerIdx = 0;
  var _readerChapters = []; /* 当前书籍章节索引列表 [{title,pidx}] */
  var RENDER_CHUNK = 120;

  var COVER_GRADS = [
    ['#f6d5c3', '#e8a87c'], ['#c3d9f6', '#7ca8e8'], ['#333333', '#333333'],
    ['#f6c3d9', '#e87ca8'], ['#e6d5f6', '#b07ce8'], ['#f6efc3', '#e8d07c']
  ];
  var DARK_BG = '#2a2a2e';

  function saveBooks() {
    var payload = JSON.stringify(_books);
    /* 书架 JSON 双写：IDB + localStorage */
    try { idbSet(BOOKS_KEY, payload); } catch (e) {}
    try { window._idbStore && window._idbStore.flush && window._idbStore.flush(); } catch (e) {}
    try { lsSet(BOOKS_KEY, payload); } catch (e) {
      /* localStorage 配额已满时，至少保证 IDB 已成功写入，不抛错 */
    }
  }

  function loadBooks(cb) {
    if (_booksLoaded) { cb(); return; }
    var _done = function (stored) {
      try {
        if (!Array.isArray(stored)) stored = [];
        /* 异步读回的是导入前的旧快照，而内存里可能已有刚 push 的新书——
           合并去重而不是直接覆盖，防止"首次导入后书架空白、重启才出现" */
        if (_books && _books.length) {
          var seen = {};
          stored.forEach(function (b) { if (b && b.id) seen[b.id] = 1; });
          _books.forEach(function (b) { if (b && b.id && !seen[b.id]) stored.push(b); });
        }
        _books = stored;
      } catch (e) { if (!Array.isArray(_books)) _books = []; }
      _booksLoaded = true;
      cb();
    };
    idbGet(BOOKS_KEY, function (v) {
      try {
        var arr = v ? JSON.parse(v) : null;
        if (Array.isArray(arr) && arr.length) { _done(arr); return; }
      } catch (e) {}
      /* IDB 未读到/为空时，读 localStorage 兜底 */
      try {
        var ls = lsGet(BOOKS_KEY, '');
        var arr2 = ls ? JSON.parse(ls) : null;
        if (Array.isArray(arr2) && arr2.length) { _done(arr2); return; }
      } catch (e) {}
      _done([]);
    });
  }

  function defaultCover(b) {
    var h = 0;
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
    /* 章节缓存只写 IDB，不再写 localStorage（防止大文本爆配额） */
    try { idbSet(CHAPTER_CACHE_PREFIX + bookId, JSON.stringify(chapters)); } catch (e) {}
    try { window._idbStore && window._idbStore.flush && window._idbStore.flush(); } catch (e) {}
  }
  function loadCachedChapters(bookId) {
    try {
      if (window._idbStore && window._idbStore.getSync) {
        var v = window._idbStore.getSync(CHAPTER_CACHE_PREFIX + bookId);
        if (v) return JSON.parse(v);
      }
    } catch (e) {}
    /* 兼容 之前写进 localStorage 的少量缓存 */
    try { var v = lsGet(CHAPTER_CACHE_PREFIX + bookId, ''); return v ? JSON.parse(v) : []; } catch (e) { return []; }
  }

  function importNovel(file) {
    if (!file) return;
    /* 超大文件护栏——超过 120MB 的 txt 在手机上必然内存崩溃，直接拒绝并明确提示，绝不卡崩 */
    if (file.size > 120 * 1024 * 1024) {
      alert('文件过大（' + Math.round(file.size / 1048576) + 'MB），超过 120MB 无法导入\n请把小说拆分成多个小文件后分别导入');
      return;
    }
    /* 修复：decodeText 是同步函数(只吃 ArrayBuffer)，之前误按"异步回调"传 File 对象，
       回调永远不会执行 → 用户点了导入毫无反应。改用 FileReader 读 ArrayBuffer 后同步解码 */
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var txt = decodeText(fr.result) || '';
        txt = txt.replace(/^﻿/, '').trim();
        if (!txt) { alert('导入失败：文件内容为空或无法识别'); return; }
        var title = (file.name || '未命名').replace(/\.[^.]+$/, '') || '未命名';
        var id = 'nv' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
        var book = { id: id, title: title, cover: '', fileName: file.name, addedAt: Date.now() };
        _books.push(book);
        saveBooks();
        idbSet(CONTENT_PREFIX + id, txt);
        /* 导入时立即解析章节并缓存 */
        var tmpParas = txt.split(/\n+/).map(function (p) { return p.trim(); }).filter(function (p) { return p !== ''; });
        var chs = parseChapters(tmpParas);
        cacheChapters(id, chs);
        window.__renderNovelShelf();
      } catch (e) { alert('导入失败：' + (e && e.message ? e.message : '文件解析出错')); }
    };
    fr.onerror = function () { alert('导入失败：文件读取失败'); };
    fr.readAsArrayBuffer(file);
  }

  /* ---------- 封面/背景图压缩 ---------- */
  /* 源头修复：原图直接存，不再 canvas downscale + toDataURL 0.82 重编码
     之前封面/背景图每次导入都被压成 0.82 quality 的 jpeg，导致二次打开糊得一批。
     localStorage 容量由用户自己控制，源头不做画质取舍。 */
  function shrinkImage(dataUrl, maxW, maxH, cb) { cb(dataUrl); }

  /* ---------- 选人共读弹层 ---------- */
  function openNovelPicker() {
    var d = window.__akiniDefaultContact && window.__akiniDefaultContact();
    if (d) {
      _readerContact = d.id;
      _readerContacts = [d.id];
      openReader();
      return;
    }
    _readerContact = null;
    _readerContacts = [];
    renderNovelPickerList();
    openSheet('novelPickerOverlay');
  }

  function renderNovelPickerList() {
    var list = $('novelPickerList');
    if (!list) return;
    var cs = contacts();
    if (!cs.length) {
      list.innerHTML = '<div style="text-align:center;color:#999;font-size:14px;padding:40px 0;line-height:1.8">还没有联系人<br>去微信-通讯录添加一位吧</div>';
      return;
    }
    list.innerHTML = cs.map(function (c) {
      var on = _readerContacts.indexOf(c.id) >= 0;
      return '<div class="aknv-item" data-cid="' + esc(c.id) + '" style="display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid #f0f0f0;cursor:pointer;-webkit-tap-highlight-color:transparent">'
        + '<div style="width:22px;height:22px;border-radius:50%;border:2px solid ' + (on ? '#1a1a1a' : '#ddd') + ';background:' + (on ? '#1a1a1a' : '#fff') + ';color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + (on ? '\u2713' : '') + '</div>'
        + '<div style="width:40px;height:40px;border-radius:50%;background:#e8e8e8;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">' + avatarInner(c.avatar) + '</div>'
        + '<div style="flex:1;min-width:0;font-size:15px;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(c.name || '未命名') + '</div>'
        + '</div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.aknv-item'), function (el) {
      el.addEventListener('click', function () {
        var cid = el.getAttribute('data-cid');
        var ix = _readerContacts.indexOf(cid);
        if (ix >= 0) _readerContacts.splice(ix, 1); else _readerContacts.push(cid);
        _readerContact = _readerContacts[0] || null;
        renderNovelPickerList();
      });
    });
  }

  /* ---------- 阅读页设置 ---------- */
  function readerSettings() {
    try { return JSON.parse(lsGet(SETTING_KEY, 'null')) || {}; } catch (e) { return {}; }
  }
  function saveReaderSettings(s) { lsSet(SETTING_KEY, JSON.stringify(s)); }
  function flipMode() { return readerSettings().flip === 'page' ? 'page' : 'scroll'; }

  function applyReaderSettings() {
    var s = readerSettings();
    var page = $('app-novel-reader');
    var content = $('novelReaderContent');
    var fsEl = $('novelFontSizeValue');
    var fs = Math.min(28, Math.max(14, parseInt(s.fontSize, 10) || 18));
    var dark = (s.bgColor === DARK_BG);
    if (content) {
      content.style.fontSize = fs + 'px';
      content.style.lineHeight = '1.9';
      /* 深色背景自动切浅色文字，避免黑底看不见 */
      content.style.color = dark ? '#d8d8d8' : '#2b2b2b';
    }
    if (fsEl) fsEl.textContent = String(fs);
    if (page) {
      if (isImgSrc(s.bg)) {
        page.style.background = '#f5f0e8';
        page.style.backgroundImage = 'url(' + s.bg + ')';
        page.style.backgroundSize = 'cover';
        page.style.backgroundPosition = 'center';
        /* 图片背景上叠一层浅色蒙层保证文字可读 */
        page.style.boxShadow = 'inset 0 0 0 999px rgba(255,255,255,0.42)';
      } else {
        page.style.backgroundImage = '';
        page.style.background = s.bgColor || '#f5f0e8';
        page.style.boxShadow = 'none';
      }
    }
    var row = $('novelBgColors');
    if (row) {
      Array.prototype.forEach.call(row.children, function (el) {
        var c = el.getAttribute('data-color');
        el.style.boxShadow = (c === s.bgColor && !isImgSrc(s.bg)) ? '0 0 0 2px #1a1a1a' : 'none';
      });
    }
    /* 翻页方式按钮态 */
    var bScroll = $('novelFlipScroll'), bPage = $('novelFlipPage');
    var isPage = flipMode() === 'page';
    if (bScroll) { bScroll.style.background = isPage ? '#f8f8f8' : '#1a1a1a'; bScroll.style.color = isPage ? '#333' : '#fff'; bScroll.style.border = isPage ? '1px solid #e0e0e0' : 'none'; }
    if (bPage) { bPage.style.background = isPage ? '#1a1a1a' : '#f8f8f8'; bPage.style.color = isPage ? '#fff' : '#333'; bPage.style.border = isPage ? 'none' : '1px solid #e0e0e0'; }
  }

  /* ---------- 翻页（左右）模式 ---------- */
  var _pagedPages = [];
  var _pagedIdx = 0;

  function pageWidth() {
    var content = $('novelReaderContent');
    return content ? content.clientWidth : 1;
  }

  function pageHeight() {
    var content = $('novelReaderContent');
    return content ? content.clientHeight : 1;
  }

  /* 视口真实分页算法：逐段渲染到隐藏测量容器，溢出则分页 */
  function _computePages() {
    if (!_readerParas.length) { _pagedPages = [[]]; return; }
    var content = $('novelReaderContent');
    if (!content) { _pagedPages = [[]]; return; }
    
    // 创建测量容器，完全继承当前正文样式
    var meas = document.createElement('div');
    meas.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:' + (pageWidth() - 40) + 'px;visibility:hidden;box-sizing:content-box;';
    var s = readerSettings();
    meas.style.fontSize = s.fontSize + 'px';
    meas.style.lineHeight = s.lineHeight;
    meas.style.color = s.textColor;
    meas.style.background = 'transparent';
    document.body.appendChild(meas);

    var maxH = pageHeight() - 40; // 减去上下 padding
    var pages = [];
    var currentPageParas = [];
    var currentH = 0;
    var pStyle = 'margin:0 0 1em;text-indent:2em;word-break:break-all;';

    for (var i = 0; i < _readerParas.length; i++) {
      var para = _readerParas[i];
      meas.innerHTML = '<p style="' + pStyle + '">' + esc(para) + '</p>';
      var h = meas.firstChild.getBoundingClientRect().height;
      if (h > maxH) {
        // 单段超过一页：按字符拆分
        var chars = para.split('');
        var chunk = '';
        for (var j = 0; j < chars.length; j++) {
          chunk += chars[j];
          meas.innerHTML = '<p style="' + pStyle + '">' + esc(chunk) + '</p>';
          if (meas.firstChild.getBoundingClientRect().height > maxH) {
            chunk = chunk.slice(0, -1);
            if (currentH + meas.firstChild.getBoundingClientRect().height > maxH && currentPageParas.length) {
              pages.push(currentPageParas);
              currentPageParas = [];
              currentH = 0;
            }
            currentPageParas.push(chunk);
            currentH += meas.firstChild.getBoundingClientRect().height;
            chunk = chars[j];
          }
        }
        if (chunk) {
          meas.innerHTML = '<p style="' + pStyle + '">' + esc(chunk) + '</p>';
          if (currentH + meas.firstChild.getBoundingClientRect().height > maxH && currentPageParas.length) {
            pages.push(currentPageParas);
            currentPageParas = [];
            currentH = 0;
          }
          currentPageParas.push(chunk);
          currentH += meas.firstChild.getBoundingClientRect().height;
        }
      } else {
        if (currentH + h > maxH && currentPageParas.length) {
          pages.push(currentPageParas);
          currentPageParas = [];
          currentH = 0;
        }
        currentPageParas.push(para);
        currentH += h;
      }
    }
    if (currentPageParas.length) pages.push(currentPageParas);
    if (!pages.length) pages.push([]);
    _pagedPages = pages;
    document.body.removeChild(meas);
  }

  function _renderPaged() {
    var content = $('novelReaderContent');
    var ind = $('novelPageIndicator');
    if (!content || !ind) return;
    content.innerHTML = '';
    content.style.overflowY = 'hidden';
    content.style.overflowX = 'hidden';
    
    var pageParas = _pagedPages[_pagedIdx] || [];
    var html = '';
    for (var i = 0; i < pageParas.length; i++) {
      var gi = _readerParas.indexOf(pageParas[i]);
      html += '<p data-pidx="' + gi + '" style="margin:0 0 1em;text-indent:2em;word-break:break-all">' + esc(pageParas[i]) + '</p>';
    }
    content.innerHTML = html;
    try { window._akiniDecorateCm && window._akiniDecorateCm(); } catch (e) {}
    ind.textContent = (_pagedIdx + 1) + '/' + _pagedPages.length;
    ind.style.display = 'block';
    
    // 滚动到顶部，模拟真实翻页
    content.scrollTop = 0;
  }

  function enterPageMode() {
    var content = $('novelReaderContent');
    if (!content) return;
    content.classList.add('paged');
    _computePages();
    _renderPaged();
  }

  function exitPageMode() {
    var content = $('novelReaderContent');
    if (!content) return;
    content.classList.remove('paged');
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
  }

  function updatePageIndicator() {
    var ind = $('novelPageIndicator');
    if (!ind) return;
    if (flipMode() !== 'page') { ind.style.display = 'none'; return; }
    ind.textContent = (_pagedIdx + 1) + '/' + _pagedPages.length;
    ind.style.display = 'block';
  }

  function nextPage() {
    if (_pagedIdx < _pagedPages.length - 1) {
      _pagedIdx++;
      _renderPaged();
      savePageProgress();
    }
  }

  function prevPage() {
    if (_pagedIdx > 0) {
      _pagedIdx--;
      _renderPaged();
      savePageProgress();
    }
  }

  function savePageProgress() {
    if (!_curBook) return;
    lsSet(PAGEPROG_PREFIX + _curBook.id, String(_pagedIdx));
  }

  function restorePageProgress() {
    var content = $('novelReaderContent');
    if (!content || !_curBook) return;
    var savedIdx = parseInt(lsGet(PAGEPROG_PREFIX + _curBook.id, '0'), 10) || 0;
    _pagedIdx = Math.min(savedIdx, Math.max(0, _pagedPages.length - 1));
    _renderPaged();
  }

  /* ---------- 章节自动解析 ----------
     识别常见章节标题：第1章 / 第一章 / 第001章 / Chapter 1 / 序章 / 前言 / 楔子 / 后记 等 */
  function parseChapters(paras) {
    var chapters = [];
    var re = /^(?:第\s*[0-9零一二三四五六七八九十百千万]+\s*[章卷回]|chapter\s+\d+|序[章言]?|前言|楔子|引子|尾声|后记|番外|终章)(.*)$/i;
    for (var i = 0; i < paras.length; i++) {
      var p = paras[i].trim();
      if (re.test(p)) {
        chapters.push({ title: p, pidx: i });
      }
    }
    return chapters;
  }

  /* ---------- 打开阅读页 ---------- */
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
  function closeChapterDrawer() {
    var drawer = $('novelChapterDrawer');
    var panel = $('novelChapterDrawerPanel');
    if (!drawer || !panel) return;
    panel.style.transform = 'translateX(-100%)';
    setTimeout(function () { drawer.style.display = 'none'; }, 260);
  }
  function renderChapterList(listEl) {
    if (!_readerParas.length) {
      listEl.innerHTML = '<div style="text-align:center;color:#bbb;font-size:14px;padding:40px 0">暂无章节</div>';
      return;
    }
    var html = '';
    if (!_readerChapters.length) {
      html += '<div style="padding:12px 18px;color:#888;font-size:13px;border-bottom:1px solid #f5f5f5">未识别到章节标题<br><span style="font-size:12px">章节名示例：第1章、第一章、Chapter 1</span></div>';
    }
    html += _readerChapters.map(function (ch, idx) {
      var num = idx + 1;
      return '<button class="novel-chapter-item" data-pidx="' + ch.pidx + '" type="button" style="display:block;width:100%;padding:13px 18px;background:#fff;border:none;border-bottom:1px solid #f5f5f5;text-align:left;font-size:15px;color:#1a1a1a;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;touch-action:manipulation">'
        + '<span style="display:inline-block;min-width:28px;color:#999;font-size:13px;margin-right:6px">' + num + '</span>'
        + esc(ch.title) + '</button>';
    }).join('');
    listEl.innerHTML = html;
    Array.prototype.forEach.call(listEl.querySelectorAll('.novel-chapter-item'), function (btn) {
      btn.addEventListener('click', function () {
        var pidx = parseInt(btn.getAttribute('data-pidx'), 10);
        if (isNaN(pidx)) return;
        jumpToParagraph(pidx);
        closeChapterDrawer();
      });
    });
  }
  function jumpToParagraph(pidx) {
    if (!_readerParas.length || pidx < 0 || pidx >= _readerParas.length) return;
    var content = $('novelReaderContent');
    if (!content) return;
    if (flipMode() === 'page') {
      /* 翻页模式：找到该段落所在页 */
      _pagedIdx = 0;
      for (var i = 0; i < _pagedPages.length; i++) {
        var page = _pagedPages[i];
        var has = false;
        for (var j = 0; j < page.length; j++) {
          if (_readerParas.indexOf(page[j]) === pidx) { has = true; break; }
        }
        if (has) { _pagedIdx = i; break; }
      }
      _renderPaged();
      savePageProgress();
    } else {
      /* 滚动模式：确保该段落已渲染再滚动 */
      if (_readerIdx <= pidx) {
        while (_readerIdx <= pidx && _readerIdx < _readerParas.length) renderMoreParas();
      }
      requestAnimationFrame(function () {
        var el = content.querySelector('[data-pidx="' + pidx + '"]');
        if (el) {
          content.scrollTop = Math.max(0, el.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 14);
        }
      });
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
    /* 导入小说 */
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
    if (menuOverlay) menuOverlay.addEventListener('click', function (e) { if (e.target === menuOverlay) closeSheet('novelReaderMenu'); });

    if (fsMinus) fsMinus.addEventListener('click', function () {
      var s = readerSettings();
      s.fontSize = Math.max(14, (parseInt(s.fontSize, 10) || 18) - 1);
      saveReaderSettings(s); applyReaderSettings(); updatePageIndicator();
    });
    if (fsPlus) fsPlus.addEventListener('click', function () {
      var s = readerSettings();
      s.fontSize = Math.min(28, (parseInt(s.fontSize, 10) || 18) + 1);
      saveReaderSettings(s); applyReaderSettings(); updatePageIndicator();
    });

    /* 阅读区点击左右翻页 */
    if (content) {
      content.addEventListener('click', function (e) {
        if (flipMode() !== 'page') return;
        var rect = content.getBoundingClientRect();
        var x = e.clientX - rect.left;
        if (x > rect.width * 0.7) { nextPage(); e.preventDefault();  return; }
        if (x < rect.width * 0.3) { prevPage(); e.preventDefault();  return; }
      });
      var _touchStartX = 0, _touchStartY = 0;
      content.addEventListener('touchstart', function (e) {
        if (flipMode() !== 'page') return;
        if (e.touches && e.touches.length) {
          _touchStartX = e.touches[0].clientX;
          _touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });
      content.addEventListener('touchend', function (e) {
        if (flipMode() !== 'page') return;
        if (e.changedTouches && e.changedTouches.length) {
          var dx = e.changedTouches[0].clientX - _touchStartX;
          var dy = e.changedTouches[0].clientY - _touchStartY;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) nextPage(); else prevPage();
          }
        }
      }, { passive: true });
    }
    if (bgRow) Array.prototype.forEach.call(bgRow.children, function (el) {
      el.addEventListener('click', function () {
        var s = readerSettings();
        s.bgColor = el.getAttribute('data-color');
        delete s.bg;
        saveReaderSettings(s); applyReaderSettings();
      });
    });
    if (bgInput) bgInput.addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        shrinkImage(fr.result, 750, 1334, function (url) {
          var s = readerSettings();
          s.bg = url;
          saveReaderSettings(s); applyReaderSettings();
        });
      };
      fr.readAsDataURL(f);
    });

    /* 翻页方式切换 */
    if (flipScroll) flipScroll.addEventListener('click', function () {
      var s = readerSettings();
      s.flip = 'scroll';
      saveReaderSettings(s); applyReaderSettings();
      if (_curBook) {
        savePageProgress();
        var content2 = $('novelReaderContent');
        if (content2) content2.innerHTML = '';
        _readerIdx = 0;
        exitPageMode();
        renderMoreParas();
        updatePageIndicator();
      }
    });
    if (flipPage) flipPage.addEventListener('click', function () {
      var s = readerSettings();
      s.flip = 'page';
      saveReaderSettings(s); applyReaderSettings();
      if (_curBook) {
        saveProgress();
        _readerIdx = 0;
        enterPageMode();
        restorePageProgress();
      }
    });

    if (pickerClose) pickerClose.addEventListener('click', function () { closeSheet('novelPickerOverlay'); });
    if (pickerOverlay) pickerOverlay.addEventListener('click', function (e) { if (e.target === pickerOverlay) closeSheet('novelPickerOverlay'); });
    if (pickerConfirm) pickerConfirm.addEventListener('click', function () {
      if (!_readerContacts.length) { alert('先选一位一起看的联系人吧~'); return; }
      _readerContact = _readerContacts[0];
      openReader();
    });

    if (actCancel) actCancel.addEventListener('click', function () { closeSheet('novelBookActions'); });
    if (actOverlay) actOverlay.addEventListener('click', function (e) { if (e.target === actOverlay) closeSheet('novelBookActions'); });
    if (actCover) actCover.addEventListener('click', function () {
      closeSheet('novelBookActions');
      if (coverInput) coverInput.click();
    });
    if (coverInput) coverInput.addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f || !_curBook) return;
      var fr = new FileReader();
      fr.onload = function () {
        shrinkImage(fr.result, 240, 320, function (url) {
          _curBook.cover = url;
          saveBooks();
          window.__renderNovelShelf();
        });
      };
      fr.readAsDataURL(f);
    });
    if (actRename) actRename.addEventListener('click', function () {
      closeSheet('novelBookActions');
      if (renameInput && _curBook) renameInput.value = _curBook.title;
      openSheet('novelRenameModal');
    });
    if (actDelete) actDelete.addEventListener('click', function () {
      closeSheet('novelBookActions');
      if (!_curBook) return;
      if (!confirm('确定删除《' + _curBook.title + '》吗？')) return;
      var id = _curBook.id;
      _books = _books.filter(function (b) { return b.id !== id; });
      saveBooks();
      try { window._idbStore && window._idbStore.remove && window._idbStore.remove(CONTENT_PREFIX + id); } catch (e) {}
      lsSet(PROGRESS_PREFIX + id, '0'); /* removeItem 被主程序禁用，写 0 重置 */
      lsSet(PAGEPROG_PREFIX + id, '0');
      window.__renderNovelShelf();
    });
    if (renameCancel) renameCancel.addEventListener('click', function () { closeSheet('novelRenameModal'); });
    if (renameOverlay) renameOverlay.addEventListener('click', function (e) { if (e.target === renameOverlay) closeSheet('novelRenameModal'); });
    if (renameOk) renameOk.addEventListener('click', function () {
      if (!_curBook) { closeSheet('novelRenameModal'); return; }
      var v = (renameInput && renameInput.value || '').trim();
      if (v) {
        _curBook.title = v.slice(0, 60);
        saveBooks();
        window.__renderNovelShelf();
      }
      closeSheet('novelRenameModal');
    });

    if (content) {
      var st = null;
      content.addEventListener('scroll', function () {
        if (st) clearTimeout(st);
        st = setTimeout(function () {
          if (flipMode() === 'page') {
            updatePageIndicator();
            savePageProgress();
          } else {
            if (content.scrollTop + content.clientHeight > content.scrollHeight - 600 && _readerIdx < _readerParas.length) {
              renderMoreParas();
            }
            saveProgress();
          }
        }, 200);
      }, { passive: true });
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
  function cmFmtTime(ts) {
    var d = new Date(ts);
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------- 段评标记渲染：段落末尾圆圈+数量 ---------- */
  window._akiniDecorateCm = function () {
    var content = $('novelReaderContent');
    if (!content || !_curBook) return;
    var list = cmLoad();
    var byPara = {};
    list.forEach(function (cm) {
      if (cm.pidx == null || cm.pidx < 0) return;
      (byPara[cm.pidx] = byPara[cm.pidx] || []).push(cm);
    });
    Array.prototype.forEach.call(content.querySelectorAll('p[data-pidx]'), function (p) {
      Array.prototype.forEach.call(p.querySelectorAll('.aknv-cmmark'), function (m) { m.remove(); });
      var pidx = parseInt(p.getAttribute('data-pidx'), 10);
      var cms = byPara[pidx];
      if (!cms || !cms.length) return;
      var total = 0;
      cms.forEach(function (cm) { total += (cm.list || []).length; });
      var mk = document.createElement('span');
      mk.className = 'aknv-cmmark';
      mk.setAttribute('data-pidx', String(pidx));
      /* 小圆圈+数字居中圈内，防全局样式覆盖（min/max-width + flex:0 0 固定 + line-height:1） */
      mk.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;min-width:18px;max-width:18px;flex:0 0 18px;border:1.5px solid #b08a4f;color:#b08a4f;border-radius:50%;font-size:' + (total > 9 ? '8px' : '10px') + ';line-height:1;font-weight:600;font-style:normal;text-align:center;text-indent:0;letter-spacing:0;padding:0;margin-left:3px;vertical-align:middle;cursor:pointer;box-sizing:border-box;background:rgba(255,255,255,.75)';
      mk.textContent = String(total);
      mk.addEventListener('click', function (e) {
        
        openCmView(pidx);
      });
      p.appendChild(mk);
    });
  };

  /* ---------- 长按选择 → 添加段评浮动条 ---------- */
  function ensureCmDom() {
    if ($('aknvSelBar')) return;
    var bar = document.createElement('div');
    bar.id = 'aknvSelBar';
    bar.style.cssText = 'display:none;position:fixed;z-index:6010;background:#1a1a1a;color:#fff;font-size:14px;padding:8px 16px;border-radius:8px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3);user-select:none;-webkit-user-select:none';
    bar.textContent = '添加段评';
    document.body.appendChild(bar);
    bar.addEventListener('click', function () {
      bar.style.display = 'none';
      if (_cmPending) openCmAdd();
    });

    var add = document.createElement('div');
    add.id = 'aknvCmAdd';
    add.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:6011;align-items:center;justify-content:center';
    add.innerHTML = '<div style="width:86%;max-width:340px;background:#fff;border-radius:14px;padding:16px;box-sizing:border-box">'
      + '<div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:8px">添加段评</div>'
      + '<div id="aknvCmAddQuote" style="font-size:13px;color:#888;background:#f6f6f6;border-radius:8px;padding:8px 10px;margin-bottom:10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-all"></div>'
      + '<textarea id="aknvCmAddInput" rows="3" maxlength="200" placeholder="写下你的段评" style="width:100%;box-sizing:border-box;border:1px solid #e0e0e0;border-radius:10px;padding:10px 12px;font-size:15px;outline:0;resize:none;color:#1a1a1a;font-family:inherit"></textarea>'
      + '<div style="display:flex;gap:10px;margin-top:12px"><button id="aknvCmAddCancel" type="button" style="flex:1;height:42px;border-radius:10px;border:1px solid #e0e0e0;background:#f8f8f8;color:#555;font-size:15px;cursor:pointer">取消</button><button id="aknvCmAddOk" type="button" style="flex:1;height:42px;border-radius:10px;border:none;background:#1a1a1a;color:#fff;font-size:15px;font-weight:600;cursor:pointer">保存</button></div>'
      + '</div>';
    document.body.appendChild(add);
    $('aknvCmAddCancel').addEventListener('click', function () { add.style.display = 'none'; _cmPending = null; });
    add.addEventListener('click', function (e) { if (e.target === add) { add.style.display = 'none'; _cmPending = null; } });
    $('aknvCmAddOk').addEventListener('click', saveCmAdd);

    var view = document.createElement('div');
    view.id = 'aknvCmView';
    view.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:6012;align-items:center;justify-content:center';
    view.innerHTML = '<div style="width:88%;max-width:360px;max-height:70vh;background:#fff;border-radius:18px;display:flex;flex-direction:column;overflow:hidden">'
      + '<div style="display:flex;align-items:center;padding:14px 16px 10px;flex-shrink:0">'
      + '<span style="flex:1;font-size:16px;font-weight:700;color:#1a1a1a">段评</span>'
      + '<button id="aknvCmMoreBtn" type="button" style="background:none;border:none;font-size:20px;color:#666;cursor:pointer;padding:2px 8px">⋯</button>'
      + '<button id="aknvCmViewClose" type="button" style="background:none;border:none;font-size:20px;color:#999;cursor:pointer;padding:2px 4px">✕</button></div>'
      + '<div id="aknvCmReplyCfg" style="display:none;padding:0 16px 10px;flex-shrink:0;align-items:center;gap:8px">'
      + '<span style="font-size:13px;color:#666;flex:1">联系人回复段评时间</span>'
      + '<input id="aknvCmDelayInput" type="number" min="1" max="600" value="10" style="width:60px;height:32px;border:1px solid #e0e0e0;border-radius:8px;padding:0 8px;font-size:14px;outline:0;text-align:center"/>'
      + '<span style="font-size:13px;color:#999">秒</span></div>'
      + '<div id="aknvCmViewQuote" style="margin:0 16px 10px;font-size:13px;color:#888;background:#f6f6f6;border-radius:8px;padding:8px 10px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-all;flex-shrink:0"></div>'
      + '<div id="aknvCmViewList" style="flex:1;overflow-y:auto;padding:0 16px;min-height:80px"></div>'
      + '<div style="display:flex;gap:8px;padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid #f0f0f0;flex-shrink:0">'
      + '<input id="aknvCmViewInput" maxlength="200" placeholder="写段评" style="flex:1;min-width:0;height:40px;border:1px solid #e0e0e0;border-radius:20px;padding:0 14px;font-size:14px;outline:0;color:#1a1a1a"/>'
      + '<button id="aknvCmViewSend" type="button" style="height:40px;padding:0 18px;border:none;border-radius:20px;background:#1a1a1a;color:#fff;font-size:14px;cursor:pointer;flex-shrink:0">发送</button></div>'
      + '</div>';
    document.body.appendChild(view);
    $('aknvCmViewClose').addEventListener('click', function () { view.style.display = 'none'; _cmViewing = null; });
    view.addEventListener('click', function (e) { if (e.target === view) { view.style.display = 'none'; _cmViewing = null; } });
    $('aknvCmViewSend').addEventListener('click', sendCmFromView);
    $('aknvCmMoreBtn').addEventListener('click', function () {
      var cfg = $('aknvCmReplyCfg');
      cfg.style.display = cfg.style.display === 'flex' ? 'none' : 'flex';
    });
    $('aknvCmDelayInput').addEventListener('change', function () {
      var v = Math.min(600, Math.max(1, parseInt(this.value, 10) || 10));
      this.value = v;
      lsSet('akini_nvcm_delay', String(v));
    });
  }

  function openCmAdd() {
    ensureCmDom();
    var q = $('aknvCmAddQuote');
    if (q) q.textContent = _cmPending.quote;
    var inp = $('aknvCmAddInput');
    if (inp) inp.value = '';
    $('aknvCmAdd').style.display = 'flex';
  }

  function cmStripEmoji(t) {
    /* 段评仅文字：剔除 emoji 与图片占位 */
    return String(t || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').trim();
  }

  function saveCmAdd() {
    var inp = $('aknvCmAddInput');
    var text = cmStripEmoji(inp ? inp.value : '');
    if (!text) { alert('段评不能为空哦'); return; }
    var list = cmLoad();
    var cm = {
      id: 'cm' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      pidx: _cmPending.pidx,
      quote: _cmPending.quote.slice(0, 120),
      list: [{ who: 'me', text: text, ts: Date.now() }],
      replied: false
    };
    list.push(cm);
    cmSave(list);
    $('aknvCmAdd').style.display = 'none';
    _cmPending = null;
    window._akiniDecorateCm();
    scheduleCmReply(cm);
  }

  /* ---------- 联系人定时回复段评（字卡库文字） ---------- */
  function scheduleCmReply(cm) {
    if (!cm || cm.replied) return;
    var delay = Math.min(600, Math.max(1, parseInt(lsGet('akini_nvcm_delay', '10'), 10) || 10)) * 1000;
    setTimeout(function () {
      var list = cmLoad();
      var cur = null;
      for (var i = 0; i < list.length; i++) if (list[i].id === cm.id) { cur = list[i]; break; }
      if (!cur || cur.replied) return;
      var pool = _readerContacts.length ? _readerContacts : contacts().map(function (c) { return c.id; });
      if (!pool.length) return;
      var cid = pool[Math.floor(Math.random() * pool.length)];
      var c = contactById(cid);
      if (!c) return;
      var t = '';
      try { t = window.pickWordCards ? window.pickWordCards(1, cid) : ''; } catch (e) {}
      t = (t || '').split('\n')[0]; /* 联系人回复段评保留字卡主字卡和emoji模块，仅排除表情包图片(pickWordCards已过滤pat) */
      if (!t) return;
      cur.list.push({ who: cid, name: c.name || '联系人', avatar: c.avatar || '', text: t, ts: Date.now() });
      cur.replied = true;
      cmSave(list);
      window._akiniDecorateCm();
      if (_cmViewing) openCmView(_cmViewing, true);
    }, delay);
  }

  /* ---------- 查看段评弹窗 ---------- */
  function openCmView(pidx, keepOpen) {
    ensureCmDom();
    _cmViewing = pidx;
    var list = cmLoad().filter(function (cm) { return cm.pidx === pidx; });
    if (!list.length) { $('aknvCmView').style.display = 'none'; _cmViewing = null; return; }
    $('aknvCmViewQuote').textContent = list.map(function (cm) { return cm.quote; })[0] || '';
    var di = $('aknvCmDelayInput');
    if (di) di.value = lsGet('akini_nvcm_delay', '10');
    var items = [];
    list.forEach(function (cm) { (cm.list || []).forEach(function (m) { items.push(m); }); });
    items.sort(function (a, b) { return a.ts - b.ts; });
    $('aknvCmViewList').innerHTML = items.map(function (m) {
      var isMe = m.who === 'me';
      var name = isMe ? '我' : (m.name || '联系人');
      var av = isMe ? avatarInner(myAvatar()) : avatarInner(m.avatar || '');
      return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5">'
        + '<div style="width:34px;height:34px;border-radius:50%;background:#e8e8e8;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">' + av + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:13px;font-weight:600;color:#555">' + esc(name) + '</span>'
        + '<span style="font-size:11px;color:#bbb">' + cmFmtTime(m.ts) + '</span></div>'
        + '<div style="font-size:14px;color:#1a1a1a;margin-top:3px;word-break:break-all;line-height:1.5">' + esc(m.text) + '</div>'
        + '</div></div>';
    }).join('') || '<div style="text-align:center;color:#bbb;font-size:13px;padding:24px 0">暂无段评</div>';
    var v = $('aknvCmView');
    v.style.display = 'flex';
    if (!keepOpen) { var lv = $('aknvCmViewList'); lv.scrollTop = lv.scrollHeight; }
  }

  function sendCmFromView() {
    var inp = $('aknvCmViewInput');
    var text = cmStripEmoji(inp ? inp.value : '');
    if (!text) return;
    var list = cmLoad();
    var cur = null;
    for (var i = list.length - 1; i >= 0; i--) if (list[i].pidx === _cmViewing) { cur = list[i]; break; }
    if (!cur) return;
    cur.list.push({ who: 'me', text: text, ts: Date.now() });
    cmSave(list);
    inp.value = '';
    window._akiniDecorateCm();
    openCmView(_cmViewing, true);
    if (!cur.replied) scheduleCmReply(cur);
  }

  /* ---------- 选择监听 ---------- */
  function bindCmSelection() {
    var content = $('novelReaderContent');
    if (!content || content._aknvCmBound) return;
    content._aknvCmBound = true;
    ensureCmDom();
    var check = function () {
      setTimeout(function () {
        var bar = $('aknvSelBar');
        if (!bar) return;
        var sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { bar.style.display = 'none'; return; }
        var range = sel.getRangeAt(0);
        var node = range.commonAncestorContainer;
        var el = node.nodeType === 1 ? node : node.parentNode;
        var p = el && el.closest ? el.closest('p[data-pidx]') : null;
        if (!p || !content.contains(p)) { bar.style.display = 'none'; return; }
        var quote = sel.toString().trim();
        if (!quote) { bar.style.display = 'none'; return; }
        _cmPending = { pidx: parseInt(p.getAttribute('data-pidx'), 10), quote: quote };
        var rc = range.getBoundingClientRect();
        bar.style.left = Math.max(10, Math.min(window.innerWidth - 110, rc.left + rc.width / 2 - 50)) + 'px';
        bar.style.top = Math.max(50, rc.top - 44) + 'px';
        bar.style.display = 'block';
      }, 60);
    };
    content.addEventListener('mouseup', check);
    content.addEventListener('touchend', check);
    content.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.aknv-cmmark')) {
        var bar = $('aknvSelBar');
        var sel = window.getSelection();
        if (bar && (!sel || sel.isCollapsed)) bar.style.display = 'none';
      }
    });
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
        shrinkImage(fr.result, 300, 400, function (url) {
          _editBook.cover = url;
          renderEditCover();
        });
      };
      fr.readAsDataURL(f);
      this.value = '';
    });
    $('aknvEditOk').addEventListener('click', function () {
      if (!_editBook) return;
      var t = ($('aknvEditTitle').value || '').trim();
      if (t) _editBook.title = t;
      saveBooks();
      em.style.display = 'none';
      window.__renderNovelShelf();
    });
  }

  var _editBook = null;
  function renderEditCover() {
    var box = $('aknvEditCover');
    if (!box || !_editBook) return;
    box.innerHTML = isImgSrc(_editBook.cover)
      ? '<img src="' + esc(_editBook.cover) + '" style="width:100%;height:100%;object-fit:cover">'
      : defaultCover(_editBook);
  }

  function setManageMode(on) {
    _manageMode = !!on;
    var addBtn = $('novelAddBtn');
    if (addBtn) {
      if (on) {
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
  window.openEditBook = openEditBook;

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
      + '<div style="font-size:16px;font-weight:700;color:#1a1a1a;text-align:center;margin-bottom:14px">更改头像光环颜色</div>'
      + '<div style="display:flex;justify-content:center;margin-bottom:16px"><div id="akiniHaloPreview" style="width:64px;height:64px;border-radius:50%;background:#eee;position:relative"><div class="akcp-halo" style="position:absolute;inset:-2px"></div></div></div>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="font-size:13px;color:#666;width:28px;flex-shrink:0">红色</span>'
      + '<input id="akiniHaloR" class="akini-rgb-slider" type="range" min="0" max="255" value="224"/>'
      + '<span id="akiniHaloRv" class="akini-rgb-val">224</span></div>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="font-size:13px;color:#666;width:28px;flex-shrink:0">绿色</span>'
      + '<input id="akiniHaloG" class="akini-rgb-slider" type="range" min="0" max="255" value="96"/>'
      + '<span id="akiniHaloGv" class="akini-rgb-val">96</span></div>'
      + '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:13px;color:#666;width:28px;flex-shrink:0">蓝色</span>'
      + '<input id="akiniHaloB" class="akini-rgb-slider" type="range" min="0" max="255" value="138"/>'
      + '<span id="akiniHaloBv" class="akini-rgb-val">138</span></div>'
      + '<div style="display:flex;gap:10px;margin-top:18px"><button id="akiniHaloCancel" type="button" style="flex:1;height:42px;border-radius:10px;border:1px solid #e0e0e0;background:#f8f8f8;color:#555;font-size:15px;cursor:pointer">取消</button><button id="akiniHaloOk" type="button" style="flex:1;height:42px;border-radius:10px;border:none;background:#1a1a1a;color:#fff;font-size:15px;font-weight:600;cursor:pointer">保存</button></div>'
      + '</div>';
    document.body.appendChild(m);
    /* 白边圆环 thumb（内填当前颜色）+ 数值框样式 */
    var st2 = document.createElement('style');
    st2.textContent = '.akini-rgb-slider{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:14px;border-radius:7px;outline:none;background:#eee}'
      + '.akini-rgb-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;border-radius:50%;background:var(--akini-thumb-c,#fff);border:4px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer;box-sizing:border-box}'
      + '.akini-rgb-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--akini-thumb-c,#fff);border:4px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35);cursor:pointer}'
      + '.akini-rgb-val{min-width:44px;padding:6px 0;text-align:center;background:#1a1a1a;color:#fff;border-radius:10px;font-size:14px;font-weight:600;flex-shrink:0}';
    document.head.appendChild(st2);
    var upd = function () {
      var r = +$('akiniHaloR').value, g = +$('akiniHaloG').value, b = +$('akiniHaloB').value;
      $('akiniHaloRv').textContent = r; $('akiniHaloGv').textContent = g; $('akiniHaloBv').textContent = b;
      /* 轨道联动渐变：保持另外两通道不变，展示本通道 0→255 的颜色走向（同截图） */
      $('akiniHaloR').style.background = 'linear-gradient(90deg,rgb(0,' + g + ',' + b + '),rgb(255,' + g + ',' + b + '))';
      $('akiniHaloG').style.background = 'linear-gradient(90deg,rgb(' + r + ',0,' + b + '),rgb(' + r + ',255,' + b + '))';
      $('akiniHaloB').style.background = 'linear-gradient(90deg,rgb(' + r + ',' + g + ',0),rgb(' + r + ',' + g + ',255))';
      /* 三条滑杆的圆环内都填当前合成色 */
      m.style.setProperty('--akini-thumb-c', 'rgb(' + r + ',' + g + ',' + b + ')');
      var pv = $('akiniHaloPreview').querySelector('.akcp-halo');
      if (pv) pv.style.borderColor = 'rgba(' + r + ',' + g + ',' + b + ',.5)';
      /* 实时整体预览 */
      var r2 = Math.round(r + (255 - r) * 0.25), g2 = Math.round(g + (255 - g) * 0.25), b2 = Math.round(b + (255 - b) * 0.25);
      var st = document.getElementById('akiniHaloPrevStyle');
      if (!st) { st = document.createElement('style'); st.id = 'akiniHaloPrevStyle'; document.head.appendChild(st); }
      st.textContent = '#akiniHaloPreview .akcp-halo::before{background:radial-gradient(circle,rgba(' + r + ',' + g + ',' + b + ',.38) 52%,rgba(' + r + ',' + g + ',' + b + ',.12) 66%,rgba(' + r + ',' + g + ',' + b + ',0) 74%)!important}'
        + '#akiniHaloPreview .akcp-halo::after{background:conic-gradient(from 0deg,rgba(' + r + ',' + g + ',' + b + ',0) 0deg,rgba(' + r + ',' + g + ',' + b + ',.95) 40deg,rgba(' + r2 + ',' + g2 + ',' + b2 + ',.95) 80deg,rgba(' + r + ',' + g + ',' + b + ',0) 125deg)!important}';
    };
    $('akiniHaloR').addEventListener('input', upd);
    $('akiniHaloG').addEventListener('input', upd);
    $('akiniHaloB').addEventListener('input', upd);
    $('akiniHaloCancel').addEventListener('click', function () { m.style.display = 'none'; });
    m.addEventListener('click', function (e) { if (e.target === m) m.style.display = 'none'; });
    $('akiniHaloOk').addEventListener('click', function () {
      lsSet('akini_halo_r', $('akiniHaloR').value);
      lsSet('akini_halo_g', $('akiniHaloG').value);
      lsSet('akini_halo_b', $('akiniHaloB').value);
      applyHaloColor();
      m.style.display = 'none';
    });
  }
  function bindHaloMenu() {
    var btn = $('companionActHalo');
    if (!btn || btn._haloBound) return;
    btn._haloBound = true;
    btn.addEventListener('click', function () {
      closeSheet('companionMenuSheet');
      ensureHaloDom();
      var c = readHaloRgb();
      $('akiniHaloR').value = c.r; $('akiniHaloG').value = c.g; $('akiniHaloB').value = c.b;
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
    try { applyHaloColor(); } catch (e) {}
    setTimeout(bindNovelMenu, 400);
    setTimeout(bindHaloMenu, 450);
  }
})();

;
/* ===== akini-chat-preview.js ===== */

(function(){
  try{
    ["akini_preview_bubble_left","akini_preview_bubble_right","akini_my_avatar","akini_ta_avatar","akini_icity_my_avatar","akini_icity_ta_avatar"].forEach(function(k){
      var _v=localStorage.getItem(k);
      if(_v==="null"||_v==="undefined")localStorage.removeItem(k);
    });
  }catch(e){}
  const KEY = "akini_preview_contact_id";
  const BUBBLE_LEFT_KEY = "akini_preview_bubble_left";
  const BUBBLE_RIGHT_KEY = "akini_preview_bubble_right";
  const LYRIC_TITLE_KEY = "akini_lyric_title";
  const LYRIC_ARTIST_KEY = "akini_lyric_artist";
  const LYRIC_QUOTE_KEY = "akini_lyric_quote";
  const DEFAULT_LEFT = "";
  const DEFAULT_RIGHT = "";
  const LYRIC_TITLE_DEFAULT = "罗生门";
  const LYRIC_ARTIST_DEFAULT = "张子豪";
  const LYRIC_QUOTE_DEFAULT = "想知道你会不会太冷";
  function $(id){ return document.getElementById(id); }
  function __akiniIsDefAv(s){
    if(s==null)return true;
    s=String(s).trim();
    if(!s||s==="null"||s==="undefined")return true;
    s=s.replace(/️/g,"");
    var a=Array.from(s);
    return a.length<=2&&!/^[a-zA-Z0-9一-鿿]+$/.test(s);
  }
window.__akiniLineAvatarImg=window.__akiniLineAvatarImg||function(){var u="data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f7f8fa"/><circle cx="40" cy="29" r="14" fill="none" stroke="#5a5e66" stroke-width="1.5"/><path d="M12 76c4-17 14-26 28-26s24 9 28 26" fill="none" stroke="#5a5e66" stroke-width="1.5" stroke-linecap="round"/></svg>');return '<img src="'+u+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';};
function __akiniAvOrLine(v){return __akiniIsDefAv(v)?window.__akiniLineAvatarImg():v;}
function it(t,e){
  if(e=e||"",!t||"string"!=typeof t)return __akiniAvOrLine(e);
  t=t.trim();
  if(!t||t==="null"||t==="undefined")return __akiniAvOrLine(e);
  if(0===t.indexOf("<img")){var n=t.match(/src="([^"]*)"/);if(!n||!n[1])return __akiniAvOrLine(e);t=n[1]}
  return 0===t.indexOf("data:")||0===t.indexOf("http")?'<img src="'+t.replace(/"/g,"&quot;")+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">':__akiniAvOrLine(t)
}
  /* 头像取值工具：从任意写法里取出真实图片地址；再判断它是否真的是照片，
     避免把「灰线人形 SVG / 预设头像」当成用户设置的真实头像直接渲染成默认图。 */
  function _akiniRawAv(s){
    if(s==null)return "";
    s=String(s).trim();
    if(!s||s==="null"||s==="undefined")return "";
    if(0===s.indexOf("<img")){var m=s.match(/src="([^"]*)"/);s=m&&m[1]?m[1]:"";}
    return s||"";
  }
  function _akiniIsPhoto(v){
    v=_akiniRawAv(v);
    if(!v)return false;
    if(0!==v.indexOf("data:image")&&0!==v.indexOf("http")&&0!==v.indexOf("blob:"))return false;
    if(0===v.indexOf("data:image/svg"))return false;
    try{if(window.__akiniIsDefaultAvatarToken&&window.__akiniIsDefaultAvatarToken(v))return false;}catch(e){}
    try{if(window.AKINI_PRESET_COLOR_AVATAR&&v===window.AKINI_PRESET_COLOR_AVATAR)return false;}catch(e){}
    return true;
  }
  function _akiniPickPhoto(list,fallbackHtml){
    for(var i=0;i<list.length;i++){if(_akiniIsPhoto(list[i]))return it(_akiniRawAv(list[i]),"");}
    for(var j=0;j<list.length;j++){var a=_akiniRawAv(list[j]);if(a)return it(a,fallbackHtml||"");}
    return fallbackHtml!==undefined?fallbackHtml:window.__akiniLineAvatarImg();
  }
  /* 头像统一由 core 的 window.getMyAvatar / window.getTaAvatar 提供：
     已在 core 中改为「真实照片优先 + 过滤灰线默认 token + 兼容 s1/avatar_left 键」，
     这里不再重复定义，避免 || 判断导致覆盖失效。 */
  window.getContacts=function getContacts(){
    if(window.akiniContacts && window.akiniContacts.getContacts){
      var api = window.akiniContacts.getContacts();
      if(Array.isArray(api) && api.length) return api;
    }
    try{
      var ls = JSON.parse(localStorage.getItem("akini_contacts")||"[]");
      if(Array.isArray(ls) && ls.length) return ls;
    }catch(e){}
    return [];
  };
  /* 聊天预览固定使用默认联系人，不再读取/保存任何“选择联系人”状态 */
  function getSelectedContactId(){
    var contacts=getContacts();
    if(!contacts.length)return null;
    var dc=window.__akiniDefaultContact&&window.__akiniDefaultContact();
    if(dc&&dc.id)return dc.id;
    var def=contacts.filter(function(c){return c.isDefault})[0]||contacts[0];
    return def&&def.id?def.id:null;
  }
  function getContactById(id){
    if(window.akiniContacts && window.akiniContacts.getChatTarget){
      var api=window.akiniContacts.getChatTarget(id);
      if(api)return api;
    }
    var contacts=getContacts();
    for(var i=0;i<contacts.length;i++)if(contacts[i].id===id)return contacts[i];
    return null;
  }
  window.__akAvatarPH=(window.__akiniLineAvatarImg?window.__akiniLineAvatarImg():'')||'<span style="display:inline-flex;width:100%;height:100%;align-items:center;justify-content:center;background:#ececec;border-radius:50%"></span>';
  function isSwapped(){var t=localStorage.getItem("akini_swap_avatar_pos");return"true"===t||"1"===t}
  function updatePreview(){
    var id=getSelectedContactId();
    var contactAvatar = id ? window.getTaAvatar(id) : _akiniPickPhoto([
      (function(){try{return localStorage.getItem("akini_ta_avatar");}catch(e){return"";}})(),
      (function(){try{return localStorage.getItem("akini_icity_ta_avatar");}catch(e){return"";}})()
    ], window.__akAvatarPH||window.__akiniLineAvatarImg());
    var myAvatar=getMyAvatar();
    var swapped=isSwapped();
    var leftA=$("previewAvatarLeft");
    if(leftA)leftA.innerHTML=swapped?contactAvatar:myAvatar;
    var rightA=$("previewAvatarRight");
    if(rightA)rightA.innerHTML=swapped?myAvatar:contactAvatar;
  }
  window.updateChatPreview=updatePreview;
  window.__akiniUpdatePreview=updatePreview;
  (function(){
    var t=null;
    function refresh(){
      if(t)return;
      t=setTimeout(function(){
        t=null;
        try{updatePreview();}catch(e){}
      },60);
    }
    try{window.addEventListener("akini-img-ready",refresh);}catch(e){}
    try{window.addEventListener("pageshow",refresh);}catch(e){}
    try{window.addEventListener("storage",function(e){if(!e||!e.key||0===e.key.indexOf("akini_"))refresh();});}catch(e){}
  })();
  function updateSelectOptions(){var sel=$("selectChatPreviewContact");if(!sel)return;var prev=sel.value;sel.innerHTML="";var contacts=getContacts();if(!contacts.length)return;contacts.forEach(function(c){var opt=document.createElement("option");opt.value=c.id;opt.textContent=c.name||"对方";sel.appendChild(opt);});var id=getSelectedContactId();var exists=contacts.some(function(c){return c.id===id});sel.value=exists?id:(prev&&contacts.some(function(c){return c.id===prev})?prev:(contacts[0]&&contacts[0].id));if(sel.value){try{localStorage.setItem(KEY,sel.value)}catch(e){}}}
  function applyPreviewWrap(b){if(!b)return;b.classList.add("no-wrap");var _t=(b.textContent||"").trim();b.classList.toggle("is-empty",!_t);}
  /* 预览气泡硬性限制：去换行、最多 8 个字，截断后光标移到末尾 */
  function clampPreviewBubble(b){
    if(!b)return false;
    if(b.__composing)return false;/* 中文输入法组合期间绝不动 DOM，否则正在输入的文字会被吃掉 */
    var t=(b.textContent||"").replace(/[\r\n]+/g,"");
    if(t.length>8)t=t.slice(0,8);
    if(t!==(b.textContent||"")){
      b.textContent=t;
      applyPreviewWrap(b);
      try{var r=document.createRange();r.selectNodeContents(b);r.collapse(false);var s=window.getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}
      return true;
    }
    return false;
  }
  function cleanPreviewText(v){if(!v||v==="null"||v==="undefined")return "";return String(v).replace(/[\r\n]+/g,"").slice(0,8);}
  function updatePreviewBubbles(){var leftB=$("previewBubbleLeft");var rightB=$("previewBubbleRight");if(leftB){var v=localStorage.getItem(BUBBLE_LEFT_KEY);if(v==="null"||v==="undefined"){try{localStorage.removeItem(BUBBLE_LEFT_KEY);}catch(e){}v=null;}leftB.textContent=cleanPreviewText(v);if(!leftB.textContent.trim())leftB.textContent=DEFAULT_LEFT;}if(rightB){var v2=localStorage.getItem(BUBBLE_RIGHT_KEY);if(v2==="null"||v2==="undefined"){try{localStorage.removeItem(BUBBLE_RIGHT_KEY);}catch(e){}v2=null;}rightB.textContent=cleanPreviewText(v2);if(!rightB.textContent.trim())rightB.textContent=DEFAULT_RIGHT;}applyPreviewWrap(leftB);applyPreviewWrap(rightB);}
  function updateLyricCard(){var t=$("lyricTitle");var a=$("lyricArtist");var q=$("lyricQuote");if(t){var v=localStorage.getItem(LYRIC_TITLE_KEY);t.textContent=v||LYRIC_TITLE_DEFAULT;}if(a){var v=localStorage.getItem(LYRIC_ARTIST_KEY);a.textContent=v||LYRIC_ARTIST_DEFAULT;}if(q){var v=localStorage.getItem(LYRIC_QUOTE_KEY);q.textContent=v||LYRIC_QUOTE_DEFAULT;}}
  function saveLyricCard(){var t=$("lyricTitle");var a=$("lyricArtist");var q=$("lyricQuote");try{if(t)localStorage.setItem(LYRIC_TITLE_KEY,t.textContent.trim());if(a)localStorage.setItem(LYRIC_ARTIST_KEY,a.textContent.trim());if(q)localStorage.setItem(LYRIC_QUOTE_KEY,q.textContent.trim());}catch(e){}}
  function resetLyricCard(){try{localStorage.removeItem(LYRIC_TITLE_KEY);localStorage.removeItem(LYRIC_ARTIST_KEY);localStorage.removeItem(LYRIC_QUOTE_KEY);}catch(e){}updateLyricCard();}
  document.addEventListener("DOMContentLoaded",function(){
    updateSelectOptions();
    updatePreviewBubbles();
    updateLyricCard();
    updatePreview();
    /* 美化面板可见时才刷新联系人下拉与预览；用 MutationObserver 监听面板显隐，
       替代原来的 3s 轮询。联系人下拉变化已有 select change 事件处理。 */
    try {
      var _ba = document.getElementById("beautifyArea");
      if (_ba && window.MutationObserver) {
        new MutationObserver(function () {
          try {
            if (_ba.style.display !== "none") { updateSelectOptions(); updatePreview(); }
          } catch (e) {}
        }).observe(_ba, { attributes: true, attributeFilter: ["style"] });
      }
    } catch (e) {}
    var sel=$("selectChatPreviewContact");if(sel){sel.addEventListener("change",function(){var id=sel.value;localStorage.setItem(KEY,id);updatePreview();});}
    var leftB=$("previewBubbleLeft");var rightB=$("previewBubbleRight");
    function savePreviewBubbles(){if(leftB)try{localStorage.setItem(BUBBLE_LEFT_KEY,leftB.textContent.trim())}catch(e){}if(rightB)try{localStorage.setItem(BUBBLE_RIGHT_KEY,rightB.textContent.trim())}catch(e){}applyPreviewWrap(leftB);applyPreviewWrap(rightB);}
    function bindBubble(b){
      if(!b)return;
      // 移动端/触摸屏点击兜底：确保点中气泡即可调起输入法与进入编辑态
      b.addEventListener("click",function(e){
        try{
          if(document.activeElement!==b){
            b.focus();
            var r=document.createRange();
            r.selectNodeContents(b);
            r.collapse(false);
            var s=window.getSelection();
            if(s){s.removeAllRanges();s.addRange(r);}
          }
        }catch(err){}
      });
      b.addEventListener("blur",savePreviewBubbles);
      b.addEventListener("focusout",savePreviewBubbles);
      b.addEventListener("compositionstart",function(){b.__composing=true;});
      b.addEventListener("compositionend",function(){b.__composing=false;clampPreviewBubble(b);savePreviewBubbles();});
      b.addEventListener("input",function(){if(b.__composing)return;clampPreviewBubble(b);savePreviewBubbles();});
      b.addEventListener("keyup",function(){if(b.__composing)return;clampPreviewBubble(b);savePreviewBubbles();});
      // beforeinput：iOS 部分输入法换行不触发 keydown，必须在这里拦截插入段落/换行
      b.addEventListener("beforeinput",function(e){
        try{
          var it=e&&e.inputType||"";
          if(it==="insertParagraph"||it==="insertLineBreak"){e.preventDefault();b.blur();return;}
          if(it==="insertText"&&e.data&&/[\r\n]/.test(e.data)){e.preventDefault();return;}
        }catch(x){}
      });
      b.addEventListener("paste",function(e){try{e.preventDefault();var t=(e.clipboardData||window.clipboardData).getData("text")||"";t=t.replace(/[\r\n]+/g,"").slice(0,8);document.execCommand("insertText",false,t);}catch(x){}clampPreviewBubble(b);savePreviewBubbles();});
      b.addEventListener("keydown",function(e){
        if(e.key==="Enter"){e.preventDefault();b.blur();return;}
        // 已达 8 字且未选中任何文字时，禁止继续输入可打印字符
        if(e.key&&e.key.length===1&&!e.ctrlKey&&!e.metaKey){
          var t=(b.textContent||"");
          var sel=window.getSelection&&window.getSelection();
          var hasSel=sel&&!sel.isCollapsed;
          if(t.length>=8&&!hasSel)e.preventDefault();
        }
      });
      clampPreviewBubble(b);
    }
    bindBubble(leftB);
    bindBubble(rightB);
    var lyricT=$("lyricTitle");var lyricA=$("lyricArtist");var lyricQ=$("lyricQuote");var lyricR=$("lyricResetBtn");
    [lyricT,lyricA,lyricQ].forEach(function(el){if(el){el.addEventListener("blur",saveLyricCard);el.addEventListener("input",saveLyricCard);el.addEventListener("keyup",saveLyricCard);el.addEventListener("paste",saveLyricCard);el.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();el.blur();}});}});
    if(lyricR){lyricR.addEventListener("click",function(e){resetLyricCard();});}
    window.addEventListener("beforeunload",function(){savePreviewBubbles();saveLyricCard();});
    window.addEventListener("pagehide",function(){savePreviewBubbles();saveLyricCard();});
    document.addEventListener("visibilitychange",function(){if("hidden"===document.visibilityState){savePreviewBubbles();saveLyricCard();}});
    /* 气泡与歌词已有 input/blur/paste/compositionend 保存，visibilitychange/pagehide 也保存，
       删除原 60s 定时写入（滚动时的同步 localStorage 写入是掉帧来源之一）。 */
  });
})();

;
/* ===== akini-mini-bubble.js =====
   消息小气泡（参考 iMessage tapback）：白底黑描边，贴在消息气泡左下角。
   - 联系人发来的消息按「小气泡概率」自动加一个（默认 30%，与引用回复一致）
   - 长按/点击消息 → 菜单「小气泡」可给自己或对方的任意消息手动添加
   - 内容随机抽自 字卡库 → 小气泡 tab
*/
(function(){
  var MAP_KEY = 'akini_msg_mb';
  var LAST_KEY = 'akini_msg_mb_last';
  var PROCESSED_KEY = 'akini_msg_mb_processed'; /* 记录联系人已摇过的消息 ts，避免重复摇 */

  function rd(k, d){
    try{ var v = window.__wbRead ? window.__wbRead(k, d) : JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }
    catch(e){ return d; }
  }
  function wr(k, v){ try{ if(window.__wbWrite) window.__wbWrite(k, v); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function curCid(){ try{ return (window.akiniContacts && window.akiniContacts.getActiveChatId) ? String(window.akiniContacts.getActiveChatId()||'') : ''; }catch(e){ return ''; } }
  function mapAll(){ var m=rd(MAP_KEY,{}); return (m && typeof m==='object' && !Array.isArray(m)) ? m : {}; }
  function lastAll(){ var m=rd(LAST_KEY,{}); return (m && typeof m==='object' && !Array.isArray(m)) ? m : {}; }
  function cidMap(m, id){ var x=m[id]; return (x && typeof x==='object' && !Array.isArray(x)) ? x : {}; }

  function bubblePool(){
    var arr=[]; try{ arr=rd('akini_wordbank',[]); }catch(e){ arr=[]; }
    var seen={}, pool=[];
    (Array.isArray(arr)?arr:[]).forEach(function(it){
      if(!it || typeof it!=='object') return;
      if((it.tab||'main')!=='bubble') return;
      var t=String(it.text||it.content||'').trim();
      if(!t || seen[t]) return;
      if(window.__wbIsBlocked && window.__wbIsBlocked('bubble', t)) return;
      seen[t]=1; pool.push(t);
    });
    return pool;
  }
  function pick(){
    var pool=bubblePool();
    return pool.length ? pool[Math.floor(Math.random()*pool.length)] : '';
  }
  window.__akiniPickMiniBubble = pick;

  function apply(row, mp){
    if(!row || !row.getAttribute) return;
    var ts=row.getAttribute('data-ts');
    if(!ts) return;
    var bubble=row.querySelector('.bubble');
    if(!bubble) return;
    /* 小气泡只禁止出现在转账/问卷/商店/音乐卡片上；表情包、图片、视频、语音气泡允许贴小气泡 */
    var CARD_CLS=/transfer-bubble|survey-bubble|shop-card-bubble|music-invite-bubble|music-end-bubble/;
    if(CARD_CLS.test(bubble.className)){
      if(bubble.hasAttribute('data-mb')) bubble.removeAttribute('data-mb');
      row.classList.remove('has-mini-bubble');
      return;
    }
    var txt=mp[ts];
    if(txt){
      if(bubble.getAttribute('data-mb')!==String(txt)) bubble.setAttribute('data-mb', String(txt));
      row.classList.add('has-mini-bubble');
    }else{
      if(bubble.hasAttribute('data-mb')) bubble.removeAttribute('data-mb');
      row.classList.remove('has-mini-bubble');
    }
  }

  var busy=false;
  function processedAll(){ var m=rd(PROCESSED_KEY,{}); return (m && typeof m==='object' && !Array.isArray(m)) ? m : {}; }
  function scan(){
    if(busy) return;
    var body=document.getElementById('chatBody');
    if(!body) return;
    var id=curCid();
    if(!id) return;
    busy=true;
    try{
      var rows=body.querySelectorAll('.msg-row[data-ts]');
      if(!rows.length) return;
      var all=mapAll(), mp=cidMap(all,id);
      var pa=processedAll(), pp=cidMap(pa,id); /* pp: 本会话已被联系人摇过的 ts 集合 {ts:true} */
      var changed=false, ppChanged=false;
      rows.forEach(function(r){
        var ts=r.getAttribute('data-ts');
        if(!ts) return;
        if(r.classList.contains('system')) return;
        var b=r.querySelector('.bubble');
        if(!b) return;
        /* 只有转账/问卷/商店/音乐卡片不参与小气泡；表情包/图片/视频/语音允许 */
        if(/transfer-bubble|survey-bubble|shop-card-bubble|music-invite-bubble|music-end-bubble/.test(b.className)) return;
        /* 联系人每条消息只摇一次（不论我是否手动贴过），用 PROCESSED_KEY 记录 */
        if(pp[ts]) return;
        pp[ts]=true; ppChanged=true;
        /* 按概率摇小气泡；摇中则覆盖已有（联系人后贴的覆盖我手动贴的，显示最新） */
        var p=(window.AKR && window.AKR.getProb) ? window.AKR.getProb('miniBubble') : 0.1;
        if(Math.random()>=p) return;
        var t=pick();
        if(t){ mp[ts]=t; changed=true; }
      });
      if(changed){ all[id]=mp; wr(MAP_KEY, all); }
      if(ppChanged){ pa[id]=pp; wr(PROCESSED_KEY, pa); }
      rows.forEach(function(r){ apply(r, mp); });
    }catch(e){}
    finally{ busy=false; }
  }
  window.__akiniMiniBubbleScan = scan;

  function setFor(row, text){
    if(!row) return false;
    var id=curCid();
    if(!id) return false;
    var ts=row.getAttribute('data-ts');
    if(!ts) return false;
    var all=mapAll(), mp=cidMap(all,id);
    text=String(text||'').trim();
    if(text) mp[ts]=text; else delete mp[ts];
    all[id]=mp; wr(MAP_KEY, all);
    apply(row, mp);
    return true;
  }
  window.__akiniSetMiniBubble = setFor;

  function openPicker(row){
    if(!row) return;
    var id=curCid();
    if(!id){ window.__akiniToast && window.__akiniToast('请先进入聊天'); return; }
    var old=document.getElementById('akiniMbPicker'); if(old) old.remove();
    var ts=row.getAttribute('data-ts');
    var cur='';
    try{ cur=cidMap(mapAll(),id)[ts]||''; }catch(e){}

    var wrap=document.createElement('div');
    wrap.id='akiniMbPicker';
    wrap.style.cssText='position:fixed;inset:0;z-index:9300;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;';
    var inner=document.createElement('div');
    inner.style.cssText='width:100%;max-width:480px;background:#fff;border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px;box-sizing:border-box;';
    var head=document.createElement('div');
    head.style.cssText='display:flex;align-items:center;justify-content:space-between;flex-shrink:0;';
    var title=document.createElement('div');
    title.style.cssText='font-size:16px;font-weight:700;color:#1a1a1a';
    title.textContent='添加小气泡';
    var close=document.createElement('button');
    close.type='button'; close.textContent='✕';
    close.style.cssText='border:none;background:none;font-size:20px;color:#999;cursor:pointer;padding:0 4px;';
    close.addEventListener('click', function(){ wrap.remove(); });
    head.appendChild(title); head.appendChild(close);

    var input=document.createElement('input');
    input.type='text';
    input.maxLength=20;
    input.placeholder='输入小气泡内容…';
    input.value=cur||'';
    input.style.cssText='width:100%;box-sizing:border-box;padding:12px 14px;border-radius:13px;border:1.5px solid #000;background:#fff;color:#000;font-size:15px;outline:none;';

    var tip=document.createElement('div');
    tip.style.cssText='font-size:11px;color:#999;flex-shrink:0;line-height:1.5;';
    tip.textContent='自己输入的小气泡只在这条消息上显示；联系人会从字卡库「小气泡」随机抽内容';

    var confirmBtn=document.createElement('button');
    confirmBtn.type='button'; confirmBtn.textContent='确定';
    confirmBtn.style.cssText='width:100%;padding:12px;border-radius:13px;border:none;background:#1a1a1a;color:#fff;font-size:15px;font-weight:600;cursor:pointer;flex-shrink:0;';
    function doConfirm(){
      var t=input.value;
      if(!t || !t.trim()){ input.focus(); return; }
      if(setFor(row, t)){ wrap.remove(); window.__akiniToast && window.__akiniToast('✓ 已添加小气泡'); }
    }
    confirmBtn.addEventListener('click', doConfirm);
    input.addEventListener('keydown', function(e){
      if(e.key==='Enter'){ e.preventDefault(); doConfirm(); }
    });

    inner.appendChild(head); inner.appendChild(input); inner.appendChild(tip);

    if(cur){
      var rm=document.createElement('button');
      rm.type='button'; rm.textContent='移除当前小气泡';
      rm.style.cssText='width:100%;padding:11px;border-radius:13px;border:1.5px solid #f0c4c4;background:#fff5f5;color:#c0392b;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;';
      rm.addEventListener('click', function(){ setFor(row,''); wrap.remove(); window.__akiniToast && window.__akiniToast('已移除小气泡'); });
      inner.appendChild(rm);
    }

    inner.appendChild(confirmBtn);
    wrap.appendChild(inner);
    wrap.addEventListener('click', function(e){ if(e.target===wrap) wrap.remove(); });
    document.body.appendChild(wrap);
    setTimeout(function(){ try{ input.focus(); }catch(e){} }, 80);
  }
  window.__akiniOpenMiniBubblePicker = openPicker;

  function hookMenu(){
    var btn=document.getElementById('ctxMiniBubble');
    if(!btn || btn.__mbBound) return;
    btn.__mbBound=1;
    btn.addEventListener('click', function(){
      var row=window.__akiniMbCtxRow||null;
      if(!row){
        var menu=document.getElementById('msgContextMenu');
        if(menu && menu.style.display!=='none'){
          var mr=menu.getBoundingClientRect(), best=null, bestD=1e9;
          document.querySelectorAll('#chatBody .msg-row').forEach(function(r){
            var b=r.querySelector('.bubble'); if(!b) return;
            var br=b.getBoundingClientRect();
            var d=Math.abs(br.left-mr.left)+Math.abs(br.top-mr.top);
            if(d<bestD){ bestD=d; best=r; }
          });
          row=best;
        }
      }
      if(!row) return;
      openPicker(row);
    });
  }

  function boot(){
    hookMenu();
    var body=document.getElementById('chatBody');
    if(body && !body.__mbObs){
      body.__mbObs=1;
      try{
        var _mbScanTimer=null;
        new MutationObserver(function(){
          /* 防抖：避免连续 DOM 变动触发大量 scan */
          if(_mbScanTimer) clearTimeout(_mbScanTimer);
          _mbScanTimer=setTimeout(scan, 300);
        }).observe(body, {childList:true});
      }catch(e){}
    }
    scan();
    /* 已由上方 MutationObserver(childList) 负责 DOM 变动后的扫描，
       15s 轮询属于重复开销，删除。 */
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 1000);
})();

/* ===== 一次性清理旧版误标墓碑（只执行一次）=====
   旧版启动钩子把「本次写入比上次短」中缺失的 id 全部当成删除，
   导致朋友圈动态 / iCity 日记被永久隐藏（表现为帖子凭空消失）。
   真实删除时数据本身已从 localStorage、IndexedDB 与备份中移除，
   清空墓碑列表不会让已删内容复活，只会让被误伤的帖子重新显示。 */
(function(){
  var FLAG='akini_tombstone_purge_v1';
  try{ if(localStorage.getItem(FLAG)==='1') return; }catch(e){ return; }
  function run(){
    try{ if(localStorage.getItem(FLAG)==='1') return; }catch(e){ return; }
    try{ localStorage.setItem('akini_deleted_posts','[]'); }catch(e){}
    try{ localStorage.setItem('akini_deleted_icity','[]'); }catch(e){}
    try{
      if(window._idbStore&&window._idbStore.set){
        window._idbStore.set('akini_deleted_posts','[]');
        window._idbStore.set('akini_deleted_icity','[]');
      }
    }catch(e){}
    try{ localStorage.setItem(FLAG,'1'); }catch(e){}
    try{ if(typeof window._renderPosts==='function') window._renderPosts(); }catch(e){}
    try{ if(typeof window._renderIcity==='function') window._renderIcity(); }catch(e){}
  }
  var done=false;
  window.addEventListener('akini-storage-restored',function(){ if(done)return; done=true; setTimeout(run,0); });
  setTimeout(function(){ if(done)return; done=true; run(); },5000);
})();

