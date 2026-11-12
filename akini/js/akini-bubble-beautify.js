if(!saved||saved==="null"||saved==="undefined"||!saved.trim()||saved.trim()==="null"||saved.trim()==="undefined")saved="";
 if(input)input.value=saved;
 applyCss(saved);
 /* localStorage 可能因配额丢失，从 IndexedDB 兜底恢复气泡 CSS */
 if(!saved && window._idbStore && window._idbStore.get){
   window._idbStore.get(KEY,function(v){
     if(v&&v!=="null"&&v!=="undefined"&&v.trim()&&v.trim()!=="null"&&v.trim()!=="undefined"){
       if(input)input.value=v;
       applyCss(v);
       try{localStorage.setItem(KEY,v);}catch(e){}
     }
   });
   /* 主键是脏值/空时，备份键也可能有好内容，一并兜底 */
   window._idbStore.get(KEY+"_backup",function(v){
     if(v&&v!=="null"&&v!=="undefined"&&v.trim()&&v.trim()!=="null"&&v.trim()!=="undefined"){
       var cur=localStorage.getItem(KEY)||"";