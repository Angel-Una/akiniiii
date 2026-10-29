/* ===== akini-survey-shop-engine.js ===== */
window.__akiniDefer2=function(fn){if("requestIdleCallback"in window){requestIdleCallback(fn,{timeout:5000});}else{setTimeout(fn,200);}};window.__akiniDefer2(function(){
/* ===== Akini 问卷与商店卡片互动增强引擎 ===== */
(function(){
  /* ---------- 0. 存量清洗：群双人头像 token 不得残留在 TA 头像键（根治新联系人双人头像） ---------- */
  try {
    ["akini_ta_avatar", "akini_icity_ta_avatar"].forEach(function(k){
      var v = localStorage.getItem(k);
      if(v && window.__akiniIsGroupAvatarToken && window.__akiniIsGroupAvatarToken(v)) localStorage.removeItem(k);
    });
  } catch(e){}

  /* ---------- 1. 聊天问卷弹窗双 Tab（我的提问 / TA的提问） ---------- */
  window.__surveyChatTab = "mine";
  window.__switchSurveyChatTab = function(tab){
    window.__surveyChatTab = tab;
    var btnMine = document.getElementById("surveyTabMine");
    var btnTa = document.getElementById("surveyTabTa");
    if(btnMine){
      var onM = tab === "mine";
      btnMine.style.borderBottom = onM ? "2.5px solid #1a1a1a" : "2.5px solid transparent";
      btnMine.style.color = onM ? "#1a1a1a" : "#888";
      btnMine.style.fontWeight = onM ? "600" : "400";
    }
    if(btnTa){
      var onT = tab === "ta";
      btnTa.style.borderBottom = onT ? "2.5px solid #1a1a1a" : "2.5px solid transparent";
      btnTa.style.color = onT ? "#1a1a1a" : "#888";
      btnTa.style.fontWeight = onT ? "600" : "400";
    }
    if(typeof window.renderSurveyList === "function") window.renderSurveyList();
  };

  /* ---------- 2. 直接展示回答结果，从上到下从新到旧排序 ---------- */
  function _buildSurveyDirectResultHtml(s, isTaTab, realIdx, contactName){
    try {
      var title = (s.title || "").trim() || "问卷";
      // 提取最新作答记录
      var replyToShow = null;
      if (s.replies && s.replies.length > 0) {
        replyToShow = s.replies[s.replies.length - 1];
      }
      var hasReply = !!(s.replied || (replyToShow && replyToShow.answers && replyToShow.answers.length > 0));

      // 时间：作答完成时间
      var bestTs = (replyToShow && replyToShow.ts) || s.createdAt || 0;
      var timeStr = bestTs ? new Date(bestTs).toLocaleString("zh-CN", {month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"}) : "";

      // 状态：严格只展示已作答完成的标记（绝非答题入口）
      var statusBadge = isTaTab
        ? '<span style="font-size:12px;padding:3px 8px;border-radius:6px;background:#1a1a1a;color:#fff;font-weight:500;">✓ 我已回答</span>'
        : '<span style="font-size:12px;padding:3px 8px;border-radius:6px;background:#1a1a1a;color:#fff;font-weight:500;">✓ ' + (typeof escapeHtml === "function" ? escapeHtml(contactName || "TA") : (contactName || "TA")) + '已回答</span>';
      var subInfo = isTaTab
        ? "来自 " + (contactName || s.senderName || "联系人") + " &middot; " + timeStr
        : (contactName || "联系人") + " &middot; " + timeStr;

      var card = '<div class="survey-direct-card" style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 4px rgba(0,0,0,.04);border:1px solid #ebebeb;">';
      // 卡片顶部
      card += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f2f2f2;">';
      card += '  <div style="flex:1;min-width:0;">';
      card += '    <div style="font-size:16px;font-weight:600;color:#111;margin-bottom:3px;word-break:break-word;">' + (typeof escapeHtml === "function" ? escapeHtml(title) : title) + '</div>';
      card += '    <div style="font-size:12px;color:#888;">' + subInfo + '</div>';
      card += '  </div>';
      card += '  <div style="flex-shrink:0;">' + statusBadge + '</div>';
      card += '</div>';

      // 卡片主体：直接展示每个问题与回答结果
      var qList = s.questions || [];
      if (qList.length === 0) {
        card += '<div style="font-size:13px;color:#999;padding:8px 0;">该问卷暂无问题</div>';
      } else {
        card += '<div style="display:flex;flex-direction:column;gap:10px;">';
        qList.forEach(function(q, qIdx){
          var qText = (q && q.text) ? String(q.text).trim() : ("问题 " + (qIdx + 1));
          var curType = (q && q.type) || s.qType || "single";
          var opts = (q && q.options ? q.options : []).filter(function(o){ return (o || "").trim(); });
          if (curType === "yesno") opts = ["是", "否"];

          var ans = replyToShow && replyToShow.answers ? replyToShow.answers[qIdx] : undefined;
          var isMulti = (curType === "multi") || Array.isArray(ans);

          var singlePickedIndex = -1;
          if (!isMulti && ans !== undefined && ans !== null && ans !== "") {
            if (typeof ans === "number" && ans >= 0 && ans < opts.length) {
              singlePickedIndex = ans;
            } else if (/^\d+$/.test(String(ans)) && parseInt(ans, 10) >= 0 && parseInt(ans, 10) < opts.length) {
              singlePickedIndex = parseInt(ans, 10);
            } else {
              var cCode = String(ans).trim().toUpperCase().charCodeAt(0) - 65;
              if (cCode >= 0 && cCode < opts.length && String(ans).trim().length === 1) {
                singlePickedIndex = cCode;
              } else {
                for (var _si = 0; _si < opts.length; _si++) {
                  if (String(opts[_si]).trim() === String(ans).trim()) {
                    singlePickedIndex = _si;
                    break;
                  }
                }
              }
            }
          }

          card += '<div style="background:#fafafa;border-radius:10px;padding:12px;border:1px solid #f0f0f0;">';
          card += '  <div style="font-size:14px;font-weight:600;color:#222;margin-bottom:8px;">' + (qIdx + 1) + '. ' + (typeof escapeHtml === "function" ? escapeHtml(qText) : qText) + '</div>';

          if (opts.length >= 2) {
            card += '  <div style="display:flex;flex-direction:column;gap:6px;">';
            opts.forEach(function(opt, oIdx){
              var label = String.fromCharCode(65 + oIdx);
              var isPicked = false;
              if (hasReply) {
                if (isMulti) {
                  isPicked = Array.isArray(ans) && (ans.indexOf(opt) >= 0 || ans.indexOf(oIdx) >= 0 || ans.indexOf(String(oIdx)) >= 0);
                } else {
                  isPicked = (oIdx === singlePickedIndex);
                }
              }
              var dotStyle = isPicked
                ? 'width:14px;height:14px;border-radius:50%;background:#1a1a1a;border:none;flex-shrink:0;'
                : 'width:14px;height:14px;border-radius:50%;border:1.5px solid #bbb;background:#fff;box-sizing:border-box;flex-shrink:0;';
              var textStyle = isPicked
                ? 'font-size:13px;color:#111;font-weight:600;'
                : 'font-size:13px;color:#777;font-weight:400;';
              card += '    <div style="display:flex;align-items:center;gap:8px;min-height:28px;">';
              card += '      <div style="' + dotStyle + '"></div>';
              card += '      <span style="' + textStyle + '"><b style="margin-right:4px;">' + label + '.</b>' + (typeof escapeHtml === "function" ? escapeHtml(opt) : opt) + '</span>';
              if (isPicked) {
                card += '      <span style="font-size:11px;color:#1a1a1a;background:#eee;padding:1px 6px;border-radius:4px;margin-left:auto;">' + (isTaTab ? "我的回答" : "TA的选择") + '</span>';
              }
              card += '    </div>';
            });
            card += '  </div>';
          } else {
            // 问答题或无选项展示
            var ansDisplay = (ans !== undefined && ans !== null && ans !== "") ? String(ans) : "未作答";
            var textStyle = hasReply ? "color:#111;font-weight:500;" : "color:#999;font-style:italic;";
            card += '  <div style="font-size:13px;padding:8px;background:#fff;border-radius:6px;border:1px solid #e8e8e8;' + textStyle + '">回答：' + (typeof escapeHtml === "function" ? escapeHtml(ansDisplay) : ansDisplay) + '</div>';
          }
          card += '</div>';
        });
        card += '</div>';
      }

      // 备注显示
      if (replyToShow && replyToShow.note) {
        card += '<div style="margin-top:10px;padding:9px 12px;background:#f5f5f5;border-radius:8px;font-size:13px;color:#333;line-height:1.5;">';
        card += '  <b style="color:#666;">备注：</b>' + (typeof escapeHtml === "function" ? escapeHtml(replyToShow.note) : replyToShow.note);
        card += '</div>';
      }

      // 仅作为已作答记录详情展示，严禁出现任何“去回答”或答题操作按钮
      card += '</div>';
      return card;
    } catch(err) {
      console.error("[_buildSurveyDirectResultHtml] error:", err);
      return "";
    }
  }
  window.__buildSurveyDirectResultHtml = _buildSurveyDirectResultHtml;

  window.renderSurveyList = function(){
    try {
      var container = document.getElementById("surveyListContainer");
      if(!container) return;
      var chatId = (window.akiniContacts && window.akiniContacts.getActiveChatId) ? window.akiniContacts.getActiveChatId() : "";
      if(!chatId){
        container.innerHTML = '<div style="text-align:center;color:#999;padding:60px 20px;font-size:14px">请进入聊天后查看问卷</div>';
        return;
      }
      if(typeof window.loadSurveys === "function") window.loadSurveys(chatId);
      var list = (window.surveys || []).slice().filter(function(s){ return s && !s.deleted; });

      var currentTab = window.__surveyChatTab || "mine";
      var isTaTab = (currentTab === "ta");

      // 严格铁律——这两个模块只显示回答后的问卷详情和列表，绝对不是回答问卷的地方！
      function _isAnsweredSurvey(s){
        if (!s) return false;
        if (s.replied === true) return true;
        if (Array.isArray(s.replies) && s.replies.length > 0) {
          for (var i = 0; i < s.replies.length; i++) {
            var r = s.replies[i];
            if (r && Array.isArray(r.answers) && r.answers.length > 0) return true;
          }
        }
        return false;
      }

      // 严格过滤：必须已作答，且按 Tab 归属分类；未回答的问卷绝不在此显示！
      var filtered = list.filter(function(s){
        if (!_isAnsweredSurvey(s)) return false;
        if (isTaTab) return s.direction === "receive";
        return s.direction !== "receive";
      });

      // 从上到下按最新作答时间降序排序
      filtered.sort(function(a, b){
        var tsA = a.createdAt || 0;
        if (a.replies && a.replies.length > 0) {
          a.replies.forEach(function(r){ if (r && r.ts && r.ts > tsA) tsA = r.ts; });
        }
        var tsB = b.createdAt || 0;
        if (b.replies && b.replies.length > 0) {
          b.replies.forEach(function(r){ if (r && r.ts && r.ts > tsB) tsB = r.ts; });
        }
        return tsB - tsA;
      });

      var fab = document.getElementById("surveyAddFab");
      if(fab) fab.style.display = isTaTab ? "none" : "flex";

      var targetContact = (window.akiniContacts && window.akiniContacts.getChatTarget) ? window.akiniContacts.getChatTarget(chatId) : null;
      var contactName = targetContact ? targetContact.name : "联系人";

      if(filtered.length === 0){
        var tip = isTaTab
          ? "暂无我回答 " + contactName + " 的问卷记录<br>你在聊天中完成作答后将在此展示详情"
          : "暂无 " + contactName + " 回答我的问卷记录<br>对方在聊天中完成作答后将在此展示详情";
        container.innerHTML = '<div style="text-align:center;color:#999;padding:60px 20px;font-size:14px;line-height:1.7;">' + tip + '</div>';
        return;
      }

      var html = "";
      filtered.forEach(function(s){
        var realIdx = (window.surveys || []).indexOf(s);
        html += _buildSurveyDirectResultHtml(s, isTaTab, realIdx, contactName);
      });
      container.innerHTML = html;
      // 彻底移除任何答题事件绑定
    } catch(e) {
      console.error("[renderSurveyList] error:", e);
    }
  };

  /* ---------- 3. 字卡库「问卷」Tab：表情包同款逻辑——仅联系人横条（无"我"），每个联系人独立问卷库 ---------- */
  window.__wbSurveyContactId = "";
  window.__renderWbSurveyTab = function(){
    if(typeof window.renderSurveyWbTab === "function"){
      window.renderSurveyWbTab();
    }
  };

  /* ---------- 4. iOS 三通道事件委托：升级支持编辑与删除 ---------- */
  (function(){
    if(window.__wbSurveyTapDelegated) return;
    window.__wbSurveyTapDelegated = true;
    function _handleEditOrDel(ev){
      if(window.__wbTab !== "survey") return;
      var t = ev.target && ev.target.closest ? ev.target : null;
      if(!t || !t.closest || !t.closest("#wbContent")) return;
      var editBtn = t.closest(".wb-survey-edit-btn");
      if(editBtn){
        ev.preventDefault(); 
        var sid = editBtn.getAttribute("data-sid");
        var cid = window.__wbSurveyContactId || window.__currentWbSurveyCid || "";
        var list = [];
        try { var raw = localStorage.getItem("akini_surveys_" + cid); if(raw) list = JSON.parse(raw) || []; } catch(e){}
        var sIdx = list.findIndex(function(it){ return String(it.id) === String(sid); });
        if(sIdx >= 0 && typeof window.openSurveyEdit === "function"){
          window.__surveyForContactConfig = cid;
          window.openSurveyEdit(sIdx);
        }
        return;
      }
      var delBtn = t.closest(".wb-survey-del-btn");
      if(delBtn){
        ev.preventDefault(); 
        var sid = delBtn.getAttribute("data-sid");
        if(!confirm("确定删除该问卷吗？")) return;
        var cid = window.__wbSurveyContactId || window.__currentWbSurveyCid || "";
        var list = [];
        try { var raw = localStorage.getItem("akini_surveys_" + cid); if(raw) list = JSON.parse(raw) || []; } catch(e){}
        var idx = list.findIndex(function(it){ return String(it.id) === String(sid); });
        if(idx >= 0){
          list[idx].deleted = true;
          try { localStorage.setItem("akini_surveys_" + cid, JSON.stringify(list)); } catch(e){}
          if(typeof window.renderSurveyWbTab === "function") window.renderSurveyWbTab();
        }
        return;
      }
    }
    window.addEventListener("click", _handleEditOrDel, false);
  })();

  /* ---------- 5. Tab 切换三保险：click + touchend 捕获 + MutationObserver（根治 iOS 切 Tab 空白） ---------- */
  function _scheduleSurveyRender(){
    setTimeout(function(){ try { window.__renderWbSurveyTab(); } catch(e){} }, 60);
    setTimeout(function(){ try { window.__renderWbSurveyTab(); } catch(e){} }, 190);
  }
  function _openCreateForContact(){
    var cid = window.__wbSurveyContactId || window.__currentWbSurveyCid || "";
    if(!cid){
      // 自动从联系人列表或 localStorage 取第一个有效联系人
      try {
        if(window.akiniContacts && window.akiniContacts.getContacts){
          var cs = window.akiniContacts.getContacts().filter(function(c){ return c && c.id !== "me" && c.id !== "my"; });
          if(cs.length > 0) cid = cs[0].id;
        }
      } catch(e){}
    }
    if(!cid){
      try { cid = localStorage.getItem("akini_active_chat_id") || ""; } catch(e){}
    }
    if(!cid){
      try {
        var rawC = localStorage.getItem("akini_contacts");
        if(rawC){
          var clist = JSON.parse(rawC) || [];
          clist = clist.filter(function(c){ return c && c.id !== "me" && c.id !== "my"; });
          if(clist.length > 0) cid = clist[0].id;
        }
      } catch(e){}
    }
    if(!cid){ alert("请先在通讯录创建联系人"); return; }
    window.__wbSurveyContactId = cid;
    window.__currentWbSurveyCid = cid;
    try { if(window.akiniContacts && window.akiniContacts.setActiveChatId) window.akiniContacts.setActiveChatId(cid); } catch(e){}
    try { localStorage.setItem("akini_active_chat_id", cid); } catch(e){}
    if(typeof window.openSurveyCreate === "function") window.openSurveyCreate();
  }
  window.__wbSurveyOpenCreate = _openCreateForContact;

  var _tabHandler = function(e){
    var tabBtn = e.target && e.target.closest ? e.target.closest(".wb-tabs .tab") : null;
    if(tabBtn && tabBtn.getAttribute("data-tab") === "survey"){
      window.__wbTab = "survey";
      _scheduleSurveyRender();
    }
    var addBtn = e.target && e.target.closest ? e.target.closest(".wb-head-add") : null;
    if(addBtn && window.__wbTab === "survey"){
      e.preventDefault();
      _openCreateForContact();
    }
  };
  document.addEventListener("click", _tabHandler, true);
  document.addEventListener("touchend", _tabHandler, true);
  (function(){
    var tabs = document.querySelector(".wb-tabs");
    if(!tabs || !window.MutationObserver) return;
    new MutationObserver(function(){
      var act = tabs.querySelector(".tab.active");
      if(act && act.getAttribute("data-tab") === "survey") _scheduleSurveyRender();
    }).observe(tabs, { subtree: true, attributes: true, attributeFilter: ["class"] });
  })();

  /* ---------- 6. 商品详情弹窗按钮文案（赠送：接收礼物/拒收礼物；代付：给TA代付/拒绝代付） ----------
     文案与底色已由 shop.js 的 _setShopDetailMode 在打开前一并写死。
     这里以前用 setTimeout(50ms) 二次改写，会造成打开瞬间「付款/接收 → 接收礼物」的闪跳，现已去掉，
     只保留一个透传入口，避免别处调用 __shopOpenReceiveDetail 时找不到实现。 */
  window.__shopOpenReceiveDetail = function(orderId){
    if(window.__shopOpenReceiveOrderDetail) window.__shopOpenReceiveOrderDetail(orderId);
  };

  /* ---------- 7. 联系人回复后主动发问卷邀请 / 商店卡片 ---------- */
  (function(){
    if(window.__akiniInteractiveCardsReady) return;

    function activeChatId(){
      try {
        return window.akiniContacts && window.akiniContacts.getActiveChatId
          ? window.akiniContacts.getActiveChatId() : "";
      } catch(e){ return ""; }
    }

    function contactName(chatId){
      try {
        var t = window.akiniContacts && window.akiniContacts.getChatTarget
          ? window.akiniContacts.getChatTarget(chatId) : null;
        return (t && t.name) || "对方";
      } catch(e){ return "对方"; }
    }

    function readJson(key, def){
      try {
        var v = JSON.parse(localStorage.getItem(key) || "null");
        return v === null ? def : v;
      } catch(e){ return def; }
    }

    function wordNote(chatId){
      try {
        var w = window.pickWordCards ? window.pickWordCards(1, chatId) : "";
        return (w && String(w).trim()) || "";
      } catch(e){ return ""; }
    }

    /* 从该联系人的专属问卷库抽一份，生成「TA 发给我」的对话实例 */
    function sendSurveyInvite(chatId){
      var list = readJson("akini_surveys_" + chatId, []);
      if(!Array.isArray(list)) return false;
      var pool = list.filter(function(s){
        return s && !s.deleted && s.direction !== "receive" &&
          String(s.id).indexOf("srv_recv_") !== 0 &&
          Array.isArray(s.questions) && s.questions.length > 0;
      });
      if(!pool.length) return false;
      var src = pool[Math.floor(Math.random() * pool.length)];
      var clone = {
        id: "srv_recv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        sourceId: src.id,
        title: src.title || "",
        questions: JSON.parse(JSON.stringify(src.questions)),
        createdAt: Date.now(),
        qType: src.qType || "single",
        senderName: contactName(chatId),
        targetId: chatId,
        chatType: "contact",
        selectedMembers: [chatId],
        replies: [],
        replied: false,
        direction: "receive",
        replyAt: 0
      };
      list.push(clone);
      /* core 覆盖过 localStorage.setItem（对已有 akini_ 键会静默失败），必须走原型写入，
         否则点击卡片时 loadSurveys 读不到这份问卷，只能从聊天记录重建出残缺问卷 */
      try {
        var sk = "akini_surveys_" + chatId, sj = JSON.stringify(list);
        Storage.prototype.setItem.call(localStorage, sk, sj);
        try { window.akiniStore && window.akiniStore.memorySet && window.akiniStore.memorySet(sk, sj); } catch(e){}
        if(Storage.prototype.getItem.call(localStorage, sk) !== sj) return false;
      } catch(e){ return false; }
      try {
        window.__akiniAllSurveys = window.__akiniAllSurveys || {};
        window.__akiniAllSurveys[clone.id] = clone;
      } catch(e){}
      var row = null;
      try {
        row = window.insertSurveyBubble
          ? window.insertSurveyBubble(clone, false, "待回答", chatId) : null;
      } catch(e){}
      if(row && row.outerHTML && window.__akiniAppendMessageHTML){
        /* insertSurveyBubble 已经把卡片插进 DOM，appendMessageHTML 还会再插一次。
           先摘掉临时节点，再让 appendMessageHTML 持久化并落 DOM；随后校正确保最终只有一张 */
        var rowHTML = row.outerHTML;
        if(row.parentNode) row.parentNode.removeChild(row);
        try {
          window.__akiniAppendMessageHTML(chatId, rowHTML, {
            lastMsg: "[问卷] " + (clone.title || "邀请你回答"),
            lastTime: Date.now()
          });
        } catch(e){}
        setTimeout(function(){
          try {
            var body = document.getElementById("chatBody");
            if(!body) return;
            var nodes = body.querySelectorAll('.bubble.survey-bubble[data-survey-id="' + clone.id + '"]');
            if(!nodes.length){
              var tmp = document.createElement("div");
              tmp.innerHTML = rowHTML;
              while(tmp.firstChild) body.appendChild(tmp.firstChild);
              body.scrollTop = body.scrollHeight;
              return;
            }
            for(var i = 0; i < nodes.length - 1; i++){
              var r = nodes[i].closest(".msg-row");
              if(r && r.parentNode) r.parentNode.removeChild(r);
            }
          } catch(e){}
        }, 250);
      }
      return !!row;
    }

    /* 从商品库抽一件，让 TA 赠送或求你代付 */
    function sendShopCard(chatId){
      var products = readJson("akini_shop_products", []);
      if(!Array.isArray(products) || !products.length) return false;
      var p = products[Math.floor(Math.random() * products.length)];
      if(!p || !p.id) return false;
      var type = Math.random() < 0.5 ? "delegate" : "gift";
      var orderId = "ord_recv_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      try {
        window.__shopReceiveCard(chatId, type, p.id, orderId, wordNote(chatId));
      } catch(e){ return false; }
      return true;
    }

    /* 每项概率都是「每次回复独立判定」的字面百分比，100 就必定命中。
       一次回复最多发一张卡：按 一起听邀请 → 问卷邀请 → 商店卡片 的顺序取第一个真正发出的。
       三者与回复一样走「回复触发」，不受主动发消息开关约束。 */
    function triggerCards(chatId){
      if(!chatId || chatId !== activeChatId()) return;
      if(window.__akiniCardTriggering) return;
      var AKR = window.AKR;
      if(!AKR || typeof AKR.getProb !== "function") return;
      window.__akiniCardTriggering = true;
      try {
        if(Math.random() < AKR.getProb("invite") && sendMusicInvite(chatId)) return;
        if(Math.random() < AKR.getProb("surveyInvite") && sendSurveyInvite(chatId)) return;
        if(Math.random() < AKR.getProb("shopCard")) sendShopCard(chatId);
      } finally {
        setTimeout(function(){ window.__akiniCardTriggering = false; }, 1200);
      }
    }

    function sendMusicInvite(chatId){
      try{
        if(!window.__akiniSendMusicInviteCard) return false;
        if(chatId !== activeChatId()) return false;
        /* 返回真实结果：60 秒节流/已在听歌等情况下没发出，就继续判定问卷与商店卡片 */
        return !!window.__akiniSendMusicInviteCard();
      }catch(e){ return false; }
    }

    /* core 的回复由内部函数直接插入，不经过 window.I / akiniTriggerReply，
       因此用 DOM 观察兜底：用户发消息后的 60 秒内，聊天里新增「对方」普通文字气泡时按概率触发。
       只统计「我发消息 → 联系人回复」这条路径，主动消息/定时内容不触发。 */
    function markUserSend(){
      window.__akiniUserSentAt = Date.now();
      window.__akiniCardTriggeredForSend = false;
    }
    document.addEventListener("click", function(e){
      try{ if(e.target && e.target.closest && e.target.closest("#sendBtn")) markUserSend(); }catch(err){}
    }, true);
    document.addEventListener("keydown", function(e){
      try{
        if(e.key === "Enter" && e.target && e.target.id === "msgInput" && !e.isComposing) markUserSend();
      }catch(err){}
    }, true);

    var CARD_CLASSES = ["survey-bubble","shop-card-bubble","music-invite-bubble","music-end-bubble","transfer-bubble","sticker-bubble","redpacket-bubble"];
    function isPlainTextRow(row){
      var b = row.querySelector(".bubble");
      if(!b) return false;
      for(var i=0;i<CARD_CLASSES.length;i++){ if(b.classList.contains(CARD_CLASSES[i])) return false; }
      return true;
    }
    function onRowAdded(row){
      try{
        if(!row || row.nodeType !== 1 || !row.classList || !row.classList.contains("msg-row")) return;
        if(!row.classList.contains("other") && !row.classList.contains("ta")) return;
        if(!isPlainTextRow(row)) return;
        if(window.__akiniCardTriggering || window.__akiniCardTriggeredForSend) return;
        var sentAt = window.__akiniUserSentAt || 0;
        if(!sentAt || Date.now() - sentAt > 60000) return;
        var ts = parseInt(row.getAttribute("data-ts") || "0", 10);
        if(ts > 0 && Date.now() - ts > 60000) return;
        var id = activeChatId();
        if(!id) return;
        window.__akiniCardTriggeredForSend = true;
        setTimeout(function(){ triggerCards(id); }, 1600 + Math.random() * 800);
      }catch(err){}
    }
    function startCardObserver(){
      var body = document.getElementById("chatBody");
      if(!body || typeof MutationObserver !== "function") return false;
      if(body.__akiniCardObserver) return true;
      var mo = new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          var added = muts[i].addedNodes || [];
          for(var j=0;j<added.length;j++){
            var n = added[j];
            if(!n || n.nodeType !== 1) continue;
            if(n.classList && n.classList.contains("msg-row")){ onRowAdded(n); continue; }
            if(!n.querySelectorAll) continue;
            var rows = n.querySelectorAll(".msg-row");
            for(var k=0;k<rows.length;k++) onRowAdded(rows[k]);
          }
        }
      });
      mo.observe(body, { childList: true });
      body.__akiniCardObserver = mo;
      return true;
    }
    if(!startCardObserver()){
      if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", startCardObserver);
      else setTimeout(startCardObserver, 300);
    }
  })();
})();

});
;
/* ===== akini-performance.js ===== */

