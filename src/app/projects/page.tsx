import type { Metadata } from "next";
import { projects } from "../metadata";
import { ProjectCover } from "../../components/project-cover";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Selected Projects</h1>
      <div className="project-grid">
        {projects.map((p, i) => (
          <article key={p.name} className="project-card">
            <div className="project-cover-wrap">
              <ProjectCover seed={p.name} image={p.image} alt={p.name} />
              {p.award && <span className="ribbon">{p.award}</span>}
            </div>
            <div className="project-info">
              <div className="project-meta">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>{p.event}</span>
              </div>
              <h2 className="project-name">{p.name}</h2>
              <p className="project-blurb">{p.desc[0]}</p>
              <div className="project-tags">
                {p.stack.split(" · ").slice(0, 4).map(t => (
                  <span key={t} className="project-tag">{t}</span>
                ))}
              </div>
              {p.link ? (
                <a href={p.link} target="_blank" rel="noreferrer" className="project-code">
                  {p.link.includes("github.com") ? "Code" : "Live"} ↗
                </a>
              ) : (
                <span className="project-code private">Private</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
