/* v924 头像闪烁根治：单人卡片头像与用户最新头像严格同源（优先 akini_my_avatar），
      杜绝启动时先拿历史残留的 akini_s1_avatar 显示旧头像、随后被 main.js 换成新头像导致的来回闪烁 */
   var avatar = localStorage.getItem('akini_my_avatar') || localStorage.getItem('akini_icity_my_avatar') || localStorage.getItem('akini_s1_avatar');
   if (avatar) {
     try { localStorage.setItem('akini_s1_avatar', avatar); } catch (eSav) {}
   }
   var photo = localStorage.getItem('akini_s1_photo') || localStorage.getItem('akini_s1_polaroid_img');
   /* v898：LS 被拦截为空时异步从 akiniStore/IDB 兜底回填并回写 LS */
   if (!photo && window.akiniStore && window.akiniStore.get) {
     try { window.akiniStore.get('akini_s1_photo', function (_pv) { if (_pv) { var _pe = document.getElementById('s1PolaroidImg'); if (_pe) _pe.style.backgroundImage = 'url("' + _pv + '")'; try { localStorage.setItem('akini_s1_photo', _pv); } catch (ePh1) {} } }); } catch (ePh2) {}
   }
   /* v972 修复单人模块背景图/头像灰白不显示：启动早期这些大图已迁移到 IndexedDB，
      同步 LS 读取必为空。与 photo 一致，LS 为空时异步从 akiniStore/IDB 兜底回填 */
   if (!cover && window.akiniStore && window.akiniStore.get) {
     try { window.akiniStore.get('akini_s1_cover', function (_cv) { if (_cv) { var _ce = document.getElementById('s1CoverBg'); if (_ce) _ce.style.backgroundImage = 'url("' + _cv + '")'; try { localStorage.setItem('akini_s1_cover', _cv); } catch (eCov) {} } }); } catch (eCov2) {}
   }
   if (!avatar && window.akiniStore && window.akiniStore.get) {
     try { window.akiniStore.get('akini_my_avatar', function (_av) { if (_av) { var _ae = document.getElementById('s1AvatarImg'); if (_ae) _ae.src = _av; try { localStorage.setItem('akini_s1_avatar', _av); } catch (eAv) {} } }); } catch (eAv2) {}
   }
   if (t1 && document.getElementById('s1Text1')) document.getElementById('s1Text1').textContent = t1;
   if (t2 && document.getElementById('s1Text2')) document.getElementById('s1Text2').textContent = t2;
   if (t3 && document.getElementById('s1Text3')) document.getElementById('s1Text3').textContent = t3;
   if (t5 && document.getElementById('s1TextLoc')) document.getElementById('s1TextLoc').textContent = t5;
   if (note && document.getElementById('s1PolaroidNote')) document.getElementById('s1PolaroidNote').textContent = note;
   if (cover && document.getElementById('s1CoverBg')) document.getElementById('s1CoverBg').style.backgroundImage = 'url("' + cover + '")';
   if (avatar && document.getElementById('s1AvatarImg')) document.getElementById('s1AvatarImg').src = avatar;
   if (photo && document.getElementById('s1PolaroidImg')) document.getElementById('s1PolaroidImg').style.backgroundImage = 'url("' + photo + '")';
 } catch(e){}
};
// 预定义 window.navTo，如果在脚本加载完成前被点击，先暂存或平稳触发
if (!window.navTo) {
 window.navTo = function(page) {
   /* v1021：滑动刚结束的误触点击直接忽略 */
   if (window.__akiniSwipeBlock && window.__akiniSwipeBlock()) return;
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