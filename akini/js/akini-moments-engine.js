/*
* akini-moments-engine.js
* 朋友圈 / iCity 自动点赞/评论引擎（对齐 compat 用户定制逻辑）
* - 用户发布动态后，按"消息回复延迟"等待，随后所有联系人 100% 点赞 + 100% 评论
* - 每个联系人只评论 1 条文字，评论内容仅来自用户字卡库，无兜底句库/表情
* - 用户回复某联系人评论后，该联系人再回复 1 条（同样延迟）
* - 联系人自己发朋友圈/iCity 时，有 20% 概率附带用户给 TA 添加的表情包（与评论表情包概率一致，仅贴文非评论）
*/

if (window.akiniStore && window.akiniStore.memoryGet) {
       addFromRaw(window.akiniStore.memoryGet('akini_wordbank'));
     }
     // 兜底 localStorage
     var keys = Object.keys(localStorage);
     keys.forEach(function (k) {

var avatar = getContactAvatar(contact, app);
   // compat 逻辑：20% 概率发表情包（仅用该联系人自己的专属库，对齐 syy 朋友圈评论概率）
   var stickers = getContactStickers(contact.id);
   if (stickers.length && Math.random() < 0.2) {