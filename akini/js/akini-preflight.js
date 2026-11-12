/* ==========================================================================
  v732 前置安全挂载：所有第一屏/导航/交互函数全局就绪，确保点击零报错
  ========================================================================== */
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
       el.style.setProperty('background-image', 'url(\"' + event.target.result + '\")', 'important');
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
     var el = document.getElementById('s1AvatarImg');
     if (el) {
       el.src = event.target.result;
       try { localStorage.setItem('akini_s1_avatar', event.target.result); } catch(err) {}
     }
   };
   reader.readAsDataURL(file);
 };
 input.click();
};
window.loadS1SavedData = function() {
 try {
   /* v912：s1 文字行编号迁移（视觉第2/3行原存 key3/key4，现改为 key2/key3）——
      幂等迁移防内容丢失：旧 key3(视觉第2行)→key2、旧 key4(视觉第3行)→key3，完成后打标记防重跑覆盖 */
   try {
     if (localStorage.getItem('akini_s1_migrated_v912') !== '1') {
       localStorage.setItem('akini_s1_migrated_v912', '1');
       var _old3 = localStorage.getItem('akini_s1_custom_text_3');
       var _old4 = localStorage.getItem('akini_s1_custom_text_4');
       if (_old3 !== null && _old3 !== '' && !localStorage.getItem('akini_s1_custom_text_2')) {
         localStorage.setItem('akini_s1_custom_text_2', _old3);
       }
       if (_old4 !== null && _old4 !== '') {
         /* 仅当 key3 仍是旧体系值（等于 _old3 或为空）才允许被旧 key4 覆盖，防止用户已编辑新第3行后被回写 */
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
   /* v924 头像闪烁根治：单人卡片头像与用户最新头像严格同源（优先 akini_my_avatar），
      杜绝启动时先拿历史残留的 akini_s1_avatar 显示旧头像、随后被 main.js 换成新头像导致的来回闪烁 */
   var avatar = localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_icity_my_avatar') || localStorage.getItem('akini_s1_avatar');
   if (avatar) {
     try { localStorage.setItem('akini_s1_avatar', avatar); } catch (eSav) {}
   }
   var photo = localStorage.getItem('akini_s1_photo') || localStorage.getItem('akini_s1_polaroid_img');
   /* v898：LS 被拦截为空时异步从 akiniStore/IDB 兜底回填并回写 LS */
   if (!photo && window.akiniStore && window.akiniStore.get) {
     try { window.akiniStore.get('akini_s1_photo', function (_pv) { if (_pv) { var _pe = document.getElementById('s1PolaroidImg'); if (_pe) _pe.style.setProperty('background-image', 'url(\"' + _pv + '\")', 'important'); try { localStorage.setItem('akini_s1_photo', _pv); } catch (ePh1) {} } }); } catch (ePh2) {}
   }
   /* v972 修复单人模块背景图/头像灰白不显示：启动早期这些大图已迁移到 IndexedDB，
      同步 LS 读取必为空。与 photo 一致，LS 为空时异步从 akiniStore/IDB 兜底回填 */
   if (!cover && window.akiniStore && window.akiniStore.get) {
     try { window.akiniStore.get('akini_s1_cover', function (_cv) { if (_cv) { var _ce = document.getElementById('s1CoverBg'); if (_ce) _ce.style.setProperty('background-image', 'url(\"' + _cv + '\")', 'important'); try { localStorage.setItem('akini_s1_cover', _cv); } catch (eCov) {} } }); } catch (eCov2) {}
   }
   if (!avatar && window.akiniStore && window.akiniStore.get) {
     try { window.akiniStore.get('akini_my_avatar', function (_av) { if (_av) { var _ae = document.getElementById('s1AvatarImg'); if (_ae) _ae.src = _av; try { localStorage.setItem('akini_s1_avatar', _av); } catch (eAv) {} } }); } catch (eAv2) {}
   }
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
// 预定义 window.navTo，如果在脚本加载完成前被点击，先暂存或平稳触发
if (!window.navTo) {
 window.navTo = function(page) {
   if (window.__realNavTo) {
     window.__realNavTo(page);
   } else {
     window.location.hash = '#' + page;
     // 兼容寻找对应弹窗并展示
     var target = document.getElementById(page + 'Area') || document.getElementById(page + 'Modal');
     if (target) {
       target.style.display = 'flex';
     }
   }
 };
}
document.addEventListener('DOMContentLoaded', function() {
 window.loadS1SavedData();
});