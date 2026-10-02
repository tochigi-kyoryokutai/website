# 一般社団法人とちぎ地域おこし協力隊ネットワーク 公式サイト

栃木県内の地域おこし協力隊員・OB/OG・関係者をつなぐネットワークの公式サイトです。

- 公開URL(暫定): **https://tochigi-kyoryokutai.pages.dev** — 2026-09-21 時点で**公開中・誰でも閲覧できる**
- 公開URL(本番): **https://tochigi-kyoryokutai.or.jp** — 2026-10-02、Pagesアクティブ・各ページ表示を管理者確認
- 構成: 静的HTML/CSS + Cloudflare Pages(GitHub リポジトリを接続し、main への push ごとに自動デプロイ)
- 活動情報: note の記事を GitHub Actions で定期取得して表示しています

## サイト構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | トップ(ヒーロー・活動ダイジェスト・新着note) |
| `about.html` | 団体概要(法人概要・目的及び事業) |
| `business.html` | 事業内容(県委託事業・活動レポート) |
| `contact.html` | お問い合わせ(相談窓口のGoogleフォーム2件へのリンク) |
| `404.html` | エラーページ(CSSインライン+ルート相対リンク) |
| `css/styles.css` | 唯一のCSS。冒頭 `:root` にデザイントークン |
| `js/news.js` | `data/notes.json` を読み込んで新着noteを描画 |
| `data/notes.json` | GitHub Actions が自動生成する唯一の可変データ |
| `scripts/fetch-note-rss.mjs` | note RSS → notes.json 変換(依存ゼロ・Node標準のみ) |
| `.github/workflows/fetch-note.yml` | 日次実行(JST 6:30)+手動実行 |

方針: フレームワーク・ビルドステップ・npm 依存を使わない。10年後に誰でも読めることを優先する。

## 実装再開時の現在地（2026-09-20 確認）

