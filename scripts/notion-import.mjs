// One-off: copies the blog posts in src/content/writings into the Notion "Blog" database.
// Posts already in the database (same Slug) are skipped, so it is safe to run again.
//
//   node scripts/notion-import.mjs          import
//   node scripts/notion-import.mjs --dry    only show what would be imported
//
// Reads NOTION_TOKEN and NOTION_BLOG_DATABASE_ID from .env.local.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "src/content/writings");
const SITE = "https://nicole-hy-lee.vercel.app";
const DRY = process.argv.includes("--dry");

// Posts whose layout Notion can't hold: imported as a copy with "Use site file" ticked,
// so the site keeps showing the file.
const KEEP_FILE = new Set(["playground-thoughts", "burnout-epigenetics"]);
const SKIP = new Set(["hello-world"]); // the template post

// ---------- env ----------
const env = {};
if (existsSync(path.join(ROOT, ".env.local"))) {
  for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const token = process.env.NOTION_TOKEN || env.NOTION_TOKEN;
const db = process.env.NOTION_BLOG_DATABASE_ID || env.NOTION_BLOG_DATABASE_ID;
if (!DRY && (!token || !db)) {
  console.error("Add NOTION_TOKEN and NOTION_BLOG_DATABASE_ID to .env.local first.");
  process.exit(1);
}

async function notion(p, method = "GET", body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.notion.com/v1/${p}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt < 5) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`${p}: ${res.status} ${json.message}`);
    return json;
  }
}

// ---------- inline text ----------
const abs = u => (u.startsWith("/") ? SITE + u : u);
const decode = s =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

function text(content, ann = {}, link) {
  const out = [];
  for (let i = 0; i < content.length; i += 1900) {
    out.push({
      type: "text",
      text: { content: content.slice(i, i + 1900), link: link ? { url: abs(link) } : null },
      annotations: { bold: !!ann.bold, italic: !!ann.italic, code: !!ann.code, strikethrough: false, underline: false, color: "default" },
    });
  }
  return out;
}

// markdown inline: `code`, [text](url), **bold**, *italic* / _italic_
function md(s, ann = {}) {
  const out = [];
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)(.+?)\*(?!\w)|(?<!\w)_(?!\s)(.+?)_(?!\w)/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push(...text(decode(s.slice(last, m.index)), ann));
    if (m[1] !== undefined) out.push(...text(m[1], { ...ann, code: true }));
    else if (m[2] !== undefined) out.push(...md(m[2], ann).map(t => ({ ...t, text: { ...t.text, link: { url: abs(m[3]) } } })));
    else if (m[4] !== undefined) out.push(...md(m[4], { ...ann, bold: true }));
    else out.push(...md(m[5] ?? m[6], { ...ann, italic: true }));
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(...text(decode(s.slice(last)), ann));
  return out;
}

// html inline: <em>, <strong>, <b>, <i>, <a href>, <sub>/<sup> kept as plain text
function html(s, ann = {}) {
  const out = [];
  const re = /<(em|i|strong|b)>([\s\S]*?)<\/\1>|<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<[^>]+>/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push(...text(decode(s.slice(last, m.index)), ann));
    if (m[1]) out.push(...html(m[2], { ...ann, [/em|i/.test(m[1]) ? "italic" : "bold"]: true }));
    else if (m[3]) out.push(...html(m[4], ann).map(t => ({ ...t, text: { ...t.text, link: { url: abs(m[3]) } } })));
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(...text(decode(s.slice(last)), ann));
  return out;
}

// ---------- blocks ----------
const block = (type, data) => ({ object: "block", type, [type]: data });
const para = (rich, color = "default") => block("paragraph", { rich_text: rich, color });
const heading = (level, rich) => block(`heading_${level}`, { rich_text: rich });
const image = (src, caption = "") => block("image", { type: "external", external: { url: abs(src) }, caption: caption ? md(caption) : [] });

function figure(inner) {
  const imgs = [...inner.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)].map(m => m[1]);
  const cap = inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1].trim() ?? "";
  return imgs.map((src, i) => image(src, i === imgs.length - 1 ? cap : ""));
}

