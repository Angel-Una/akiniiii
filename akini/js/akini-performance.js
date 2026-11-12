
(function(){
  if (!/iP(hone|ad|od)/.test(navigator.userAgent)) return;
  var HEAP_LIMIT = 0.85;
  var IDLE_TIMEOUT = 25000;
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
    try { console.warn('[Akini] iOS 内存压力降载:', reason); } catch(e){}
    try { document.documentElement.classList.add('akini-low-mem'); } catch(e){}
    try {
      document.querySelectorAll('video').forEach(function(v){ try{v.pause();}catch(e){} });
    } catch(e){}
  }
  setInterval(function(){
    var r = heapRatio();
    if (r > HEAP_LIMIT) { degrade('heap ' + Math.round(r*100) + '%'); return; }
    if (r > 0.65 && (Date.now() - lastInteraction) > IDLE_TIMEOUT) { degrade('idle heap ' + Math.round(r*100) + '%'); }
  }, 5000);
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden && !degraded) lastInteraction = Date.now();
  });
})();

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
        try { window.__akiniIncCache = {}; } catch (e) {}
        try {
          var zn = document.getElementById('chatBody');
          if (zn) zn.setAttribute('data-rendered-chat-id', '');
        } catch (e) {}
      }
    };
  }
  install();
  var _iv = setInterval(function () { install(); if (window.__akiniChatSwitchPatched) clearInterval(_iv); }, 200);
  setTimeout(function () { try { clearInterval(_iv); } catch (e) {} }, 8000);
})();

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
    var now = Date.now();
    if (now - lastKick < 45000) return;
    lastKick = now;
    if (!hasContacts()) return;
    if (toggleOn('contactFriendsToggle') && !hasSchedule('akini_next_friendsPost')) {
      try {
        if (typeof window._akiniRescheduleFriendsPost === 'function') {
          window._akiniRescheduleFriendsPost();
          console.log('[Akini] 朋友圈调度死停，已重新排期');
        }
      } catch (e) {}
    }
    if (toggleOn('contactIcityToggle') && !hasSchedule('akini_next_icityPost')) {
      try {
        if (typeof window._akiniRescheduleIcityPost === 'function') {
          window._akiniRescheduleIcityPost();
          console.log('[Akini] iCity调度死停，已重新排期');
        }
      } catch (e) {}
    }
    if (toggleOn('contactMailToggle')) {
      try {
        if (window.akiniMailEngine && typeof window.akiniMailEngine.checkStatus === 'function') {
          window.akiniMailEngine.checkStatus();
        }
      } catch (e) {}
    }
  }
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

  function firstKickIfNeeded() {
    try {
      if (localStorage.getItem('akini__first_kick') === '1') return;
      if (!hasContacts()) return;
      var friends = toggleOn('contactFriendsToggle');
      var icity = toggleOn('contactIcityToggle');
      var mail = toggleOn('contactMailToggle');
      if (!friends && !icity && !mail) return;
      localStorage.setItem('akini__first_kick', '1');
      var delay = 10000 + Math.floor(Math.random() * 80000);
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
          console.log('[Akini] 首启快速互动已触发');
        } catch (e) {}
      }, delay);
    } catch (e) {}
  }
  var fkIv = setInterval(function () {
    firstKickIfNeeded();
    if (localStorage.getItem('akini__first_kick') === '1') clearInterval(fkIv);
  }, 1500);
  setTimeout(function () { try { clearInterval(fkIv); } catch (e) {} }, 60000);
})();
