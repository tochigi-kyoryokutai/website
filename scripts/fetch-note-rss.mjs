// note.com の RSS を取得して data/notes.json を生成する。
// 依存: なし(Node 20+ の標準機能のみ)。GitHub Actions から日次実行される。
//
// 挙動:
// - NOTE_ACCOUNT が "PLACEHOLDER" のとき: 空の notes.json を書いて正常終了
// - 取得・解析に失敗したとき: 既存の notes.json に触らず exit 1(前回の正常データが生き残る)
// - 正常に取得して記事0件のとき: 空の notes.json を書く(サイト側は非表示に縮退)

// ★ noteアカウントを変更する場合、この1行だけを書き換える
const NOTE_ACCOUNT = "tochioko_nw";

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "notes.json");
const MAX_ITEMS = 10;
const USER_AGENT =
  "tochigi-kyoryokutai-website/1.0 (+https://github.com/tochigi-kyoryokutai/website)";

// CDATA ラッパーを剥がす
function stripCdata(s) {
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : s;
}

// XML エンティティ(名前参照+数値参照)をデコードしてプレーンテキスト化する。
// JSON にはエスケープせずプレーンテキストで格納し、安全性は表示側(textContent)で担保する。
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decodeEntities(stripCdata(m[1]).trim()).trim() : "";
}

// pubDate(RFC822)を JST の日付に変換する。表示用文字列もここで整形し、
// ブラウザ側では日付をパースしない(環境差を持ち込まない)。
function formatDates(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return null;
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const mo = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const da = String(jst.getUTCDate()).padStart(2, "0");
  return { iso: `${y}-${mo}-${da}`, display: `${y}.${mo}.${da}` };
}

async function fetchRss(url) {
  const attempt = async () => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        // note の CDN は圧縮方式ごとにキャッシュを分けており、Brotli 変種だけ
        // 古いまま返ることがある(2026-08-09 実測)。gzip を明示して安定させる
        "Accept-Encoding": "gzip",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  };
  try {
    return await attempt();
  } catch (err) {
    console.error(`初回取得に失敗、5秒後に再試行します: ${err.message}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return attempt();
  }
}

function parseItems(xml) {
  if (!/<rss[\s>]/i.test(xml)) {
    throw new Error("応答が RSS(XML)ではありません");
  }
  // channel 直下の <title>/<link> を拾わないよう、まず <item> ブロックに分割する
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  const items = [];
  for (const block of blocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    if (!title || !link) continue;
    // 予期しないリンク先は捨てる(表示側の URL 検証と合わせた2段防御)
    if (!link.startsWith("https://note.com/")) continue;
    // 記事サムネイル(media:thumbnail)。https 以外は空扱い
    let thumbnail = extractTag(block, "media:thumbnail");
    if (!thumbnail.startsWith("https://")) thumbnail = "";
    const dates = formatDates(pubDate);
    items.push({
      title,
      url: link,
      publishedAt: dates ? dates.iso : "",
      publishedDisplay: dates ? dates.display : "",
      thumbnail,
    });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

function writeJson(items) {
  // 出力は決定的にする(タイムスタンプ等を入れると毎回差分が出て無意味なコミットが積まれる)
  writeFileSync(OUT_PATH, JSON.stringify({ items }, null, 2) + "\n");
}

if (NOTE_ACCOUNT === "PLACEHOLDER") {
  console.log("NOTE_ACCOUNT が未設定のため、空の notes.json を出力して正常終了します");
  writeJson([]);
  process.exit(0);
}

try {
  const xml = await fetchRss(`https://note.com/${NOTE_ACCOUNT}/rss`);
  const items = parseItems(xml);
  writeJson(items);
  console.log(`notes.json を更新しました(${items.length}件)`);
} catch (err) {
  console.error(`取得・解析に失敗したため notes.json は更新しません: ${err.message}`);
  process.exit(1);
}