(function(){
  if (!/iP(hone|ad|od)/.test(navigator.userAgent)) return;
  var HEAP_LIMIT = 0.85;
  var IDLE_TIMEOUT = 25000;
  var lastInteraction = Date.now();
  ['touchstart','touchmove','mousedown','keydown','scroll'].forEach(function(ev){
    document.addEventListener(ev, function(){ lastInteraction = Date.now(); }, {passive:true, capture:true});
  });
  function heapRatio(){
    try {
      if (performance && performance.memory && performance.memory.jsHeapSizeLimit) {
        return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      }
    } catch(e){}
    return 0;
  }
  var degraded = false;
  function degrade(reason){
    if (degraded) return;
    degraded = true;
    try { console.warn('[Akini] iOS 内存压力降载:', reason); } catch(e){}
    try { document.documentElement.classList.add('akini-low-mem'); } catch(e){}
    try {
      document.querySelectorAll('video').forEach(function(v){ try{v.pause();}catch(e){} });
    } catch(e){}
  }
  var _memIv = setInterval(function(){
    if (document.hidden) return;
    var r = heapRatio();
    if (r > HEAP_LIMIT) { degrade('heap ' + Math.round(r*100) + '%'); return; }
    if (r > 0.65 && (Date.now() - lastInteraction) > IDLE_TIMEOUT) { degrade('idle heap ' + Math.round(r*100) + '%'); }
  }, 5000);
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden && !degraded) lastInteraction = Date.now();
  });
})();

