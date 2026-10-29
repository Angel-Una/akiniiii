
/* 第一屏：封面、头像、文字与拍立得的加载与更换 */
window.changeS1Cover = function() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      var el = document.getElementById('s1CoverBg');
      if (el) {
        el.style.setProperty('background-image', 'url("' + event.target.result + '")', 'important');
        try { localStorage.setItem('akini_s1_cover', event.target.result); } catch(err) {}
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

window.changeS1Avatar = function() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      var data = event.target.result;
      var el = document.getElementById('s1AvatarImg');
      if (el) el.src = data;
      /* 写入所有头像键，保证 A()/getMyAvatar 取到的就是新头像，
         避免只写 akini_s1_avatar 而 akini_my_avatar 仍是旧值导致预览显示旧头像 */
      try { localStorage.setItem('akini_my_avatar', data); } catch(e1) {}
      try { localStorage.setItem('akini_icity_my_avatar', data); } catch(e2) {}
      try { localStorage.setItem('akini_s1_avatar', data); } catch(e3) {}
      try { localStorage.setItem('akini_avatar_left', data); } catch(e4) {}
      /* 更新内存缓存，否则 __akiniAvatarCache.my 仍持有旧头像 */
      try { if (window.__akiniAvatarCache) window.__akiniAvatarCache.my = data; } catch(e5) {}
      try { if (window.akiniStore && window.akiniStore.memorySet) { window.akiniStore.memorySet('akini_my_avatar', data); window.akiniStore.memorySet('akini_icity_my_avatar', data); window.akiniStore.memorySet('akini_s1_avatar', data); window.akiniStore.memorySet('akini_avatar_left', data); } } catch(e6) {}
      try { if (window._idbStore && window._idbStore.set) { window._idbStore.set('akini_my_avatar', data); window._idbStore.set('akini_icity_my_avatar', data); } } catch(e7) {}
      /* 刷新全站头像与聊天预览 */
      try { if (typeof window.En === 'function') window.En(data); } catch(e8) {}
      try { if (typeof window.updateChatPreview === 'function') window.updateChatPreview(); } catch(e9) {}
      try { if (typeof window.syncGlobalMyAvatar === 'function') window.syncGlobalMyAvatar(); } catch(e10) {}
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

window.loadS1SavedData = function() {
  try {
    /* 旧版把视觉第2/3行存为 key3/key4，此处幂等迁移到 key2/key3，迁移后打标记不再重跑 */
    try {
      if (localStorage.getItem('akini_s1_migrated_') !== '1') {
        localStorage.setItem('akini_s1_migrated_', '1');
        var _old3 = localStorage.getItem('akini_s1_custom_text_3');
        var _old4 = localStorage.getItem('akini_s1_custom_text_4');
        if (_old3 !== null && _old3 !== '' && !localStorage.getItem('akini_s1_custom_text_2')) {
          localStorage.setItem('akini_s1_custom_text_2', _old3);
        }
        if (_old4 !== null && _old4 !== '') {
          var _cur3 = localStorage.getItem('akini_s1_custom_text_3');
          if (_cur3 === null || _cur3 === '' || _cur3 === _old3) {
            localStorage.setItem('akini_s1_custom_text_3', _old4);
          }
        }
        var _sj = {}; try { _sj = JSON.parse(localStorage.getItem('akini_s1_texts') || '{}'); } catch (_eJ) {}
        if (!_sj['line2'] && _sj['line3']) _sj['line2'] = _sj['line3'];
        if (_sj['line4'] && (!_sj['line3'] || _sj['line3'] === _sj['line2'])) _sj['line3'] = _sj['line4'];
        try { localStorage.setItem('akini_s1_texts', JSON.stringify(_sj)); } catch (_eJ2) {}
      }
    } catch (_eMig) {}

    var t1 = localStorage.getItem('akini_s1_custom_text_1');
    var t2 = localStorage.getItem('akini_s1_custom_text_2');
    var t3 = localStorage.getItem('akini_s1_custom_text_3');
    var t5 = localStorage.getItem('akini_s1_custom_text_5');
    var note = localStorage.getItem('akini_s1_polaroid_note');
    var cover = localStorage.getItem('akini_s1_cover') || localStorage.getItem('akini_s1_cover_bg');
    /* 头像一致性修复：akini_my_avatar 是 canonical 键，优先取它；
       若它为空则回退 akini_s1_avatar。取到后同步写入所有头像键，
       避免出现 akini_my_avatar=旧、akini_s1_avatar=新 的不一致状态
       （那种状态下 A() 会优先返回旧的 akini_my_avatar，预览一直显示旧头像）。 */
    var avatar = localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_icity_my_avatar') || localStorage.getItem('akini_s1_avatar');
    if (avatar) {
      try { localStorage.setItem('akini_my_avatar', avatar); } catch (eSav1) {}
      try { localStorage.setItem('akini_icity_my_avatar', avatar); } catch (eSav2) {}
      try { localStorage.setItem('akini_s1_avatar', avatar); } catch (eSav3) {}
      try { localStorage.setItem('akini_avatar_left', avatar); } catch (eSav4) {}
      try { if (window.__akiniAvatarCache) window.__akiniAvatarCache.my = avatar; } catch (eSav5) {}
    }
    var photo = localStorage.getItem('akini_s1_photo') || localStorage.getItem('akini_s1_polaroid_img');

    if (!photo && window.akiniStore && window.akiniStore.get) {
      try { window.akiniStore.get('akini_s1_photo', function (_pv) { if (_pv) { var _pe = document.getElementById('s1PolaroidImg'); if (_pe) _pe.style.setProperty('background-image', 'url("' + _pv + '")', 'important'); try { localStorage.setItem('akini_s1_photo', _pv); } catch (ePh1) {} } }); } catch (ePh2) {}
    }
    if (!cover && window.akiniStore && window.akiniStore.get) {
      try { window.akiniStore.get('akini_s1_cover', function (_cv) { if (_cv) { var _ce = document.getElementById('s1CoverBg'); if (_ce) _ce.style.setProperty('background-image', 'url("' + _cv + '")', 'important'); try { localStorage.setItem('akini_s1_cover', _cv); } catch (eCov) {} } }); } catch (eCov2) {}
    }
    if (!avatar && window.akiniStore && window.akiniStore.get) {
      try { window.akiniStore.get('akini_my_avatar', function (_av) { if (_av) { var _ae = document.getElementById('s1AvatarImg'); if (_ae) _ae.src = _av; try { localStorage.setItem('akini_s1_avatar', _av); } catch (eAv) {} } }); } catch (eAv2) {}
    }
    /* 文字键从 IDB 兜底恢复：浏览器清理 LS 后，文字设置会丢失——
       因为 IDB 是持久化存储（iOS Safari 例外），只要用户没手动清数据就能救回来 */
    var _textKeys = [
      { lsKey: 'akini_s1_custom_text_1', elId: 's1Text1', prop: t1 },
      { lsKey: 'akini_s1_custom_text_2', elId: 's1Text2', prop: t2 },
      { lsKey: 'akini_s1_custom_text_3', elId: 's1Text3', prop: t3 },
      { lsKey: 'akini_s1_custom_text_5', elId: 's1TextLoc', prop: t5 },
      { lsKey: 'akini_s1_polaroid_note', elId: 's1PolaroidNote', prop: note }
    ];
    _textKeys.forEach(function (_tk) {
      if ((!_tk.prop || _tk.prop === '') && window.akiniStore && window.akiniStore.get) {
        try {
          window.akiniStore.get(_tk.lsKey, function (_tv) {
            if (_tv && _tv.trim() && _tv.trim() !== 'null' && _tv.trim() !== 'undefined') {
              var _el = document.getElementById(_tk.elId);
              if (_el) _el.textContent = _tv;
              try { localStorage.setItem(_tk.lsKey, _tv); } catch (_eTk) {}
            }
          });
        } catch (_eFb) {}
      }
    });

    if (t1 && document.getElementById('s1Text1')) document.getElementById('s1Text1').textContent = t1;
    if (t2 && document.getElementById('s1Text2')) document.getElementById('s1Text2').textContent = t2;
    if (t3 && document.getElementById('s1Text3')) document.getElementById('s1Text3').textContent = t3;
    if (t5 && document.getElementById('s1TextLoc')) document.getElementById('s1TextLoc').textContent = t5;
    if (note && document.getElementById('s1PolaroidNote')) document.getElementById('s1PolaroidNote').textContent = note;
    if (cover && document.getElementById('s1CoverBg')) document.getElementById('s1CoverBg').style.setProperty('background-image', 'url("' + cover + '")', 'important');
    if (avatar && document.getElementById('s1AvatarImg')) document.getElementById('s1AvatarImg').src = avatar;
    if (photo && document.getElementById('s1PolaroidImg')) document.getElementById('s1PolaroidImg').style.setProperty('background-image', 'url("' + photo + '")', 'important');
  } catch(e){}
};

document.addEventListener('DOMContentLoaded', function() {
  window.loadS1SavedData();
});
