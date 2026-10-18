"use client";
import { useEffect, useRef, useState } from "react";
import { experiments } from "./experiments";

// SF Symbols-style glyphs (chevron.left, list.bullet, chevron.right), drawn as rounded strokes to match
const chevronLeft = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 4.5 7.5 12l7.5 7.5" />
  </svg>
);
const chevronRight = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 4.5 7.5 7.5L9 19.5" />
  </svg>
);
const listBullet = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="4.5" cy="6" r="1.4" stroke="none" />
    <circle cx="4.5" cy="12" r="1.4" stroke="none" />
    <circle cx="4.5" cy="18" r="1.4" stroke="none" />
    <path d="M9 6h11M9 12h11M9 18h11" fill="none" />
  </svg>
);

// Interactive learning journal: the experiment runs on the left, my notes on it read on the right.
export function Playground() {
  const [index, setIndex] = useState(experiments.length - 1);
  const [listOpen, setListOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const exp = experiments[index];
  const { Stage } = exp;

  // step through the experiments, wrapping around at either end
  const go = (i: number) => {
    setIndex((i + experiments.length) % experiments.length);
    setListOpen(false);
  };

  // close the list on a click outside it or on Escape
  useEffect(() => {
    if (!listOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setListOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setListOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [listOpen]);

  return (
    <div className="pg">
      {experiments.length > 1 && (
        <div className="pg-nav" ref={navRef}>
          <button type="button" className="pg-nav-btn" onClick={() => go(index - 1)} aria-label="Previous experiment" title="Previous">
            {chevronLeft}
          </button>
          <button
            type="button"
            className={`pg-nav-btn${listOpen ? " active" : ""}`}
            onClick={() => setListOpen(o => !o)}
            aria-label="All experiments"
            aria-expanded={listOpen}
            aria-haspopup="menu"
            title="All experiments"
          >
            {listBullet}
          </button>
          <button type="button" className="pg-nav-btn" onClick={() => go(index + 1)} aria-label="Next experiment" title="Next">
            {chevronRight}
          </button>
          {listOpen && (
            <ul className="pg-nav-menu" role="menu" aria-label="Experiments">
              {experiments.map((e, i) => (
                <li key={e.slug}>
                  <button
                    type="button"
                    role="menuitem"
                    aria-current={i === index}
                    className={`pg-nav-item${i === index ? " active" : ""}`}
                    onClick={() => go(i)}
                  >
                    <span className="pg-tab-tag">{e.tag}</span> {e.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="pg-layout">
        <div className="pg-stage">
          {/* key remounts the stage so switching experiments starts each one fresh */}
          <Stage key={exp.slug} />
        </div>

        <article className="pg-notes">
          <h2 className="pg-notes-title">{exp.title}</h2>
          <p className="pg-howto">{exp.howTo}</p>
          <div className="pg-notes-body">{exp.notes}</div>
        </article>
      </div>
    </div>
  );
}