// The .mdx posts use ## for sections; in Notion that's Heading 1 (the site turns it back into ##).
function mdxBlocks(body) {
  body = body.replace(/\{\/\*[\s\S]*?\*\/\}\s*/g, "");
  const lines = body.split("\n");
  const blocks = [];
  let i = 0;
  const flushPara = buf => buf.length && blocks.push(para(md(buf.join(" ").trim())));
  let buf = [];
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { flushPara(buf); buf = []; i++; continue; }
    if (t.startsWith("<figure")) {
      flushPara(buf); buf = [];
      let chunk = line;
      while (!chunk.includes("</figure>") && i + 1 < lines.length) chunk += "\n" + lines[++i];
      blocks.push(...figure(chunk));
      i++; continue;
    }
    let m;
    if ((m = t.match(/^<h([2-4])[^>]*>(.*)<\/h\1>$/))) { flushPara(buf); buf = []; blocks.push(heading(+m[1] - 1, md(m[2]))); i++; continue; }
    if ((m = t.match(/^<p className="post-stack">(.*)<\/p>$/))) { flushPara(buf); buf = []; blocks.push(para(md(m[1]), "gray")); i++; continue; }
    if ((m = t.match(/^<p><a className="post-button" href="([^"]+)">(.*?)\s*<Arrow \/>\s*<\/a><\/p>$/))) {
      flushPara(buf); buf = []; blocks.push(para(text(`${m[2]} →`, {}, m[1]))); i++; continue;
    }
    if ((m = t.match(/^(#{1,4}) (.*)$/))) { flushPara(buf); buf = []; blocks.push(heading(Math.min(3, Math.max(1, m[1].length - 1)), md(m[2]))); i++; continue; }
    if (t.startsWith("```")) {
      flushPara(buf); buf = [];
      const lang = t.slice(3).trim();
      const code = [];
      while (++i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i]);
      blocks.push(block("code", { rich_text: text(code.join("\n")), language: lang && lang !== "text" ? lang : "plain text" }));
      i++; continue;
    }
    if (/^-{3,}$/.test(t)) { flushPara(buf); buf = []; blocks.push(block("divider", {})); i++; continue; }
    if (t.startsWith("|")) {
      flushPara(buf); buf = [];
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        if (!cells.every(c => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      const width = Math.max(...rows.map(r => r.length));
      blocks.push(block("table", {
        table_width: width, has_column_header: true, has_row_header: false,
        children: rows.map(r => block("table_row", { cells: Array.from({ length: width }, (_, c) => md(r[c] ?? "")) })),
      }));
      continue;
    }
    if ((m = t.match(/^([-*]|\d+\.) (.*)$/))) {
      flushPara(buf); buf = [];
      const type = /\d/.test(m[1]) ? "numbered_list_item" : "bulleted_list_item";
      let item = m[2];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^([-*]|\d+\.) /.test(lines[i + 1].trim()) && /^\s+/.test(lines[i + 1])) item += " " + lines[++i].trim();
      blocks.push(block(type, { rich_text: md(item) }));
      i++; continue;
    }
    if (t.startsWith(">")) {
      flushPara(buf); buf = [];
      const q = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) q.push(lines[i++].trim().replace(/^>\s?/, ""));
      blocks.push(block("quote", { rich_text: md(q.join(" ")) }));
      continue;
    }
    if (t.startsWith("<")) {
      // any other one-line html, e.g. <p className="center">: keep its text
      flushPara(buf); buf = []; blocks.push(para(html(t.replace(/^<p[^>]*>|<\/p>$/g, "")))); i++; continue;
    }
    buf.push(t);
    i++;
  }
  flushPara(buf);
  return blocks;
}

function htmlBlocks(src) {
  const blocks = [];
  const re = /<h([2-4])[^>]*>([\s\S]*?)<\/h\1>|<p[^>]*>([\s\S]*?)<\/p>|<img\s+[^>]*src="([^"]+)"[^>]*>/g;
  for (const m of src.matchAll(re)) {
    if (m[1]) blocks.push(heading(+m[1] - 1, html(m[2])));
    else if (m[4]) blocks.push(image(m[4]));
    else {
      const inner = m[3];
      for (const img of inner.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)) blocks.push(image(img[1]));
      const rich = html(inner.replace(/<img[^>]*>/g, "")).filter(t => t.text.content);
      if (rich.some(t => t.text.content.trim())) blocks.push(para(rich));
    }
  }
  return blocks;
}

