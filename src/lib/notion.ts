// Blog posts written in Notion. Each row of the "blog" database is a post: its properties
// mirror the .mdx front matter and the page body is the post. Set NOTION_TOKEN (the
// integration's secret) and NOTION_BLOG_DATABASE_ID; without them the blog just shows the .mdx posts.

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

// How often (seconds) the blog checks Notion for edits. The blog pages use the same number.
export const NOTION_REVALIDATE = 60;

// Links and images in Notion that point at the live site are turned back into site paths,
// so imported posts serve their pictures from public/ and internal links stay in the same tab.
const SITE = /^https?:\/\/(www\.)?nicole-hy-lee\.vercel\.app(?=\/|$)/;
export const localize = (url: string) => url.replace(SITE, "") || "/";

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_BLOG_DATABASE_ID;
export const notionEnabled = Boolean(token && databaseId);

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

async function notion(path: string, init: { method?: string; body?: Json; fresh?: boolean } = {}): Promise<Json> {
  const res = await fetch(`${API}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    ...(init.fresh ? { cache: "no-store" as const } : { next: { revalidate: NOTION_REVALIDATE, tags: ["notion"] } }),
  });
  if (!res.ok) throw new Error(`Notion ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

export type RichText = {
  plain_text: string;
  href: string | null;
  annotations: { bold: boolean; italic: boolean; strikethrough: boolean; underline: boolean; code: boolean };
};

export type NotionBlock = { id: string; type: string; has_children: boolean; children?: NotionBlock[] } & Record<string, Json>;

export type NotionPost = {
  id: string;
  slug: string;
  title: string;
  date?: Date;
  kind?: string;
  summary?: string;
  draft: boolean;
  pinned: boolean;
  // the site keeps showing the .mdx/.html file with this slug; the Notion page is just a copy
  useFile: boolean;
  cover?: string;
  image?: string;
  imageLight?: string;
  caption?: string;
  note?: string;
  source?: string;
};

// Properties are looked up by name, ignoring case, so "Type" and "type" both work.
function prop(page: Json, name: string): Json {
  const key = Object.keys(page.properties).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? page.properties[key] : undefined;
}

const plain = (rich?: RichText[]) => (rich ?? []).map(t => t.plain_text).join("").trim();

function text(page: Json, name: string): string | undefined {
  const p = prop(page, name);
  if (!p) return undefined;
  const v =
    p.type === "title" ? plain(p.title)
    : p.type === "rich_text" ? plain(p.rich_text)
    : p.type === "select" ? p.select?.name
    : p.type === "url" ? p.url
    : p.type === "formula" ? p.formula?.string
    : undefined;
  return v || undefined;
}

const checked = (page: Json, name: string) => prop(page, name)?.checkbox === true;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Files uploaded to Notion come back as links that expire after an hour, so the site links to
// /api/notion-image/<id>, which asks Notion for a fresh link on each load. Outside links are used as is.
function fileUrl(file: Json, id: string, field?: string): string | undefined {
  if (!file) return undefined;
  if (file.type === "external") return localize(file.external.url);
  return `/api/notion-image/${id}${field ? `?field=${field}` : ""}`;
}

function toPost(page: Json): NotionPost | null {
  const title = text(page, "Title") ?? text(page, "Name");
  if (!title) return null;
  const date = prop(page, "Date")?.date?.start;
  const light = prop(page, "Light cover")?.files?.[0];
  return {
    id: page.id,
    // titles on the site are all lowercase
    title: title.toLowerCase(),
    slug: slugify(text(page, "Slug") ?? title),
    // no date: listed after the dated posts, like the archived essays
    date: date ? new Date(date) : undefined,
    kind: text(page, "Type"),
    summary: text(page, "Summary"),
    draft: !checked(page, "Published"),
    pinned: checked(page, "Pinned"),
    useFile: checked(page, "Use site file"),
    cover: text(page, "ASCII cover"),
    image: fileUrl(page.cover, page.id, "cover"),
    imageLight: light ? fileUrl(light, page.id, "light") : undefined,
    caption: text(page, "Caption"),
    note: text(page, "Note"),
    source: text(page, "Source"),
  };
}

export async function getNotionPosts(): Promise<NotionPost[]> {
  if (!notionEnabled) return [];
  const pages: Json[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion(`databases/${databaseId}/query`, {
      method: "POST",
      body: { page_size: 100, start_cursor: cursor },
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages.filter(p => !p.archived && !p.in_trash).map(toPost).filter((p): p is NotionPost => p !== null);
}

// A page's blocks, with nested blocks (list items, toggles, columns) filled in.
export async function getBlocks(id: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion(`blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`);
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  await Promise.all(blocks.filter(b => b.has_children && b.type !== "child_page").map(async b => (b.children = await getBlocks(b.id))));
  return blocks;
}

export function blocksWordCount(blocks: NotionBlock[]): number {
  return blocks.reduce((n, b) => {
    const rich: RichText[] = b[b.type]?.rich_text ?? [];
    return n + plain(rich).split(/\s+/).filter(Boolean).length + (b.children ? blocksWordCount(b.children) : 0);
  }, 0);
}

// For the image route: a fresh link to an uploaded file and when it stops working.
export async function freshFileUrl(id: string, field?: string): Promise<{ url: string; expires?: string } | null> {
  if (field === "cover" || field === "light") {
    const page = await notion(`pages/${id}`, { fresh: true });
    if (page.parent?.database_id?.replace(/-/g, "") !== databaseId?.replace(/-/g, "")) return null;
    const file = field === "cover" ? page.cover : prop(page, "Light cover")?.files?.[0];
    return file ? pick(file) : null;
  }
  const block = await notion(`blocks/${id}`, { fresh: true });
  return block[block.type] && ["image", "video", "file", "pdf", "audio"].includes(block.type) ? pick(block[block.type]) : null;
}

function pick(file: Json) {
  if (file.type === "external") return { url: file.external.url as string };
  if (file.type === "file") return { url: file.file.url as string, expires: file.file.expiry_time as string };
  return null;
}
