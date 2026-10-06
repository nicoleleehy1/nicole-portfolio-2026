import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ComponentType } from "react";
import { essays } from "@/app/metadata";

const DIR = path.join(process.cwd(), "src/content/writings");

// Front matter at the top of each .mdx post.
type PostMeta = {
  title: string;
  date?: string | Date;
  summary?: string;
  kind?: string;
  draft?: boolean;
};

export type Writing = {
  slug: string;
  title: string;
  kind?: string;
  summary?: string;
  question?: string;
  date?: Date;
  format: "mdx" | "html";
};

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
        if (m.draft && !showDrafts) return null;
        const w: Writing = {
          slug,
          title: m.title,
          kind: m.draft ? `Draft${m.kind ? ` · ${m.kind}` : ""}` : m.kind,
          summary: m.summary,
          date: m.date ? new Date(m.date) : undefined,
          format: "mdx",
        };
        return w;
      }),
  );
  const archived: Writing[] = essays.map(e => ({ ...e, format: "html" }));
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
