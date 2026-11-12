(function(){
  'use strict';
  if (window.__akiniStorageSafeReady) return;
  window.__akiniStorageSafeReady = true;
  var rawLS = null;
  try { rawLS = window.localStorage; } catch(e) {}
  var proto = rawLS ? Object.getPrototypeOf(rawLS) : null;
  var origSet = proto && proto.setItem;
  var origGet = proto && proto.getItem;
  var origRemove = proto && proto.removeItem;
  var origKey = proto && proto.key;
  var mem = Object.create(null);
  var idbReady = false;
  var db = null;
  function isImgKey(k){ return /^akini_(home_bg|cover_bg|day_bg|music_bg|my_avatar|ta_avatar|contact_avatar_|chat_bg_|stickers_)/.test(String(k||'')); }
  function isCriticalKey(k){
    if (!k) return false;
    if (/^akini_(wordbank|wb_groups|surveys|survey_groups|contacts|stickers_|settings_|toggle_|num_|home_|my_avatar|ta_avatar|contact_avatar_)/.test(String(k))) return true;
    return isImgKey(k);
  }
  function openDb(cb){
    if (db) { cb && cb(db); return; }
    if (!window.indexedDB) { cb && cb(null); return; }
    var req = indexedDB.open('AkiniApp', 1);
    req.onupgradeneeded = function(){ var d=req.result; if(!d.objectStoreNames.contains('akini_data')) d.createObjectStore('akini_data'); };
    req.onsuccess = function(){ db=req.result; idbReady=true; cb && cb(db); restoreAll(); };
    req.onerror = function(){ cb && cb(null); };
  }
  function idbSet(k,v){ openDb(function(d){ if(!d) return; try{ var tx=d.transaction('akini_data','readwrite'); tx.objectStore('akini_data').put(v,k); }catch(e){} }); }
  function idbGet(k,cb){ openDb(function(d){ if(!d){ cb(null); return; } try{ var tx=d.transaction('akini_data','readonly'); var r=tx.objectStore('akini_data').get(k); r.onsuccess=function(){ cb(r.result == null ? null : r.result); }; r.onerror=function(){ cb(null); }; }catch(e){ cb(null); } }); }
  function idbKeys(cb){ openDb(function(d){ if(!d){ cb([]); return; } try{ var tx=d.transaction('akini_data','readonly'); var store=tx.objectStore('akini_data'); var r=store.getAllKeys ? store.getAllKeys() : null; if(!r){ cb([]); return; } r.onsuccess=function(){ cb(r.result||[]); }; r.onerror=function(){ cb([]); }; }catch(e){ cb([]); } }); }
  function lsGet(k){ try { return origGet ? origGet.call(rawLS,k) : rawLS.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { if(origSet) origSet.call(rawLS,k,v); else rawLS.setItem(k,v); return true; } catch(e){ return false; } }
  function lsRemove(k){ try { if(origRemove) origRemove.call(rawLS,k); else rawLS.removeItem(k); } catch(e){} }
  function migrateLsBigMediaToIdb(){
    if(!rawLS) return;
    var keys=[];
    for(var i=0;i<(rawLS.length||0);i++){ try{ var k=origKey?origKey.call(rawLS,i):rawLS.key(i); if(k&&String(k).indexOf('akini_')===0) keys.push(k); }catch(e){} }
    keys.forEach(function(k){
      var v=lsGet(k); if(!v) return;
      if(isImgKey(k) || v.length>40*1024){
        mem[k]=v; idbSet(k,v);
        var essential = k==='akini_home_bg' || k==='akini_my_avatar' || k==='akini_ta_avatar' || /^akini_stickers_/.test(k);
        if(!essential || v.length>1800*1024) lsRemove(k);
      }
    });
  }
  function restoreAll(){
    if(!idbReady) return;
    idbKeys(function(keys){
      keys.forEach(function(k){
        if(!isCriticalKey(k)) return;
        if(mem[k]) return;
        idbGet(k,function(v){ if(v != null && v !== '' && v !== '[]' && v !== '{}') mem[k]=v; });
      });
      window.__akiniStorageRestored = true;
    });
  }
  if(proto && rawLS){
    proto.getItem = function(k){
      if(isCriticalKey(k)){
        if(mem[k] != null && mem[k] !== '') return mem[k];
        var raw = lsGet(k); if(raw != null && raw !== '') return raw;
        if(isImgKey(k)) idbGet(k,function(v){ if(v){ mem[k]=v; } });
        return null;
      }
      return lsGet(k);
    };
    proto.setItem = function(k,v){
      var sv = String(v);
      if(isCriticalKey(k)){
        if((sv==='[]'||sv==='{}') && (mem[k] || lsGet(k))) return;
        mem[k]=sv;
        var ok=true;
        if(isImgKey(k) && sv.length>1800*1024){ lsRemove(k); ok=false; } else ok=lsSet(k,sv);
        idbSet(k,sv);
        return;
      }
      return lsSet(k,sv);
    };
    proto.removeItem = function(k){ delete mem[k]; lsRemove(k); idbSet(k,null); };
  }
  try { migrateLsBigMediaToIdb(); } catch(e){}
  openDb(function(){});
  window.akiniStore = {
    get:function(k,cb){ var v=localStorage.getItem(k); if(v!=null){ cb&&cb(v); return; } idbGet(k,cb||function(){}); },
    set:function(k,v,cb){ localStorage.setItem(k,v); cb&&cb(true); },
    getJson:function(k,cb,fb){ this.get(k,function(v){ try{ cb(JSON.parse(v)); }catch(e){ cb(fb); } }); },
    setJson:function(k,v,cb){ this.set(k,JSON.stringify(v),cb); }
  };
})();
