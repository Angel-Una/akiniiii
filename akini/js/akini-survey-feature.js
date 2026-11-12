
localStorage.removeItem("akini_surveys");
     localStorage.removeItem("akini_surveys_backup");
   }catch(e){ console.error("[survey] migrateOldSurveys error", e); }
 }
 // 兜底：从聊天记录中的 survey-bubble 恢复问卷数据
 // 解决旧版本/缓存异常导致 akini_surveys 为空但聊天中仍有问卷卡片的场景
 // zzzq 20260918加会话级缓存——同一会话 HTML 未变化时跳过重复全量解析，
 // 防止大聊天记录被反复 innerHTML 解析导致主线程长时间阻塞（iOS 卡崩元凶）
 var __surveyRecoverCache = {};
 function recoverSurveysFromChat(chatId){
   try{
     if(!window.akiniContacts || !window.akiniContacts.getContacts) return;

var cm = (countEl.textContent || "").match(/(\d+)/);
           if(cm) qCount = parseInt(cm[1], 10) || 1;
         }
         /* 撤raw读取，恢复直接重建残缺问卷兜底（结构由消毒函数另行修复） */
         var q = { text: qText.replace(/^问题：/, "").trim() || "问卷", options: [] };
         var s = {

return;
   }
   loadSurveys(chatId);
   var chatSurveys = surveys.slice().filter(function(s){ return !s.deleted; });
   /* zzzq 20260918聊天记录大时 recoverSurveysFromChat 的全量 innerHTML 解析会长时间阻塞主线程，
      iOS Watchdog 直接杀进程（发送问卷卡崩的元凶之一）。改为仅当问卷列表为空时才做恢复兜底。 */
   if(chatSurveys.length === 0){
     recoverSurveysFromChat(chatId);
     chatSurveys = surveys.slice().filter(function(s){ return !s.deleted; });
   }

});
     // 持久化卡片状态：只对聊天历史字符串做定点替换，绝不整包重写会话（防聊天记录被覆盖丢失）
     try {
       var survey = (typeof surveys !== "undefined" ? surveys.find(function(x){ return x.id === surveyId; }) : null);
       var chatId2 = (survey && survey.targetId) || (window.akiniContacts && window.akiniContacts.getActiveChatId ? window.akiniContacts.getActiveChatId() : "ta");
       /* zzzq 20260918[^]*? 无距离上限，在大聊天记录上跨卡片回溯会阻塞主线程（卡崩元凶）。
          问卷卡片从 data-survey-id 到 status 的 HTML 距离固定几百字符，限定 1500 内匹配即可 */
       var rx = new RegExp('(data-survey-id="' + surveyId + '"[\\s\\S]{0,1500}?survey-bubble-status">)[^<]*');