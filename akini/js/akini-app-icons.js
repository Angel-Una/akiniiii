      if(!AKINI_PENDING_VAL){
        alert('请先上传图片或输入 Emoji，并等预览显示新图标后再点保存');
        return;
      }
      if(AKINI_PENDING_VAL){
        var key='akini_app_icon_'+AKINI_EDITING_ID;
        var saved=false;
        var dropTomb = function(){
          try{localStorage.removeItem('akini_app_icon_tomb_'+AKINI_EDITING_ID);}catch(e){}
        };
        try{
          localStorage.setItem(key,AKINI_PENDING_VAL);
          saved=true;
        }catch(e){}
        if(!saved){
          try{
            for(var k=localStorage.length-1;k>=0;k--){
              var rk=localStorage.key(k);
              if(!rk||rk===key)continue;
              if(/^akini_stickers/.test(rk)||/^akini_chat_bg_/.test(rk)||/^akini_icity_ta_bg_/.test(rk)||rk==='akini_localstorage_snapshot'){
                localStorage.removeItem(rk);
              }
            }
            localStorage.setItem(key,AKINI_PENDING_VAL);
            saved=true;
          }catch(e){}
        }
        if(!saved){
          try{
            for(var k2=localStorage.length-1;k2>=0;k2--){
              var rk2=localStorage.key(k2);
              if(!rk2||rk2===key)continue;
              if(/^akini_app_icon_/.test(rk2)){
                localStorage.removeItem(rk2);
              }
            }
            localStorage.setItem(key,AKINI_PENDING_VAL);
            saved=true;
          }catch(e){}
        }
        dropTomb();
        try{if(window._idbStore&&window._idbStore.set){window._idbStore.set(key,AKINI_PENDING_VAL);}}catch(e){}
        try{
          if(AKINI_PENDING_VAL.length < 90000){
            localStorage.setItem('akini_iconvault_'+AKINI_EDITING_ID,AKINI_PENDING_VAL);
          }
        }catch(eV){}
        applyAppIcon(AKINI_EDITING_ID,AKINI_PENDING_VAL);