if (!c) { console.warn('[TA手机] 容器注入失败'); return; }
   if (c.parentElement !== document.body) document.body.appendChild(c);
   c.style.display = 'flex';
   showContactGrid();
   updateStatusBar();
   if (_statusBarTimer) clearInterval(_statusBarTimer);
   _statusBarTimer = setInterval(updateStatusBar, 1000);
 }
 function hideContainer() {
   var c = getEl('akini-ta-phone-container');
   if (c) c.style.display = 'none';
   if (_statusBarTimer) {
     clearInterval(_statusBarTimer);
     _statusBarTimer = null;