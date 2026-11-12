// ================= v743 全面彻底修复系统 =================
// 1. 聊天界面的聊天设置弹窗点击唤起
window.openChatMenuModal = function() {
 var cmo = document.getElementById("chatMenuOverlay");
 if (!cmo) return;
 cmo.style.removeProperty("display");
 cmo.style.display = "flex";
 cmo.classList.add("show");
 cmo.style.pointerEvents = "auto";
 cmo.style.zIndex = "99999";
 try {
   if (typeof window.__akiniSyncChatMenuUI === "function") {
     window.__akiniSyncChatMenuUI();
   }
 } catch (e) {}
};
window.closeChatMenuModal = function() {
 var cmo = document.getElementById("chatMenuOverlay");
 if (!cmo) return;
 cmo.style.display = "none";
 cmo.classList.remove("show");
 cmo.style.pointerEvents = "none";
};
document.addEventListener("DOMContentLoaded", function() {
 // 绑定聊天设置空白背景点击与触摸关闭（三保险：menuBg + chatMenuOverlay 自身）
 var bindMenuOverlayClose = function() {
   var cmo = document.getElementById("chatMenuOverlay");
   var menuBg = document.getElementById("menuBg");
   var doClose = function() {
     window.closeChatMenuModal();
   };
   if (menuBg && !menuBg._close_bound) {
     menuBg._close_bound = true;
     menuBg.addEventListener("click", doClose);
     menuBg.addEventListener("touchend", doClose);
   }
   if (cmo && !cmo._close_bound) {
     cmo._close_bound = true;
     var onCmoTap = function(e) {
       // 仅当点击目标就是 overlay 蒙层本身或非面板内部区域时才关闭
       if (e.target === cmo || e.target.id === "menuBg" || e.target.classList.contains("menu-bg")) {
         doClose(e);
       }
     };
     cmo.addEventListener("click", onCmoTap);
   }
 };
 bindMenuOverlayClose();
 setInterval(function(){ if(!document.hidden) bindMenuOverlayClose(); }, 3000);
 // 绑定聊天右上角展开按钮及昵称条
 var bindMenuBtns = function() {
   var btns = document.querySelectorAll("#chatContactMenuBtn, .chat-contact-menu-btn, #chatTaName, .ta-name-pill");
   btns.forEach(function(btn) {
     if (!btn._v743_bound) {
       btn._v743_bound = true;
       btn.addEventListener("click", function(e) {
         // 仅在 #app-chat 可见时唤起聊天菜单
         var appChat = document.getElementById("app-chat");
         if (appChat && appChat.style.display !== "none") {
           window.openChatMenuModal();
         }
       });
     }
   });
   // 绑定关闭按钮与背景点击
   var menuBg = document.getElementById("menuBg");
   if (menuBg && !menuBg._v743_bound) {
     menuBg._v743_bound = true;
     menuBg.addEventListener("click", function(e) {
       e.preventDefault();
       window.closeChatMenuModal();
     });
   }
   var mpClose = document.getElementById("mpCloseBtn");
   if (mpClose && !mpClose._v743_bound) {
     mpClose._v743_bound = true;
     mpClose.addEventListener("click", function(e) {
       e.preventDefault();
       window.closeChatMenuModal();
     });
   }
 };
 bindMenuBtns();
 // v1229 对齐 milk/syy：改为 visibilitychange 驱动，只在切到前台时绑定一次
 document.addEventListener('visibilitychange', function(){ if(!document.hidden && typeof bindMenuBtns === 'function') bindMenuBtns(); });
 // 恢复保存的各背景
 try {
   var s1_bg = localStorage.getItem("akini_s1_cover_bg");
   if (s1_bg) {
     var el = document.getElementById("s1CoverBg");
     if (el) el.style.setProperty('background-image', 'url("' + s1_bg + '")', 'important');
   }
   var s1_p = localStorage.getItem("akini_s1_polaroid_img");
   if (s1_p) {
     var el = document.getElementById("s1PolaroidImg");
     if (el) el.style.setProperty('background-image', 'url("' + s1_p + '")', 'important');
   }
   var s2_cov = localStorage.getItem("akini_cover_bg");
   if (s2_cov) {
     var el = document.getElementById("coverAreaMain");
     if (el) el.style.setProperty('background-image', 'url("' + s2_cov + '")', 'important');
   }
   var s2_day = localStorage.getItem("akini_day_bg");
   if (s2_day) {
     var el = document.getElementById("bgArea");
     if (el) {
       el.style.setProperty('background-image', 'url("' + s2_day + '")', 'important');
       el.style.backgroundSize = "cover";
       el.style.backgroundPosition = "center";
     }
   }
   var h_bg = localStorage.getItem("akini_home_bg");
   if (h_bg) {
     var el = document.getElementById("phoneFrame");
     if (el) el.style.setProperty('background-image', 'url("' + h_bg + '")', 'important');
   }
   var f_bg = localStorage.getItem("akini_friends_bg");
   if (f_bg) {
     var el = document.getElementById("friendsHeader");
     if (el) el.style.setProperty('background-image', 'url("' + f_bg + '")', 'important');
   }
 } catch(e){}
});
// v973 彻底对齐 极简标杆：图片直存原图 Base64，杜绝 Canvas 二次压缩造成的模糊
window.compressImageDataUrl = function(dataUrl, callback, opts) {
 /* v1087：真压缩——之前是空壳，几 MB 原图直接塞 localStorage 和背景层，
    是"只导几张图就卡崩闪退"的直接元凶。限制最长边 1600px / JPEG 0.82（约 200-500KB） */
 try {
   var img = new Image();
   img.onload = function() {
     try {
       var maxSide = (opts && opts.maxSide) || 1600;
       var q = (opts && opts.quality) || 0.82;
       var w = img.width, hh = img.height;
       if (w > 0 && hh > 0 && Math.max(w, hh) > maxSide) {
         var r = maxSide / Math.max(w, hh);
         w = Math.round(w * r); hh = Math.round(hh * r);
       }
       var cv = document.createElement('canvas');
       cv.width = w; cv.height = hh;
       var ctx = cv.getContext('2d');
       ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hh);
       ctx.drawImage(img, 0, 0, w, hh);
       var out = cv.toDataURL('image/jpeg', q);
       if (out && out.length < String(dataUrl).length) { if (typeof callback === 'function') callback(out); return; }
       if (typeof callback === 'function') callback(dataUrl);
     } catch (err) { if (typeof callback === 'function') callback(dataUrl); }
   };
   img.onerror = function() { if (typeof callback === 'function') callback(dataUrl); };
   img.src = dataUrl;
 } catch (e) { if (typeof callback === 'function') callback(dataUrl); }
};
// 2. 通用可靠的相册选择并处理函数
window.triggerPickImage = function(targetKey, callback) {
 var input = document.getElementById("akini_universal_picker");
 if (!input) {
   input = document.createElement("input");
   input.type = "file";
   input.accept = "image/*";
   input.id = "akini_universal_picker";
   input.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;";
   document.body.appendChild(input);
 }
 input.onchange = function(e) {
   var file = e.target.files && e.target.files[0];
   if (!file) return;
   var reader = new FileReader();
   reader.onload = function(evt) {
     var dataUrl = evt.target.result;
     // 压缩后再保存，避免单图撑爆 localStorage
     window.compressImageDataUrl(dataUrl, function(compressed) {
       if (targetKey) {
         try { localStorage.setItem(targetKey, compressed); } catch(ex){}
       }
       if (callback) callback(compressed);
     });
   };
   reader.readAsDataURL(file);
   input.value = "";
 };
 input.click();
};
/* v1246：handleS1CoverDirect / handleS1PhotoDirect 已统一至 akini-image-upload.js，此处不再定义。 */
// 美化页面按钮事件劫持与确保100%生效
document.addEventListener("DOMContentLoaded", function() {
 var homeBtn = document.getElementById("changeHomeBgBtnBeautify");
 if (homeBtn) {
   homeBtn.onclick = function(e) {
     e.preventDefault();
     window.triggerPickImage("akini_home_bg", function(dataUrl) {
       try { localStorage.setItem("akini_home_bg", dataUrl); } catch(ex) {}
       if (window.applyAkiniHomeBg) { window.applyAkiniHomeBg(dataUrl); return; }
       var el = document.getElementById("phoneFrame");
       if (el) el.style.setProperty('background-image', 'url("' + dataUrl + '")', 'important');
     });
   };
 }
 var friendsBtn = document.getElementById("changeFriendsBgBtnBeautify");
 if (friendsBtn) {
   friendsBtn.onclick = function(e) {
     e.preventDefault();
     window.triggerPickImage("akini_friends_bg", function(dataUrl) {
       var el = document.getElementById("friendsHeader");
       if (el) el.style.setProperty('background-image', 'url("' + dataUrl + '")', 'important');
     });
   };
 }
 // 通话/通话mini背景已由专用 file input 及 v828 终版引擎处理，无需劫持
});