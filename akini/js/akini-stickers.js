(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function readJson(k, fb){ try{ var v=localStorage.getItem(k); if(v) return JSON.parse(v); }catch(e){} return fb; }
  function writeJson(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function avHtml(av,size){ if(av && /^(data:|https?:|blob:|\/)/.test(av)) return '<img src="'+av+'" style="width:100%;height:100%;object-fit:cover" alt="">'; if(window.nt) return window.nt(av||'',size||40); return '<span>'+(av||'👤')+'</span>'; }
  function myAvatar(){ try{ var a=window.getMyAvatar&&window.getMyAvatar(); if(a) return a; }catch(e){} return localStorage.getItem('akini_my_avatar') || '🐱'; }
  var curCid = null, stkFilterGid='', stkQuery='', stkSelMode=false, stkBlockMode=false, stkSel={};
  var srvQuery='', srvSelMode=false, srvBlockMode=false, srvSel={};
  function getCid(){ if(curCid) return curCid; try{ curCid=localStorage.getItem('akini_wb_sticker_cid')||'me'; }catch(e){ curCid='me'; } return curCid; }
  function setCid(cid){ curCid=cid||'me'; try{ localStorage.setItem('akini_wb_sticker_cid',curCid); }catch(e){} }
  function contacts(){ var arr=[]; try{ arr=(window.akiniContacts&&window.akiniContacts.getContacts&&window.akiniContacts.getContacts())||[]; }catch(e){} arr=arr.filter(function(c){ return c&&c.id!=='me'&&c.id!=='my'; }); if(!arr.length && window.__akiniDefaultContact) arr=[window.__akiniDefaultContact()]; return arr; }
  function stkKey(cid){ return 'akini_stickers_'+(cid||getCid()); }
  function stkRead(cid){ var a=readJson(stkKey(cid),[]); return Array.isArray(a)?a:[]; }
  function stkWrite(cid,a){ writeJson(stkKey(cid),a); }
  function stkGroups(){ var a=readJson('akini_sticker_groups',[]); return Array.isArray(a)?a:[]; }
  function stkFiltered(arr){ return arr.map(function(it,i){return {it:it,idx:i};}).filter(function(row){ var it=row.it||{}; if(stkFilterGid==='__ungrouped__' && it.g) return false; if(stkFilterGid && stkFilterGid!=='__ungrouped__' && String(it.g)!==String(stkFilterGid)) return false; if(stkQuery && String(it.name||'').toLowerCase().indexOf(stkQuery.toLowerCase())<0) return false; return true; }); }
  function applyChrome(on){ var gf=$('wbGroupFilter'); if(gf && on) gf.style.display='none'; var add=$('addWordBtn'); if(add) add.style.display=on?'none':''; syncBars(); }
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
  var _setCid = setCid;
  var _stkSel = stkSel;
  var _stkFilterGid = stkFilterGid;
  var _stkSelMode = stkSelMode;
  var _stkBlockMode = stkBlockMode;
  var _syncModeBars = syncBars;
  function renderStickerTab(){
    var box=$('wbContent'); if(!box) return; applyChrome(true);
    var cid=getCid(), people=[{id:'me', name:localStorage.getItem('akini_my_name')||'我', avatar:myAvatar()}].concat(contacts().map(function(c){return {id:c.id,name:c.name||'默认联系人',avatar:c.avatar||'🙂'};}));
    var h='<div style="display:flex;gap:14px;overflow-x:auto;padding:8px 16px;background:#fff;min-height:76px;flex-shrink:0">';
    people.forEach(function(p){ var on=String(p.id)===String(cid); h+='<div class="wb-stk-person '+(on?'active':'')+'" data-cid="'+esc(p.id)+'"><div class="wb-stk-person-avatar">'+avHtml(p.avatar,44)+'</div><div class="wb-stk-name">'+esc(p.name)+'</div></div>'; });
    h+='</div>';
    var groups=stkGroups(); if(groups.length){ var arr0=stkRead(cid); h+='<div style="display:flex;gap:7px;overflow-x:auto;margin:0 14px 8px;padding:6px;background:#f5f5f5;border-radius:14px;flex-shrink:0"><button type="button" class="wb-stk-chip '+(stkFilterGid===''?'active':'')+'" data-gid="">全部</button><button type="button" class="wb-stk-chip '+(stkFilterGid==='__ungrouped__'?'active':'')+'" data-gid="__ungrouped__">未分组</button>'; groups.forEach(function(g){ h+='<button type="button" class="wb-stk-chip '+(String(stkFilterGid)===String(g.id)?'active':'')+'" data-gid="'+esc(g.id)+'">'+esc(g.name)+'</button>'; }); h+='</div>'; }
    var arr=stkRead(cid), shown=stkFiltered(arr), inMode=stkSelMode||stkBlockMode;
    h+='<div style="padding:0 12px 16px;background:#fff;flex:1"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
    shown.forEach(function(row){ var it=row.it||{}, i=row.idx, on=!!stkSel[i]; h+='<div class="wb-stk-item" data-idx="'+i+'" style="border-color:'+(on?'#1a1a1a':'#eee')+';'+(it.b?'opacity:.42;':'')+'"><img loading="lazy" decoding="async" src="'+esc(it.s||'')+'" alt="">'+(inMode?'<span class="stk-chk" style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;border:1px solid #aaa;background:'+(on?'#111':'#fff')+';color:#fff;font-size:12px;text-align:center">'+(on?'✓':'')+'</span>':'')+(it.b?'<span class="badge" style="position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.55);color:#fff">已屏蔽</span>':'')+'</div>'; });
    h+='</div>'+(shown.length?'':'<div class="empty-text">'+(arr.length?'没有匹配的表情包':'还没有表情包，点右上角「新增」添加图片')+'</div>')+'</div>';
    box.innerHTML=h; syncBars();
    /* 容器级事件委托：window 捕获阶段三通道（pointerdown/touchend/click）。
       iOS 上主字卡模块在 wbContent 的 touchend 里无条件 preventDefault 会抑制 click，
       导致头像切换/分组筛选/格子点击全部失效；捕获阶段先于其执行，彻底绕过。 */
    if (!window.__stkTapDelegated) {
      window.__stkTapDelegated = true;
      /* 统一轻量事件委托：单个 click + 10px 滑动过滤；
         不使用捕获阶段、不拦截默认行为，绝不与其他模块抢事件 */
      var _content = document.getElementById('wbContent');
      if (!_content) return;
      var _slop = { x: 0, y: 0, moved: false };
      _content.addEventListener('touchstart', function (ev) {
        var p = ev.touches && ev.touches[0];
        if (!p) return;
        _slop.x = p.clientX; _slop.y = p.clientY; _slop.moved = false;
      }, { passive: true });
      _content.addEventListener('touchmove', function (ev) {
        var p = ev.touches && ev.touches[0];
        if (!p) return;
        if (Math.abs(p.clientX - _slop.x) > 10 || Math.abs(p.clientY - _slop.y) > 10) _slop.moved = true;
      }, { passive: true });
      _content.addEventListener('touchcancel', function () { _slop.moved = false; }, { passive: true });
      _content.addEventListener('click', function (ev) {
        if (window.__wbTab !== 'sticker') return;
        if (_slop.moved) { _slop.moved = false; return; }
        var t = ev.target && ev.target.closest ? ev.target : null;
        if (!t || !t.closest) return;
        var person = t.closest('.wb-stk-person');
        var chipEl = t.closest('.wb-stk-chip');
        var item = t.closest('.wb-stk-item');
        if (!person && !chipEl && !item) return;
        try {
          if (person) {
            _setCid(person.getAttribute('data-cid'));
            _stkSel = {};
            renderStickerTab();
            return;
          }
          if (chipEl) {
            _stkFilterGid = chipEl.getAttribute('data-gid') || '';
            _stkSel = {};
            renderStickerTab();
            return;
          }
          if (item) {
            var idx = parseInt(item.getAttribute('data-idx'), 10);
            if (isNaN(idx)) return;
            if (_stkSelMode || _stkBlockMode) {
              if (_stkSel[idx]) delete _stkSel[idx]; else _stkSel[idx] = true;
              var __on = !!_stkSel[idx];
              item.style.borderColor = __on ? '#1a1a1a' : '#eee';
              var __chk = item.querySelector('.stk-chk');
              if (__chk) {
                __chk.style.borderColor = __on ? '#1a1a1a' : '#ccc';
                __chk.style.background = __on ? '#1a1a1a' : 'rgba(255,255,255,.9)';
                __chk.textContent = __on ? '✓' : '';
              }
              _syncModeBars();
            } else {
              /* 普通点击不删除表情包：删除统一走星标选择模式 */
            }
          }
        } catch (x) {}
      });
    }
  }
  function surveyKey(){ return 'akini_surveys_'+(window.__currentWbSurveyCid||'default'); }
  function surveys(){ var a=readJson(surveyKey(),[]); return Array.isArray(a)?a:[]; }
  function writeSurveys(a){ writeJson(surveyKey(),a); }
  function renderSurveyWbTab(){
    var box=$('wbContent'); if(!box) return; applyChrome(false); syncBars();
    var arr=surveys().filter(function(s){ return !srvQuery || String(s.title||'').indexOf(srvQuery)>=0 || String(s.q||'').indexOf(srvQuery)>=0; });
    box.innerHTML = arr.length ? arr.map(function(s){ return '<div class="survey-card" data-sid="'+esc(s.id)+'"><strong>'+esc(s.title||'未命名问卷')+'</strong><p>'+esc(s.q||'')+'</p></div>'; }).join('') : '<div class="empty-text">还没有问卷，点右上角「新增」创建</div>';
  }
  window.renderStickerTab=renderStickerTab; window.renderSurveyWbTab=renderSurveyWbTab;
  window.__akiniRenderCurrentWbTab=function(){ if(window.__wbTab==='sticker') renderStickerTab(); else if(window.__wbTab==='survey') renderSurveyWbTab(); else { applyChrome(false); window.__wbRenderList&&window.__wbRenderList(); } };












































































































  function _bindTap(el, fn, guard) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el || typeof fn !== 'function') return;
    var handlers = el.__akiniTapHandlers || (el.__akiniTapHandlers = []);
    for (var i = 0; i < handlers.length; i++) {
      if (handlers[i].fn === fn) { handlers[i].guard = guard; return; }
    }
    handlers.push({ fn: fn, guard: guard });
    if (el.__akiniTapBound) return;
    el.__akiniTapBound = 1;
    el.style.cursor = 'pointer';
    el.style.webkitTapHighlightColor = 'transparent';
    el.style.touchAction = 'manipulation';
    var sx = 0, sy = 0, moved = false;
    el.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches[0]) {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; moved = false;
      }
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0] &&
          (Math.abs(e.touches[0].clientX - sx) > 10 || Math.abs(e.touches[0].clientY - sy) > 10)) {
        moved = true;
      }
    }, { passive: true });
    el.addEventListener('touchcancel', function () { moved = false; }, { passive: true });
    el.addEventListener('click', function (e) {
      if (moved) { moved = false; return; }
      var hs = el.__akiniTapHandlers || [];
      for (var j = 0; j < hs.length; j++) {
        var h = hs[j];
        if (h.guard && !h.guard()) continue;
        try { h.fn(e); } catch (err) {}
        return;
      }
    });
  }
  window.__akiniBindTap = _bindTap;
  var bindTap = _bindTap;
  function _srvTap(el, fn) {
    _bindTap(el, fn, function () { return window.__wbTab === 'survey'; });
  }
  var srvTap = _srvTap;
























































































































































































































































































  function _bindSurveyToolbar() { return true; }
  function toggleSearch(){ var bar=$('wbSearchBar'), ip=$('wbSearchInput'); if(!bar) return; var show=bar.style.display!=='block'; bar.style.display=show?'block':'none'; if(ip){ ip.value=''; if(show) ip.focus(); } stkQuery=''; srvQuery=''; window.__akiniRenderCurrentWbTab(); }
  function openAdd(){ if(window.__wbTab==='sticker') $('addStickerModal').style.display='flex'; else if(window.__wbTab==='survey') $('surveyCreateModal').style.display='flex'; }
  function addStickerFiles(files){ var cid=getCid(), arr=stkRead(cid), list=[].slice.call(files||[]); if(!list.length) return; var left=list.length; list.forEach(function(f){ var r=new FileReader(); r.onload=function(){ arr.push({id:Date.now()+Math.random(),s:r.result,g:'',b:false}); if(--left===0){ stkWrite(cid,arr); renderStickerTab(); } }; r.readAsDataURL(f); }); }
  function toggleSel(){ if(window.__wbTab==='sticker'){ stkSelMode=!stkSelMode; if(stkSelMode) stkBlockMode=false; stkSel={}; renderStickerTab(); } else if(window.__wbTab==='survey'){ srvSelMode=!srvSelMode; if(srvSelMode) srvBlockMode=false; srvSel={}; renderSurveyWbTab(); } }
  function toggleBlock(){ if(window.__wbTab==='sticker'){ stkBlockMode=!stkBlockMode; if(stkBlockMode) stkSelMode=false; stkSel={}; renderStickerTab(); } else if(window.__wbTab==='survey'){ srvBlockMode=!srvBlockMode; if(srvBlockMode) srvSelMode=false; srvSel={}; renderSurveyWbTab(); } }

































































































































































































































































































































































































































































































  function _stkTap(el, fn) {
    if (window.__akiniBindTap) window.__akiniBindTap(el, fn, function () { return window.__wbTab === 'sticker'; });
    else _bindTap(el, fn, function () { return window.__wbTab === 'sticker'; });
  }
  var stkTap = _stkTap;
















































































































































































































































































































  function _bindStickerToolbar(){
    stkTap('searchBtn',function(e){ toggleSearch(e); }); srvTap('searchBtn',function(e){ toggleSearch(e); }); stkTap('groupBtn',function(){ alert('表情包分组管理'); }); srvTap('groupBtn',function(){ alert('问卷分组管理'); }); stkTap('dedupBtn',function(){ alert('没有重复表情包'); }); srvTap('dedupBtn',function(){ alert('没有重复问卷'); }); stkTap('selectBtn',function(e){ toggleSel(e); }); srvTap('selectBtn',function(e){ toggleSel(e); }); stkTap('wbBlockBtn',function(e){ toggleBlock(e); }); srvTap('wbBlockBtn',function(e){ toggleBlock(e); }); stkTap('wbImportBtn',function(){ $('wbImportInput').click(); }); srvTap('wbImportBtn',function(){ $('wbImportInput').click(); });
    bindTap('wbHeadAdd', openAdd, function(){return true;}); bindTap('addWordBtn',openAdd,function(){return window.__wbTab==='sticker'||window.__wbTab==='survey';}); bindTap('cancelStickerAdd',function(){ $('addStickerModal').style.display='none'; }); bindTap('confirmStickerAdd',function(){ addStickerFiles($('stickerFile').files); $('addStickerModal').style.display='none'; });
    $('wbImportInput').addEventListener('change',function(){ if(window.__wbTab==='sticker') addStickerFiles(this.files); });
    bindTap('cancelSurveyAdd',function(){ $('surveyCreateModal').style.display='none'; }); bindTap('confirmSurveyAdd',function(){ var a=surveys(); a.push({id:Date.now(),title:$('surveyTitle').value||'未命名问卷',q:$('surveyQuestion').value||''}); writeSurveys(a); $('surveyCreateModal').style.display='none'; renderSurveyWbTab(); });
    var search=$('wbSearchInput'); search.addEventListener('input',function(){ if(window.__wbTab==='sticker') stkQuery=this.value.trim(); if(window.__wbTab==='survey') srvQuery=this.value.trim(); window.__akiniRenderCurrentWbTab(); }); bindTap('wbSearchClose',toggleSearch,function(){return true;});
    document.addEventListener('click',function(e){ if(window.__wbTab!=='sticker') return; var p=e.target.closest&&e.target.closest('.wb-stk-person'); if(p){ setCid(p.getAttribute('data-cid')); stkSel={}; renderStickerTab(); return; } var chip=e.target.closest&&e.target.closest('.wb-stk-chip'); if(chip){ stkFilterGid=chip.getAttribute('data-gid')||''; stkSel={}; renderStickerTab(); return; } var item=e.target.closest&&e.target.closest('.wb-stk-item'); if(item&&(stkSelMode||stkBlockMode)){ var idx=parseInt(item.getAttribute('data-idx'),10); if(stkSel[idx]) delete stkSel[idx]; else stkSel[idx]=true; renderStickerTab(); } });
    document.addEventListener('click',function(e){ var tab=e.target.closest&&e.target.closest('.wb-tabs .tab'); if(tab){ setTimeout(function(){ if(window.__wbTab!=='sticker') exitModes(); },0); } });
  }
  document.addEventListener('DOMContentLoaded', _bindStickerToolbar);
})();
