(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function readJson(key, fallback){
    try { var raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch(e) {}
    return fallback;
  }
  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  }
  function defaultContacts(){ return [{ id:'default', name:'默认联系人', avatar:'🙂' }]; }
  window.akiniContacts = window.akiniContacts || {
    getContacts:function(){ return readJson('akini_contacts', defaultContacts()); },
    getActiveChatId:function(){ return localStorage.getItem('akini_active_chat_id') || 'default'; }
  };
  window.__akiniDefaultContact = function(){ return defaultContacts()[0]; };
  window.getMyAvatar = function(){ return localStorage.getItem('akini_my_avatar') || '🐱'; };
  window.nt = function(av, size){
    if (av && /^(data:|https?:|blob:|\/)/.test(av)) return '<img src="'+av+'" style="width:100%;height:100%;object-fit:cover" alt="">';
    return '<span style="font-size:'+Math.round((size||40)*0.45)+'px">'+(av||'👤')+'</span>';
  };
  window.showNotification = function(msg){ console.log('[notice]', msg); };
  window.__wbTab = window.__wbTab || 'main';
  function renderBasicWordTab(){
    var box = $('wbContent'); if(!box) return;
    var key = 'akini_wordbank_' + window.__wbTab;
    var arr = readJson(key, []);
    if (!arr.length) { box.innerHTML = '<div class="empty-text">' + window.__wbTab + ' 列表空空如也</div>'; return; }
    box.innerHTML = arr.map(function(x){return '<div class="survey-card">'+String(x.text||x)+'</div>';}).join('');
  }
  window.__wbRenderList = renderBasicWordTab;
  window.__wbSyncSearchScope = function(){};
  window.__openWordBank = function(){
    var w = $('wordbankOverlay'); if(!w) return;
    w.style.display='flex';
    try { if (window.__akiniRenderCurrentWbTab) window.__akiniRenderCurrentWbTab(); else renderBasicWordTab(); } catch(e) { console.error(e); }
  };
  function closeWordBank(){ var w=$('wordbankOverlay'); if(w) w.style.display='none'; }
  function bindTap(el, fn){
    if(!el || el.__coreTapBound) return;
    el.__coreTapBound = true;
    var sx=0, sy=0, moved=false, touching=false, fired=false;
    el.addEventListener('touchstart', function(e){ var t=e.touches&&e.touches[0]; if(t){ sx=t.clientX; sy=t.clientY; moved=false; touching=true; fired=false; } }, {passive:true});
    el.addEventListener('touchmove', function(e){ var t=e.touches&&e.touches[0]; if(t && (Math.abs(t.clientX-sx)>10 || Math.abs(t.clientY-sy)>10)) moved=true; }, {passive:true});
    el.addEventListener('touchend', function(e){
      if(!touching) return; touching=false;
      if(!moved){ fired=true; try { fn(e); } catch(err){ console.error(err); } try { e.preventDefault(); } catch(_){} }
    }, {passive:false});
    el.addEventListener('click', function(e){ if(fired){ fired=false; return; } if(moved){ moved=false; return; } try { fn(e); } catch(err){ console.error(err); } });
  }
  window.__coreBindTap = bindTap;
  function setTab(tab){
    window.__wbTab = tab || 'main';
    document.querySelectorAll('.wb-tabs .tab').forEach(function(b){ b.classList.toggle('active', (b.getAttribute('data-tab')||'main') === window.__wbTab); });
    var sb = $('wbSearchBar'); if(sb) sb.style.display='none';
    var si = $('wbSearchInput'); if(si) si.value='';
    if (window.__akiniRenderCurrentWbTab) window.__akiniRenderCurrentWbTab(); else renderBasicWordTab();
  }
  function bindWordbank(){
    bindTap($('wordBtn'), window.__openWordBank);
    bindTap($('closeWordBank'), closeWordBank); bindTap($('closeWordBankBottom'), closeWordBank);
    var tabs = $('wbTabs');
    if (tabs && !tabs.__coreTabsBound) {
      tabs.__coreTabsBound = true;
      bindTap(tabs, function(e){ var t=e.target.closest && e.target.closest('.tab'); if(t) setTab(t.getAttribute('data-tab')||'main'); });
    }
    var content = $('wbContent');
    if (content && !content.__wordItemTouchBound) {
      content.__wordItemTouchBound = true;
      var sx=0, sy=0, touching=false;
      content.addEventListener('touchstart', function(e){ var t=e.touches&&e.touches[0]; if(t){ sx=t.clientX; sy=t.clientY; touching=true; } }, {passive:true});
      content.addEventListener('touchend', function(e){
        if (!touching) return; touching=false;
        var p=e.changedTouches&&e.changedTouches[0];
        if (p && Math.abs(p.clientX-sx)<=10 && Math.abs(p.clientY-sy)<=10) {
          if (e.target.closest && e.target.closest('.wb-word-item')) {}
          try { e.preventDefault(); } catch(_) {}
        }
      }, {passive:false});
    }
  }
  function initHome(){
    var title = localStorage.getItem('akini_home_title'); if(title) $('homeTitle').textContent = title;
    var bg = localStorage.getItem('akini_home_bg');
    if(bg){ $('homeHero').style.backgroundImage='url("'+bg+'")'; $('homeHero').classList.remove('black'); }
    else if(localStorage.getItem('akini_home_bg_missing')==='1'){ $('homeHero').classList.add('black'); }
    bindTap($('setTextBtn'), function(){ localStorage.setItem('akini_home_title','已保存的自定义文字'); $('homeTitle').textContent='已保存的自定义文字'; });
    bindTap($('setImageBtn'), function(){ $('homeImageInput').click(); });
    $('homeImageInput').addEventListener('change', function(){
      var f=this.files&&this.files[0]; if(!f) return;
      var r=new FileReader();
      r.onload=function(){ localStorage.setItem('akini_home_bg', r.result); $('homeHero').style.backgroundImage='url("'+r.result+'")'; $('homeHero').classList.remove('black'); };
      r.readAsDataURL(f);
    });
  }
  document.addEventListener('DOMContentLoaded', function(){ bindWordbank(); initHome(); });
})();
