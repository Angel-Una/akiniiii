/* 本文件：toast 提示 + 全局异常/拒绝兜底。
  纪念日底图已由 akini-image-upload.js 统一接管。 */
(function(){
 /* toast 桥（main.js 先加载 __akiniToast 已存在；自绘兜底双保险） */
 function __fallbackToast(msg){
   try {
     var t = document.createElement('div');
     t.textContent = String(msg);
     t.style.cssText = 'position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:9900;background:rgba(0,0,0,.78);color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;max-width:80vw;box-shadow:0 4px 16px rgba(0,0,0,.3);transition:opacity .3s;';