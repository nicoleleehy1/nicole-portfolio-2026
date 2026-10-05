import type { Metadata } from "next";
import { projects } from "../metadata";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Selected Projects</h1>
      <div>
        {projects.map((p, i) => (
          <div key={i} className="project">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div className="project-title">{p.name}</div>
                <div className="project-meta">{p.event}</div>
              </div>
              {p.link && (
                <a href={p.link} target="_blank" rel="noreferrer" className="link" style={{ fontSize: "0.85rem" }}>
                  github
                </a>
              )}
            </div>
            <ul className="plain-list project-desc">
              {p.desc.map((line, j) => (
                <li key={j}>{line}</li>
              ))}
            </ul>
            <p className="project-stack">{p.stack}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
