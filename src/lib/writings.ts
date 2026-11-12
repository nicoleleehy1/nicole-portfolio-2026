import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ComponentType } from "react";
import { essays } from "@/app/metadata";
import { coverKind, type CoverKind } from "@/lib/ascii-covers";

const DIR = path.join(process.cwd(), "src/content/writings");

// Front matter at the top of each .mdx post.
type PostMeta = {
  title: string;
  date?: string | Date;
  summary?: string;
  kind?: string;
  draft?: boolean;
  // hidden posts are left out everywhere, including `npm run dev`
  hidden?: boolean;
  // pinned posts sit at the top of the blog's front page, above the newest story
  pinned?: boolean;
  // optional ASCII cover motif (see COVER_KINDS in src/lib/ascii-covers.ts); picked from the topic if left out
  cover?: string;
};

export type Writing = {
  slug: string;
  title: string;
  kind?: string;
  summary?: string;
  question?: string;
  date?: Date;
  format: "mdx" | "html";
  cover: CoverKind;
  minutes: number;
  pinned?: boolean;
};

// "{updated}" in a title becomes the post's date as "nov 2026", so a running post's title
// tracks when it was last updated: bump `date` and the title follows.
const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const fillTitle = (title: string, date?: Date) => title.replace("{updated}", date ? monthYear.format(date).toLowerCase() : "");

// Rough reading time at ~230 words a minute.
async function readingMinutes(file: string) {
  const raw = await readFile(path.join(DIR, file), "utf8");
  const words = raw.replace(/^---[\s\S]*?---/, "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

// Drafts are visible in `npm run dev` so you can preview them, and hidden in production.
const showDrafts = process.env.NODE_ENV !== "production";

async function loadPost(slug: string) {
  const mod: { default: ComponentType; metadata: PostMeta } = await import(`@/content/writings/${slug}.mdx`);
  return mod;
}

export async function getWritings(): Promise<Writing[]> {
  const files = await readdir(DIR);
  const posts = await Promise.all(
    files
      .filter(f => f.endsWith(".mdx"))
      .map(async f => {
        const slug = f.replace(/\.mdx$/, "");
        const { metadata: m } = await loadPost(slug);
        if (m.hidden || (m.draft && !showDrafts)) return null;
        const date = m.date ? new Date(m.date) : undefined;
        const w: Writing = {
          slug,
          title: fillTitle(m.title, date),
          kind: m.draft ? `Draft${m.kind ? ` · ${m.kind}` : ""}` : m.kind,
          summary: m.summary,
          date,
          format: "mdx",
          cover: coverKind(`${slug} ${m.title} ${m.kind ?? ""}`, m.cover),
          minutes: await readingMinutes(f),
          pinned: m.pinned,
        };
        return w;
      }),
  );
  const archived: Writing[] = await Promise.all(
    essays.map(async e => ({
      ...e,
      format: "html" as const,
      cover: coverKind(`${e.slug} ${e.title} ${e.kind}`),
      minutes: await readingMinutes(`${e.slug}.html`),
    })),
  );
  // Newest first; undated pieces (the archived essays) go last in their listed order.
  const dated = posts.filter((p): p is Writing => p !== null).sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  return [...dated, ...archived];
}

export async function getWriting(slug: string) {
  const w = (await getWritings()).find(w => w.slug === slug);
  if (!w) return null;
  if (w.format === "mdx") {
    const { default: Body } = await loadPost(slug);
    return { ...w, Body, html: undefined };
  }
  const html = await readFile(path.join(DIR, `${slug}.html`), "utf8");
  return { ...w, Body: undefined, html };
}
