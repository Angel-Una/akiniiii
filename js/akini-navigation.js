

  function _akiniCleanPopups(){
    try {
      var cmo = document.getElementById("chatMenuOverlay");
      if (cmo) { cmo.style.display = "none"; cmo.classList.remove("show"); if(cmo.style.pointerEvents) cmo.style.pointerEvents = "none"; }
      var addOverlays = document.querySelectorAll(".chat-list-add-menu-overlay");
      addOverlays.forEach(function(el){ el.classList.remove("show"); el.remove(); });
      var pm = document.getElementById("plusMenu");
      if (pm) { pm.style.display = "none"; pm.classList.remove("show"); }
      var ep = document.getElementById("emojiPanel");
      if (ep) { ep.style.display = "none"; ep.classList.remove("show"); }
    } catch(e){}
  }

/* 全站图层清单：导航/返回共用同一份 */
var AKINI_APP_PAGES = ["app-chat","app-chat-list","app-friends","app-mail","app-music","app-call","app-shop","app-novel","app-novel-reader","app-companion"];
var AKINI_AREAS = ["settingsArea","akiniProbArea","beautifyArea","icityArea","storageArea","wordbankOverlay","wbExclOverlay","surveyListModal","surveyCreateModal","surveyDetailModal","surveyCreatedListModal","akini-ta-phone-container","watchArea"];
var AKINI_OVERLAYS = ["musicMenuOverlay","musicContactPicker","musicPlaylistOverlay","musicPlaylistSelect","musicOptionPicker","musicHomeOverlay","musicHistoryOverlay","musicEndPopup","musicInvitePopup","companionHomeOverlay","companionHistoryOverlay"];
var AKINI_HOME_BARS = ["homeScreens","bottomBar"];

function akiniHideLayers(opts){
  opts = opts || {};
  AKINI_OVERLAYS.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
  AKINI_APP_PAGES.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
  AKINI_AREAS.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
  if(opts.hideHome){
    AKINI_HOME_BARS.forEach(function(id){ var el=document.getElementById(id); if(el) el.style.display="none"; });
  }
}

window.akiniGoBack = function(target){
  _akiniCleanPopups();
  if (target === "home") {
    try { localStorage.removeItem("akini_active_chat_id"); } catch(e){}
    akiniHideLayers({});
    if(window.__akiniBackStack) window.__akiniBackStack.length = 0;
    try { var _cw=document.querySelector(".content-wrapper"); if(_cw){ _cw.style.display="flex"; _cw.classList.remove("akini-content-hidden"); } } catch(e){}
    try { if(window.__akiniShowContent) window.__akiniShowContent(); } catch(e){}
    /* 回到首页统一复位滚动位置，杜绝首页停留在上次的偏移 */
    try { if(window.__akiniResetHomeScroll) window.__akiniResetHomeScroll(); } catch(e){}
    return false;
  }
  if (target !== "home" && window.__navBack && !window.__navBack._akini) {
    try { if (window.__navBack()) return false; } catch(e){}
  }
  /* 离开聊天页时清除当前激活会话，避免返回列表仍被判定为“在聊天”而不弹通知 */
  if (target !== "chat" && target !== "chat-list") {
    try { localStorage.removeItem("akini_active_chat_id"); } catch(e){}
  }
  akiniHideLayers({ hideHome: true });
  if(window.__akiniBackStack) window.__akiniBackStack.length = 0;
  if (target) {
    if (window.showPage) { try { window.showPage(target); } catch(e){} }
    var el = document.getElementById("app-" + target);
    if (el) { el.style.display="flex"; el.classList.add("show"); el.style.zIndex="500"; }
    if (target === "chat-list" && window.switchChatTab) {
      try { window.switchChatTab("wechat"); } catch(e){}
    }
  }
  return false;
};
// 打开字卡库：先立即显示浮层，再延迟渲染字卡列表，避免进入卡顿
window.__openWordBank = function(){
  try {
    if(window.showArea) {
      window.showArea("wordbankOverlay");
    } else {
      var overlay = document.getElementById("wordbankOverlay");
      if(overlay) overlay.style.display = "block";
    }
  } catch(e) {
    var overlay2 = document.getElementById("wordbankOverlay");
    if(overlay2) overlay2.style.display = "block";
  }
  try {
    if(window.renderWordbank) requestAnimationFrame(function(){ try { window.renderWordbank(); } catch(e){} });
  } catch(e) {}
};

