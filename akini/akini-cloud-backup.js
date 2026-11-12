}
           } catch (e) {}
         }
         try { if (window.akiniStore && window.akiniStore.memorySet) window.akiniStore.memorySet(k, val); } catch (e) {}
         try { if (window._idbStore && window._idbStore.set) { window._idbStore.set(k, val); window._idbStore.set(k + "_backup", val); } } catch (e) {}
       }
       missing = missing.filter(_wtsOk);
       if (missing.length) {
         // 回填缺失 key：localStorage + 内存 + IDB 三层同时写入
         missing.forEach(_fill);
         console.warn("[云备份] 已从云端恢复 " + missing.length + " 项缺失数据");
         // 恢复完成后立即刷新界面（联系人/聊天/头像/预览），让恢复的数据即刻生效
         try { if (window.__akiniOnCriticalRestored) window.__akiniOnCriticalRestored(); } catch (e) {}
       }
       // v899 图像键延迟批：本地对账完成后再判断（最多等 30s），含两条通道——
       // ① 仍缺失且云端不旧于本地记录 → 回填；② 云端时间戳明显更新 → 即使本地非空也覆盖
       //    （破解"IDB 旧值先被 restoreAll 巩固进内存，云端新值永远进不来"的死锁）
       if (pendingImgs.length) {
         var _tries = 0;
         (function _waitStorage() {
           if (!window.__akiniStorageRestored && _tries++ < 100) { setTimeout(_waitStorage, 300); return; }
           var late = [], newer = [];
           pendingImgs.forEach(function (k) {
             var local = null;
             try { local = localStorage.getItem(k); } catch (e) {}
             var mem = null;
             try { if (window.akiniStore && window.akiniStore.memoryGet) mem = window.akiniStore.memoryGet(k); } catch (e) {}
             var hasLocal = mem != null && mem !== "" && mem !== "null" && mem !== "undefined";
             var empty = !hasLocal;
             var lw = (window.__akiniImgWts && window.__akiniImgWts.local(k)) || 0;
             var cw = 0; try { cw = +(cloud["akini_wts_" + k] || 0) || 0; } catch (e1) {}
             /* v964：仅在云端时间戳确实更新(cw>lw)时才覆盖本地，杜绝"巩固旧值"再被旧值覆盖 */
             if (cw > 0 && cw > lw) { newer.push(k); return; }
             if (empty && _wtsOk(k)) late.push(k);
           });
           var did = late.length + newer.length;
           if (did > 0) {
             late.forEach(_fill);
             newer.forEach(_fill);
             console.warn("[云备份] 图像键延迟批恢复 " + did + " 项" + (newer.length ? "（含 " + newer.length + " 项云端较新覆盖）" : ""));
             try { if (window.__akiniOnCriticalRestored) window.__akiniOnCriticalRestored(); } catch (e) {}
           }
         })();
       }
       // 缺失较多说明本地被清理过：回填后刷新一次让界面用上恢复的数据（防循环）
       if (missing.length >= 3) {
         try {
           var lock = +(localStorage.getItem("akini_cloud_restore_lock") || 0);
           if (Date.now() - lock > 3 * 60 * 1000) {
             // 用户已进入应用则不再自动刷新（恢复的数据已在内存，界面下次启动自然生效）
             if (window.__akiniSplashDone) { console.warn("[云备份] 已进入应用，跳过恢复后刷新"); return; }
             localStorage.setItem("akini_cloud_restore_lock", String(Date.now()));
             location.reload();
           }
         } catch (e) {}
       }
     }).catch(function () {
       // 网络失败：不标记完成（防止空数据覆盖云端），10 秒后自动重试
       setTimeout(restore, 10000);
     });
   } catch (e) {}
 }
 // ---- 钩子 ----
 // v604: 切后台/关闭页面绝不执行 collectAll+JSON.stringify(可达数MB) ——
 // 后台冻结窗口内跑长任务会被系统强杀（=切后台闪退的根因），对齐 milk/syy：后台零工作。
 // 数据安全：akiniStore 每次写操作已即时落盘本地 IndexedDB（不丢），回前台后延迟补跑云备份即可。
 var _pendingHideBackup = false;
 document.addEventListener("visibilitychange", function () {
   if (document.hidden) {
     _pendingHideBackup = true; // 仅做标记，回前台补跑
   } else if (_pendingHideBackup) {
     _pendingHideBackup = false;
     setTimeout(function () { backup(false); }, 2000); // 回前台 2s 后补跑，避开 UI 恢复高峰
   }
 });
 // pagehide / beforeunload 不再触发备份：冻结窗口内的重序列化正是被杀原因；
 // 本地 IDB 已即时持久化，下次打开页面后 150s 周期内自动补上云端。
 // 每 150 秒周期检测（有变化才上传；切后台/关闭页面前仍有即时备份）
 // zzzy：60s 全量 collectAll+stringify 是主线程卡顿/掉帧大户，恢复 150s；后台时 backup(false) 内部已跳过