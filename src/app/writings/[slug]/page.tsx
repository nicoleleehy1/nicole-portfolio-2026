import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWriting, getWritings } from "@/lib/writings";

export const dynamicParams = false;

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
    <article style={{ padding: "2rem 0 3rem" }}>
      <Link href="/writings" className="back-link">← Writings</Link>
      <p className="writing-kind" style={{ marginTop: "1.5rem" }}>
        {[w.date && dateFormat.format(w.date), w.kind].filter(Boolean).join(" · ")}
      </p>
      <h1 className="writing-heading">{w.title}</h1>
      {w.question && (
        <p className="writing-question">
          <strong>Research question:</strong> {w.question}
        </p>
      )}
      {Body ? (
        <div className="prose"><Body /></div>
      ) : (
        // Converted from the Google Docs export; trusted, checked-in content.
        <div className="prose" dangerouslySetInnerHTML={{ __html: w.html ?? "" }} />
      )}
    </article>
  );
}
