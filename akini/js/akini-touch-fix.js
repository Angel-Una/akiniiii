/* iCity 头像预览兜底 + 存储空间防护
  说明：原先这里的 attachFastClick 会在 touchend 里调用
  事件拦截（阻止后续 click）的做法，
  与各模块自身的 click 绑定互相打架，导致按钮偶发无响应。
  现已整体移除，所有按钮交由各自模块的标准 click 处理；
  全局的 document click 兜底（会重复触发 openAppPage）也一并删除。 */
(function(){
 /* iCity 个人设置：打开编辑时，从缓存/本地存储兜底恢复头像 */
 var editBtn = document.getElementById('icityEditProfileBtn');
 if(editBtn){
   editBtn.addEventListener('click', function(){
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
 }
 /* 自动清理冗余快照，避免 localStorage 爆满导致真实数据丢失 */
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
     console.log('[Akini] storage guard cleaned', candidates.length, 'keys');
   }catch(e){}
 }
 setTimeout(guardStorage, 3000);
 setInterval(function(){
   if(document.hidden || window._restoringData) return;
   guardStorage();
 }, 60000);
})();