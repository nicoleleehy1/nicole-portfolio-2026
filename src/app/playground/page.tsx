import type { Metadata } from "next";
import Link from "next/link";
import { experiments } from "./experiments";
import { SectionEyebrow } from "@/components/section-eyebrow";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <section className="section scrim" data-content data-exclude>
      <SectionEyebrow href="/playground" count={experiments.length} />
      <h1 className="page-title">Playground</h1>
      <p className="pg-intro">
        Small simulations where a handful of simple rules turns into something that looks alive. Each one runs in your
        browser; pick one and play.
      </p>
      <ol className="pg-grid">
        {experiments.map((x, i) => (
          <li key={x.slug}>
            <Link href={`/playground/${x.slug}`} className="pg-card">
              <span className="pg-card-num">EXP {String(i + 1).padStart(2, "0")}</span>
              <span className="pg-card-title">{x.title}</span>
              <span className="pg-card-play">{x.play}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
