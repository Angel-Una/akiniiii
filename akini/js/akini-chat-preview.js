function savePreviewBubbles(){if(leftB)try{localStorage.setItem(BUBBLE_LEFT_KEY,leftB.textContent.trim())}catch(e){}if(rightB)try{localStorage.setItem(BUBBLE_RIGHT_KEY,rightB.textContent.trim())}catch(e){}applyPreviewWrap(leftB);applyPreviewWrap(rightB);}
   function bindBubble(b){
     if(!b)return;
     // 移动端/触摸屏点击兜底：确保点中气泡即可调起输入法与进入编辑态
     b.addEventListener("click",function(e){