"use client";
import { useState } from "react";
import { experiments } from "./experiments";

// Interactive learning journal: the experiment runs on the left, my notes on it read on the right.
export function Playground() {
  const [slug, setSlug] = useState(experiments[experiments.length - 1].slug);
  const exp = experiments.find(e => e.slug === slug) ?? experiments[0];
  const { Stage } = exp;

  return (
    <div className="pg">
      {experiments.length > 1 && (
        <div className="pg-tabs" role="tablist" aria-label="Experiments">
          {experiments.map(e => (
            <button
              key={e.slug}
              type="button"
              role="tab"
              aria-selected={e.slug === slug}
              className={`pg-tab${e.slug === slug ? " active" : ""}`}
              onClick={() => setSlug(e.slug)}
            >
              <span className="pg-tab-tag">{e.tag}</span> {e.title}
            </button>
          ))}
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
