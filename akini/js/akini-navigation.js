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
})();