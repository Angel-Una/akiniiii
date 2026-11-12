(function(){
 var PROB_KEYS = {
   emoji: 'akini_prob_emoji', quote: 'akini_prob_quote', poke: 'akini_prob_poke', noReply: 'akini_prob_noReply', replyCall: 'akini_prob_replyCall',
   missCall: 'akini_prob_missCall', answerCall: 'akini_prob_answerCall', incomingCall: 'akini_prob_incomingCall',
   refundTransfer: 'akini_prob_refundTransfer', collectTransfer: 'akini_prob_collectTransfer',
   meaningfulNumber: 'akini_prob_meaningfulNumber', taTransfer: 'akini_prob_taTransfer',
   groupCall: 'akini_prob_groupCall', groupAtMe: 'akini_prob_groupAtMe', groupAtOther: 'akini_prob_groupAtOther',
   groupTransferOther: 'akini_prob_groupTransferOther', groupTransferMe: 'akini_prob_groupTransferMe',
   replySticker: 'akini_prob_replySticker', pinyinCard: 'akini_prob_pinyinCard', emojiMixMsg: 'akini_prob_emojiMixMsg', postWithSticker: 'akini_prob_postWithSticker', surveyInvite: 'akini_prob_surveyInvite', shopCard: 'akini_prob_shopCard',
 };
 var DEFAULT_PROBS = {
   emoji: 20, quote: 30, poke: 3, noReply: 10, replyCall: 10,
   missCall: 15, answerCall: 85, incomingCall: 10,
   refundTransfer: 30, collectTransfer: 70,
   meaningfulNumber: 15, taTransfer: 7,
   groupCall: 15, groupAtMe: 15, groupAtOther: 5,
   groupTransferOther: 15, groupTransferMe: 15,
   replySticker: 20, pinyinCard: 35, emojiMixMsg: 20, postWithSticker: 10, surveyInvite: 20, shopCard: 20,
 };
 /* zzza→v685：已读不回默认概率维持 10% 不变。'2' 是 v684 误迁移出的值，启动对账后统一迁回 '10'（三处副本） */
 var __migrateNoReply = function () {
   try {
     var cur = localStorage.getItem('akini_prob_noReply');
     if (cur === '2' || cur === '20') {
       localStorage.setItem('akini_prob_noReply', '10');
       if (window._idbStore && window._idbStore.set) {
         window._idbStore.set('akini_prob_noReply', '10');
         window._idbStore.set('akini_prob_noReply_backup', '10');
       }
     }
   } catch(e){}
 };
 __migrateNoReply();
 setTimeout(__migrateNoReply, 4000);
 setTimeout(__migrateNoReply, 9000);
 try {
   if (localStorage.getItem("akini_toggle_contactTransferToggle") === null) {
     localStorage.setItem("akini_toggle_contactTransferToggle", "1");
   }
 } catch(e){}
 var TIME_KEYS = {
   reply: ['akini_time_reply_start','akini_time_reply_end'],
   mail: ['akini_time_mail_start','akini_time_mail_end'],
   activeMsg: ['akini_time_activemsg_start','akini_time_activemsg_end'],
   friends: ['akini_time_friends_start','akini_time_friends_end'],
   icity: ['akini_time_icity_start','akini_time_icity_end']
 };
 function lsGet(k, def){ try { var v=localStorage.getItem(k); return v!==null?v:def; } catch(e){ return def; } }
 function lsSet(k, v){
   try { localStorage.setItem(k, v); } catch(e){}
   try { if (window._idbStore && window._idbStore.set) window._idbStore.set(k, v); } catch(e){}
 }
 function clamp(n, min, max){ return Math.max(min, Math.min(max, parseFloat(n)||0)); }
 function getProb(key){
   if (key === 'sticker') key = 'emoji';
   if (key === 'noReply') {
     if (lsGet('akini_toggle_readNoReplyToggle', '0') !== '1') return 0;
   }
   if (key === 'quote') {
     if (lsGet('akini_toggle_quoteReplyToggle', '0') !== '1') return 0;
   }
   var v = parseFloat(lsGet(PROB_KEYS[key], DEFAULT_PROBS[key]));
   if (isNaN(v)) v = DEFAULT_PROBS[key];
   return clamp(v, 0, 100) / 100;
 }
 function getTimeRange(key){
   var r = TIME_KEYS[key];
   return { start: lsGet(r[0], '00:00'), end: lsGet(r[1], '00:00') };
 }
 function isInTimeRange(key){
   var toggleMap = {reply:'contactReplyToggle',mail:'contactMailToggle',activeMsg:'contactActiveMsgToggle',friends:'contactFriendsToggle',icity:'contactIcityToggle'};
   var toggleKey = toggleMap[key];
   if (toggleKey && lsGet('akini_toggle_' + toggleKey, '') === '0') return false;
   var r = getTimeRange(key);
   var now = new Date();
   var cur = now.getHours() * 60 + now.getMinutes();
   var parts = r.start.split(':'); var start = parseInt(parts[0])*60 + parseInt(parts[1]||0);
   var parts2 = r.end.split(':'); var end = parseInt(parts2[0])*60 + parseInt(parts2[1]||0);
   if (start === 0 && end === 0) return true;
   if (start <= end) return cur >= start && cur <= end;
   return cur >= start || cur <= end;
 }
 function pickReplyBehavior(){
   // 1. “已读不回”：严格仅在开关明确开启（=1）且命中概率时触发；已读不回概率为0或开关关闭绝不触发
   var noReplyProb = getProb('noReply');
   if (noReplyProb > 0 && Math.random() < noReplyProb) {
     console.log('[pickReplyBehavior] 已读不回命中');
     return {type:'none', extra:{}};
   }
   // 2. 表情包/转账/拍一拍/电话按各自概率独立触发
   var transferSwitch = lsGet('akini_toggle_contactTransferToggle', null);
   var isTransferOn = transferSwitch === null ? true : transferSwitch === '1';
   var extra = {
     transfer: isTransferOn && (Math.random() < getProb('taTransfer')),
     sticker:  Math.random() < (getProb('emoji') || 0.15),
     quote:    Math.random() < getProb('quote'),
     poke:     Math.random() < getProb('poke'),
     call:     Math.random() < getProb('replyCall'),
     emojiMix: lsGet('akini_toggle_emojiMixToggle', '0') === '1'
   };
   console.log('[pickReplyBehavior] 文字回复 + 附加', JSON.stringify(extra));
   return {type:'text', extra: extra};
 }
 // UI bindings
 /* v898：概率调整独立页开关（与设置页互斥显示，hideAll 已收录防 overlay 残留） */
 window.__openProbArea = function(){
   try {
     var sa = document.getElementById('settingsArea'), pa = document.getElementById('akiniProbArea');
     if(sa) sa.style.display = 'none';
     if(pa) pa.style.display = 'flex';
   } catch(e){}
 };
 window.__closeProbArea = function(){
   try {
     var sa = document.getElementById('settingsArea'), pa = document.getElementById('akiniProbArea');
     if(pa) pa.style.display = 'none';
     if(sa) sa.style.display = 'flex';
   } catch(e){}
 };
 function bindProbInput(id, key){
   var el = document.getElementById(id);
   if (!el) return;
   el.value = lsGet(PROB_KEYS[key], DEFAULT_PROBS[key]);
   el.addEventListener('change', function(){ lsSet(PROB_KEYS[key], clamp(el.value,0,100)); });
   el.addEventListener('input', function(){ lsSet(PROB_KEYS[key], clamp(el.value,0,100)); });
 }
 function bindTimeInput(id, key, idx){
   var el = document.getElementById(id);
   if (!el) return;
   el.value = lsGet(TIME_KEYS[key][idx], idx===0?'08:00':'23:00');
   el.addEventListener('change', function(){ lsSet(TIME_KEYS[key][idx], el.value); });
 }
 function resetProbDefaultsIfNeeded(){
   try {
     var CURR = 'v20260929zzzs';
     if (localStorage.getItem('akini_prob_version') === CURR) return;
     lsSet('akini_prob_version', CURR);
     // 本版重置回复相关概率为新默认值（用户指定）
     var RESET_KEYS = ['noReply','taTransfer','emoji','quote','poke','replyCall'];
     for (var k in DEFAULT_PROBS) {
       if (DEFAULT_PROBS.hasOwnProperty(k)) {
         if (RESET_KEYS.indexOf(k) >= 0) {
           lsSet(PROB_KEYS[k], DEFAULT_PROBS[k]);
         } else if (localStorage.getItem(PROB_KEYS[k]) === null) {
           lsSet(PROB_KEYS[k], DEFAULT_PROBS[k]);
         }
       }
     }
     console.log('[Akini] 概率默认值已重置(v20260810m):', DEFAULT_PROBS);
   } catch(e){ console.warn('resetProbDefaults error:', e); }
 }
 document.addEventListener('DOMContentLoaded', function(){
   resetProbDefaultsIfNeeded();
   bindProbInput('probEmoji','emoji'); bindProbInput('probQuote','quote'); bindProbInput('probPoke','poke'); bindProbInput('probNoReply','noReply');
   bindProbInput('probMissCall','missCall'); bindProbInput('probAnswerCall','answerCall'); bindProbInput('probIncomingCall','incomingCall');
   bindProbInput('probRefundTransfer','refundTransfer'); bindProbInput('probCollectTransfer','collectTransfer');
   bindProbInput('probMeaningfulNumber','meaningfulNumber');
   bindProbInput('probReplySticker','replySticker'); bindProbInput('probPinyinCard','pinyinCard'); bindProbInput('probEmojiMixMsg','emojiMixMsg'); bindProbInput('probPostWithSticker','postWithSticker'); bindProbInput('probSurveyInvite','surveyInvite'); bindProbInput('probShopCard','shopCard');
   bindProbInput('probGroupCall','groupCall'); bindProbInput('probGroupAtMe','groupAtMe'); bindProbInput('probGroupAtOther','groupAtOther'); bindProbInput('probTaTransfer','taTransfer');
   bindProbInput('probGroupTransferOther','groupTransferOther'); bindProbInput('probGroupTransferMe','groupTransferMe');
   bindTimeInput('timeReplyStart','reply',0); bindTimeInput('timeReplyEnd','reply',1);
   bindTimeInput('timeMailStart','mail',0); bindTimeInput('timeMailEnd','mail',1);
   bindTimeInput('timeActiveMsgStart','activeMsg',0); bindTimeInput('timeActiveMsgEnd','activeMsg',1);
   bindTimeInput('timeFriendsStart','friends',0); bindTimeInput('timeFriendsEnd','friends',1);
   bindTimeInput('timeIcityStart','icity',0); bindTimeInput('timeIcityEnd','icity',1);
 });
 /* 合并而非覆盖：main.js 先行定义了完整版 AKR（含 getReplyCount/isUserPresent/isAppActive 等），
    此处直接覆盖会让回复生成函数调用 getReplyCount 抛 TypeError 被 try 吞掉，
    导致表情包/引用回复/多连发整条路径静默失效。缺少的方法从旧对象继承。 */
 var _prevAKR = window.AKR || {};
 window.AKR = { getProb: getProb, getTimeRange: getTimeRange, isInTimeRange: isInTimeRange, pickReplyBehavior: pickReplyBehavior };
 for (var _k in _prevAKR) {
   if (_prevAKR.hasOwnProperty(_k) && typeof _prevAKR[_k] === 'function' && typeof window.AKR[_k] !== 'function') {
     window.AKR[_k] = _prevAKR[_k];
   }
 }
 if (typeof window.AKR.getReplyCount !== 'function') {
   window.AKR.getReplyCount = function(){ var r = Math.random(); return r < 0.75 ? 1 : r < 0.95 ? 2 : 3; };
 }
})();