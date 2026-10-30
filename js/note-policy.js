// RSS生成時と画面表示時で共用する掲載判定。仮記事はタイトル変更後も除外する。
(function (root) {
  "use strict";

  var excludedIds = ["n473cce466438"];

  function isPublishableNote(item) {
    if (!item || typeof item.title !== "string" || !item.title.trim()) return false;
    try {
      var url = new URL(item.url);
      var match = url.pathname.match(/^\/tochioko_nw\/n\/(n[a-z0-9]+)\/?$/);
      return url.protocol === "https:" && url.hostname === "note.com" &&
        !url.port && !url.username && !url.password && match !== null &&
        excludedIds.indexOf(match[1]) === -1;
    } catch (e) {
      return false;
    }
  }

  var policy = { isPublishableNote: isPublishableNote };
  if (typeof module !== "undefined" && module.exports) module.exports = policy;
  else root.notePublicationPolicy = policy;
})(globalThis);
