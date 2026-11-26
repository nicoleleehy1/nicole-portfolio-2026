"use client";
import { Fragment } from "react";
import { Arrow } from "./arrow";

export type XpEntry = {
  date: string;
  role: string;
  co: string;
  summary: string;
  desc: string[];
  link?: string;
};

// plain-text arrows in the copy ("6+ hrs → 20 mins") become the site's arrow
function withArrows(text: string) {
  const parts = text.split("→");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <Arrow />}
    </Fragment>
  ));
}

// Expandable rows: company | role and date, with bullets revealed on click.
export function XpList({ entries }: { entries: XpEntry[] }) {
  return (
    <div>
      {entries.map((e, i) => (
        <details key={i} className="xp">
          <summary className="xp-summary">
            <div className="xp-head">
              <span className="xp-title">
                {e.link ? (
                  <a className="entry-role xp-co-link" href={e.link} target="_blank" rel="noreferrer">
                    {e.co.trim()}
                  </a>
                ) : (
                  <span className="entry-role">{e.co.trim()}</span>
                )}
                <span className="xp-sep"> | </span>
                <span className="xp-co">{e.role}</span>
              </span>
              <span className="xp-date">{e.date}</span>
            </div>
            <div className="xp-blurb">
              {withArrows(e.summary)}
              <span className="xp-chevron" aria-hidden="true">
                <Arrow />
              </span>
            </div>
          </summary>
          <ul className="plain-list xp-desc">
            {e.desc.map((line, j) => (
              <li key={j}>{withArrows(line)}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
