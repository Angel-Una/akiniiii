
/* 头像与第一屏壁纸恢复 */
(function(){
  function __akiniApplyAvatar(id, url) {
    if (!url) return;
    var el = document.getElementById(id);
    if (!el) return;
    if (String(url).indexOf('<img') === 0) {
      if (el.getAttribute('data-avatar-applied') === url) return;
      el.innerHTML = url;
      el.setAttribute('data-avatar-applied', url);
      return;
    }
    if (el.getAttribute('data-avatar-applied') === url) return;
    var img = el.querySelector('img');
    if (!img) {
      el.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
    } else {
      img.src = url;
    }
    el.setAttribute('data-avatar-applied', url);
  }

  function restoreAllImagesAndConfig() {
    try {
      var homeBg = localStorage.getItem('akini_home_bg') || localStorage.getItem('home_bg');
      if (homeBg && homeBg.length > 10) {
        var pf = document.getElementById('phoneFrame');
        if (pf) {
          pf.style.setProperty('background-image', 'url("' + homeBg + '")', 'important');
          pf.style.setProperty('background-size', 'cover', 'important');
          pf.style.setProperty('background-position', 'center', 'important');
        }
      }
      var s1Av = localStorage.getItem('akini_s1_avatar') || localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_avatar_left');
      if (s1Av && s1Av.length > 10) {
        var elS1Av = document.getElementById('s1AvatarImg');
        if (elS1Av && elS1Av.getAttribute('data-applied-src') !== s1Av) {
          elS1Av.setAttribute('data-applied-src', s1Av);
          elS1Av.src = s1Av;
        }
      }
      var avL = localStorage.getItem('akini_avatar_left') || localStorage.getItem('akini_s2_avatar_left') || localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_s1_avatar');
      if (avL && avL.length > 10) __akiniApplyAvatar('avatarLeft', avL);
      var avR = localStorage.getItem('akini_avatar_right') || localStorage.getItem('akini_s2_avatar_right') || localStorage.getItem('akini_ta_avatar');
      if (avR && avR.length > 10) __akiniApplyAvatar('avatarRight', avR);
    } catch(e) {}
  }

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
  window.addEventListener('load', restoreAllImagesAndConfig);
})();
