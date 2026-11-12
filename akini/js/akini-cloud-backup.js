
try { cloud = JSON.parse(rows[0].payload); } catch (e) { return; }
       if (!cloud || typeof cloud !== "object") return;
       var cloudKeys = Object.keys(cloud);
       _cloudKeyCount = cloudKeys.length;
       var missing = [];
       /* 图像键回退修复：大图像键(头像/背景)不进 localStorage，启动早期(本地对账
          restoreAll 未完成)时 LS+内存均为空——原逻辑在此刻误判"本地缺失"并回填云端
          【旧值】，随后旧值被巩固进三层，新头像被永久覆盖(回退根因)。
          修复：图像键全部进入延迟批，等 window.__akiniStorageRestored(对账完成)后再判断。 */
       var pendingImgs = [];
       cloudKeys.forEach(function (k) {
         if (!(cloud[k] && cloud[k] !== "null" && cloud[k] !== "undefined")) return;
         var _isImg = !!(window.__akiniImgWts && window.__akiniImgWts.isImg(k));
         if (_isImg && !window.__akiniStorageRestored) { pendingImgs.push(k); return; }
         var local = null;
         try { local = localStorage.getItem(k); } catch (e) {}

} catch (e) {}
 }
 // ---- 钩子 ----
 // 切后台/关闭页面绝不执行 collectAll+JSON.stringify(可达数MB) ——
 // 后台冻结窗口内跑长任务会被系统强杀（=切后台闪退的根因），对齐 milk/syy：后台零工作。
 // 数据安全：akiniStore 每次写操作已即时落盘本地 IndexedDB（不丢），回前台后延迟补跑云备份即可。
 var _pendingHideBackup = false;
 document.addEventListener("visibilitychange", function () {
   if (document.hidden) {