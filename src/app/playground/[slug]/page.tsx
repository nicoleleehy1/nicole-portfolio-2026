import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { experiments } from "../experiments";
import { ExperimentView } from "@/components/playground/experiment";

export const dynamicParams = false;

export function generateStaticParams() {
  return experiments.map(x => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const x = experiments.find(x => x.slug === slug);
  return { title: x?.title, description: x?.idea };
}

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = experiments.findIndex(x => x.slug === slug);
  if (i < 0) notFound();
  const x = experiments[i];
  const prev = experiments[(i + experiments.length - 1) % experiments.length];
  const next = experiments[(i + 1) % experiments.length];

  return (
    <article className="section scrim" data-content data-exclude>
      <Link href="/playground" className="back-link">← Playground</Link>
      <p className="eyebrow" style={{ marginTop: "1.5rem" }}>
        EXP {String(i + 1).padStart(2, "0")} · {x.idea}
      </p>
      <h1 className="page-title">{x.title}</h1>
      <ExperimentView slug={x.slug} />
      <div className="prose pg-notes">
        <h2>What&apos;s going on</h2>
        {x.notes.map(p => (
          <p key={p}>{p}</p>
        ))}
        <h3>Things to try</h3>
        <ul>
          {x.tryThis.map(t => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <nav className="pg-pager" aria-label="More experiments">
        <Link href={`/playground/${prev.slug}`}>← {prev.title}</Link>
        <Link href={`/playground/${next.slug}`}>{next.title} →</Link>
      </nav>
    </article>
  );
}