(function () {
  function install() {
    if (window.__akiniChatSwitchPatched || !window.akiniContacts || typeof window.akiniContacts.setActiveChatId !== 'function') return;
    window.__akiniChatSwitchPatched = true;
    var orig = window.akiniContacts.setActiveChatId.bind(window.akiniContacts);
    window.akiniContacts.setActiveChatId = function (id) {
      var prev = '';
      try { prev = window.akiniContacts.getActiveChatId ? window.akiniContacts.getActiveChatId() : ''; } catch (e) {}
      orig(id);
      if (id && prev !== id) {
        try {
          var body = document.getElementById('chatBody');
          if (body) { body.innerHTML = ''; body.scrollTop = 0; }
        } catch (e) {}
        try { window.__akiniIncCache = {}; } catch (e) {}
        try {
          var zn = document.getElementById('chatBody');
          if (zn) zn.setAttribute('data-rendered-chat-id', '');
        } catch (e) {}
      }
    };
  }
  install();
  var _iv = setInterval(function () { install(); if (window.__akiniChatSwitchPatched) clearInterval(_iv); }, 200);
  setTimeout(function () { try { clearInterval(_iv); } catch (e) {} }, 8000);
})();

(function () {
  var lastKick = 0;
  function toggleOn(name) {
    try {
      var v = localStorage.getItem('akini_toggle_' + name);
      return v === '1';
    } catch (e) { return false; }
  }
  function hasContacts() {
    try {
      if (!window.akiniContacts || !window.akiniContacts.getContacts) return false;
      var c = window.akiniContacts.getContacts();
      return !!(c && c.length);
    } catch (e) { return false; }
  }
  function hasSchedule(key) {
    try {
      var v = parseFloat(localStorage.getItem(key) || '0');
      return v > 0;
    } catch (e) { return false; }
  }
  function kick() {
    var now = Date.now();
    if (now - lastKick < 45000) return;
    lastKick = now;
    if (!hasContacts()) return;
    if (toggleOn('contactFriendsToggle') && !hasSchedule('akini_next_friendsPost')) {
      try {
        if (typeof window._akiniRescheduleFriendsPost === 'function') {
          window._akiniRescheduleFriendsPost();
          console.log('[Akini] 朋友圈调度死停，已重新排期');
        }
      } catch (e) {}
    }
    if (toggleOn('contactIcityToggle') && !hasSchedule('akini_next_icityPost')) {
      try {
        if (typeof window._akiniRescheduleIcityPost === 'function') {
          window._akiniRescheduleIcityPost();
          console.log('[Akini] iCity调度死停，已重新排期');
        }
      } catch (e) {}
    }
    if (toggleOn('contactMailToggle')) {
      try {
        if (window.akiniMailEngine && typeof window.akiniMailEngine.checkStatus === 'function') {
          window.akiniMailEngine.checkStatus();
        }
      } catch (e) {}
    }
  }
  var bootIv = setInterval(function () {
    if (hasContacts()) {
      clearInterval(bootIv);
      kick();
      setInterval(kick, 60000);
    }
  }, 1000);
  setTimeout(function () { try { clearInterval(bootIv); } catch (e) {} }, 120000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { lastKick = 0; kick(); }
  });

  function firstKickIfNeeded() {
    try {
      if (localStorage.getItem('akini__first_kick') === '1') return;
      if (!hasContacts()) return;
      var friends = toggleOn('contactFriendsToggle');
      var icity = toggleOn('contactIcityToggle');
      var mail = toggleOn('contactMailToggle');
      if (!friends && !icity && !mail) return;
      localStorage.setItem('akini__first_kick', '1');
      var delay = 10000 + Math.floor(Math.random() * 80000);
      setTimeout(function () {
        try {
          if (friends && typeof window._akiniRescheduleFriendsPost === 'function') {
            window._akiniRescheduleFriendsPost();
          }
          if (icity && typeof window._akiniRescheduleIcityPost === 'function') {
            window._akiniRescheduleIcityPost();
          }
          if (mail) {
            try { localStorage.removeItem('akini_next_mailAutoSend'); } catch (e0) {}
            if (window.akiniMailEngine && typeof window.akiniMailEngine.checkStatus === 'function') {
              window.akiniMailEngine.checkStatus();
            }
          }
          console.log('[Akini] 首启快速互动已触发');
        } catch (e) {}
      }, delay);
    } catch (e) {}
  }
  var fkIv = setInterval(function () {
    firstKickIfNeeded();
    if (localStorage.getItem('akini__first_kick') === '1') clearInterval(fkIv);
  }, 1500);
  setTimeout(function () { try { clearInterval(fkIv); } catch (e) {} }, 60000);
})();

