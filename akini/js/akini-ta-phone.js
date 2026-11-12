
(function () {
 'use strict';
 var CHAT_CHANCE = 0.02;           // 聊天实时收藏概率 2%（对齐 compat）
 var MOMENTS_CHANCE = 0.10;        // 朋友圈实时收藏概率 10%（对齐 compat）
 var ICITY_CHANCE = 0.10;          // iCity 实时收藏概率 10%（与朋友圈一致）
 var MUSIC_CHANCE = 0.10;          // 网易云收藏概率 10%（与朋友圈一致）
 var CHAT_HISTORY_CHANCE = 0.03;   // 历史聊天收藏概率 3%（对齐 compat）
 var MOMENTS_HISTORY_CHANCE = 0.05;// 历史朋友圈收藏概率 5%（对齐 compat）
 var ICITY_HISTORY_CHANCE = 0.05;  // 历史 iCity 收藏概率 5%（与朋友圈一致）
 var MUSIC_HISTORY_CHANCE = 0.05;  // 历史网易云收藏概率 5%（与朋友圈一致）

}
 /* 从字卡库随机抽一张字卡作为收藏备注（无兜底：字卡库为空时不加备注） */
 function pickWordcardRemark() {
   try {
     var raw = localStorage.getItem('akini_wordbank');

el.innerHTML = '<div class="akini-ta-phone-empty">' + (currentTab === 'calls' ? '暂无通话记录...' : 'TA 还没有收藏任何内容...') + '</div>';
     return;
   }
   /* 旧收藏补齐备注：无 remark 的条目现场从字卡库抽一张补上并持久化（字卡库为空则跳过，无兜底文案） */
   var needSave = false;
   items.forEach(function (it) {