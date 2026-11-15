"use client";
import { Fragment, useEffect, useRef, useState } from "react";
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

// Expandable rows: company | role and date, with bullets revealed on click. A column of dots beside the list
// follows the scroll, lighting the entry currently in view; clicking a dot jumps to its entry.
export function XpList({ entries }: { entries: XpEntry[] }) {
  const rows = useRef<(HTMLDetailsElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // the active entry is the last one whose top has passed 40% of the way down the screen
      const line = window.innerHeight * 0.4;
      let next = 0;
      rows.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) next = i;
      });
      // at the very bottom of the page, the last entry may never reach the line
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        next = rows.current.length - 1;
      }
      setActive(next);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const jump = (i: number) => {
    const el = rows.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="xp-wrap">
      <nav className="xp-dots" aria-label="Experience entries">
        <div className="xp-dots-track">
          {entries.map((e, i) => (
            <button
              key={i}
              type="button"
              className={`xp-dot${i === active ? " is-active" : ""}`}
              aria-label={e.co.trim()}
              aria-current={i === active ? "true" : undefined}
              onClick={() => jump(i)}
            />
          ))}
        </div>
      </nav>
      {entries.map((e, i) => (
        <details
          key={i}
          className="xp"
          ref={el => {
            rows.current[i] = el;
          }}
        >
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