- 4ページ・CSS・note取得スクリプト・日次Actionsは実装済み。サイト本体は2026-08-26にコミット済み。
- 設立年月日は令和8（2026）年4月1日。2026-09-20に確認し、団体概要に反映済み。
- ローカルのブランチは `main`。リモート `origin` は `https://github.com/tochigi-kyoryokutai/website.git` に設定済み。
- GitHub Organization `tochigi-kyoryokutai` の管理画面でリポジトリが未作成であることを確認し、公開リポジトリ [`website`](https://github.com/tochigi-kyoryokutai/website) を作成済み。
- **Cloudflare Pages は接続済み・稼働中**(2026-09-21 確認)。`main` への push で自動デプロイされ、約1分で反映される。
  暫定URL `https://tochigi-kyoryokutai.pages.dev` で4ページ・404とも 200/404 を確認済み。
- 2026-10-02: `tochigi-kyoryokutai.or.jp` を接続済み。取得・更新はさくらインターネット、DNSはCloudflare。
- `*.pages.dev` は `.html` 付きURLを拡張子なしURLへ 308 リダイレクトする(`/about.html` → `/about`)。サイト内リンクは `about.html` のままでも到達するが、1ホップ増える。
- **検索エンジンに対する制限をかけていない**(`noindex` なし・`robots.txt` は Cloudflare の既定)。暫定URLでもインデックスされ得る。
- note アカウントは `tochioko_nw` に設定済み。ただし保存済み記事はタイトルに「(テスト)」を含む1件。公開前に掲載内容とRSSを確認する。

再開する順序:

1. ~~4ページの確認~~／~~GitHubへ push~~／~~Cloudflare Pages 接続と `*.pages.dev` での確認~~ — 完了(2026-09-21)。
   定款の「目的及び事業」も原文ベースに差し替え済み。
2. note記事の掲載内容を確定する(保存済み記事はタイトルに「(テスト)」を含む1件)。
3. Actionsの「Fetch note RSS」を手動実行し、記事取得からPagesへの反映まで確認する。
4. 独自ドメインの接続は完了。www転送とURL設定の公開反映を確認する。メールは運用方式の決定後に設定する。

Pages の設定値: Production branch `main`、Framework preset `None`、Build command `exit 0`（変換処理なし）、Build output directory `/`（このリポジトリのルート）。[Cloudflare公式の静的HTML手順](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)を参照。

## 保守手順

### 共通ヘッダー/フッターの変更(重要)

ヘッダー・フッターは `index.html` `about.html` `business.html` `contact.html` の4ファイルに複製されている。変更するときは**必ず4ファイルすべてを同時に更新**する。対象は `<!-- ▼共通ヘッダー -->` 〜 `<!-- ▲共通ヘッダー -->`(フッターも同様)のコメントマーカー間。ページ間で異なってよいのはナビの `aria-current="page"` の位置だけ。

ズレの機械的チェック(リポジトリ直下で実行。何も表示されなければOK):

```sh
for f in about business contact; do
  diff <(sed -n '/▼共通ヘッダー/,/▲共通ヘッダー/p' index.html | sed 's/ aria-current="page"//') \
       <(sed -n '/▼共通ヘッダー/,/▲共通ヘッダー/p' $f.html    | sed 's/ aria-current="page"//')
  diff <(sed -n '/▼共通フッター/,/▲共通フッター/p' index.html) \
       <(sed -n '/▼共通フッター/,/▲共通フッター/p' $f.html)
done
```

### note アカウントの設定

`scripts/fetch-note-rss.mjs` 冒頭の `const NOTE_ACCOUNT = "tochioko_nw";` は設定済み。アカウントを変更する場合はこの1行を書き換える。GitHub接続後、Actions タブから「Fetch note RSS」を手動実行(Run workflow)し、取得成功と、データに差分がある場合の bot コミット → サイト反映まで一度通して確認する。

### Actions が赤い・止まったときの一次切り分け

1. `https://note.com/<アカウント名>/rss` をブラウザで開く。404 ならアカウント名の変更を疑う → スクリプトの `NOTE_ACCOUNT` を修正
2. 一時的な取得失敗なら翌日の実行で自然回復する(失敗時は前回の正常データが残る設計。サイト表示は壊れない)
3. schedule 実行はリポジトリに60日間活動がないと GitHub が自動停止する。workflow 内の keepalive ステップで防いでいるが、止まっていたら Actions タブ → 対象 workflow → 「Enable workflow」で再有効化
4. 失敗通知メールは workflow ファイルの最終更新者に届く。見落とさないこと

### ローカルでの確認方法

本番はドメイン直下(ルート)配信。リポジトリ直下でサーバを起動して確認する:

```sh
python3 -m http.server 8000
# → http://localhost:8000/ を開く
```

本番と同じ条件で見たいときは、ブランチを push すると Cloudflare Pages がブランチごとのプレビュー URL を発行する。

確認する幅: 320px / 375px / PC。JS無効でも新着セクションが消えるだけで他が無傷なこと。

### ドメイン関連(年次・重要)

- **ドメイン `tochigi-kyoryokutai.or.jp` の更新を切らさない**(さくらインターネット管理)。更新期限・更新方法・支払い方法・通知メールの受信可否を年1回確認する。サイトが死ぬ最有力シナリオは技術障害ではなくドメイン失効
- GitHub Organization のオーナー、Cloudflare アカウントの管理者は、それぞれ2名以上を維持する(担当者が動けなくなっても運営が続くように)
- ホスティング(Pages)・DNSはCloudflare、ドメイン取得・更新管理はさくらインターネット。メール方式は未決定。両サービスのログイン情報と2段階認証の復旧コードは法人で保管する

### ドメイン接続と仕上げ（2026-10-02）

- [x] さくらインターネットで `tochigi-kyoryokutai.or.jp` 取得（2026-10-01）
- [x] Cloudflare DNSの有効化とPagesカスタムドメイン接続。管理者がアクティブ・各ページ表示を確認
- [x] HTTPSの `www.tochigi-kyoryokutai.or.jp` → 正式URLへの301転送を確認（2026-10-02、`/about?check=domain2` のパス・クエリを保持）。www用プロキシAレコードは `192.0.2.1`
- [ ] HTTPからHTTPSへの転送を確認
- [ ] 4ページの `og:url` / `canonical`、団体概要JSON-LDの `url` を公開反映して確認（ローカル修正済み）
- [x] 存在しない深いパス `/missing/page` がHTTP 404を返すことを確認（2026-10-02）
- [ ] 深い404画面の戻りリンクをブラウザで確認
- メール設定は別途、運用方式・アドレス・担当の合意後に実施。サイト接続完了をメール設定完了とは扱わない

### その他の未了タスク(HTML内の `TODO:` コメントで検索可能)

- 定款「目的及び事業」原文 → `about.html` の該当節を差し替え
- (任意)一般向けお問い合わせフォーム → 現状は相談窓口2フォーム(現役隊員向け・市町職員向け)へのリンクで運用中。追加する場合は `contact.html` の TODO コメント参照
- 法人英語表記の確定 → 4ファイルのフッター+`about.html` の JSON-LD に追記

### 既知の割り切り

- favicon は SVG のみ(画像ファイルを持たない方針)。Safari ではデフォルトアイコンになることがあるが許容する
- Android には和文明朝フォントがないため、見出しはゴシックで表示される(サイズ・余白で階層は維持される)
