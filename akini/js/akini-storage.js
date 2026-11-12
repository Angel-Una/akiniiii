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

  function isImgKey(k){ return /^akini_(home_bg|cover_bg|day_bg|music_bg|my_avatar|ta_avatar|contact_avatar_|chat_bg_|stickers_|s1_cover|s1_photo|s1_avatar|cover_img|bg_img|anniv_bg|music_player_bg)/.test(String(k||'')); }
  // 所有 akini_ 前缀的键都是关键数据：一律镜像到内存 + IndexedDB，
  // restoreAll 启动时全量水合，杜绝"刷新后图片/设置消失"。
  function isCriticalKey(k){
    if (!k) return false;
    return String(k).indexOf('akini_') === 0;
  }
  // 关键图/文：体积允许时同时留在 localStorage，保证首屏同步读取立即可用
  function isEssentialKey(k){
    if (!k) return false;
    var s = String(k);
    if (s === 'akini_home_bg' || s === 'akini_my_avatar' || s === 'akini_ta_avatar') return true;
    if (/^akini_stickers_/.test(s)) return true;
    if (/^akini_(s1_cover|s1_photo|s1_avatar|cover_bg|cover_img|day_bg|bg_img|anniv_bg|music_bg|music_player_bg|chat_bg_)/.test(s)) return true;
    if (/^akini_(wordbank|wb_groups|surveys|survey_groups|contacts|stickers|settings|icity|mail_|posts|shop_|chat_history|s1_texts|s1_custom_text)/.test(s)) return true;
    return false;
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

  // 启动时把大媒体从 LS 迁到内存+IDB，释放 LS 配额；关键小数据仍保留在 LS
  function migrateLsBigMediaToIdb(){
    if(!rawLS) return;
    var keys=[];
    for(var i=0;i<(rawLS.length||0);i++){ try{ var k=origKey?origKey.call(rawLS,i):rawLS.key(i); if(k&&String(k).indexOf('akini_')===0) keys.push(k); }catch(e){} }
    keys.forEach(function(k){
      var v=lsGet(k); if(!v) return;
      var big = isImgKey(k) || v.length > 40*1024;
      if (big) {
        mem[k]=v; idbSet(k,v);
        // 关键键且体积可控时留在 LS，否则移除（IDB 已有副本，restoreAll 会水合回内存）
        if (!isEssentialKey(k) || v.length > 1800*1024) lsRemove(k);
      }
    });
  }

  // 启动全量水合：把 IDB 里所有关键键读回内存，保证同步读取命中
  function restoreAll(){
    if(!idbReady) return;
    idbKeys(function(keys){
      var pending = keys.length;
      if (!pending) { window.__akiniStorageRestored = true; return; }
      keys.forEach(function(k){
        if(!isCriticalKey(k)){ if(--pending===0) window.__akiniStorageRestored = true; return; }
        if(mem[k] != null && mem[k] !== ''){ if(--pending===0) window.__akiniStorageRestored = true; return; }
        idbGet(k,function(v){
          if(v != null && v !== '' && v !== '[]' && v !== '{}') mem[k]=v;
          if(--pending===0) window.__akiniStorageRestored = true;
        });
      });
    });
  }

  if(proto && rawLS){
    proto.getItem = function(k){
      if(isCriticalKey(k)){
        if(mem[k] != null && mem[k] !== '') return mem[k];
        var raw = lsGet(k); if(raw != null && raw !== '') return raw;
        // 内存与 LS 都没有时异步从 IDB 补回（首屏可能先返回空，水合后再次读取即命中）
        idbGet(k,function(v){ if(v != null && v !== '') mem[k]=v; });
        return null;
      }
      return lsGet(k);
    };
    proto.setItem = function(k,v){
      var sv = String(v);
      if(isCriticalKey(k)){
        // 空数组/空对象不覆盖已有值，避免误清空
        if((sv==='[]'||sv==='{}') && (mem[k] || lsGet(k))) return;
        mem[k]=sv;
        var keepLs = true;
        if (isImgKey(k) && sv.length > 1800*1024) { lsRemove(k); keepLs = false; }
        else if (!isEssentialKey(k) && sv.length > 40*1024) { lsRemove(k); keepLs = false; }
        else keepLs = lsSet(k,sv);
        idbSet(k,sv);
        return keepLs;
      }
      return lsSet(k,sv);
    };
    proto.removeItem = function(k){ delete mem[k]; lsRemove(k); idbSet(k,null); };
  }
  try { migrateLsBigMediaToIdb(); } catch(e){}
  openDb(function(){});

  window.akiniStore = {
    get:function(k,cb){
      var v = (mem[k] != null && mem[k] !== '') ? mem[k] : lsGet(k);
      if(v != null){ cb&&cb(v); return; }
      idbGet(k, function(rv){ if(rv != null && rv !== '') mem[k]=rv; cb&&cb(rv); });
    },
    set:function(k,v,cb){ localStorage.setItem(k,v); cb&&cb(true); },
    getJson:function(k,cb,fb){ this.get(k,function(v){ try{ cb(JSON.parse(v)); }catch(e){ cb(fb); } }); },
    setJson:function(k,v,cb){ this.set(k,JSON.stringify(v),cb); },
    memoryGet:function(k){ return mem[k] != null ? mem[k] : null; },
    memorySet:function(k,v){ mem[k]=v; },
    rawLSSet:function(k,v){ return lsSet(k,v); },
    rawLSGet:function(k){ return lsGet(k); },
    isCritical:isCriticalKey,
    flushIdb:function(){ /* 写入已是同步入队，无需额外 flush */ }
  };
})();
