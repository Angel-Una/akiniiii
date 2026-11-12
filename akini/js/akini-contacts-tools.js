}
     }
   }catch(e){}
 }
 // 低频兜底：仅在页面空闲时做一次防抖保存，避免高频定时器拖慢主线程
 setInterval(function(){ if(document.hidden) return; _scheduleSaveChat(1500); _saveIcity(); },20000);
 /* ============ 关键数据完整快照 + 加载恢复 ============ */
 /* 对齐 极简标杆：废弃关键键全量快照（_snapshotCritical）——全量序列化整个 LS
    既是 Safari 切后台 Jetsam 闪退主源，旧快照还会在恢复时用旧值覆盖现数据。
    逐键数据安全由 storage-safe 启动对账 + 写入即时双写 LS+IDB 保障，无需快照兜底。 */
 function _restoreCritical(){
   /* 旧快照/多源回填恢复链已全部废弃，对外调用点保留空壳 */
   return;
 }
 // 废弃 60s 关键键快照轮询——恢复链已死，纯写入浪费
 // 页面隐藏/关闭时立即保存一次（去重，避免重复触发）
 /* 防闪退：切后台瞬间系统冻结窗口极短（jetsam 时间预算<1s），同步跑大 HTML 序列化+写盘
    会直接被强杀=闪退。改为延迟到下一事件循环执行，让 visibilitychange 回调尽快返回。
    数据已由每条消息的 300ms 防抖即时落盘兜底，此处只是额外保险 */
 function _flushAll(){_saveChat();_saveIcity();}
 document.addEventListener("visibilitychange",function(){
   if(document.hidden)setTimeout(_flushAll,0);
 });
 window.addEventListener("beforeunload",function(){setTimeout(_flushAll,0);});
 window.addEventListener("pagehide",function(){setTimeout(_flushAll,0);});
 /* 首帧单次直出，消除四重延迟覆盖 */
_restoreCritical();
})();