// 健壮的底部三按钮展示逻辑，兼顾所有机型与浏览器，即使 showArea 未挂载也能通过 DOM 唤起
window.__safeShowArea = function(areaId){
  try {
    if(typeof window.__navShowArea === 'function') {
      window.__navShowArea(areaId);
      return;
    }
  } catch(e) {}
  try {
    if(typeof window.showArea === 'function') {
      window.showArea(areaId);
      return;
    }
  } catch(e) {}
  try {
    var el = document.getElementById(areaId);
    if(el) {
      el.style.display = 'block';
      el.classList.add('show');
    }
  } catch(e) {}
};
// __navBack 由 akini-core.js 定义
if (window.__navBack) { window.__navBack._akini = true; }
(function(){
  window.hideAll = function hideAll(){
    _akiniCleanPopups();
    akiniHideLayers({});
    var menu = document.getElementById("chatMenuOverlay");
    if(menu){ menu.style.display = "none"; menu.classList.remove("show"); }
    var addMenu = document.querySelector(".chat-list-add-menu-overlay");
    if(addMenu){ addMenu.classList.remove("show"); setTimeout(function(){ addMenu.remove(); }, 200); }
  };

  window.showEl = function showEl(id, z){
    var el = document.getElementById(id);
    if(!el) return el;
    el.style.zIndex = z || "4000";
    el.style.display = "flex";
    el.classList.add("show");
    return el;
  };

  window.showArea = function showArea(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.style.zIndex = "4000";
    el.style.display = "flex";
    el.classList.add("show");
  };

  function navTo(app){
    try{
      window.hideAll();

      /* 单人模式：点微信直接进入唯一联系人（默认 TA）的聊天界面，不出现会话列表/通讯录等任何中间界面 */
      if(app === "chat-list"){
        var _openChatWithDefault = function(){
          var cid = null;
          try {
            var dc = window.__akiniDefaultContact && window.__akiniDefaultContact();
            cid = dc && dc.id;
          } catch(e){}
          if(!cid){
            try { cid = window.akiniContacts && window.akiniContacts.getActiveChatId && window.akiniContacts.getActiveChatId(); } catch(e){}
          }
          if(!cid){
            try {
              var raw = localStorage.getItem("akini_contacts");
              var arr = raw ? JSON.parse(raw) : [];
              var d = arr && ((arr.filter(function(x){ return x && x.isDefault; })[0]) || arr[0]);
              cid = d && d.id;
            } catch(e){}
          }
          if(!cid || !window.openChat) return false;
          try { window.akiniContacts && window.akiniContacts.setActiveChatId && window.akiniContacts.setActiveChatId(cid); } catch(e){}
          try { window.openChat(cid); } catch(e){ return false; }
          return true;
        };
        if(_openChatWithDefault()) return;
        /* 联系人尚未恢复完成：先铺聊天容器，等数据就绪后立刻进聊天，绝不停在会话列表 */
        __akiniShowAppContainer("chat");
        var _waitDone = false;
        var _waitEvents = ['akini-storage-restored','akini-contacts-restored','akini-cloud-restored','load','pageshow','focus'];
        var _waitCleanup = function(){
          _waitEvents.forEach(function(evt){ try { window.removeEventListener(evt, _waitTry); } catch(e){} });
        };
        var _waitTry = function(){
          if(_waitDone) return;
          try {
            if(_openChatWithDefault()){ _waitDone = true; _waitCleanup(); }
          } catch(e){}
        };
        _waitEvents.forEach(function(evt){
          try { window.addEventListener(evt, _waitTry); } catch(e){}
        });
        setTimeout(_waitTry, 300);
        setTimeout(_waitTry, 900);
        setTimeout(_waitTry, 2000);
        return;
      }

      if(app === "music" || app === "music-together"){
        // 和陪伴(companion)完全一致的入口逻辑：
        // 先把 app-music 容器铺出来，再根据是否有进行中的会话决定盖哪一层。
        __akiniShowAppContainer("music");
        try {
          var musicActive = '1' === localStorage.getItem('akini_music_listening_active');
          if (musicActive && window._showMusicContactPicker) {
            // 有会话：直接回播放器/选人界面
            try { if (window.__akiniHideMusicHome) window.__akiniHideMusicHome(); } catch (e) {}
            window._showMusicContactPicker();
          } else {
            // 无会话：显示「开始一起听」首页。先把播放器藏掉，避免任何情况下播放器露出。
            try {
              var _am = document.getElementById("app-music");
              if (_am) { _am.style.display = "none"; _am.classList.remove("show"); }
            } catch (e) {}
            try { if (window.__akiniHideMusicHome) window.__akiniHideMusicHome(); } catch (e) {}
            if (window.__akiniShowMusicHome) {
              window.__akiniShowMusicHome();
            } else if (window._showMusicContactPicker) {
              window._showMusicContactPicker();
            }
          }
        } catch(e) {}
        return;
      }

      if(app === "survey"){
        if(window._openSurveyList){ window._openSurveyList(); return; }
        var sm = document.getElementById("surveyListModal");
        if(sm){ sm.style.display = "flex"; sm.style.zIndex = "9100"; }
        return;
      }

      if(app === "friends"){
        try{ window.__akiniClearFeatureUnread && window.__akiniClearFeatureUnread("friends"); }catch(e){}
        __akiniShowAppContainer(app);
        return;
      }
      if(app === "call"){
        __akiniShowAppContainer(app);
        return;
      }

      if(app === "icity"){
        try{ window.__akiniClearFeatureUnread && window.__akiniClearFeatureUnread("icity"); }catch(e){}
        showArea("icityArea");
        return;
      }
      if(app === "settings"){ showArea("settingsArea"); return; }
      if(app === "storage"){ window.__openStorageMgr && window.__openStorageMgr(); return; }
      if(app === "beautify"){ showArea("beautifyArea"); return; }
      if(app === "wordbank"){
        showArea("wordbankOverlay");
        if(typeof window.renderWordbank === "function") window.renderWordbank();
        else if(typeof populateWordbankGroups === "function") populateWordbankGroups();
        return;
      }
      if(app === "shop"){
        showEl("app-shop");
        window.__renderShop && window.__renderShop();
        return;
      }
      if(app === "novel"){
        showEl("app-novel");
        window.__renderNovelShelf && window.__renderNovelShelf();
        return;
      }
      if(app === "companion"){
        showEl("app-companion");
        try{ window.__akiniClearFeatureUnread && window.__akiniClearFeatureUnread("companion"); }catch(e){}
        // 如果有进行中的陪伴会话，直接进主界面；否则先显示陪伴首页
        var _cactive = false;
        try{
          if(typeof window.companionState === "function"){
            var _st = window.companionState();
            _cactive = !!( _st && _st.cid );
          }
        }catch(e){}
        if(_cactive){
          window.__openCompanion && window.__openCompanion();
        } else if(typeof window.__akiniShowCompanionHome === "function"){
          window.__akiniShowCompanionHome();
        } else {
          window.__openCompanion && window.__openCompanion();
        }
        return;
      }
      if(app === "mail"){
        if(typeof window.showPage === "function") window.showPage("mail");
        else showEl("app-mail");
        window.__renderMail && window.__renderMail();
        return;
      }
      if(app === "home"){
        window.hideAll && window.hideAll();
        try{
          var cw = document.querySelector(".content-wrapper");
          if(cw){ cw.style.display = "flex"; cw.classList.remove("akini-content-hidden"); }
        }catch(e){}
        try{ window.__akiniShowContent && window.__akiniShowContent(); }catch(e){}
        try{ window.__akiniResetHomeScroll && window.__akiniResetHomeScroll(); }catch(e){}
        return;
      }
      if(app === "chat-detail" && window._akiniLastChatId){ window.openChat(window._akiniLastChatId, true); return; }
      if(app === "ta-phone"){ window.AkiniTaPhone && window.AkiniTaPhone.showTaPhone(); return; }
      if(app === "watch"){ window.__akiniOpenWatch && window.__akiniOpenWatch(); return; }

      if(typeof window.showPage === "function") window.showPage(app);
      else console.warn("navTo unknown app:", app);
    }catch(err){ console.error("navTo error", err); }
  }
  window.navTo = navTo;

  /* 打开应用容器：统一固定定位，避免被首页的父级裁剪 */
  function __akiniShowAppContainer(app){
    var target = document.getElementById("app-" + app);
    if(!target) return;
    target.classList.add("show");
    target.style.display = "flex";
    target.style.position = "fixed";
    target.style.top = "0";
    target.style.left = "0";
    target.style.width = "100%";
    target.style.height = "100%";
    target.style.zIndex = "4000";
    target.style.visibility = "visible";
    target.style.opacity = "1";
    target.style.pointerEvents = "auto";
    if(app === "chat-list" || app === "friends") target.style.background = "#f2f2f2";
    document.body.appendChild(target);
  }

  /* 信箱打开函数：供按钮直接调用 */
  function openMail(){
    var el = document.getElementById("app-mail");
    if(!el) return;
    AKINI_APP_PAGES.forEach(function(id){
      if(id === "app-mail") return;
      var n = document.getElementById(id);
      if(n){ n.style.display = "none"; n.classList.remove("show"); }
    });
    AKINI_AREAS.forEach(function(id){
      var n = document.getElementById(id);
      if(n){ n.style.display = "none"; n.classList.remove("show"); }
    });
    el.style.zIndex = "9000";
    el.style.display = "flex";
    el.classList.add("show");
    if(window.__renderMail) window.__renderMail();
  }
  window.__openMail = openMail;

  /* 导航映射 */
  var map = {
    appBtnChat: "chat-list", appBtnFriends: "friends", appBtnMusic: "music",
    appBtnIcity: "icity", appBtnShop: "shop", appBtnMail: "mail",
    appBtnTaPhone: "ta-phone", appBtnNovel: "novel", appBtnCompanion: "companion",
    appBtnWatch: "watch",
    settingsBtn: "settings", beautifyBtn: "beautify", wordBtn: "wordbank"
  };
  function bindAppButtons(){
    Object.keys(map).forEach(function(id){
      var el = document.getElementById(id);
      if(!el || el.__akiniAppBound) return;
      /* 已由 HTML 内联 onclick 接管（syy 同款写法，兼容旧内核/ArkWeb），
         不再重复绑定，避免一次点击触发两次跳转 */
      if(el.getAttribute("onclick")) return;
      el.__akiniAppBound = true;
      el.setAttribute("data-bound", "1");
      el.style.touchAction = "manipulation";
      var app = map[id];
      el.addEventListener("click", function(){
        if(app === "mail"){
          if(window.navTo) navTo("mail");
          else if(typeof window.showPage === "function") window.showPage("mail");
          else openMail();
          return;
        }
        if(window.navTo) navTo(app);
      });
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindAppButtons);
  } else {
    bindAppButtons();
  }

  /* ===== 微信/浏览器返回键统一关闭网易云一起听浮层 ===== */
  (function(){
    var MUSIC_OVERLAYS = ["app-music","musicMenuOverlay","musicContactPicker","musicPlaylistOverlay","musicPlaylistSelect","musicOptionPicker","musicHomeOverlay","musicHistoryOverlay"];
    function musicIsVisible(){
      var app = document.getElementById("app-music");
      if(app && (app.style.display === "flex" || app.classList.contains("show"))) return true;
      for(var i=0;i<MUSIC_OVERLAYS.length;i++){
        var el = document.getElementById(MUSIC_OVERLAYS[i]);
        if(el && (el.style.display === "flex" || el.classList.contains("show"))) return true;
      }
      return false;
    }
    function hideMusicLayers(){
      // 和陪伴一致：系统/微信返回键只收起音乐界面回首页，不结束一起听会话。
      // 会话保持，下次再进网易云直接回播放器。
      for(var i=0;i<MUSIC_OVERLAYS.length;i++){
        var el = document.getElementById(MUSIC_OVERLAYS[i]);
        if(el){ el.style.display="none"; el.classList.remove("show"); }
      }
      try{ if(window.__akiniHideMusicHome) window.__akiniHideMusicHome(); }catch(e){}
      try{ if(window.hideMusicHome) window.hideMusicHome(); }catch(e){}
      try{ if(window.navTo) window.navTo('home'); }catch(e){}
    }
    /* 音乐浮层出现时自动压入一条历史记录，使微信/系统返回键能关闭它 */
    var appMusic = document.getElementById("app-music");
    if(appMusic && typeof MutationObserver !== 'undefined'){
      var mo = new MutationObserver(function(){
        if(musicIsVisible()){
          try{
            var st = window.history && history.state;
            if(!st || !st._akini_music_open){
              history.pushState({ _akini_music_open: true }, "", location.href);
            }
          }catch(e){}
        }
      });
      mo.observe(appMusic, { attributes: true, attributeFilter: ["style","class"] });
    }
    /* 用户点微信/系统返回时，如果当前没有音乐标记且音乐仍显示，则关闭音乐。
       如果音乐已不可见但历史状态里还残留 _akini_music_open，顺手清掉，
       避免这条残留记录在后续返回时把一起听界面又带回来。 */
    window.addEventListener("popstate", function(e){
      var st = (e && e.state) || {};
      var visible = musicIsVisible();
      if(!st._akini_music_open && visible){
        hideMusicLayers();
      } else if(st._akini_music_open && !visible){
        try {
          var cleaned = {};
          for (var k in st) if (st.hasOwnProperty(k) && k !== '_akini_music_open') cleaned[k] = st[k];
          history.replaceState(cleaned, '', location.href);
        } catch (err) {}
      }
    });
  })();
})();

/* ===== 气泡原生类名标注 =====
   把本应用的气泡结构补上 .message / .message-sent / .message-received，
   让 syy 那套自定义气泡 CSS（依赖这几个原生类名）在任何手机/浏览器上都能直接生效。
   纯 DOM 操作，不读 UA、不判断型号，所有设备走同一条路径。
   转账/表情包/问卷/商品卡/一起听等特殊气泡不加类名，避免被通用气泡样式误伤。 */
(function(){
  if(window.__akiniBubbleTagBooted) return;
  window.__akiniBubbleTagBooted = true;

  var SKIP = /(transfer-bubble|sticker-bubble|survey-bubble|shop-card-bubble|music-invite-bubble|music-end-bubble|system)/;

  function tagOne(row){
    if(!row || row.nodeType !== 1 || !row.classList) return;
    if(!row.classList.contains('me') && !row.classList.contains('other') && !row.classList.contains('ta')) return;
    var b = row.querySelector ? row.querySelector('.bubble') : null;
    if(!b || !b.classList) return;
    if(SKIP.test(b.className || '')) return;
    if(!b.classList.contains('message')) b.classList.add('message');
    if(row.classList.contains('me')){
      if(!b.classList.contains('message-sent')) b.classList.add('message-sent');
      b.classList.remove('message-received');
    }else{
      if(!b.classList.contains('message-received')) b.classList.add('message-received');
      b.classList.remove('message-sent');
    }
  }

  function tag(root){
    try{
      var node = root || document.body;
      if(!node || node.nodeType !== 1) return;
      if(node.classList.contains('msg-row')) tagOne(node);
      var rows = node.querySelectorAll ? node.querySelectorAll('.msg-row') : [];
      for(var i=0;i<rows.length;i++) tagOne(rows[i]);
    }catch(e){}
  }
  window.__akiniTagMessageBubbles = tag;

  var queue = [], scheduled = false;
  function flush(){
    scheduled = false;
    var arr = queue; queue = [];
    for(var i=0;i<arr.length;i++) tag(arr[i]);
  }
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    if(window.requestAnimationFrame) requestAnimationFrame(flush);
    else setTimeout(flush, 16);
  }

  function boot(){
    tag(document.body);
    try{
      if(typeof MutationObserver === 'undefined') return;
      var mo = new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          var added = muts[i].addedNodes || [];
          for(var j=0;j<added.length;j++){
            var n = added[j];
            if(n && n.nodeType === 1) queue.push(n);
          }
        }
        if(queue.length) schedule();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
