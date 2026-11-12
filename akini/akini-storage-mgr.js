/**
* Akini 储存数据页（数据管理）
* 入口：设置页「储存数据」行 → 全屏页面
* 功能：导出备份 / 导入备份 / 清除数据
*/
(function () {
 "use strict";
 var AREA_ID = "storageArea";
 function renderStorage() {
   var body = document.getElementById("akStorBody");
   if (!body) return;
   body.innerHTML =
     '<div class="settings-card"><div class="card-title">备份与恢复</div>' +
       '<div class="ak-hint" style="margin-top:0">数据每次变更已自动备份到浏览器本地库；换设备/清理浏览器前请先导出备份文件</div>' +
       '<div class="ak-btn-col">' +
         '<button class="[REDACTED_TOKEN] primary" id="akStorExport" type="button">导出备份</button>' +
         '<button class="[REDACTED_TOKEN]" id="akStorImport" type="button">导入备份</button>' +
         '<input type="file" id="akStorImportFile" accept=".zip,.json" class="akini-file-offscreen">' +
       "</div>" +
     "</div>" +
     '<div class="settings-card"><div class="card-title">清除聊天数据</div>' +
       '<div class="ak-hint" style="margin-top:0">选择要清除的联系人/群聊，仅删除其聊天记录，其余数据保留，不可恢复</div>' +
       '<div class="ak-btn-col">' +
         '<button class="[REDACTED_TOKEN] danger" id="akStorClearChat" type="button">选择要清除的对话</button>' +
       "</div>" +
     "</div>" +
     '<div class="settings-card"><div class="card-title">清除数据</div>' +
       '<div class="ak-hint" style="margin-top:0">清空后聊天记录、联系人、朋友圈、iCity、贴纸、设置全部删除（含浏览器本地库），不可恢复</div>' +
       '<div class="ak-btn-col">' +
         '<button class="[REDACTED_TOKEN] danger" id="akStorWipe" type="button">清除全部数据</button>' +
       "</div>" +
     "</div>";
   bindActions();
 }
 function bindActions() {
   var $ = function (id) { return document.getElementById(id); };
   var note = function (msg) {
     try {
       if (window.__akiniCenterModal) window.__akiniCenterModal("储存数据", msg);
       else alert(msg);
     } catch (e) { alert(msg); }
   };
   var expBtn = $("akStorExport");
   if (expBtn) expBtn.onclick = function () {
     try {
       if (window.akExportBackup) window.akExportBackup();
       else note("备份模块加载中，请稍后再试");
     } catch (e) { note("导出失败：" + e.message); }
   };
   var impBtn = $("akStorImport");
   var impFile = $("akStorImportFile");

if (file && window.akImportBackup) window.akImportBackup(file);
       ev.target.value = "";
     };
   }
   var clearChatBtn = $("akStorClearChat");
   if (clearChatBtn) clearChatBtn.onclick = function () { openClearChatPicker(); };
   function openClearChatPicker() {
     var rows = [];
     try {
       /* getSessions() 返回对象 {id: session}；名称/类型取 chatTarget */
       var sessMap = (window.akiniContacts && window.akiniContacts.getSessions)
         ? window.akiniContacts.getSessions() : {};
       var dirty = false;
       Object.keys(sessMap || {}).forEach(function (id) {
         var target = null;
         try {
           target = window.akiniContacts.getChatTarget
             ? window.akiniContacts.getChatTarget(id) : null;
         } catch (e) {}
         // 仅展示实际存在的有效联系人或群聊；若联系人/群聊已删除（孤儿历史会话），不展示并自动清理脏数据
         if (target && (target.name || target.nickname)) {
           rows.push({
             id: id,
             name: target.name || target.nickname,
             isGroup: !!(target.type === "group" || target.isGroup)
           });
         } else {
           // 自动清理不存在的残留孤儿 session
           try {
             delete sessMap[id];
             dirty = true;
           } catch (err) {}
         }
       });
       if (dirty && window.akiniContacts && window.akiniContacts.saveSessions) {
         try { window.akiniContacts.saveSessions(sessMap); } catch (err) {}
       }
     } catch (e) {}
     var overlay = document.createElement("div");
     overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:6005;display:flex;align-items:flex-end;";
     var listHtml = "";
     if (!rows.length) {
       listHtml = '<div style="text-align:center;color:#999;font-size:14px;padding:28px 0">暂无可清除的对话</div>';
     } else {
       rows.forEach(function (it) {
         var name = it.name || it.id;
         var isGroup = it.isGroup;
         listHtml += '<label style="display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid #f3f3f3;cursor:pointer;min-height:48px;box-sizing:border-box">' +
           '<input type="checkbox" class="[REDACTED_TOKEN]" value="' + String(it.id).replace(/"/g, "&quot;") + '" style="width:20px;height:20px;flex-shrink:0;accent-color:#1a1a1a">' +
           '<span style="flex:1;min-width:0;font-size:15px;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
             String(name).replace(/&/g, "&amp;").replace(/</g, "&lt;") +
             (isGroup ? ' <span style="font-size:11px;color:#999">(群聊)</span>' : "") +
           "</span></label>";
       });
     }
     overlay.innerHTML =
       '<div style="background:#f7f7f8;border-radius:20px 20px 0 0;width:100%;max-height:78vh;display:flex;flex-direction:column">' +
         '<div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #ececec;flex-shrink:0">' +
           '<button id="akClearChatCancel" type="button" style="background:0 0;border:none;font-size:15px;color:#666;cursor:pointer;padding:4px">取消</button>' +
           '<span style="font-weight:600;font-size:16px;color:#1a1a1a">清除聊天数据</span>' +
           '<button id="akClearChatGo" type="button" style="background:#e6432d;border:none;border-radius:16px;padding:7px 16px;color:#fff;font-size:14px;font-weight:600;cursor:pointer">清除</button>' +
         "</div>" +
         '<div style="flex:1;overflow-y:auto;padding:6px 16px;min-height:80px">' + listHtml + "</div>" +
         '<div style="padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));font-size:12px;color:#999;text-align:center;flex-shrink:0">勾选后点「清除」，所选对话的聊天记录将被永久删除</div>' +
       "</div>";
     document.body.appendChild(overlay);
     var close = function () { try { overlay.remove(); } catch (e) {} };
     overlay.addEventListener("click", function (ev) { if (ev.target === overlay) close(); });
     overlay.querySelector("#akClearChatCancel").onclick = close;
     overlay.querySelector("#akClearChatGo").onclick = function () {
       var ids = [];
       overlay.querySelectorAll(".[REDACTED_TOKEN]:checked").forEach(function (cb) { ids.push(cb.value); });
       if (!ids.length) { note("请先勾选要清除的对话"); return; }
       if (!confirm("确定清除所选 " + ids.length + " 个对话的聊天记录吗？删除后无法恢复！")) return;
       var n = 0;
       try { n = window.__akiniClearChatData ? window.__akiniClearChatData(ids) : 0; } catch (e) { console.error(e); }
       close();
       note("已清除 " + n + " 个对话的聊天记录");
     };
   }
   var wipeBtn = $("akStorWipe");
   if (wipeBtn) wipeBtn.onclick = function () {
     if (!confirm("确定要清空全部数据吗？\n聊天记录、联系人、朋友圈、iCity、贴纸、设置都会被删除，且无法恢复！")) return;
     if (!confirm("最后确认：真的要全部删除吗？建议先点「导出备份」留底。")) return;
     wipeBtn.disabled = true;
     wipeBtn.textContent = "正在清除…";
     // 全局清除标记：阻断一切 localStorage 写回与 IDB 备份，防止清除后数据复活
     wipeBtn.textContent = "正在清除…";
     // 全局清除标记：阻断一切 localStorage 写回与 IDB 备份，防止清除后数据复活
     try { window.__akiniWiping = true; } catch (e) {}
     // 放行 AkiniPersist 的删除/清空拦截，否则 localStorage.clear() 会把 akini_ 关键数据全部保留下来，清除失败
     try { window._akiniAllowRemove = true; } catch (e) {}
     // 立即清空内存镜像 + IDB 待写队列，防止刷新前的间隙旧数据被重新落盘
     try { if (window.akiniStore && window.akiniStore.wipeMemory) window.akiniStore.wipeMemory(); } catch (e) {}
     // 保险丝 cookie：即使本次刷新前 IDB 没清完，下次启动会再清一轮（由 akini-storage-safe.js 启动段消费）
     try { document.cookie = "akini_wipe_pending=1;path=/;max-age=600"; } catch (e) {}
     var reloaded = false;
     var doReload = function () {
       if (reloaded) return;
       reloaded = true;
       // core 式：换 URL 整页加载（?reset= 时间戳），bfcache 对 URL 变化不适用，旧页面无法从内存复活
       try { location.href = location.pathname + "?reset=" + Date.now(); }
       catch (e) { try { location.reload(true); } catch (e2) { location.reload(); } }
     };
     var clearLocal = function () {
       try { localStorage.clear(); } catch (e) {}
       try { sessionStorage.clear(); } catch (e) {}
       // 兜底：若 clear 被任何拦截层保留/回写，逐键强删所有残留（含非 akini_ 键）
       try {
         var rest = [];
         for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) rest.push(k); }
         rest.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
       } catch (e) {}
       try {