;
/* ===== akini-image-upload.js ===== */
/* ============================================================
   akini-image-upload.js — 统一图片上传引擎（拍立得 / 首页封面 / 纪念日底图）
   设计原则：
   1. 单一入口：所有图片选择 → 压缩 → 上墙 → 持久化 走同一套流程
   2. 单一委托：一个 document click 监听器负责触发对应 file input
   3. 无内联依赖：不依赖 HTML 上的 onclick/onchange
   4. 幂等绑定：input 的 change 事件只绑一次
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 配置：区域 ↔ 元素ID ↔ inputID ↔ 存储键 ---------- */
  var AREAS = {
    s1cover:  { elId: 's1CoverBg',       inputId: 's1CoverInputDirect', keys: ['akini_s1_cover', 'akini_s1_cover_bg', 's1_cover'] },
    polaroid: { elId: 's1PolaroidImg',   inputId: 's1PhotoInputDirect', keys: ['akini_s1_photo', 'akini_s1_polaroid_img'] },
    cover:    { elId: 'coverAreaMain',   inputId: 's2CoverInputDirect', keys: ['akini_cover_bg', 'akini_cover_img', 'akini_s2_cover', 'cover_bg'] },
    daybg:    { elId: 'bgArea',          inputId: 's2DayBgInputDirect',  keys: ['akini_day_bg', 'akini_bg_img', 'akini_anniv_bg', 'day_bg'] }
  };

  /* ---------- 工具函数 ---------- */

  // 合法图片值校验：只接受真正的图片地址，截断/脏值一律拒绝，避免上墙后变成黑块
  function validImage(v) {
    if (!v || typeof v !== 'string' || v.length < 100) return false;
    if (/^data:image\//i.test(v)) return true;
    if (/^(blob:|https?:\/\/|\/)/i.test(v)) return true;
    return false;
  }

  // 把 dataUrl 设为元素背景（用 !important 防止 CSS 简写覆盖）
  function applyBg(elId, dataUrl) {
    var el = document.getElementById(elId);
    if (!el) return;
    if (!validImage(dataUrl)) {
      /* 取不到有效图片时清掉内联背景，回落到样式表默认渐变，而不是留一块深色底 */
      try { el.style.removeProperty('background-image'); } catch (e) {}
      return;
    }
    el.style.setProperty('background-image', 'url("' + dataUrl + '")', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
  }

  // 只写主键：同一张图写 4 个键会把 localStorage 配额挤爆，导致其他图片被驱逐后变黑
  function persist(keys, dataUrl) {
    var primary = keys[0];
    try { localStorage.setItem(primary, dataUrl); } catch (e) {}
    try {
      if (window.akiniStore && typeof window.akiniStore.set === 'function') {
        window.akiniStore.set(primary, dataUrl);
        if (typeof window.akiniStore.flushIdb === 'function') window.akiniStore.flushIdb();
      }
    } catch (e) {}
  }

  // 取第一个有效存储值（LS 优先，其次内存镜像）
  function firstValid(keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = null;
      try { v = localStorage.getItem(keys[i]); } catch (e) {}
      if (!validImage(v) && window.akiniStore && window.akiniStore.memoryGet) {
        try { var m = window.akiniStore.memoryGet(keys[i]); if (validImage(m)) v = m; } catch (e2) {}
      }
      if (validImage(v)) return v;
    }
    return null;
  }

  // 压缩（如果有压缩函数），否则原样回调
  function compress(dataUrl, cb) {
    if (typeof window.compressImageDataUrl === 'function') {
      window.compressImageDataUrl(dataUrl, function (c) { cb(c || dataUrl); });
    } else {
      cb(dataUrl);
    }
  }

  /* ---------- 核心：处理选中的图片文件 ---------- */
  function processFile(type, file) {
    if (!file) return;
    var area = AREAS[type];
    if (!area) return;

    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target.result;
      compress(dataUrl, function (finalUrl) {
        applyBg(area.elId, finalUrl);
        persist(area.keys, finalUrl);
      });
    };
    reader.onerror = function () {
      if (window.akiniToast) window.akiniToast('图片读取失败，请重试');
    };
    reader.readAsDataURL(file);
  }

  /* ---------- 绑定 input 的 change 事件（幂等） ---------- */
  function bindInput(type) {
    var area = AREAS[type];
    var input = document.getElementById(area.inputId);
    if (!input || input.__akImgBound) return;
    input.__akImgBound = true;
    input.addEventListener('change', function (e) {
      processFile(type, e.target.files && e.target.files[0]);
      // 重置 input，允许重复选同一张图
      try { e.target.value = ''; } catch (err) {}
    });
  }

  /* ---------- 全局点击委托：点击区域 → 触发对应 input ---------- */
  function setupClickDelegation() {
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      // 点到 input 本身不处理
      if (t && t.tagName === 'INPUT' && t.type === 'file') return;

      var host = t && t.closest ? t.closest('#s1CoverBg, #s1PolaroidImg, #coverAreaMain, #dualAvatarWrap, #bgArea') : null;
      if (!host) return;

      var id = host.id;
      var inputId = null;
      if (id === 's1CoverBg') inputId = AREAS.s1cover.inputId;
      else if (id === 's1PolaroidImg') inputId = AREAS.polaroid.inputId;
      else if (id === 'coverAreaMain' || id === 'dualAvatarWrap') inputId = AREAS.cover.inputId;
      else if (id === 'bgArea') inputId = AREAS.daybg.inputId;

      if (inputId) {
        ev.preventDefault();
        ev.stopPropagation();
        var inp = document.getElementById(inputId);
        if (inp) {
          try { inp.value = ''; } catch (e) {}
          inp.click();
        }
      }
    });
  }

  /* ---------- 恢复已保存的图片 ---------- */
  function restoreAll() {
    applyBg(AREAS.s1cover.elId,  firstValid(AREAS.s1cover.keys));
    applyBg(AREAS.polaroid.elId, firstValid(AREAS.polaroid.keys));
    applyBg(AREAS.cover.elId,    firstValid(AREAS.cover.keys));
    applyBg(AREAS.daybg.elId,    firstValid(AREAS.daybg.keys));
  }

  /* ---------- 初始化 ---------- */
  function init() {
    bindInput('s1cover');
    bindInput('polaroid');
    bindInput('cover');
    bindInput('daybg');
    setupClickDelegation();
    restoreAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 存储层恢复后再次恢复图片（数据可能从 IDB 异步加载）
  function onStorageReady() { restoreAll(); }
  if (window.__akiniStorageRestored) {
    onStorageReady();
  } else {
    /* 存储层恢复完成后会调用 __akiniOnCriticalRestored；
       旧名 __akiniOnStorageRestored 从未被存储层触发，会导致被驱逐到 IDB 的
       第二屏封面/纪念日底图永远回不来——这里同时挂两个钩子兜底 */
    var prev = window.__akiniOnCriticalRestored;
    window.__akiniOnCriticalRestored = function () {
      if (typeof prev === 'function') { try { prev(); } catch (e) {} }
      onStorageReady();
    };
    var prev2 = window.__akiniOnStorageRestored;
    window.__akiniOnStorageRestored = function () {
      if (typeof prev2 === 'function') { try { prev2(); } catch (e) {} }
      onStorageReady();
    };
  }

  /* ---------- 兼容旧内联 onchange（HTML 里残留的 onchange 仍可调用） ---------- */
  window.handleS1CoverDirect = function (e) { processFile('s1cover',  e.target && e.target.files && e.target.files[0]); };
  window.handleS1PhotoDirect = function (e) { processFile('polaroid', e.target && e.target.files && e.target.files[0]); };
  window.handleS2CoverDirect = function (e) { processFile('cover',    e.target && e.target.files && e.target.files[0]); };
  window.handleS2DayBgDirect  = function (e) { processFile('daybg',    e.target && e.target.files && e.target.files[0]); };
  window.triggerDayBgUpload   = function ()  { var i = document.getElementById(AREAS.daybg.inputId); if (i) i.click(); };

})();

