(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function readJson(k, fb){ try{ var v=localStorage.getItem(k); if(v) return JSON.parse(v); }catch(e){} return fb; }
  function writeJson(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function avHtml(av,size){ if(av && /^(data:|https?:|blob:|\/)/.test(av)) return '<img src="'+av+'" style="width:100%;height:100%;object-fit:cover" alt="">'; if(window.nt) return window.nt(av||'',size||40); return '<span>'+(av||'👤')+'</span>'; }
  function myAvatar(){ try{ var a=window.getMyAvatar&&window.getMyAvatar(); if(a) return a; }catch(e){} return localStorage.getItem('akini_my_avatar') || '🐱'; }

  var curCid = null;
  var stkFilterGid='', stkQuery='', stkSelMode=false, stkBlockMode=false, stkSel={};
  var srvQuery='', srvSelMode=false, srvBlockMode=false, srvSel={};

  function getCid(){ if(curCid) return curCid; try{ curCid=localStorage.getItem('akini_wb_sticker_cid')||'me'; }catch(e){ curCid='me'; } return curCid; }
  function setCid(cid){ curCid=cid||'me'; try{ localStorage.setItem('akini_wb_sticker_cid',curCid); }catch(e){} }
  function contacts(){
    var arr=[];
    try{ arr=(window.akiniContacts&&window.akiniContacts.getContacts&&window.akiniContacts.getContacts())||[]; }catch(e){}
    arr=arr.filter(function(c){ return c&&c.id!=='me'&&c.id!=='my'; });
    if(!arr.length && window.__akiniDefaultContact) arr=[window.__akiniDefaultContact()];
    return arr;
  }
  function stkKey(cid){ return 'akini_stickers_'+(cid||getCid()); }
  function stkRead(cid){ var a=readJson(stkKey(cid),[]); return Array.isArray(a)?a:[]; }
  function stkWrite(cid,a){ writeJson(stkKey(cid),a); }
  // 分组按联系人独立：每个人有自己的分组定义
  function stkGroupsKey(cid){ return 'akini_sticker_groups_'+(cid||getCid()); }
  function stkGroups(cid){ var a=readJson(stkGroupsKey(cid),[]); return Array.isArray(a)?a:[]; }
  function stkGroupsWrite(cid,arr){ writeJson(stkGroupsKey(cid),arr); }
  function stkFiltered(arr){
    return arr.map(function(it,i){return {it:it,idx:i};}).filter(function(row){
      var it=row.it||{};
      if(stkFilterGid==='__ungrouped__' && it.g) return false;
      if(stkFilterGid && stkFilterGid!=='__ungrouped__' && String(it.g)!==String(stkFilterGid)) return false;
      if(stkQuery && String(it.name||'').toLowerCase().indexOf(stkQuery.toLowerCase())<0) return false;
      return true;
    });
  }

  /* ---------- 统一轻触绑定 ----------
     同时监听 touchend（捕获阶段）与 click，二者去重只触发一次。
     原因：core 在 #wbContent 与各按钮的 touchend 里 preventDefault 会抑制 click，
     只绑 click 的处理器在真实手机触摸下永远收不到事件 → 表现为"点不动 / 要点好几下"。
     捕获阶段先于 core 的冒泡 touchend 执行，确保动作一定跑到。 */
  function onTap(el, fn, guard){
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el || typeof fn !== 'function') return;
    var handlers = el.__akiniTapHandlers || (el.__akiniTapHandlers = []);
    var gsig = guard ? String(guard) : '';
    for (var i = 0; i < handlers.length; i++) {
      if (handlers[i].fn === fn && String(handlers[i].guard || '') === gsig) return;
    }
    handlers.push({ fn: fn, guard: guard });
    if (el.__akiniTapBound) return;
    el.__akiniTapBound = 1;
    el.style.cursor = 'pointer';
    el.style.webkitTapHighlightColor = 'transparent';
    el.style.touchAction = 'manipulation';
    var sx = 0, sy = 0, moved = false, fromTouch = false;
    function run(){
      var hs = el.__akiniTapHandlers || [];
      for (var j = 0; j < hs.length; j++) {
        var h = hs[j];
        if (h.guard && !h.guard()) continue;
        try { h.fn(); } catch (err) {}
        return;
      }
    }
    el.addEventListener('touchstart', function (e) {
      var p = e.touches && e.touches[0];
      if (p) { sx = p.clientX; sy = p.clientY; moved = false; }
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      var p = e.touches && e.touches[0];
      if (p && (Math.abs(p.clientX - sx) > 10 || Math.abs(p.clientY - sy) > 10)) moved = true;
    }, { passive: true });
    el.addEventListener('touchcancel', function () { moved = false; }, { passive: true });
    // 触摸：touchend 先执行并标记，随后浏览器合成的 click 被跳过，避免一次轻触触发两次
    el.addEventListener('touchend', function () {
      if (moved) { moved = false; return; }
      fromTouch = true;
      run();
      setTimeout(function () { fromTouch = false; }, 400);
    }, { passive: true });
    el.addEventListener('click', function () {
      if (fromTouch) { fromTouch = false; return; }
      if (moved) { moved = false; return; }
      run();
    });
  }
  window.__akiniBindTap = onTap;

  function _srvTap(el, fn){ onTap(el, fn, function(){ return window.__wbTab === 'survey'; }); }
  function _stkTap(el, fn){ onTap(el, fn, function(){ return window.__wbTab === 'sticker'; }); }

  function syncBars(){
    var on=window.__wbTab==='sticker', son=window.__wbTab==='survey';
    var sel=Object.keys(on?stkSel:srvSel).length;
    var sa=$('wbSelectActions'), ba=$('wbBlockActions');
    if(sa) sa.style.display=((on&&stkSelMode)||(son&&srvSelMode))?'flex':'none';
    if(ba) ba.style.display=((on&&stkBlockMode)||(son&&srvBlockMode))?'flex':'none';
    var d=$('wbSelectDeleteBtn'); if(d) d.textContent='删除('+sel+')';
    var b=$('wbBlockDoBtn'); if(b) b.textContent='屏蔽('+sel+')';
    var u=$('wbBlockUndoBtn'); if(u) u.textContent='取消屏蔽('+sel+')';
    var sb=$('selectBtn'); if(sb) sb.classList.toggle('active',(on&&stkSelMode)||(son&&srvSelMode));
    var bb=$('wbBlockBtn'); if(bb) bb.classList.toggle('active',(on&&stkBlockMode)||(son&&srvBlockMode));
  }
  function exitModes(){ stkSelMode=false; stkBlockMode=false; stkSel={}; srvSelMode=false; srvBlockMode=false; srvSel={}; syncBars(); }

  function applyChrome(on){
    var gf=$('wbGroupFilter'); if(gf) gf.style.display='none';
    var add=$('addWordBtn'); if(add) add.style.display=on?'none':'';
    syncBars();
  }

  // 人物切换栏：表情包与问卷共用，按当前联系人高亮
  function peopleBarHtml(){
    var cid=getCid();
    var people=[{id:'me', name:localStorage.getItem('akini_my_name')||'我', avatar:myAvatar()}]
      .concat(contacts().map(function(c){return {id:c.id,name:c.name||'默认联系人',avatar:c.avatar||'🙂'};}));
    var h='<div style="display:flex;gap:14px;overflow-x:auto;padding:8px 16px;background:#fff;min-height:76px;flex-shrink:0">';
    people.forEach(function(p){
      var on=String(p.id)===String(cid);
      h+='<div class="wb-stk-person '+(on?'active':'')+'" data-cid="'+esc(p.id)+'"><div class="wb-stk-person-avatar">'+avHtml(p.avatar,44)+'</div><div class="wb-stk-name">'+esc(p.name)+'</div></div>';
    });
    h+='</div>';
    return h;
  }
  function renderStickerTab(){
    var box=$('wbContent'); if(!box) return; applyChrome(true);
    var cid=getCid();
    var h=peopleBarHtml();
    var groups=stkGroups(cid);
    if(groups.length){
      h+='<div style="display:flex;gap:7px;overflow-x:auto;margin:0 14px 8px;padding:6px;background:#f5f5f5;border-radius:14px;flex-shrink:0"><button type="button" class="wb-stk-chip '+(stkFilterGid===''?'active':'')+'" data-gid="">全部</button><button type="button" class="wb-stk-chip '+(stkFilterGid==='__ungrouped__'?'active':'')+'" data-gid="__ungrouped__">未分组</button>';
      groups.forEach(function(g){ h+='<button type="button" class="wb-stk-chip '+(String(stkFilterGid)===String(g.id)?'active':'')+'" data-gid="'+esc(g.id)+'">'+esc(g.name)+'</button>'; });
      h+='</div>';
    }
    var arr=stkRead(cid), shown=stkFiltered(arr), inMode=stkSelMode||stkBlockMode;
    h+='<div style="padding:0 12px 16px;background:#fff;flex:1"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
    shown.forEach(function(row){
      var it=row.it||{}, i=row.idx, on=!!stkSel[i];
      h+='<div class="wb-stk-item" data-idx="'+i+'" style="border-color:'+(on?'#1a1a1a':'#eee')+';'+(it.b?'opacity:.42;':'')+'"><img loading="lazy" decoding="async" src="'+esc(it.s||'')+'" alt="">'+(inMode?'<span class="stk-chk" style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;border:1px solid #aaa;background:'+(on?'#111':'#fff')+';color:#fff;font-size:12px;text-align:center">'+(on?'✓':'')+'</span>':'')+(it.b?'<span class="badge" style="position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.55);color:#fff">已屏蔽</span>':'')+'</div>';
    });
    h+='</div>'+(shown.length?'':'<div class="empty-text">'+(arr.length?'没有匹配的表情包':'还没有表情包，点右上角「新增」添加图片')+'</div>')+'</div>';
    box.innerHTML=h; syncBars();
  }

  // 问卷按联系人独立：与表情包共用同一个当前联系人 cid
  function surveyKey(cid){ return 'akini_surveys_'+(cid||getCid()); }
  function surveys(cid){ var a=readJson(surveyKey(cid),[]); return Array.isArray(a)?a:[]; }
  function writeSurveys(a){ writeJson(surveyKey(),a); }
  function renderSurveyWbTab(){
    var box=$('wbContent'); if(!box) return; applyChrome(false); syncBars();
    var cid=getCid();
    var arr=surveys(cid).filter(function(s){ return !srvQuery || String(s.title||'').indexOf(srvQuery)>=0 || String(s.q||'').indexOf(srvQuery)>=0; });
    var h=peopleBarHtml();
    h += arr.length ? arr.map(function(s){ return '<div class="survey-card" data-sid="'+esc(s.id)+'"><strong>'+esc(s.title||'未命名问卷')+'</strong><p>'+esc(s.q||'')+'</p></div>'; }).join('') : '<div class="empty-text">还没有问卷，点右上角「新增」创建</div>';
    box.innerHTML = h;
  }

  window.renderStickerTab=renderStickerTab;
  window.renderSurveyWbTab=renderSurveyWbTab;
  window.__akiniRenderCurrentWbTab=function(){
    if(window.__wbTab==='sticker') renderStickerTab();
    else if(window.__wbTab==='survey') renderSurveyWbTab();
    else { applyChrome(false); window.__wbRenderList&&window.__wbRenderList(); }
  };

  function toggleSearch(){
    var bar=$('wbSearchBar'), ip=$('wbSearchInput'); if(!bar) return;
    var show=bar.style.display!=='block';
    bar.style.display=show?'block':'none';
    if(ip){ ip.value=''; if(show) ip.focus(); }
    stkQuery=''; srvQuery='';
    window.__akiniRenderCurrentWbTab();
  }
  function openAdd(){
    if(window.__wbTab==='sticker'){ var m=$('addStickerModal'); if(m) m.style.display='flex'; }
    else if(window.__wbTab==='survey'){ var s=$('surveyCreateModal'); if(s) s.style.display='flex'; }
  }
  function addStickerFiles(files){
    var cid=getCid(), arr=stkRead(cid), list=[].slice.call(files||[]);
    if(!list.length) return;
    var left=list.length;
    list.forEach(function(f){
      var r=new FileReader();
      r.onload=function(){
        arr.push({id:Date.now()+Math.random(),s:r.result,g:'',b:false});
        if(--left===0){ stkWrite(cid,arr); renderStickerTab(); }
      };
      r.readAsDataURL(f);
    });
  }
  function toggleSel(){
    if(window.__wbTab==='sticker'){ stkSelMode=!stkSelMode; if(stkSelMode) stkBlockMode=false; stkSel={}; renderStickerTab(); }
    else if(window.__wbTab==='survey'){ srvSelMode=!srvSelMode; if(srvSelMode) srvBlockMode=false; srvSel={}; renderSurveyWbTab(); }
  }
  function toggleBlock(){
    if(window.__wbTab==='sticker'){ stkBlockMode=!stkBlockMode; if(stkBlockMode) stkSelMode=false; stkSel={}; renderStickerTab(); }
    else if(window.__wbTab==='survey'){ srvBlockMode=!srvBlockMode; if(srvBlockMode) srvSelMode=false; srvSel={}; renderSurveyWbTab(); }
  }

  function bindToolbar(){
    if (window.__stkToolbarBound) return;
    window.__stkToolbarBound = true;
    _stkTap('searchBtn', toggleSearch);
    _srvTap('searchBtn', toggleSearch);
    _stkTap('groupBtn', function(){ alert('表情包分组管理'); });
    _srvTap('groupBtn', function(){ alert('问卷分组管理'); });
    _stkTap('dedupBtn', function(){ alert('没有重复表情包'); });
    _srvTap('dedupBtn', function(){ alert('没有重复问卷'); });
    _stkTap('selectBtn', toggleSel);
    _srvTap('selectBtn', toggleSel);
    _stkTap('wbBlockBtn', toggleBlock);
    _srvTap('wbBlockBtn', toggleBlock);
    _stkTap('wbImportBtn', function(){ var i=$('wbImportInput'); if(i) i.click(); });
    _srvTap('wbImportBtn', function(){ var i=$('wbImportInput'); if(i) i.click(); });

    onTap('wbHeadAdd', openAdd, function(){ return true; });
    onTap('addWordBtn', openAdd, function(){ return window.__wbTab==='sticker'||window.__wbTab==='survey'; });
    onTap('cancelStickerAdd', function(){ var m=$('addStickerModal'); if(m) m.style.display='none'; });
    onTap('confirmStickerAdd', function(){ addStickerFiles($('stickerFile').files); var m=$('addStickerModal'); if(m) m.style.display='none'; });
    var imp=$('wbImportInput');
    if(imp) imp.addEventListener('change',function(){ if(window.__wbTab==='sticker') addStickerFiles(this.files); });
    onTap('cancelSurveyAdd', function(){ var m=$('surveyCreateModal'); if(m) m.style.display='none'; });
    onTap('confirmSurveyAdd', function(){
      var a=surveys();
      a.push({id:Date.now(),title:$('surveyTitle').value||'未命名问卷',q:$('surveyQuestion').value||''});
      writeSurveys(a);
      var m=$('surveyCreateModal'); if(m) m.style.display='none';
      renderSurveyWbTab();
    });
    var search=$('wbSearchInput');
    if(search) search.addEventListener('input',function(){
      if(window.__wbTab==='sticker') stkQuery=this.value.trim();
      if(window.__wbTab==='survey') srvQuery=this.value.trim();
      window.__akiniRenderCurrentWbTab();
    });
    onTap('wbSearchClose', toggleSearch, function(){ return true; });
  }

  /* 容器级委托：在 #wbContent 上用捕获阶段 touchend 响应头像/分组/格子。
     core 在 #wbContent 的冒泡 touchend 里 preventDefault 会抑制 click，
     捕获阶段先执行，保证手机触摸下一定能切换联系人、筛选分组、选中格子。 */
  function bindContentDelegation(){
    var box = $('wbContent');
    if (!box || box.__stkContentBound) return;
    box.__stkContentBound = true;
    var sx=0, sy=0, moved=false;
    box.addEventListener('touchstart', function(e){
      var p=e.touches&&e.touches[0]; if(p){ sx=p.clientX; sy=p.clientY; moved=false; }
    }, {passive:true});
    box.addEventListener('touchmove', function(e){
      var p=e.touches&&e.touches[0];
      if(p && (Math.abs(p.clientX-sx)>10 || Math.abs(p.clientY-sy)>10)) moved=true;
    }, {passive:true});
    function handle(ev){
      var tab = window.__wbTab;
      if (tab !== 'sticker' && tab !== 'survey') return;
      if (moved) return;
      var t = ev.target;
      if (!t || !t.closest) return;
      var person = t.closest('.wb-stk-person');
      var chipEl = t.closest('.wb-stk-chip');
      var item = t.closest('.wb-stk-item');
      if (!person && !chipEl && !item) return;
      try {
        // 头像切换：表情包与问卷共用，切完重渲染当前 tab
        if (person) {
          setCid(person.getAttribute('data-cid'));
          stkSel={}; srvSel={};
          if (tab === 'sticker') renderStickerTab(); else renderSurveyWbTab();
          return;
        }
        if (tab !== 'sticker') return;
        if (chipEl) { stkFilterGid = chipEl.getAttribute('data-gid') || ''; stkSel={}; renderStickerTab(); return; }
        if (item && (stkSelMode || stkBlockMode)) {
          var idx = parseInt(item.getAttribute('data-idx'), 10);
          if (isNaN(idx)) return;
          if (stkSel[idx]) delete stkSel[idx]; else stkSel[idx] = true;
          renderStickerTab();
        }
      } catch(x) {}
    }
    box.addEventListener('touchend', function(e){ handle(e); }, true);
    box.addEventListener('click', function(e){ handle(e); });
  }

  // 切 tab 时退出选择/屏蔽模式
  function bindTabExit(){
    if (window.__stkTabExitBound) return;
    window.__stkTabExitBound = true;
    document.addEventListener('click', function(e){
      var tab = e.target.closest && e.target.closest('.wb-tabs .tab');
      if (tab) setTimeout(function(){ if(window.__wbTab!=='sticker' && window.__wbTab!=='survey') exitModes(); }, 0);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    bindToolbar();
    bindContentDelegation();
    bindTabExit();
  });
})();
