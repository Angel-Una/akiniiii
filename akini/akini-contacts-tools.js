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
 function _scheduleSaveChat(delay){
   if(_saveChatTimer)return;
   _saveChatTimer=setTimeout(function(){
     _saveChatTimer=null;_saveChat();
   },delay||1500);