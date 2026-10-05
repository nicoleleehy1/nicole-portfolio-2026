import type { Metadata } from "next";
import { research } from "../metadata";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Research</h1>
      <div>
        {research.map((r, i) => (
          <div key={i} className="entry">
            <div className="entry-date">{r.date}</div>
            <div>
              <div className="entry-role">{r.role}</div>
              <div className="entry-co">{r.co}</div>
              <p className="entry-desc">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