// ---------- posts ----------
function frontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"')) v = JSON.parse(v);
    else if (v === "true" || v === "false") v = v === "true";
    meta[kv[1]] = v;
  }
  return { meta, body: raw.slice(m[0].length) };
}

// The archived essays' details live in src/app/metadata.tsx; read the few fields needed.
function essayMeta(slug) {
  const src = readFileSync(path.join(ROOT, "src/app/metadata.tsx"), "utf8");
  const start = src.indexOf(`slug: "${slug}"`);
  const chunk = src.slice(start, src.indexOf("}", start));
  const field = k => chunk.match(new RegExp(`\\n\\s*${k}: "((?:[^"\\\\]|\\\\.)*)"`))?.[1];
  return { title: field("title"), cover: field("cover") };
}

function posts() {
  const out = [];
  for (const f of readdirSync(DIR).sort()) {
    const slug = f.replace(/\.(mdx|html)$/, "");
    if (SKIP.has(slug)) continue;
    if (f.endsWith(".mdx")) {
      const { meta, body } = frontMatter(readFileSync(path.join(DIR, f), "utf8"));
      out.push({ slug, meta, blocks: mdxBlocks(body) });
    } else if (f.endsWith(".html") && KEEP_FILE.has(slug)) {
      out.push({ slug, meta: essayMeta(slug), blocks: htmlBlocks(readFileSync(path.join(DIR, f), "utf8")) });
    }
  }
  return out;
}

function properties({ slug, meta }) {
  const rt = s => [{ type: "text", text: { content: s } }];
  const p = {
    Title: { title: rt(meta.title) },
    Slug: { rich_text: rt(slug) },
    Published: { checkbox: !meta.draft && !meta.hidden && !!meta.title },
    Pinned: { checkbox: !!meta.pinned },
    "Use site file": { checkbox: KEEP_FILE.has(slug) },
  };
  if (meta.date) p.Date = { date: { start: String(meta.date).slice(0, 10) } };
  const kind = { notes: "notes", update: "Update", note: "notes" }[String(meta.kind).toLowerCase()] ?? meta.kind;
  if (kind && ["Opinion", "Research", "notes", "Update"].includes(kind)) p.Type = { select: { name: kind } };
  if (meta.summary) p.Summary = { rich_text: rt(meta.summary) };
  if (meta.cover) p["ASCII cover"] = { select: { name: meta.cover } };
  if (meta.caption) p.Caption = { rich_text: rt(meta.caption) };
  if (meta.note) p.Note = { rich_text: rt(meta.note) };
  if (meta.source) p.Source = { url: meta.source };
  return p;
}

async function existingSlugs() {
  const slugs = new Set();
  let cursor;
  do {
    const res = await notion(`databases/${db}/query`, "POST", { page_size: 100, start_cursor: cursor });
    for (const page of res.results) {
      const s = page.properties.Slug?.rich_text?.map(t => t.plain_text).join("");
      if (s) slugs.add(s);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return slugs;
}

const all = posts();
const have = DRY && !token ? new Set() : await existingSlugs();
for (const post of all) {
  if (have.has(post.slug)) { console.log(`skip    ${post.slug} (already in Notion)`); continue; }
  if (DRY) {
    const counts = {};
    for (const b of post.blocks) counts[b.type] = (counts[b.type] ?? 0) + 1;
    console.log(`would add ${post.slug}: ${post.blocks.length} blocks`, counts);
    continue;
  }
  const page = await notion("pages", "POST", {
    parent: { database_id: db },
    properties: properties(post),
    ...(post.meta.image ? { cover: { type: "external", external: { url: abs(post.meta.image) } } } : {}),
    children: post.blocks.slice(0, 100),
  });
  for (let i = 100; i < post.blocks.length; i += 100) {
    await notion(`blocks/${page.id}/children`, "PATCH", { children: post.blocks.slice(i, i + 100) });
  }
  console.log(`added   ${post.slug} (${post.blocks.length} blocks)`);
}
