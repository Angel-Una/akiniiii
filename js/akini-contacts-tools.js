
(function(){
  "use strict";
  /* 联系人预览切换（多人功能）已移除，此文件只保留聊天记录保存与滚动逻辑 */

  /* ============ 聊天：进入即滚到底部 + 清除残留输入状态 ============ */
  function _activeChatId(){return window.akiniContacts?window.akiniContacts.getActiveChatId():null;}
  function _chatVisible(){var c=document.getElementById("app-chat");return!!(c&&c.style.display!=="none");}
  function _scrollBottom(){var U=document.getElementById("chatBody");if(U){var nb=U.scrollHeight-U.scrollTop-U.clientHeight<120;if(nb)U.scrollTop=U.scrollHeight;}}
  // 多次延时滚动，覆盖异步恢复（IDB 读取）完成时机
  function _scrollBottomRobust(){
    _scrollBottom();
    setTimeout(_scrollBottom,50);setTimeout(_scrollBottom,150);setTimeout(_scrollBottom,350);setTimeout(_scrollBottom,700);setTimeout(_scrollBottom,1200);
  }
  function _clearStaleTyping(){
    var U=document.getElementById("chatBody");if(!U)return;
    var ac=_activeChatId();
    var typing=window.__akiniTypingMap&&ac?window.__akiniTypingMap[ac]:null;
    if(typing&&typing.timer)return; // 正在输入中，保留
    U.querySelectorAll('[id^="typingBubbleRow_"]').forEach(function(el){el.remove();});
    if(window.__akiniTypingMap&&ac){delete window.__akiniTypingMap[ac];}
  }
  if(window.openChat){
    var _origOpenChat=window.openChat;
    window.openChat=function(){var r=_origOpenChat.apply(this,arguments);_scrollBottomRobust();setTimeout(_clearStaleTyping,60);return r;};
  }
  // 进入聊天页（showPage('chat')）时也确保滚动
  if(window.showPage){
    var _origShowPage=window.showPage;
    window.showPage=function(t){var r=_origShowPage.apply(this,arguments);if(t==="chat"){_scrollBottomRobust();setTimeout(_clearStaleTyping,80);}return r;};
  }
  document.addEventListener("DOMContentLoaded",function(){
    var U=document.getElementById("chatBody");
    if(U){var t=null;new MutationObserver(function(){if(!_chatVisible())return;if(t)clearTimeout(t);t=setTimeout(_scrollBottom,80);}).observe(U,{childList:true,subtree:true});}
  });
  // 重渲染后（watchdog 触发）若在聊天页，重新滚到底部
  if(window.reRenderAll){
    var _origReRender=window.reRenderAll;
    window.reRenderAll=function(){var r=_origReRender.apply(this,arguments);if(_chatVisible())_scrollBottomRobust();return r;};
  }
  setInterval(function(){if(_chatVisible())_clearStaleTyping();},2000);

  /* ============ 强制保存：聊天记录（剔除输入气泡）/ icity ============ */
  function _stripTyping(html){var d=document.createElement("div");d.innerHTML=html;d.querySelectorAll('[id^="typingBubbleRow_"]').forEach(function(el){el.remove();});return d.innerHTML;}
  // 记录上次保存的聊天内容签名，避免无变化时重复做昂贵的序列化/写入
  var _lastChatSig="";
  var _saveChatTimer=null;
  /* 脏标记：只有聊天列表真的发生增删时才做整段 innerHTML 序列化。
     旧实现每 20 秒无条件读一次 ~1MB 的 chatBody.innerHTML 再解析，是"一滑一顿/按钮迟滞"的固定开销来源。 */
  var _chatDirty=true;
  function _bindChatDirty(){
    try{
      var U=document.getElementById("chatBody");
      if(!U||U.__akiniDirtyObs||typeof MutationObserver!=="function")return;
      var mo=new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          var t=muts[i].target;
          if(t&&t.id==="chatBody"||muts[i].addedNodes.length||muts[i].removedNodes.length){
            _chatDirty=true;
            _scheduleSaveChat(1500); /* 变化即触发防抖保存，不再等 20s 轮询 */
            return;
          }
        }
      });
      mo.observe(U,{childList:true,subtree:false});
      U.__akiniDirtyObs=mo;
    }catch(e){}
  }
  document.addEventListener("DOMContentLoaded",function(){ _bindChatDirty(); });
  function _scheduleSaveChat(delay){
    if(_saveChatTimer)return;
    _saveChatTimer=setTimeout(function(){
      _saveChatTimer=null;_saveChat();
    },delay||1500);
  }
  function _saveChat(){
    try{
      var U=document.getElementById("chatBody");var ac=_activeChatId();
      if(!U||!ac||window._restoringChatHistory||window._restoringData)return;
      var html=U.innerHTML||"";if(!html.trim())return;
      var d=U.getAttribute("data-rendered-chat-id");if(d!==ac)return;
      html=_stripTyping(html);
      // 防止把「恢复出的旧/较短快照」覆盖掉本地更长的真实数据：若已存数据明显更长则跳过本次保存
      try{
        var _existing=localStorage.getItem("akini_chat_history_"+ac)||"";
        if(_existing&&_existing.length>html.length+200)return;
        // 行数对比更可靠：已存记录的消息行数更多时绝不覆盖（防回信/切页时旧快照覆盖真实记录）
        if(_existing&&window.__akiniCountMsgRows){
          var _er=window.__akiniCountMsgRows(_existing),_nr=window.__akiniCountMsgRows(html);
          if(_er>_nr)return;
        }
      }catch(e){}
      // 变化检测：内容未变则跳过，避免高频定时器造成卡顿
      var sig=ac+"#"+html.length+"#"+(html.charCodeAt(html.length-1)||0);
      if(sig===_lastChatSig)return;
      _lastChatSig=sig;
      // DOM 是唯一数据源：直接持久化当前内容，禁止与旧快照拼接（拼接会导致消息重复）
      // 含 base64 图片的大内容只写 IndexedDB（异步、不阻塞主线程），避免 localStorage 同步写入卡顿/超限
      var hasBig=html.indexOf("data:image")>=0&&html.length>200000;
      if(!hasBig){
        try{localStorage.setItem("akini_chat_history_"+ac,html);}catch(e){}
      }
      if(window._idbStore&&window._idbStore.set){window._idbStore.set("akini_chat_history_"+ac,html);}
      if(window.akiniContacts&&window.akiniContacts.updateSession){window.akiniContacts.updateSession(ac,{messagesHTML:html});}
      /* 已移除「全量快照 akini_localstorage_snapshot」写入：
         它与专属主键/备份键重复存同一份数据，是储存越用越大（同一张图存 4~5 遍）的主要来源。 */
      _chatDirty=false;
    }catch(e){console.warn("[patch] save chat",e);}
  }
  function _saveIcity(){
    try{
      // 合并内存中的 F 与 localStorage，避免旧数据覆盖新评论
      try{
        if(typeof F!=="undefined"&&F){
          var lsF=localStorage.getItem("akini_icity_diaries")||localStorage.getItem("akini_icity_diaries_backup")||"[]";
          var arrF=[];try{arrF=JSON.parse(lsF)}catch(e){arrF=[]}
          if(!Array.isArray(arrF))arrF=[];
          var map={};
          arrF.forEach(function(d){if(d&&d.id)map[d.id]=d;});
          F.forEach(function(d){if(d&&d.id){var old=map[d.id];if(old){var oc=old.comments||[];var nc=d.comments||[];var cm={};oc.forEach(function(c){var k=(c.ts||0)+"_"+(c.text||"")+"_"+(c.author||"");cm[k]=c;});nc.forEach(function(c){var k=(c.ts||0)+"_"+(c.text||"")+"_"+(c.author||"");if(!cm[k])cm[k]=c;});d.comments=Object.keys(cm).map(function(k){return cm[k];}).sort(function(a,b){return (a.ts||0)-(b.ts||0);});}map[d.id]=d;}});
          F=Object.keys(map).map(function(k){return map[k];});
          var fjson=JSON.stringify(F);
          localStorage.setItem("akini_icity_diaries",fjson);
          if(window._idbStore&&window._idbStore.set){
            window._idbStore.set("akini_icity_diaries",fjson);
          }
        }
      }catch(e){}
      var icityKeys=["akini_icity_diaries","akini_icity_comments","akini_icity_my_nick","akini_icity_my_handle","akini_icity_my_bio","akini_icity_my_avatar","akini_icity_my_bg","akini_icity_ta_nick","akini_icity_ta_handle","akini_icity_ta_avatar","akini_icity_ta_bg"];
      for(var ki=0;ki<icityKeys.length;ki++){
        var k=icityKeys[ki];
        var val=localStorage.getItem(k);
        if(val){
          /* 只保留主键：不再写 k+"_backup" 与全量快照这两层重复副本 */
          if(window._idbStore&&window._idbStore.set){
            window._idbStore.set(k,val);
          }
        }
      }
    }catch(e){}
  }
  // 聊天保存已由 chatBody MutationObserver 变化即触发（防抖 1.5s）；
  // iCity 备份由 visibilitychange/beforeunload/pagehide 的 _flushAll 负责。
  // 删除 20s _ctTick 轮询。
  function _flushAll(){_saveChat();_saveIcity();}
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){ setTimeout(_flushAll,0); }
  });
  window.addEventListener("beforeunload",function(){setTimeout(_flushAll,0);});
  window.addEventListener("pagehide",function(){setTimeout(_flushAll,0);});
})();
