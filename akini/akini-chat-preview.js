(function(){
 try{
   ["akini_preview_bubble_left","akini_preview_bubble_right","akini_my_avatar","akini_ta_avatar","akini_icity_my_avatar","akini_icity_ta_avatar"].forEach(function(k){
     var _v=localStorage.getItem(k);
     if(_v==="null"||_v==="undefined")localStorage.removeItem(k);
   });
 }catch(e){}
 const KEY = "akini_preview_contact_id";
 const BUBBLE_LEFT_KEY = "akini_preview_bubble_left";
 const BUBBLE_RIGHT_KEY = "akini_preview_bubble_right";
 const LYRIC_TITLE_KEY = "akini_lyric_title";
 const LYRIC_ARTIST_KEY = "akini_lyric_artist";
 const LYRIC_QUOTE_KEY = "akini_lyric_quote";
 const DEFAULT_LEFT = "";
 const DEFAULT_RIGHT = "";
 const LYRIC_TITLE_DEFAULT = "罗生门";
 const LYRIC_ARTIST_DEFAULT = "张子豪";
 const LYRIC_QUOTE_DEFAULT = "想知道你会不会太冷";
 function $(id){ return document.getElementById(id); }
 function __akiniIsDefAv(s){
   if(s==null)return true;
   s=String(s).trim();
   if(!s||s==="null"||s==="undefined")return true;
   s=s.replace(/️/g,"");
   if(s==="👤"||s==="🐰"||s==="🐱")return true;
   var a=Array.from(s);
   return a.length<=2&&!/^[a-zA-Z0-9一-鿿]+$/.test(s);
 }
window.__akiniLineAvatarImg=window.__akiniLineAvatarImg||function(){var u="data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f7f8fa"/><circle cx="40" cy="29" r="14" fill="none" stroke="#5a5e66" stroke-width="1.5"/><path d="M12 76c4-17 14-26 28-26s24 9 28 26" fill="none" stroke="#5a5e66" stroke-width="1.5" stroke-linecap="round"/></svg>');return '<img src="'+u+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';};
function __akiniAvOrLine(v){return __akiniIsDefAv(v)?window.__akiniLineAvatarImg():v;}
function it(t,e){
 if(e=e||"",!t||"string"!=typeof t)return __akiniAvOrLine(e);
 t=t.trim();
 if(!t||t==="null"||t==="undefined")return __akiniAvOrLine(e);
 if(0===t.indexOf("<img")){var n=t.match(/src="([^"]*)"/);if(!n||!n[1])return __akiniAvOrLine(e);t=n[1]}
 return 0===t.indexOf("data:")||0===t.indexOf("http")?'<img src="'+t.replace(/"/g,"&quot;")+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">':__akiniAvOrLine(t)
}
 window.getMyAvatar=window.getMyAvatar||function getMyAvatar(){
   function memGet(k){try{if(window.akiniStore&&window.akiniStore.memoryGet)return window.akiniStore.memoryGet(k);}catch(e){}return null;}
   var n=memGet("akini_my_avatar")||memGet("akini_icity_my_avatar")||localStorage.getItem("akini_my_avatar")||localStorage.getItem("akini_icity_my_avatar")||"";
   if(n)return it(n,"🐱");const t=window.__akiniAvatarCache?window.__akiniAvatarCache.my:"";if(t)return it(t,"🐱");return window.__akiniLineAvatarImg();
 };
 window.getTaAvatar=window.getTaAvatar||function getTaAvatar(id){
   function memGet(k){try{if(window.akiniStore&&window.akiniStore.memoryGet)return window.akiniStore.memoryGet(k);}catch(e){}return null;}
   if(id && window.akiniContacts && window.akiniContacts.getChatTarget){
     var ct = window.akiniContacts.getChatTarget(id);
     if(ct && ct.avatar) return it(ct.avatar, window.__akAvatarPH||"");
   }
   var active = window.akiniContacts && window.akiniContacts.getActiveChatId ? window.akiniContacts.getActiveChatId() : "";
   if(active && window.akiniContacts && window.akiniContacts.getChatTarget){
     var act = window.akiniContacts.getChatTarget(active);
     if(act && act.avatar) return it(act.avatar, window.__akAvatarPH||"");
   }
   var n = memGet("akini_ta_avatar")||memGet("akini_icity_ta_avatar")||localStorage.getItem("akini_ta_avatar")||localStorage.getItem("akini_icity_ta_avatar");
   if(n) return it(n, window.__akAvatarPH||"");
   const t = window.__akiniAvatarCache ? window.__akiniAvatarCache.ta : "";
   if(t) return it(t, window.__akAvatarPH||"");
   return window.__akiniLineAvatarImg();
 };
 window.getContacts=function getContacts(){
   if(window.akiniContacts && window.akiniContacts.getContacts){
     var api = window.akiniContacts.getContacts();
     if(Array.isArray(api) && api.length) return api;
   }
   try{
     var ls = JSON.parse(localStorage.getItem("akini_contacts")||"[]");
     if(Array.isArray(ls) && ls.length) return ls;
   }catch(e){}
   return [];
 };
 function getSelectedContactId(){var contacts=getContacts();if(!contacts.length)return null;var saved="";try{saved=localStorage.getItem(KEY)||""}catch(e){}var exists=contacts.some(function(c){return c.id===saved});if(exists)return saved;var def=contacts.find(function(c){return c.isDefault});if(!def&&contacts.length)def=contacts[0];if(def){try{localStorage.setItem(KEY,def.id)}catch(e){}return def.id}return null;}
 function getContactById(id){
   if(window.akiniContacts && window.akiniContacts.getChatTarget){
     var api=window.akiniContacts.getChatTarget(id);
     if(api)return api;
   }
   var contacts=getContacts();
   for(var i=0;i<contacts.length;i++)if(contacts[i].id===id)return contacts[i];
   return null;
 }
 window.__akAvatarPH=(window.__akiniLineAvatarImg?window.__akiniLineAvatarImg():'')||'<span style="display:inline-flex;width:100%;height:100%;align-items:center;justify-content:center;background:#ececec;border-radius:50%"></span>';
 function isSwapped(){var t=localStorage.getItem("akini_swap_avatar_pos");return"true"===t||"1"===t}
 function updatePreview(){
   var id=getSelectedContactId();
   var contact=null;
   if(id)contact=getContactById(id);
   var contactAvatar=contact && contact.avatar ? it(contact.avatar,window.__akAvatarPH||"") : (id?window.getTaAvatar(id):it(localStorage.getItem("akini_ta_avatar")||"",window.__akAvatarPH||""));
   var myAvatar=getMyAvatar();
   var swapped=isSwapped();
   var leftA=$("previewAvatarLeft");
   if(leftA)leftA.innerHTML=swapped?contactAvatar:myAvatar;
   var rightA=$("previewAvatarRight");
   if(rightA)rightA.innerHTML=swapped?myAvatar:contactAvatar;
 }
 function updateSelectOptions(){var sel=$("selectChatPreviewContact");if(!sel)return;var prev=sel.value;sel.innerHTML="";var contacts=getContacts();if(!contacts.length)return;contacts.forEach(function(c){var opt=document.createElement("option");opt.value=c.id;opt.textContent=c.name||"对方";sel.appendChild(opt);});var id=getSelectedContactId();var exists=contacts.some(function(c){return c.id===id});sel.value=exists?id:(prev&&contacts.some(function(c){return c.id===prev})?prev:(contacts[0]&&contacts[0].id));if(sel.value){try{localStorage.setItem(KEY,sel.value)}catch(e){}}}
 function applyPreviewWrap(b){if(!b)return;b.classList.add("no-wrap");var _t=(b.textContent||"").trim();b.classList.toggle("is-empty",!_t);}
 /* 预览气泡硬性限制：去换行、最多 8 个字，截断后光标移到末尾 */
 function clampPreviewBubble(b){
   if(!b)return false;
   if(b.__composing)return false;/* 中文输入法组合期间绝不动 DOM，否则正在输入的文字会被吃掉 */
   var t=(b.textContent||"").replace(/[\r\n]+/g,"");
   if(t.length>8)t=t.slice(0,8);
   if(t!==(b.textContent||"")){
     b.textContent=t;
     applyPreviewWrap(b);
     try{var r=document.createRange();r.selectNodeContents(b);r.collapse(false);var s=window.getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}
     return true;
   }
   return false;
 }
 function cleanPreviewText(v){if(!v||v==="null"||v==="undefined")return "";return String(v).replace(/[\r\n]+/g,"").slice(0,8);}
 function updatePreviewBubbles(){var leftB=$("previewBubbleLeft");var rightB=$("previewBubbleRight");if(leftB){var v=localStorage.getItem(BUBBLE_LEFT_KEY);if(v==="null"||v==="undefined"){try{localStorage.removeItem(BUBBLE_LEFT_KEY);}catch(e){}v=null;}leftB.textContent=cleanPreviewText(v);if(!leftB.textContent.trim())leftB.textContent=DEFAULT_LEFT;}if(rightB){var v2=localStorage.getItem(BUBBLE_RIGHT_KEY);if(v2==="null"||v2==="undefined"){try{localStorage.removeItem(BUBBLE_RIGHT_KEY);}catch(e){}v2=null;}rightB.textContent=cleanPreviewText(v2);if(!rightB.textContent.trim())rightB.textContent=DEFAULT_RIGHT;}applyPreviewWrap(leftB);applyPreviewWrap(rightB);}
 function updateLyricCard(){var t=$("lyricTitle");var a=$("lyricArtist");var q=$("lyricQuote");if(t){var v=localStorage.getItem(LYRIC_TITLE_KEY);t.textContent=v||LYRIC_TITLE_DEFAULT;}if(a){var v=localStorage.getItem(LYRIC_ARTIST_KEY);a.textContent=v||LYRIC_ARTIST_DEFAULT;}if(q){var v=localStorage.getItem(LYRIC_QUOTE_KEY);q.textContent=v||LYRIC_QUOTE_DEFAULT;}}
 function saveLyricCard(){var t=$("lyricTitle");var a=$("lyricArtist");var q=$("lyricQuote");try{if(t)localStorage.setItem(LYRIC_TITLE_KEY,t.textContent.trim());if(a)localStorage.setItem(LYRIC_ARTIST_KEY,a.textContent.trim());if(q)localStorage.setItem(LYRIC_QUOTE_KEY,q.textContent.trim());}catch(e){}}
 function resetLyricCard(){try{localStorage.removeItem(LYRIC_TITLE_KEY);localStorage.removeItem(LYRIC_ARTIST_KEY);localStorage.removeItem(LYRIC_QUOTE_KEY);}catch(e){}updateLyricCard();}
 document.addEventListener("DOMContentLoaded",function(){
   updateSelectOptions();
   updatePreviewBubbles();
   updateLyricCard();
   updatePreview();
   setInterval(function(){
     try{
       if(document.hidden) return;
       var ba=document.getElementById("beautifyArea");
       if(!ba || ba.style.display==="none") return;
       var cs=getContacts();
       var sel=$("selectChatPreviewContact");
       if(!sel)return;
       updateSelectOptions();
       updatePreview();
     }catch(e){}
   },3000);
   var sel=$("selectChatPreviewContact");if(sel){sel.addEventListener("change",function(){var id=sel.value;localStorage.setItem(KEY,id);updatePreview();});}
   var leftB=$("previewBubbleLeft");var rightB=$("previewBubbleRight");
   function savePreviewBubbles(){if(leftB)try{localStorage.setItem(BUBBLE_LEFT_KEY,leftB.textContent.trim())}catch(e){}if(rightB)try{localStorage.setItem(BUBBLE_RIGHT_KEY,rightB.textContent.trim())}catch(e){}applyPreviewWrap(leftB);applyPreviewWrap(rightB);}
   function bindBubble(b){
     if(!b)return;
     // 移动端/触摸屏点击兜底：确保点中气泡即可调起输入法与进入编辑态
     b.addEventListener("click",function(e){
       try{
         if(document.activeElement!==b){
           b.focus();
           var r=document.createRange();
           r.selectNodeContents(b);
           r.collapse(false);
           var s=window.getSelection();
           if(s){s.removeAllRanges();s.addRange(r);}
         }
       }catch(err){}
     });
     b.addEventListener("blur",savePreviewBubbles);
     b.addEventListener("focusout",savePreviewBubbles);
     b.addEventListener("compositionstart",function(){b.__composing=true;});
     b.addEventListener("compositionend",function(){b.__composing=false;clampPreviewBubble(b);savePreviewBubbles();});
     b.addEventListener("input",function(){if(b.__composing)return;clampPreviewBubble(b);savePreviewBubbles();});
     b.addEventListener("keyup",function(){if(b.__composing)return;clampPreviewBubble(b);savePreviewBubbles();});
     // beforeinput：iOS 部分输入法换行不触发 keydown，必须在这里拦截插入段落/换行
     b.addEventListener("beforeinput",function(e){
       try{
         var it=e&&e.inputType||"";
         if(it==="insertParagraph"||it==="insertLineBreak"){e.preventDefault();b.blur();return;}
         if(it==="insertText"&&e.data&&/[\r\n]/.test(e.data)){e.preventDefault();return;}
       }catch(x){}
     });
     b.addEventListener("paste",function(e){try{e.preventDefault();var t=(e.clipboardData||window.clipboardData).getData("text")||"";t=t.replace(/[\r\n]+/g,"").slice(0,8);document.execCommand("insertText",false,t);}catch(x){}clampPreviewBubble(b);savePreviewBubbles();});
     b.addEventListener("keydown",function(e){
       if(e.key==="Enter"){e.preventDefault();b.blur();return;}
       // 已达 8 字且未选中任何文字时，禁止继续输入可打印字符
       if(e.key&&e.key.length===1&&!e.ctrlKey&&!e.metaKey){
         var t=(b.textContent||"");
         var sel=window.getSelection&&window.getSelection();
         var hasSel=sel&&!sel.isCollapsed;
         if(t.length>=8&&!hasSel)e.preventDefault();
       }
     });
     clampPreviewBubble(b);
   }
   bindBubble(leftB);
   bindBubble(rightB);
   var lyricT=$("lyricTitle");var lyricA=$("lyricArtist");var lyricQ=$("lyricQuote");var lyricR=$("lyricResetBtn");
   [lyricT,lyricA,lyricQ].forEach(function(el){if(el){el.addEventListener("blur",saveLyricCard);el.addEventListener("input",saveLyricCard);el.addEventListener("keyup",saveLyricCard);el.addEventListener("paste",saveLyricCard);el.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();el.blur();}});}});
   if(lyricR){lyricR.addEventListener("click",function(e){resetLyricCard();});}
   window.addEventListener("beforeunload",function(){savePreviewBubbles();saveLyricCard();});
   window.addEventListener("pagehide",function(){savePreviewBubbles();saveLyricCard();});
   document.addEventListener("visibilitychange",function(){if("hidden"===document.visibilityState){savePreviewBubbles();saveLyricCard();}});
   /* v1231：原来是每 10 秒无条件写 5 个 localStorage 键（同步 IO）。
      美化面板没打开时内容不会变，改成 60 秒 + 仅在面板可见时写入。 */
   setInterval(function(){
     if(document.hidden) return;
     var ba=document.getElementById("beautifyArea");
     if(!ba || ba.style.display==="none") return;
     savePreviewBubbles(); saveLyricCard();
   },60000);
   /* v1231：删掉了"全页任意 click / scroll 都写 5 个 localStorage 键"的两个监听。
      这两个气泡和歌词本身都有 input/blur/paste 保存，全局监听属于重复写入——
      滚动时每 500ms 同步写一次 localStorage 正是明显的掉帧来源。 */
 });
})();