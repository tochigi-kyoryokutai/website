// data/notes.json を読み込み、note の新着記事をサムネイル付きカードで表示する。
// セクションはデフォルトで hidden。記事が1件以上取得できたときだけ表示する
// (記事0件・JSON未生成・fetch失敗・JS無効の全ケースが自動的に「非表示」に縮退する)。
(function () {
  "use strict";

  var section = document.getElementById("news");
  if (!section) return;

  var list = section.querySelector(".news-list");
  var limit = parseInt(section.getAttribute("data-limit") || "3", 10);

  function isHttps(url) {
    try {
      return new URL(url).protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  fetch("data/notes.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = data && Array.isArray(data.items) ? data.items : [];
      // 生成スクリプト側の検証に加えた2段目の防御: https 以外のリンクは表示しない
      items = items
        .filter(function (item) {
          return isHttps(item.url);
        })
        .slice(0, limit);
      if (items.length === 0) return;

      items.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "news-card";

        var a = document.createElement("a");
        a.href = item.url;
        a.rel = "noopener";

        if (item.thumbnail && isHttps(item.thumbnail)) {
          var img = document.createElement("img");
          img.src = item.thumbnail;
          img.alt = "";
          img.loading = "lazy";
          a.appendChild(img);
        }

        var body = document.createElement("div");
        body.className = "news-card-body";

        var meta = document.createElement("p");
        meta.className = "news-card-meta";
        var time = document.createElement("time");
        time.dateTime = item.publishedAt || "";
        time.textContent = item.publishedDisplay || "";
        meta.appendChild(time);
        var source = document.createElement("span");
        source.textContent = " note";
        meta.appendChild(source);
        body.appendChild(meta);

        var title = document.createElement("p");
        title.className = "news-card-title";
        title.textContent = item.title;
        body.appendChild(title);

        a.appendChild(body);
        li.appendChild(a);
        list.appendChild(li);
      });

      section.hidden = false;
    })
    .catch(function () {
      /* 取得失敗時はセクション非表示のまま(何もしない) */
    });
})();
