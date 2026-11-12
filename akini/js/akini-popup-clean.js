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
window.akiniGoBack = function(target){
 _akiniCleanPopups();
 // 返回首页 = 隐藏所有应用页/浮层，露出 .content-wrapper 真正首页
 if (target === "home") {
   try { localStorage.removeItem("akini_active_chat_id"); } catch(e){}
   var _allApps = ["app-chat-list","app-friends","app-mail","app-music","app-chat","app-call","app-add-contact","app-contact-detail","app-create-group","app-shop","app-novel","app-novel-reader","app-companion"];
   var _allAreas = ["settingsArea","beautifyArea","icityArea","storageArea","wordbankOverlay","wbExclOverlay","surveyListModal","surveyCreateModal","surveyDetailModal","surveyCreatedListModal"];
   var _allOverlays = ["musicMenuOverlay","musicContactPicker","musicPlaylistOverlay","musicPlaylistSelect","musicOptionPicker"];
   _allOverlays.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
   _allApps.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
   _allAreas.forEach(function(id){ var a=document.getElementById(id); if(a){ a.style.display="none"; a.classList.remove("show"); } });
   if(window.__akiniBackStack) window.__akiniBackStack.length = 0;
   try { var _cw=document.querySelector(".content-wrapper"); if(_cw){ _cw.style.display="flex"; _cw.classList.remove("akini-content-hidden"); } } catch(e){}
   try { if(window.__akiniShowContent) window.__akiniShowContent(); } catch(e){}
   /* 回到首页统一复位滚动位置，杜绝首页停留在上次的偏移（PWA 启动/返回时界面上移） */
   try { if(window.__akiniResetHomeScroll) window.__akiniResetHomeScroll(); } catch(e){}
   return false;
 }
 // 返回优先使用导航历史，否则按目标层级返回
 if (target !== "home" && window.__navBack && !window.__navBack._akini) {
   try { if (window.__navBack()) return false; } catch(e){}
 }
 /* v845 防穿透：切到任一 app 页时同时隐藏首页 homeScreens，否则首页底栏（设置/美化/字卡库）
  会持续显示在聊天界面底部（"首页穿透到聊天"的元凶） */
var allPages = ["app-chat-list","app-friends","app-mail","app-music","app-chat","app-call","app-add-contact","app-contact-detail","app-create-group"];
var homeScreens = ["homeScreens","bottomBar"];
 var areas = ["settingsArea","beautifyArea","icityArea","wordbankOverlay","surveyListModal","surveyCreateModal","surveyDetailModal","surveyCreatedListModal"];
 var overlays = ["musicMenuOverlay","musicContactPicker","musicPlaylistOverlay","musicPlaylistSelect","musicOptionPicker"];
 // 离开聊天页时清除当前激活会话，避免后续返回列表仍被判定为“在聊天”而不弹通知
 if (target !== "chat" && target !== "chat-list") {
   try { localStorage.removeItem("akini_active_chat_id"); } catch(e){}
 }
 overlays.forEach(function(id){ var el=document.getElementById(id); if(el){ el.style.display="none"; el.classList.remove("show"); } });
 // 记录当前是否在添加联系人/创建群聊页面，用于返回 chat-list 时切到通讯录 tab
 var sourcePage = null;
 for (var k=0;k<allPages.length;k++){ var src=document.getElementById(allPages[k]); if(src && src.style.display!=="none" && src.classList.contains("show")){ sourcePage = allPages[k].replace("app-",""); break; } }
 // 先隐藏所有应用页和浮层
 for (var i=0;i<allPages.length;i++){ var el=document.getElementById(allPages[i]); if(el){ el.style.display="none"; el.classList.remove("show"); } }
 for (var h=0;h<homeScreens.length;h++){ var hel=document.getElementById(homeScreens[h]); if(hel){ hel.style.display="none"; } }
 for (var j=0;j<areas.length;j++){ var a=document.getElementById(areas[j]); if(a){ a.style.display="none"; a.classList.remove("show"); } }
 if(window.__akiniBackStack) window.__akiniBackStack.length = 0;
 if (target) {
   if (window.showPage) { try { window.showPage(target); } catch(e){} }
   var el = document.getElementById("app-" + target);
   if (el) { el.style.display="flex"; el.classList.add("show"); el.style.zIndex="500"; }
   // 从添加联系人/创建群聊返回时，切换到通讯录 tab；其余回到 chat-list 默认 微信 tab
   if (target === "chat-list" && window.switchChatTab) {
     try { window.switchChatTab(sourcePage === "contact-detail" || sourcePage === "add-contact" ? "contacts" : "wechat"); } catch(e){}
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
// __navBack 由 akini-core.js 定义（加载顺序在本文件之后），此处仅做存在性守卫标记，不再 defineProperty 锁定
if (window.__navBack) { window.__navBack._akini = true; }
window.__akiniGoHome = function(){
 try{
   var allPages=["app-chat-list","app-friends","app-mail","app-music","app-chat","app-call","app-add-contact","app-contact-detail","app-create-group"];
   var areas=["settingsArea","beautifyArea","icityArea","wordbankOverlay","surveyListModal","surveyCreateModal","surveyDetailModal","surveyCreatedListModal"];
   var overlays=["musicMenuOverlay","musicContactPicker","musicPlaylistOverlay","musicPlaylistSelect","musicOptionPicker"];
   overlays.forEach(function(id){var el=document.getElementById(id);if(el){el.style.display="none";el.classList.remove("show");}});
   allPages.forEach(function(id){var el=document.getElementById(id);if(el){el.style.display="none";el.classList.remove("show");}});
   areas.forEach(function(id){var a=document.getElementById(id);if(a){a.style.display="none";a.classList.remove("show");}});
   if(window.__akiniBackStack) window.__akiniBackStack.length=0;
   try{localStorage.removeItem("akini_active_chat_id");}catch(e){}
   /* Show home page (chat-list) with bottom nav */
   var homeEl=document.getElementById("app-chat-list");
   if(homeEl){homeEl.style.display="flex";homeEl.classList.add("show");homeEl.style.zIndex="500";}
 }catch(e){console.error("[goHome] error",e);}
 return false;
};
/* v1245：移除 Object.defineProperty 锁定 __navBack——本文件加载早于 core.js，
  若在此锁定会把 __navBack 锁死为 undefined，导致 core.js 无法定义导航函数。*/