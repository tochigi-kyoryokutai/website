// Node標準のみ。生成器は一時ディレクトリで実行し、実データを変更しない。
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import policy from "../js/note-policy.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blocked = { title: "正式な名前に変更しても除外", url: "https://note.com/tochioko_nw/n/n473cce466438?from=rss" };
const published = { title: "正式レポート & お知らせ", url: "https://note.com/tochioko_nw/n/n123abc" };
const itemXml = (item) => `<item><title><![CDATA[${item.title}]]></title><link>${item.url.replaceAll("&", "&amp;")}</link><pubDate>Tue, 01 Sep 2026 16:00:00 GMT</pubDate></item>`;

test("記事IDによる除外は改題・クエリ・末尾スラッシュでも有効", () => {
  assert.equal(policy.isPublishableNote(blocked), false);
  assert.equal(policy.isPublishableNote({ ...blocked, url: blocked.url.split("?")[0] + "/" }), false);
  assert.equal(policy.isPublishableNote(published), true);
  for (const url of ["http://note.com/tochioko_nw/n/n123abc", "https://example.com/tochioko_nw/n/n123abc", "https://note.com/other/n/n123abc", "javascript:alert(1)"]) {
    assert.equal(policy.isPublishableNote({ ...published, url }), false);
  }
  assert.equal(policy.isPublishableNote(null), false);
});

function generate(xml) {
  const dir = mkdtempSync(path.join(tmpdir(), "tochigi-news-test-"));
  try {
    for (const name of ["scripts", "js", "data"]) mkdirSync(path.join(dir, name));
    for (const name of ["scripts/fetch-note-rss.mjs", "js/note-policy.js"]) copyFileSync(path.join(root, name), path.join(dir, name));
    const previous = '{"items":[{"title":"keep previous"}]}\n';
    writeFileSync(path.join(dir, "data/notes.json"), previous);
    const script = `globalThis.fetch = async () => ({ok:true,text:async()=>${JSON.stringify(xml)}}); await import(${JSON.stringify(pathToFileURL(path.join(dir, "scripts/fetch-note-rss.mjs")).href)});`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
    return { status: result.status, output: readFileSync(path.join(dir, "data/notes.json"), "utf8"), previous };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("RSS更新で仮記事を除外し、正式記事とJST日付を残す", () => {
  const result = generate(`<rss><channel>${itemXml(blocked)}${itemXml(published)}</channel></rss>`);
  assert.equal(result.status, 0);
  const data = JSON.parse(result.output);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].title, published.title);
  assert.equal(data.items[0].publishedAt, "2026-09-02");
});

test("仮記事のみ・記事なしのRSSは空配列、不正な応答では前回データを保持", () => {
  for (const xml of [`<rss><channel>${itemXml(blocked)}</channel></rss>`, "<rss><channel></channel></rss>"]) {
    const result = generate(xml);
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.output), { items: [] });
  }
  const result = generate("<html>error</html>");
  assert.equal(result.status, 1);
  assert.equal(result.output, result.previous);
});

async function render(data, fail = false, limit = 3) {
  function element() { return { children: [], appendChild(child) { this.children.push(child); } }; }
  const list = element();
  const section = { hidden: true, querySelector: () => list, getAttribute: () => String(limit) };
  const context = vm.createContext({ URL, document: { getElementById: () => section, createElement: element }, fetch: async () => {
    if (fail) throw new Error("offline");
    return { ok: true, json: async () => data };
  } });
  vm.runInContext(readFileSync(path.join(root, "js/note-policy.js"), "utf8"), context);
  vm.runInContext(readFileSync(path.join(root, "js/news.js"), "utf8"), context);
  await new Promise(resolve => setImmediate(resolve));
  return { section, list };
}

test("空・仮記事のみ・取得失敗では見出しを含むセクション全体を非表示", async () => {
  for (const [data, fail] of [[{ items: [] }, false], [{ items: [blocked] }, false], [null, false], [null, true]]) {
    const { section, list } = await render(data, fail);
    assert.equal(section.hidden, true);
    assert.equal(list.children.length, 0);
  }
});

test("古いJSONに仮記事が混在しても、正式記事のみ表示し件数制限を適用", async () => {
  const { section, list } = await render({ items: [blocked, published, published] }, false, 1);
  assert.equal(section.hidden, false);
  assert.equal(list.children.length, 1);
  assert.equal(list.children[0].children[0].href, published.url);
});
