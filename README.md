# 一般社団法人とちぎ地域おこし協力隊ネットワーク 公式サイト

栃木県内の地域おこし協力隊員・OB/OG・関係者をつなぐネットワークの公式サイトです。

- 公開URL: https://tochigi-kyoryokutai.org (準備中)
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
- ローカルのブランチは `main`。リモート接続先は未設定のため、このチェックアウトからの公開連携はまだできていない。
- GitHub Organization `tochigi-kyoryokutai` は公開APIで存在確認済み。`tochigi-kyoryokutai/website` は未認証APIで404（未作成か非公開かは未確認）。
- Cloudflare アカウント・Pagesプロジェクト・ドメインの取得状況は未確認。
- note アカウントは `tochioko_nw` に設定済み。ただし保存済み記事はタイトルに「(テスト)」を含む1件。公開前に掲載内容とRSSを確認する。

再開する順序:

1. ローカルで4ページを確認し、定款の「目的及び事業」・note記事の掲載内容を確定する。定款の原文確認は後日行い、接続準備は先に進める。文言の差し替え後も同じGitHub・Pages連携で更新できる。
2. GitHub にログインした状態で団体の管理権限と `website` の有無を確認。未作成ならリポジトリを作成し、公開対象を確認して接続・pushする。
3. Cloudflare Pages にGitHubリポジトリを接続し、`*.pages.dev` で4ページ・404・note表示を確認する。
4. Actionsの「Fetch note RSS」を手動実行し、記事取得からPagesへの反映まで確認する。
5. サイト確認後、独自ドメインの取得・接続とメール転送を進める。

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

- **ドメイン `tochigi-kyoryokutai.org` の更新を切らさない**(Cloudflare Registrar・法人名義)。自動更新設定と支払いカードの有効期限、登録メールアドレスの受信可否を年1回確認する。サイトが死ぬ最有力シナリオは技術障害ではなくドメイン失効
- GitHub Organization のオーナー、Cloudflare アカウントの管理者は、それぞれ2名以上を維持する(担当者が動けなくなっても運営が続くように)
- ホスティング(Pages)・ドメイン・DNS・メール転送(Email Routing)はすべて同じ Cloudflare アカウントにある。アカウントを失うと全部止まるので、ログイン情報と2段階認証の復旧コードは法人で保管する

### ドメイン接続時にやること(未了タスク)

1. Cloudflare Registrar で `tochigi-kyoryokutai.org` を取得(法人名義)。DNS は自動で同じアカウントの Cloudflare DNS に置かれる
2. Workers & Pages → 対象プロジェクト → Custom domains で `tochigi-kyoryokutai.org` と `www.tochigi-kyoryokutai.org` を追加(DNS レコードと証明書は自動)
3. `www` → apex のリダイレクトをダッシュボードの Redirect Rules で設定。SSL/TLS → Edge Certificates で「Always Use HTTPS」を ON
4. Email Routing で法人アドレス(`info@` 等)を作成し、転送先で実際に受信できるところまで確認する
5. 全4ページの `<head>` に `og:url` / `canonical` を追加、`about.html` の JSON-LD に `url` を追加
6. 存在しない深いパス（例: `/missing/page`）で `404.html` が表示され、トップ・お問い合わせに戻れることを確認する。リンクはルート相対なので、独自ドメイン接続時の書き換えは不要

### その他の未了タスク(HTML内の `TODO:` コメントで検索可能)

- 定款「目的及び事業」原文 → `about.html` の該当節を差し替え
- (任意)一般向けお問い合わせフォーム → 現状は相談窓口2フォーム(現役隊員向け・市町職員向け)へのリンクで運用中。追加する場合は `contact.html` の TODO コメント参照
- 法人英語表記の確定 → 4ファイルのフッター+`about.html` の JSON-LD に追記

### 既知の割り切り

- favicon は SVG のみ(画像ファイルを持たない方針)。Safari ではデフォルトアイコンになることがあるが許容する
- Android には和文明朝フォントがないため、見出しはゴシックで表示される(サイズ・余白で階層は維持される)
