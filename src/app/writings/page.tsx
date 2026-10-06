import type { Metadata } from "next";
import Link from "next/link";
import { getWritings } from "@/lib/writings";

export const metadata: Metadata = { title: "Writings" };

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function WritingsPage() {
  const writings = await getWritings();
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Writings</h1>
      <div>
        {writings.map(w => (
          <Link key={w.slug} href={`/writings/${w.slug}`} className="writing-item">
            <span className="writing-kind">
              {[w.date && dateFormat.format(w.date), w.kind].filter(Boolean).join(" · ")}
            </span>
            <span className="writing-title">{w.title}</span>
            {w.summary && <span className="writing-summary">{w.summary}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
