if(_iconPlaceholder)_iconPlaceholder.style.display='none';
         if(_iconForm)_iconForm.value=finalUrl;
       });
     };
     reader.readAsDataURL(file);
   });
 }
 /* 添加商品 */
 var ab=document.getElementById('shopAddProductBtn');
 if(ab)ab.addEventListener('click',function(){
   _cur=null;
   ['shopFormName','shopFormPrice','shopFormDesc'].forEach(function(id){
     var e=document.getElementById(id);if(e)e.value='';
   });
   if(_iconForm)_iconForm.value='';
   if(_iconPreview){_iconPreview.src='';_iconPreview.style.display='none';}
   if(_iconPlaceholder)_iconPlaceholder.style.display='flex';
   if(_iconFileInput)_iconFileInput.value='';
   var o=document.getElementById('shopAddOverlay');if(o)o.style.display='flex';
 });
 window.__shopAddProduct=function(){
   _cur=null;
   ['shopFormName','shopFormPrice','shopFormDesc'].forEach(function(id){
     var e=document.getElementById(id);if(e)e.value='';
   });
   if(_iconForm)_iconForm.value='';
   if(_iconPreview){_iconPreview.src='';_iconPreview.style.display='none';}
   if(_iconPlaceholder)_iconPlaceholder.style.display='flex';