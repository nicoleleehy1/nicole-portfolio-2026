import type { Metadata } from "next";
import { experience } from "../metadata";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Experience</h1>
      <XpList entries={experience} />
    </section>
  );
}

type Entry = (typeof experience)[number];

function XpList({ entries }: { entries: Entry[] }) {
  return (
    <div>
      {entries.map((e, i) => (
        <details key={i} className="xp">
          <summary className="xp-summary">
            <div className="xp-head">
              <span className="xp-title">
                <span className="entry-role">{e.role}</span>
                <span className="xp-sep"> | </span>
                <span className="xp-co">{e.co}</span>
                {"link" in e && e.link && (
                  <a
                    className="xp-arrow"
                    href={e.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${e.co} website`}
                  >
                    <svg viewBox="0 0 16 16" width="0.75em" height="0.75em" aria-hidden="true">
                      <path
                        d="M4 12 L12 4 M5.5 4 H12 V10.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </span>
              <span className="xp-date">{e.date}</span>
            </div>
            <div className="xp-blurb">
              {e.summary}
              <span className="xp-chevron" aria-hidden="true">›</span>
            </div>
          </summary>
          <ul className="plain-list xp-desc">
            {e.desc.map((line, j) => (
              <li key={j}>{line}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
