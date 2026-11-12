
/* 聊天设置菜单：打开/关闭 + 全局事件委托 */
window.openChatMenuModal = function() {
  var cmo = document.getElementById("chatMenuOverlay");
  if (!cmo) return;
  cmo.style.display = "flex";
  cmo.classList.add("show");
  cmo.style.pointerEvents = "auto";
  cmo.style.zIndex = "99999";
  try {
    if (typeof window.__akiniSyncChatMenuUI === "function") window.__akiniSyncChatMenuUI();
  } catch (e) {}
};

window.closeChatMenuModal = function() {
  var cmo = document.getElementById("chatMenuOverlay");
  if (!cmo) return;
  cmo.style.display = "none";
  cmo.classList.remove("show");
  cmo.style.pointerEvents = "none";
};

document.addEventListener("click", function(e) {
  var t = e.target;
  if (!t || !t.closest) return;

  if (t.id === "menuBg" || (t.classList && t.classList.contains("menu-bg")) || t.id === "chatMenuOverlay" || t.id === "mpCloseBtn") {
    window.closeChatMenuModal();
    return;
  }

  var menuBtn = t.closest("#chatContactMenuBtn, .chat-contact-menu-btn, #chatTaName, .ta-name-pill");
  if (menuBtn) {
    var appChat = document.getElementById("app-chat");
    if (appChat && appChat.style.display !== "none") window.openChatMenuModal();
    return;
  }

  var homeBtn = t.closest("#changeHomeBgBtnBeautify");
  if (homeBtn) {
    e.preventDefault();
    window.triggerPickImage("akini_home_bg", function(dataUrl) {
      try { localStorage.setItem("akini_home_bg", dataUrl); } catch(ex) {}
      if (window.applyAkiniHomeBg) { window.applyAkiniHomeBg(dataUrl); return; }
      var el = document.getElementById("phoneFrame");
      if (el) el.style.setProperty('background-image', 'url("' + dataUrl + '")', 'important');
    });
    return;
  }

  var friendsBtn = t.closest("#changeFriendsBgBtnBeautify");
  if (friendsBtn) {
    e.preventDefault();
    window.triggerPickImage("akini_friends_bg", function(dataUrl) {
      var el = document.getElementById("friendsHeader");
      if (el) el.style.setProperty('background-image', 'url("' + dataUrl + '")', 'important');
    });
  }
});

window.compressImageDataUrl = function(dataUrl, callback, opts) {
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
      window.compressImageDataUrl(evt.target.result, function(compressed) {
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
