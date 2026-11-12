
var DARK_BG = '#2a2a2e';
 function saveBooks() {
   var payload = JSON.stringify(_books);
   /* 修复：书架小 JSON 双写；localStorage 配额满时静默失败，IDB 仍可兜底 */
   try { idbSet(BOOKS_KEY, payload); } catch (e) {}
   try { window._idbStore && window._idbStore.flush && window._idbStore.flush(); } catch (e) {}
   try { lsSet(BOOKS_KEY, payload); } catch (e) {

var renameOverlay = $('novelRenameModal');
   var renameInput = $('novelRenameInput');
   var renameOk = $('novelRenameOk');
   var renameCancel = $('novelRenameCancel');
   var content = $('novelReaderContent');
   if (back) back.addEventListener('click', goHome);
   /* 加号改为「导入/管理」菜单，绑定在补丁段 bindNovelMenu */
   if (importInput) importInput.addEventListener('change', function () {
     var f = this.files && this.files[0];
     this.value = '';
     importNovel(f);
   });
   if (readerBack) readerBack.addEventListener('click', closeReader);
   if (chapterMenuBtn) chapterMenuBtn.addEventListener('click', function () { openChapterDrawer(); });
   if (chapterDrawerClose) chapterDrawerClose.addEventListener('click', closeChapterDrawer);
   if (chapterDrawerMask) chapterDrawerMask.addEventListener('click', closeChapterDrawer);
   if (chapterDrawer) chapterDrawer.addEventListener('click', function (e) { if (e.target === chapterDrawer) closeChapterDrawer(); });
   if (menuBtn) menuBtn.addEventListener('click', function () { openSheet('novelReaderMenu'); });
   if (menuClose) menuClose.addEventListener('click', function () { closeSheet('novelReaderMenu'); });