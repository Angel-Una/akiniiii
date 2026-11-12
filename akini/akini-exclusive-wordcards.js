/* ===== 专属字卡终极全能渲染引擎：保证字卡库工具栏专属字卡 100% 顺畅打开并展示联系人列表 ===== */
(function() {
 function getContactsList() {
   try {
     if (window.akiniContacts && typeof window.akiniContacts.getContacts === "function") {
       var list = window.akiniContacts.getContacts();
       if (Array.isArray(list) && list.length) return list;
     }
   } catch(e) {}
   try {
     var raw = localStorage.getItem("akini_contacts");
     if (raw) {
       var parsed = JSON.parse(raw);
       if (Array.isArray(parsed) && parsed.length) return parsed;
     }
   } catch(e) {}
   return [];
 }
 window.__akiniOpenExclusive = function() {
   try {
     // 1. 确保字卡库浮层展开
     var wb = document.getElementById("wordbankOverlay");
     if (wb) {
       wb.style.display = "flex";
       wb.classList.add("show");
     }
     // 2. 确保专属字卡浮层以顶级 z-index 展开
     var excl = document.getElementById("wbExclOverlay");
     if (excl) {
       excl.style.display = "flex";
       excl.style.zIndex = "1000005";
       excl.style.visibility = "visible";
       excl.style.opacity = "1";
       excl.classList.add("show");
     }
     // 3. 优先调用 akini-main.js 官方专属渲染
     var rendered = false;
     if (typeof window.__wbRenderExcl === "function") {
       try { window.__wbRenderExcl(); rendered = true; } catch(e) {}
     }
     if (!rendered && typeof window.__wbOpenExclusive === "function") {
       try { window.__wbOpenExclusive(); rendered = true; } catch(e) {}
     }
     // 4. 若列表依然为空，执行坚固的联系人渲染兜底
     var listEl = document.getElementById("wbExclList");
     if (listEl && (!listEl.children || listEl.children.length === 0)) {
       var cs = getContactsList();
       var tipEl = document.getElementById("wbExclTip");
       if (tipEl) tipEl.textContent = "专属分组内的字卡只有该联系人能使用，其他联系人不会抽到";
       var titleEl = document.getElementById("wbExclTitle");
       if (titleEl) titleEl.textContent = "专属字卡";
       var backBtn = document.getElementById("wbExclBack");
       if (backBtn) backBtn.style.display = "none";
       var backHomeBtn = document.getElementById("wbExclBackHome");
       if (backHomeBtn) backHomeBtn.style.display = "";
       var closeBtn = document.getElementById("wbExclClose");
       if (closeBtn) closeBtn.style.display = "none";
       if (!cs.length) {
         listEl.innerHTML = '<div class="empty-text" style="text-align:center;color:#bbb;padding:40px 0">暂无联系人<br><span style="font-size:12px;color:#aaa">请先在微信或通讯录中添加联系人</span></div>';
       } else {
         listEl.innerHTML = "";
         cs.forEach(function(c) {
           var row = document.createElement("div");
           row.className = "wb-excl-contact";
           row.dataset.cid = c.id;
           row.style.cssText = "display:flex;align-items:center;padding:12px 14px;background:#fff;border-radius:12px;margin-bottom:8px;cursor:pointer;";
           var _avt = c.avatar && String(c.avatar).trim() ? String(c.avatar).trim() : "";
           var av = /^(data:|https?:|\/|<img)/i.test(_avt)
             ? '<img src="' + _avt.replace(/"/g, "&quot;") + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt=""/>'
             : '<span style="font-size:22px">' + (_avt || "👤") + '</span>';
           row.innerHTML = '<div class="wb-excl-avatar" style="width:42px;height:42px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-right:12px;">' + av + '</div>'
             + '<div style="flex:1;min-width:0"><div class="wb-excl-name" style="font-size:15px;font-weight:600;color:#222;">' + (c.name || "未命名") + '</div><div class="wb-excl-sub" style="font-size:12px;color:#999;margin-top:2px;">点击设置专属分组与字卡</div></div>'
             + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#c5c5c5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
           row.onclick = function() {
             if (window.__wbRenderExclGroups) {
               try { window.__wbRenderExclGroups(c.id); return; } catch(ex) {}
             }
             // 若没有 __wbRenderExclGroups，派发点击事件给主脚本 WEL 委托
             var list = document.getElementById("wbExclList");
             if (list) {
               var evt = new MouseEvent("click", { bubbles: true, cancelable: true });
               row.dispatchEvent(evt);
             }
           };
           listEl.appendChild(row);
         });
       }
     }
   } catch(err) {
     console.error("[__akiniOpenExclusive] 打开专属字卡异常:", err);
   }
 };
 // 绑定左上角返回按钮
 document.addEventListener("DOMContentLoaded", function() {
   var bh = document.getElementById("wbExclBackHome");
   if (bh) {
     bh.onclick = function() {
       var excl = document.getElementById("wbExclOverlay");
       if (excl) { excl.style.display = "none"; excl.classList.remove("show"); }
       var wb = document.getElementById("wordbankOverlay");
       if (wb) { wb.style.display = "flex"; wb.classList.add("show"); }
     };
   }
   var bc = document.getElementById("wbExclClose");
   if (bc) {
     bc.onclick = function() {
       var excl = document.getElementById("wbExclOverlay");
       if (excl) { excl.style.display = "none"; excl.classList.remove("show"); }
     };
   }
 });
})();