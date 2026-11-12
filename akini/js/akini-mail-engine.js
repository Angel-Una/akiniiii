
try { return parseInt(localStorage.getItem("akini_mail_last_active") || "0", 10) || 0; } catch (e) { return 0; }
 }
 // akiniStore.getSync 返回的是原始存储值（JSON 字符串或 null），直接 push 会抛 TypeError，
 // 这正是「主动写信到点永远收不到」的根因——必须统一解析成数组
 function _asArr(v) {
   if (!v) return [];
   if (typeof v === "string") {
     try { var a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch (e) { return []; }
   }
}
   return Array.isArray(v) ? v : [];
 }
 /* raw LS 权威读优先（内存镜像可能滞后：别处直写 LS 后内存仍是旧数组，
    一读一写就把新信覆盖消失——"显示已读后信不见了"根因）。LS 无值再退内存/IDB */
 function _rawFirst(key) {
   try {
     if (window.akiniStore && window.akiniStore.rawLSGet) {

var n = JSON.stringify(arr || []);
   // 核心修复：原只写 akiniStore（大键拦截层跳过 localStorage）——重启恢复链
   // 从 IDB 镜像/快照拿到的可能是【旧值】，已读/已回信状态被旧数据回填覆盖
   // （用户看到"点了已读下次又未读"的根因）。统一走 window.saveMailSent 全链路
   // 双通道落盘（LS + IDB 主/备），并登记 akini_key_mtime 供防回退守卫比对。
   if (typeof window.saveMailSent === "function") { window.saveMailSent(arr); return; }

checkStatus: checkStatus,
   start: start,
   markActive: markActive,
   // 设置页变更开关/间隔时调用：立即按新配置重排主动来信
   resetAutoSend: function () { manageAutoSendTimer(true); },
 };
 // 等待数据恢复完成后启动
 function boot() {
   // 清理已废弃的主动来信补丁键（离线补发/重挂逻辑已移除，这些键不再写入，属历史残留）
   ["akini_mail_backfill_done", "akini_mail_engine_last_rearm", "akini_next_mailAutoSend"]
     .forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
   if (window.__akiniBooted) { start(); return; }
   var waited = 0;
   var iv = setInterval(function () {
     waited += 200;
     if (window.__akiniBooted || waited > 8000) {
       clearInterval(iv);
       start();
     }
   }, 200);
 }
 boot();
 // 应用可见时刷新活跃时间并投递离线到点的回信（不再额外重挂主动来信定时器——
 // 前台期间自调度定时器一直在跑，无需重复重挂）
 document.addEventListener("visibilitychange", function () {
   if (!document.hidden) {
     if (window.akiniMailEngine && window.akiniMailEngine.checkStatus) window.akiniMailEngine.checkStatus();
     markActive();