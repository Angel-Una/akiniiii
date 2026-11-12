/* akini-cover-persist.js — v1246 简化版
  封面/底图 的上传与恢复已统一至 akini-image-upload.js。
  本文件仅保留：双人头像的恢复（左/右头像用 <img> 而非 background-image）。 */
(function() {
 var AV_KEYS_L = ['akini_avatar_left', 'akini_s2_avatar_left', 'avatar_left'];
 var AV_KEYS_R = ['akini_avatar_right', 'akini_s2_avatar_right', 'avatar_right'];
 function firstValid(keys) {
   for (var i = 0; i < keys.length; i++) {
     try { var v = localStorage.getItem(keys[i]); if (v && v.length > 10) return v; } catch (e) {}
   }
   return null;
 }
 function applyAvatar(id, keys) {
   var v = firstValid(keys); if (!v) return;
   var el = document.getElementById(id); if (!el) return;
   if (String(v).indexOf('<img') === 0) { el.innerHTML = v; }
   else { el.innerHTML = '<img src="' + v + '" style="width:100%;height:100%;object-fit:cover;display:block;">'; }
 }
 function restoreAvatars() {
   applyAvatar('avatarLeft', AV_KEYS_L);
   applyAvatar('avatarRight', AV_KEYS_R);
 }
 // 存储层恢复后应用头像
 function tryRestore() {
   try {
     if (window.__akiniStorageRestored) { restoreAvatars(); return; }
     if (document.readyState !== 'loading') { restoreAvatars(); return; }
     setTimeout(tryRestore, 80);
   } catch (e) { try { restoreAvatars(); } catch (e2) {} }
 }
 tryRestore();
})();