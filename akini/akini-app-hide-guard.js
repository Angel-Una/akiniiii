(function(){
  var HIDE_APPS = ["app-chat","app-chat-list","app-friends","app-mail","app-music","app-call","app-add-contact","app-contact-detail","app-create-group","app-shop","app-novel","app-novel-reader","app-companion"];
  var HIDE_AREAS = ["settingsArea","akiniProbArea","beautifyArea","icityArea","storageArea","wordbankOverlay","wbExclOverlay","surveyListModal","surveyCreateModal","surveyDetailModal","surveyCreatedListModal"];

  function hide(list){
    list.forEach(function(id){
      var el = document.getElementById(id);
      if(el){ el.style.display = "none"; el.classList.remove("show"); }
    });
  }

  window.hideAll = function hideAll(){
    _akiniCleanPopups();
    hide(HIDE_APPS);
    hide(HIDE_AREAS);
    var menu = document.getElementById("chatMenuOverlay");
    if(menu){ menu.style.display = "none"; menu.classList.remove("show"); }
    var addMenu = document.querySelector(".chat-list-add-menu-overlay");
    if(addMenu){ addMenu.classList.remove("show"); setTimeout(function(){ addMenu.remove(); }, 200); }
  };

  window.showEl = function showEl(id, z){
    var el = document.getElementById(id);
    if(!el) return el;
    el.style.zIndex = z || "9000";
    el.style.display = "flex";
    el.classList.add("show");
    return el;
  };

  window.showArea = function showArea(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.style.zIndex = "9000";
    el.style.display = "flex";
    el.classList.add("show");
  };

  function navTo(app){
    try{
      window.hideAll();

      if(app === "chat-list"){
        var dc = window.__akiniDefaultContact && window.__akiniDefaultContact();
        if(dc && window.openChat){
          window.akiniContacts && window.akiniContacts.setActiveChatId && window.akiniContacts.setActiveChatId(dc.id);
          window.openChat(dc.id, true);
          return;
        }
        __akiniShowAppContainer("chat-list");
        return;
      }

      if(app === "music" || app === "music-together"){
        var mdc = window.__akiniDefaultContact && window.__akiniDefaultContact();
        if(mdc){
          try{
            localStorage.setItem("akini_music_selected_contacts", JSON.stringify([mdc.id]));
            localStorage.removeItem("akini_music_exited");
          }catch(e){}
        }
        __akiniShowAppContainer("music");
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
      if(app === "call" || app === "add-contact" || app === "contact-detail" || app === "create-group"){
        if(app === "create-group") return; /* 群聊已移除，仅保留与默认联系人的单人会话 */
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
        window.__openCompanion && window.__openCompanion();
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
        return;
      }
      if(app === "contact-detail"){ showArea("contactDetailArea"); return; }
      if(app === "add-contact"){ showArea("addContactArea"); return; }
      if(app === "chat-detail" && window._akiniLastChatId){ window.openChat(window._akiniLastChatId, true); return; }
      if(app === "ta-phone"){ window.AkiniTaPhone && window.AkiniTaPhone.showTaPhone(); return; }
      if(app === "mail"){ showEl("app-mail"); return; }

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
    target.style.zIndex = "8000";
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
    hide(HIDE_APPS.filter(function(id){ return id !== "app-mail"; }));
    hide(HIDE_AREAS);
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
    settingsBtn: "settings", beautifyBtn: "beautify", wordBtn: "wordbank"
  };
  Object.keys(map).forEach(function(id){
    var el = document.getElementById(id);
    if(!el || el.__akiniAppBound) return;
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
})();
