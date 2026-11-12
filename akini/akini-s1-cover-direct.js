// 1. 直选更换底图和拍立得照片（覆盖式透明input，无需任何click代理）
window.handleS1CoverDirect = function(e) {
 var file = e.target.files && e.target.files[0];
 if (!file) return;
 var reader = new FileReader();
 reader.onload = function(evt) {
   var url = evt.target.result;
   window.compressImageDataUrl(url, function(c) {
     var el = document.getElementById('s1CoverBg');
     if (el) {
       el.style.backgroundImage = 'url("' + c + '")';
       el.style.backgroundSize = 'cover';
       el.style.backgroundPosition = 'center';
     }
     try { localStorage.setItem('akini_s1_cover', c); } catch(err){}
     try { localStorage.setItem('akini_s1_cover_bg', c); } catch(err){}
     try { if (window._idbStore && window._idbStore.set) { window._idbStore.set('akini_s1_cover', c); window._idbStore.set('snap_akini_s1_cover', c); } } catch(err){}
   });
 };
 reader.readAsDataURL(file);
};
window.handleS1PhotoDirect = function(e) {
 var file = e.target.files && e.target.files[0];
 if (!file) return;
 var reader = new FileReader();
 reader.onload = function(evt) {
   var url = evt.target.result;
   window.compressImageDataUrl(url, function(c) {
     var el = document.getElementById('s1PolaroidImg');
     if (el) {
       el.style.backgroundImage = 'url("' + c + '")';
       el.style.backgroundSize = 'cover';
       el.style.backgroundPosition = 'center';
     }
     try { localStorage.setItem('akini_s1_photo', c); } catch(err){}
     try { localStorage.setItem('akini_s1_polaroid_img', c); } catch(err){}
     try { if (window._idbStore && window._idbStore.set) { window._idbStore.set('akini_s1_photo', c); window._idbStore.set('snap_akini_s1_photo', c); } } catch(err){}
   });
 };
 reader.readAsDataURL(file);
};
// 2. 长方圆角日历动态与系统同步更新
window.updateS1Calendar = function() {
 var now = new Date();
 
 /* v924：日历时间格式彻底与设置面板时间戳解绑！
    固定格式：12小时制 hh:mm:ss AM/PM，绝不重复拼接秒单位，绝不被设置时间戳覆盖 */
 var _rawH = now.getHours();
 var minutes = now.getMinutes();
 var seconds = now.getSeconds();
 var ampm = _rawH >= 12 ? 'PM' : 'AM';
 var hours12 = _rawH % 12;
 hours12 = hours12 ? hours12 : 12;
 var _hh = (hours12 < 10 ? '0' : '') + hours12;
 var _mm = (minutes < 10 ? '0' : '') + minutes;
 var _ss = (seconds < 10 ? '0' : '') + seconds;
 var timeStr = _hh + ':' + _mm + ':' + _ss + ' ' + ampm;
 
 var timeEl = document.getElementById('calLiveTime');
 if (timeEl) timeEl.textContent = timeStr;
 
 // 格式化日期 2026/10/3
 var year = now.getFullYear();
 var month = now.getMonth() + 1;
 var date = now.getDate();
 var dateStr = year + '/' + month + '/' + date;
 var dateEl = document.getElementById('calLiveDate');
 if (dateEl) dateEl.textContent = dateStr;
 
 // 星期名称 Saturday
 var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 var dayIdx = now.getDay();
 var weekEl = document.getElementById('calLiveWeekday');
 if (weekEl) weekEl.textContent = weekdays[dayIdx];
 
 // 星期网格高亮
 var items = document.querySelectorAll('#calWeekGrid .w-item');
 items.forEach(function(item) {
   var w = parseInt(item.getAttribute('data-w'), 10);
   if (w === dayIdx) {
     item.classList.add('today-active');
   } else {
     item.classList.remove('today-active');
   }
 });
};
window.editCalCustomText = function() {
 var el = document.getElementById('calCustomCenter');
 if (!el) return;
 var cur = el.textContent || 'xxx';
 if (typeof window.__akiniPromptModal === 'function') {
   window.__akiniPromptModal('日历中间自定义文字', '请输入自定义文字', function(val) {
     if (val !== null && String(val).trim() !== '') {
       var str = String(val).trim();
       el.textContent = str;
       try { localStorage.setItem('akini_cal_custom_center', str); } catch(e){}
     }
   }, { value: cur === 'xxx' ? '' : cur, maxLength: 30 });
   return;
 }
 try {
   var val = prompt('请输入日历中间自定义文字：', cur === 'xxx' ? '' : cur);
   if (val !== null && val.trim() !== '') {
     el.textContent = val.trim();
     try { localStorage.setItem('akini_cal_custom_center', val.trim()); } catch(e){}
   }
 } catch(e){}
};
/* v907 时间模块每秒刷新，确保永远实时；独立 IIFE 保护，不受其他启动脚本异常影响 */
(function(){
 function _tick(){
   try { if(window.updateS1Calendar) window.updateS1Calendar(); } catch(e){}
 }
 /* v922 日历自定义文字"重进变 xxx"根因修复：原实现在脚本解析期立即读元素——
    此时 <div id="calCustomCenter"> 尚未解析（getElementById 恒为 null），
    保存的文字永远没机会回填 → 每次冷启动都显示静态默认 "xxx"。
    修复：DOMContentLoaded 后应用 + 1.2s/3s 两档重试（跑赢异步恢复链）+ load 兜底；
    并全局暴露 __akiniApplyCalText 供恢复完成后调用 */
 window.__akiniApplyCalText = function(){
   try {
     var saved = localStorage.getItem('akini_cal_custom_center');
     if (saved) {
       var el = document.getElementById('calCustomCenter');
       if (el) el.textContent = saved;
     }
   } catch(e){}
 };
 function _boot(){
   _tick();
   window.__akiniApplyCalText();
 }
 if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _boot);
 else _boot();
 /* 每秒刷新日历时间，前台可见时持续走秒；后台自动暂停节省资源 */
 setInterval(function(){ if(!document.hidden) _tick(); }, 1000);
 // v1229 对齐 milk/syy：改为 visibilitychange 驱动，前台时立即更新，后台完全停止
 document.addEventListener('visibilitychange', function(){ if(!document.hidden) _tick(); });
 /* v922：设置里切换时间格式 → 日历立即按新格式刷新 */
 window.addEventListener('storage', function(ev){
   try { if (ev && ev.key === 'akini_timeFormat' && !document.hidden) _tick(); } catch(e){}
 });
 setTimeout(window.__akiniApplyCalText, 1200);
 setTimeout(window.__akiniApplyCalText, 3000);
 window.addEventListener('load', window.__akiniApplyCalText);
})();