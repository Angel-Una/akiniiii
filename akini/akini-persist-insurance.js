/* v979：旧快照恢复链已全部废弃，对外调用保留空壳，避免改动外部引用点 */
 function fullRestore(){
   return;
 }
 function reRenderAll(){
   try{ if(window.akiniContacts && window.akiniContacts.resetCache) window.akiniContacts.resetCache(); }catch(e){}
   try{ if(window.renderChatList) window.renderChatList(); }catch(e){}
   try{ if(window.updatePreview) window.updatePreview(); }catch(e){}
   try{ if(window._renderIcity) window._renderIcity(); }catch(e){}
   try{ if(window._renderIcityContactProfiles) window._renderIcityContactProfiles(); }catch(e){}
   try{ if(window.__renderMail) window.__renderMail(); }catch(e){}
   try{ if(window._renderPosts) window._renderPosts(); }catch(e){}
   try{ if(window.renderIcityProfileDiaries) window.renderIcityProfileDiaries(); }catch(e){}
 }
 var origSetItem = Storage.prototype.setItem;
 Storage.prototype.setItem = function(k, v){
   // 清除数据期间：akini_ 键一律拒写（原始层+镜像层双阻断），杜绝清完复活
   if (window.__akiniWiping && k && String(k).indexOf('akini_') === 0) return;
   // 永久防御：非显式清除操作下一律拒绝被空数组/空对象覆盖核心数据
   var _GUARD_KEYS_CORE = { akini_contacts: 1, akini_mail_sent: 1, akini_mail_received: 1, akini_posts: 1, akini_icity_diaries: 1, akini_wordbank: 1 };
   var sv = String(v);
   if ((sv === '[]' || sv === '{}') && _GUARD_KEYS_CORE[k] && !window.__akiniWiping && !window._akiniAllowRemove) {
     try {
       var _gp = null;
       if (window.akiniStore && window.akiniStore.memoryGet) _gp = window.akiniStore.memoryGet(k);
       if (_gp == null && this === localStorage) _gp = localStorage.getItem(k);
       if (_gp && _gp !== '[]' && _gp !== '{}' && _gp.length > 2) {
         console.warn('[存储防御] 永久拦截：拒绝非显式空值覆盖核心键(akini.html)', k);
         return;
       }
     } catch (_) {}
   }
   var result;
   try{ result = origSetItem.apply(this, arguments); }catch(e){ return result; }
   /* v978 对齐 极简标杆：写入已由 storage-safe 即时双写 LS+IDB 落盘，
      废弃"写关键键就全量快照"——每 5s 序列化整个 4MB+ localStorage 是
      Safari 切后台 Jetsam 强杀（闪退）元凶，且快照恢复链 v976 已全部禁用 */
   return result;
 };
 var origRemoveItem = Storage.prototype.removeItem;
 Storage.prototype.removeItem = function(k){
   if(isCritical(k) && !window._akiniAllowRemove){
     console.warn('[AkiniPersist] 拦截删除关键数据', k);
     return;
   }
   origRemoveItem.apply(this, arguments);
 };
 var origClear = Storage.prototype.clear;
 Storage.prototype.clear = function(){
   // 清除数据 / 导入备份流程显式放行（_akiniAllowRemove 或全局清除标记）：
   // 真正清空，不做关键数据保留回写——此前无此旁路导致「清除数据」后 akini_ 键被全部复活
   if (window._akiniAllowRemove || window.__akiniWiping) {
     try{ origClear.apply(this, arguments); }catch(e){}
     return;
   }
   var backup = {};
   try{
     for(var i=0;i<localStorage.length;i++){
       var k = localStorage.key(i);
       if(k && isCritical(k)) backup[k] = localStorage.getItem(k);
     }
   }catch(e){}
   origClear.apply(this, arguments);
   var saved = 0;
   for(var k in backup){
     if(!Object.prototype.hasOwnProperty.call(backup, k)) continue;
     try{ localStorage.setItem(k, backup[k]); saved++; }catch(e){}
   }
   console.log('[AkiniPersist] 拦截 localStorage.clear，已保留', saved, '条关键数据');
 };
 function runRestore(){
   if (window.__akiniWiping) return;
   if (/[?&]reset=/.test(location.search || '')) return;
   /* v979 对齐 极简标杆：存储层 storage-safe 已一次性全量加载对账，
      旧快照恢复链已废弃，这里不再触发任何旧值回填/重渲染动作 */
 }
 if(document.readyState === 'loading'){
   document.addEventListener('DOMContentLoaded', runRestore);
 } else {
   runRestore();
 }
 /* v979：废弃 120s 全量快照 + beforeunload/切后台快照——恢复链已死，纯写入浪费 */
 window._akiniSafeRemove = function(key, cb){
   window._akiniAllowRemove = true;
   try{ localStorage.removeItem(key); }catch(e){}
   window._akiniAllowRemove = false;
   if(cb) cb();
 };
 // 彻底清除某个应用图标在本地的所有痕迹，避免恢复默认后又被快照/IDB 恢复
 window._akiniPurgeIcon = function(id, cb){
   var key = 'akini_app_icon_' + id;
   window._akiniSafeRemove(key, function(){
     var s = getIDBStore();
     if(s && typeof s.remove === 'function'){
       try{ s.remove(key); }catch(e){}
       try{ s.remove('snap_' + key); }catch(e){}
       try{ s.remove('snap2_' + key); }catch(e){}
     }
     if(window._akiniCacheStore && typeof window._akiniCacheStore.backupAll === 'function'){
       try{ window._akiniCacheStore.backupAll(); }catch(e){}
     }
     if(cb) cb();
   });
 };
 window._akiniPersistRestore = fullRestore;
})();