
/* iCity：编辑个人资料时兜底恢复头像预览；localStorage 超量时清理冗余快照 */
(function(){
  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest('#icityEditProfileBtn') : null;
    if(!btn) return;
    setTimeout(function(){
      var p = document.getElementById('icityEditMyAvatarPreview');
      if(!p) return;
      var val = '';
      if(window.getMyAvatar){
        try{ val = window.getMyAvatar(); }catch(e){}
      }
      if(!val || val.indexOf('🐱')>=0){
        val = (window.__akiniAvatarCache && window.__akiniAvatarCache.my) || '';
      }
      if(!val || val.indexOf('🐱')>=0){
        val = localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_icity_my_avatar') || '';
      }
      if(!val || val.indexOf('🐱')>=0){
        try{
          var home = JSON.parse(localStorage.getItem('akini_home_avatars')||'{}');
          if(home && home.my) val = home.my;
        }catch(e){}
      }
      if(!val || val.indexOf('🐱')>=0) return;
      var inp = p.querySelector('input[type="file"]');
      if(inp) inp.remove();
      if(val.indexOf('<img')===0){ p.innerHTML = val; }
      else if(val.indexOf('data:')===0 || val.indexOf('http')===0){
        p.innerHTML = '<img src="'+val.replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">';
      } else {
        p.textContent = val;
      }
      if(inp) p.appendChild(inp);
    }, 60);
  });

  function guardStorage(){
    try{
      var total = 0;
      var i, k;
      for(i=0;i<localStorage.length;i++){
        k = localStorage.key(i);
        if(k) total += (k.length + ((localStorage.getItem(k)||'').length));
      }
      if(total < 4*1024*1024) return;
      var candidates = [];
      for(i=0;i<localStorage.length;i++){
        k = localStorage.key(i);
        if(k && /_snapshot|_backup|_cache|akini_chat_history_html/.test(k)) candidates.push(k);
      }
      candidates.forEach(function(key){ try{ localStorage.removeItem(key); }catch(e){} });
      console.log('[Akini] 存储清理', candidates.length, '个冗余键');
    }catch(e){}
  }
  setTimeout(guardStorage, 3000);
  setInterval(function(){
    if(document.hidden || window._restoringData) return;
    guardStorage();
  }, 60000);
})();
