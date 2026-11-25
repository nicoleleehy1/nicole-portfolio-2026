import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWriting, getWritings } from "@/lib/writings";
import { Arrow } from "@/components/arrow";
import { ThemedImage } from "@/components/themed-image";
import { NotionBody } from "@/components/notion-body";

// Posts written in Notion show up without a rebuild: pages are refreshed at most once a minute
// (keep in sync with NOTION_REVALIDATE), and new slugs are rendered on their first visit.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getWritings()).map(w => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = await getWriting(slug);
  return { title: w?.title, description: w?.summary };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function WritingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await getWriting(slug);
  if (!w) notFound();
  const { Body } = w;

  return (
    <article className="section scrim" data-content data-exclude>
      <Link href="/blog" className="back-link"><Arrow dir="left" /> Blog</Link>
      <p className="writing-kind" style={{ marginTop: "1.5rem" }}>
        {[w.date && dateFormat.format(w.date), w.kind].filter(Boolean).join(", ")}
      </p>
      <h1 className="writing-heading">{w.title}</h1>
      <p className="blog-byline">By Nicole Lee, {w.minutes} min read</p>
      {w.note && <p className="writing-note">{w.note}</p>}
      {w.source && (
        <p className="writing-note">
          See full article <a href={w.source} target="_blank" rel="noopener noreferrer">here</a>
        </p>
      )}
      {w.image && w.caption && (
        <figure className="writing-art">
          <ThemedImage src={w.image} light={w.imageLight} alt={w.caption} loading="eager" />
          <figcaption>{w.caption}</figcaption>
        </figure>
      )}
      {w.question && (
        <p className="writing-question">
          <strong>Research question:</strong> {w.question}
        </p>
      )}
      {Body ? (
        <div className="prose"><Body /></div>
      ) : w.blocks ? (
        <div className="prose"><NotionBody blocks={w.blocks} /></div>
      ) : (
        // Converted from the Google Docs export; trusted, checked-in content.
        <div className="prose" dangerouslySetInnerHTML={{ __html: w.html ?? "" }} />
      )}
    </article>
  );
}
