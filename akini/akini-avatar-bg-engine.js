/* ===== v809 核心保险层 =====
  1. 双人头像独立更换驱动：左头像 / 右头像原生直达支持 + 四键双写持久化 + 实时上墙
  2. 全域底图持久化引擎：单人头像底图(s1CoverBg)、拍立得底图(s1PolaroidImg)、首页壁纸(phoneFrame)、双人封面(coverAreaMain)、纪念日(bgArea)
     启动即刻恢复，定时对齐，防任何脚本误清！
  3. 手势与点击防卡死保护：确保首页所有可点击元素、底栏、头像、胶囊按钮畅通响应，无任何死循环！ */
(function(){
 // 1. 双人头像换图
 function __akiniApplyAvatar(id, url) {
   if (!url) return;
   var el = document.getElementById(id);
   if (!el) return;
   /* v1127 Bug3：头像只应用一次——已应用相同值则跳过，避免重复设 src 触发解码闪烁/闪现旧图 */
   if (el.getAttribute('data-avatar-applied') === url) return;
   var img = el.querySelector('img');
   if (!img) {
     el.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
   } else {
     img.src = url;
   }
   el.setAttribute('data-avatar-applied', url);
 }
 /* v823: 严禁页面模块点击更换头像，移除 handleS2AvatarLeftDirect 和 handleS2AvatarRightDirect */
 // 2. 全域底图与配置启动恢复引擎（涵盖单人底图、拍立得照片、主页壁纸、双人封面、纪念日、左右头像）
 function restoreAllImagesAndConfig() {
   try {
     // (1) 第一屏封面底图 - 防闪烁比较
     var s1Cov = localStorage.getItem('akini_s1_cover') || localStorage.getItem('s1_cover') || localStorage.getItem('akini_s1_cover_bg');
     if (s1Cov && s1Cov.length > 10) {
       var elS1Cov = document.getElementById('s1CoverBg');
       if (elS1Cov && elS1Cov.getAttribute('data-applied-src') !== s1Cov) {
         elS1Cov.setAttribute('data-applied-src', s1Cov);
         elS1Cov.style.setProperty('background-image', 'url("' + s1Cov + '")', 'important');
         elS1Cov.style.setProperty('background-size', 'cover', 'important');
         elS1Cov.style.setProperty('background-position', 'center', 'important');
       }
     }
     // (2) 第一屏拍立得照片
     var s1Photo = localStorage.getItem('akini_s1_photo') || localStorage.getItem('akini_s1_polaroid_img') || localStorage.getItem('s1_polaroid');
     if (s1Photo && s1Photo.length > 10) {
       var elS1Photo = document.getElementById('s1PolaroidImg');
       if (elS1Photo) {
         elS1Photo.style.setProperty('background-image', 'url("' + s1Photo + '")', 'important');
         elS1Photo.style.setProperty('background-size', 'cover', 'important');
         elS1Photo.style.setProperty('background-position', 'center', 'important');
       }
     }
     // (3) 主页全局壁纸
     var homeBg = localStorage.getItem('akini_home_bg') || localStorage.getItem('home_bg');
     if (homeBg && homeBg.length > 10) {
       var pf = document.getElementById('phoneFrame');
       if (pf) {
         pf.style.setProperty('background-image', 'url("' + homeBg + '")', 'important');
         pf.style.setProperty('background-size', 'cover', 'important');
         pf.style.setProperty('background-position', 'center', 'important');
       }
     }
     // (4) 第一屏大头像
     var s1Av = localStorage.getItem('akini_s1_avatar') || localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_avatar_left');
     if (s1Av && s1Av.length > 10) {
       var elS1Av = document.getElementById('s1AvatarImg');
       /* v1127 Bug3：仅当 src 尚未应用过该值时才设值，避免重复设 src 闪现旧图 */
       if (elS1Av && elS1Av.getAttribute('data-applied-src') !== s1Av) {
         elS1Av.setAttribute('data-applied-src', s1Av);
         elS1Av.src = s1Av;
       }
     }
     // (5) 第二屏左右头像
     var avL = localStorage.getItem('akini_avatar_left') || localStorage.getItem('akini_s2_avatar_left') || localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_s1_avatar');
     if (avL && avL.length > 10) __akiniApplyAvatar('avatarLeft', avL);
     var avR = localStorage.getItem('akini_avatar_right') || localStorage.getItem('akini_s2_avatar_right') || localStorage.getItem('akini_ta_avatar');
     if (avR && avR.length > 10) __akiniApplyAvatar('avatarRight', avR);
     // (6) 第二屏封面图
     var s2Cov = localStorage.getItem('akini_cover_bg') || localStorage.getItem('akini_cover_img') || localStorage.getItem('akini_s2_cover');
     if (s2Cov && s2Cov.length > 10) {
       var elS2Cov = document.getElementById('coverAreaMain');
       if (elS2Cov) {
         elS2Cov.style.setProperty('background-image', 'url("' + s2Cov + '")', 'important');
         elS2Cov.style.setProperty('background-size', 'cover', 'important');
         elS2Cov.style.setProperty('background-position', 'center', 'important');
       }
     }
     // (7) 纪念日底图
     var dayBg = localStorage.getItem('akini_day_bg') || localStorage.getItem('akini_bg_img') || localStorage.getItem('akini_anniv_bg');
     if (dayBg && dayBg.length > 10) {
       var elDayBg = document.getElementById('bgArea');
       if (elDayBg) {
         elDayBg.style.setProperty('background-image', 'url("' + dayBg + '")', 'important');
         elDayBg.style.setProperty('background-size', 'cover', 'important');
         elDayBg.style.setProperty('background-position', 'center', 'important');
       }
     }
   } catch(e) {}
 }
 // v1114 Bug⑥冷启动闪退重进：恢复大图(多张 data URL 同步解码)放到 DOMReady 之后，
 // 避免解析期同步解码大图引发 iOS Safari 内存峰值崩溃；DOMContentLoaded 后再执行
 // v1127 Bug3/4：合并多次 restore 调用为单次去重执行——load + 600ms + 1500ms 三个
 // 回调每轮都全量重设头像/底图 src，触发重复解码（闪烁）且 iOS 重复内存峰值；改为
 // 仅在尚未应用时写入，已应用则跳过，杜绝重复解码
 function scheduleRestore() {
   if (window.__akiniRestoreScheduled) return;
   window.__akiniRestoreScheduled = true;
   var run = function(){ window.__akiniRestoreScheduled = false; restoreAllImagesAndConfig(); };
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', run);
   } else {
     requestAnimationFrame(run);
   }
 }
 scheduleRestore();
 window.addEventListener('load', function() {
   restoreAllImagesAndConfig();
   setTimeout(restoreAllImagesAndConfig, 600);
   setTimeout(restoreAllImagesAndConfig, 1500);
 });
})();