/* ===== 后台推送：TA 发来消息时弹系统通知 =====
   以前只有「设置 → 测试推送」会调 __akiniSystemNotify，真正收到消息时没有任何人调它，
   所以权限给了、测试能弹，正常消息却一条都不推送。
   TA 的消息有两条渲染链路：
     1) window.I()（core 里的 G 函数）—— 文本/转账/表情包等绝大部分「对方发来」的消息；
     2) window.__akiniAppendMessageHTML() —— 走 tt() 的卡片/系统消息。
   两条都挂上：只要当时不在这个会话里，或者 App 在后台，就推一条系统通知。 */
(function () {
  if (window.__akiniPushNotifyHooked) return;
  window.__akiniPushNotifyHooked = true;

  var lastKey = '';
  var lastAt = 0;

  function pushEnabled() {
    try {
      if (localStorage.getItem('akini_toggle_pushNotifyToggle') === '0') return false;
    } catch (e) {}
    return ('Notification' in window) && Notification.permission === 'granted';
  }

  function chatActive(cid) {
    try {
      return !!(window.__akiniIsChatActive && window.__akiniIsChatActive(cid));
    } catch (e) {
      return false;
    }
  }

  function contactName(cid) {
    try {
      var t = window.akiniContacts && window.akiniContacts.getChatTarget
        ? window.akiniContacts.getChatTarget(cid) : null;
      return (t && t.name) || '对方';
    } catch (e) {
      return '对方';
    }
  }

  /* 取会话里最后一条「对方」消息的文字，纯文本 < 80 字 */
  function lastOtherText(cid) {
    try {
      var sess = window.akiniContacts.getSession ? window.akiniContacts.getSession(cid) : null;
      var html = (sess && sess.messagesHTML) || '';
      var at = html.lastIndexOf('<div class="msg-row other');
      if (at < 0) at = html.lastIndexOf('msg-row other');
      if (at < 0) return '';
      var box = document.createElement('div');
      box.innerHTML = html.slice(at);
      var row = box.querySelector('.msg-row');
      return ((row && row.textContent) || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    } catch (e) {
      return '';
    }
  }

  function notify(cid, text) {
    try {
      if (!pushEnabled() || !cid) return;
      if (chatActive(cid) && !document.hidden) return;
      var name = contactName(cid);
      var body = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80) || '发来一条消息';
      var key = name + '\u0001' + body;
      if (key === lastKey && Date.now() - lastAt < 3000) return;
      lastKey = key;
      lastAt = Date.now();
      window.__akiniSystemNotify(name, {
        body: body,
        icon: './favicon.png',
        tag: 'akini_msg_' + cid + '_' + Date.now()
      });
    } catch (e) {}
  }

  /* 链路 2：tt() / 卡片 / 系统消息 */
  function hookAppend() {
    var orig = window.__akiniAppendMessageHTML;
    if (typeof orig !== 'function' || orig.__akiniPushWrapped) return typeof orig === 'function';
    window.__akiniAppendMessageHTML = function (cid, html) {
      try {
        if (pushEnabled() && typeof html === 'string' && /msg-row\s+(other|ta)\b/.test(html)) {
          var tmp = document.createElement('div');
          tmp.innerHTML = html;
          var row = tmp.querySelector('.msg-row');
          notify(cid, ((row && row.textContent) || '').replace(/\s+/g, ' ').trim());
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    window.__akiniAppendMessageHTML.__akiniPushWrapped = true;
    return true;
  }

  /* 链路 1：window.I()（core 的 G：对方发来的文本/转账/表情等） */
  function hookI() {
    var orig = window.I;
    if (typeof orig !== 'function' || orig.__akiniPushWrapped) return typeof orig === 'function';
    window.I = function (cid) {
      var r;
      try {
        r = orig.apply(this, arguments);
      } catch (err) {
        /* 某个机型/浏览器上渲染这一步可能抛错，但回复不能被静默吞掉：
           退化成和底部「继续」按钮完全一样的那条已知可用路径重试一次。 */
        try {
          console.error('[Akini] 对方消息渲染失败，降级重试:', err);
          var target = null;
          try {
            target = window.akiniContacts && window.akiniContacts.getChatTarget
              ? window.akiniContacts.getChatTarget(cid) : null;
          } catch (e2) {}
          r = orig.call(this, cid, target || arguments[1] || null, null, true);
        } catch (err2) {
          try { console.error('[Akini] 降级重试仍失败:', err2); } catch (e3) {}
        }
      }
      try {
        if (pushEnabled() && cid) notify(cid, lastOtherText(cid));
      } catch (e) {}
      return r;
    };
    window.I.__akiniPushWrapped = true;
    return true;
  }

  /* window.I 是 core 在 DOMContentLoaded 之后才赋值的，所以轮询等它就位 */
  function hookAll() {
    var a = hookAppend();
    var b = hookI();
    return a && b;
  }
  if (!hookAll()) {
    var n = 0;
    var iv = setInterval(function () {
      if (hookAll() || ++n > 150) clearInterval(iv);
    }, 200);
  }
})();

/* ===== 回复看门狗：兜掉「某些机型/浏览器联系人不回消息」 =====
   正常链路是 akiniTriggerReply → setTimeout(3~7s) → window.I() 渲染对方消息。
   但这条链路是「一次性」的：中间任何一步在某个机型上失败（渲染抛错、定时器被挂起、
   语料读取为空、开关值读不到），消息就永远不来了，页面上看不出任何报错。
   这里用 MutationObserver 监听聊天区：
     · 出现「我」的消息 → 起一个 15 秒的看门狗（正常回复最多 7 秒 + 打字延迟，不会误伤）；
     · 出现「对方」的消息 → 立刻撤掉看门狗；
     · 15 秒到点还没有对方消息、且仍停在这个会话、页面在前台 → 调 __akiniForceReply()
       （就是底部「继续」按钮用的那个函数）强制补一条。
   这样不管什么机型、什么浏览器，都不会再出现「发出去了但对方一条不回」。 */
(function () {
  if (window.__akiniReplyWatchdogInstalled) return;
  window.__akiniReplyWatchdogInstalled = true;

  var WATCH_MS = 15000;
  var timer = null;
  var tries = 0;

  function activeId() {
    try {
      return window.akiniContacts && window.akiniContacts.getActiveChatId
        ? window.akiniContacts.getActiveChatId() : null;
    } catch (e) {
      return null;
    }
  }

  function disarm() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function arm() {
    disarm();
    var cid = activeId();
    if (!cid) return;
    timer = setTimeout(function () {
      timer = null;
      try {
        if (activeId() !== cid) return;            /* 用户已切到别的会话 */
        if (document.hidden) return;               /* App 在后台：等回来再靠正常链路 */
        if (window.__akiniToggleOn && !window.__akiniToggleOn('contactReplyToggle', true)) return;
        if (typeof window.__akiniForceReply !== 'function') return;
        window.__akiniForceReply();
      } catch (e) {}
    }, WATCH_MS);
  }

  function init() {
    var body = document.getElementById('chatBody');
    if (!body) {
      if (++tries < 100) setTimeout(init, 300);
      return;
    }
    var obs = new MutationObserver(function (muts) {
      var sawMe = false, sawOther = false;
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes || [];
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (!n || n.nodeType !== 1 || !n.classList) continue;
          if (!n.classList.contains('msg-row')) continue;
          if (n.classList.contains('me')) sawMe = true;
          if (n.classList.contains('other')) sawOther = true;
        }
      }
      if (sawOther) disarm();
      else if (sawMe) arm();
    });
    obs.observe(body, { childList: true });
  }

  init();
})();
