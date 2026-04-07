"use client"
import { useState, useEffect, useRef } from "react";
import { experience, research, skills } from "./metadata";
import { AnimatedSphere } from "../components/animated-sphere";


// Typing animation hook
function useTyping(phrases: string[], speed = 60, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return display.slice(0, charIdx) || phrases[phraseIdx].slice(0, charIdx);
}

export default function Portfolio() {
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const typed = useTyping([
    "building things that matter.",
    "designing for social impact.",
    "fueled by curiosity + boba.",
  ], 55, 1800);

  useEffect(() => { setMounted(true); }, []);

  const tickerContent = [
    "React", "TypeScript", "Python", "Next.js", "GraphQL", "AWS",
    "PyTorch", "Node.js", "PostgreSQL", "Docker", "Neo4j", "FastAPI",
  ];
  const doubled = [...tickerContent, ...tickerContent];

  return (
    <>
      {/* <style>{CSS}</style> */}
      <div style={{ minHeight: "100vh" }}>

        {/* ── STICKY NAV ── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(247,244,240,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--rule)",
          padding: "0.9rem clamp(1.25rem,6vw,3rem)",
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: "1rem", fontWeight: 500, letterSpacing: "0.01em" }}>
              Nicole Lee
            </span>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              {["Experience", "Research", "Projects", "Education"].map(s => (
                <a key={s} href={`#${s.toLowerCase()}`} className="nav-link">{s}</a>
              ))}
            </div>
          </div>
        </nav>

        <main style={{ 
            maxWidth: 870, 
            margin: "0 auto", 
            padding: "0 clamp(1.25rem,6vw,3rem)",
            position: "relative"  // ← add this
          }}>

          {/* ── HERO ── */}
          <div style={{ position: "relative" }}>

            {/* Subtle Grid lines */}
            <div style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100vw",
              pointerEvents: "none",
              opacity: 0.05,
              zIndex: -1,
            }}>
              {[...Array(8)].map((_, i) => (
                <div key={`h-${i}`} style={{
                  position: "absolute",
                  height: "1px",
                  left: 0, right: 0,
                  top: `${12.5 * (i + 1)}%`,
                  backgroundColor: "var(--ink)",
                }} />
              ))}
              {[...Array(12)].map((_, i) => (
                <div key={`v-${i}`} style={{
                  position: "absolute",
                  width: "1px",
                  top: 0, bottom: 0,
                  left: `${8.33 * (i + 1)}%`,
                  backgroundColor: "var(--ink)",
                }} />
              ))}
            </div>
          <section style={{ padding: "5rem 0 4rem", position: "relative", zIndex: 1 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
              {/* LEFT: text */}
              <div>
                <div className={`fade-up d1`}>
                  <p className="label" style={{ marginBottom: "1.5rem" }}>
                    Berkeley, California
                  </p>
                  <h1 style={{
                    fontFamily: "var(--serif)",
                    fontSize: "clamp(4rem,9vw,6rem)",
                    fontWeight: 300,
                    letterSpacing: "-0.02em",
                    lineHeight: 0.95,
                    marginBottom: "1.5rem",
                  }}>
                    Hello! I'm<br />
                    <em style={{ fontStyle: "italic" }}>Nicole.</em>
                  </h1>
                </div>

                <div className={`fade-up d2`}>
                  <p style={{
                    fontFamily: "var(--mono)",
                    fontSize: "clamp(0.72rem,2vw,0.82rem)",
                    color: "var(--muted)",
                    lineHeight: 1.7,
                    marginBottom: "0.5rem",
                  }}>
                    Electrical Engineering and Computer Science + Bioengineering <span style={{ color: "var(--ink)" }}>UC Berkeley</span> 
                    <br /> — currently{" "}
                    <span style={{ color: "var(--accent)" }}>{typed}</span>
                    <span className="cursor" />
                  </p>
                </div>

                <div className={`fade-up d3`} style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.3rem 1.5rem" }}>
                {[
                  { label: "email", href: "mailto:nicole.lee@berkeley.edu" },
                  { label: "linkedin", href: "https://linkedin.com/in/nicolehylee/" },
                  { label: "github", href: "https://github.com/nicoleleehy1" },
                  { label: "resume", href: "/Nicole_Lee_Resume_April_2026.pdf"},
                ].map(l => (
                  <a key={l.label} 
                    href={l.href} 
                    target={l.href.startsWith("http") ? "_blank" : undefined} 
                    rel="noreferrer"
                    className="soft-link"
                    style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                    {l.label}
                  </a>
                ))}
              </div>
              </div>

              {/* RIGHT: sphere */}
              <div style={{ 
                width: "360px", 
                height: "370px", 
                overflow: "hidden", 
                flexShrink: 0 }}>
                <AnimatedSphere />
              </div>

            </div>

            {/* Currently block */}
            <div className={`fade-up d4`} style={{
              position: "relative",
              marginTop: "3rem",
              padding: "1.25rem 1.5rem",
              borderLeft: "2px solid var(--accent)",
              background: "rgba(107,127,163,0.04)",
              zIndex: 2,
            }}>
              <p className="label" style={{ marginBottom: "0.75rem" }}>Currently</p>
              {[
                "Teaching full-stack development @ UC Berkeley",
                "Director @ Cal Hacks (world's largest collegiate hackathon)",
                "Open to internship roles for Summer 2026",
              ].map((line, i) => (
                <div key={i} className="now-line">
                  <div className="now-dot" />
                  <span style={{ fontFamily: "var(--mono)", fontSize: "0.7rem", color: "#5e5c54", lineHeight: 1.5 }}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

          <hr className="rule fade-up d4" />

          {/* ── TICKER ── */}
          <div className={`fade-up d5`} style={{ margin: "2rem 0" }}>
            <div className="ticker-wrap">
              <div className="ticker-inner">
                {doubled.map((item, i) => (
                  <span key={i} className="ticker-item">
                    {item}
                    <span className="ticker-dot">·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <hr className="rule" />

          {/* ── EXPERIENCE ── */}
          <section id="experience" style={{ padding: "3.5rem 0" }}>
            <p className="label fade-up d1" style={{ marginBottom: "2rem" }}>Experience</p>
            <div>
              {experience.map((e, i) => (
                <div key={i} className="entry fade-up" style={{ animationDelay: `${0.05 + i * 0.08}s` }}>
                  <div className="entry-date">{e.date}</div>
                  <div>
                    <div className="entry-role">{e.role}</div>
                    {e.link ? (
                      <a className="entry-co entry-co-link" href={e.link} target="_blank" rel="noreferrer">{e.co}</a>
                    ) : (
                      <div className="entry-co">{e.co}</div>
                    )}
                    <div className="entry-desc">
                      {e.desc.split('\n').map((line, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div className="now-dot" style={{ marginTop: "0.7em", flexShrink: 0 }} />
                          <span>{line.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="rule" />

          {/* ── RESEARCH ── */}
          <section id="research" style={{ padding: "3.5rem 0" }}>
            <p className="label fade-up d1" style={{ marginBottom: "2rem" }}>Research</p>
            <div>
              {research.map((r, i) => (
                <div key={i} className="entry fade-up" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                  <div className="entry-date">{r.date}</div>
                  <div>
                    <div className="entry-role">{r.role}</div>
                    <div className="entry-co">{r.co}</div>
                    <div className="entry-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="rule" />

          {/* ── PROJECTS ── */}
          <section id="projects" style={{ padding: "3.5rem 0" }}>
            <p className="label fade-up d1" style={{ marginBottom: "2rem" }}>Selected Projects</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* Featured project */}
              <div 
                className="fun-card fade-up d2">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <p style={{ fontFamily: "var(--serif)", fontSize: "1.15rem", fontWeight: 600 }}>Synapse AI</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "0.65rem", color: "var(--accent)", marginTop: "0.1rem" }}>HackMIT 2025</p>
                  </div>
                <a 
                  href="https://github.com/nicoleleehy1/synapse"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", border: "1px solid var(--rule)", padding: "0.2rem 0.5rem", borderRadius: "2px", textDecoration: "none" }}
                >
                  Github
                </a>
                </div>
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "#5e5c54", lineHeight: 1.7, marginTop: "0.6rem" }}>
                  → Built an NLP pipeline parsing PDFs into structured knowledge graphs, extracting 200+ concept nodes and typed relationships per document into a Neo4j graph database.
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "#5e5c54", lineHeight: 1.7, marginTop: "0.3rem" }}>
                  → Engineered a React + D3.js frontend rendering 8 synchronized visualization modes (force-directed graph, kanban, timeline, mind map, etc.) with real-time bidirectional edits across all views.
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "#5e5c54", lineHeight: 1.7, marginTop: "0.3rem" }}>
                  → Integrated SM-2 spaced repetition scheduling with LLM-generated flashcards and cloze deletions via Anthropic API, and Exa.ai for semantic web search enrichment.
                </p>
                <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--muted)", marginTop: "0.6rem", letterSpacing: "0.03em" }}>
                  Python · TypeScript · React · Neo4j · Anthropic API · spaCy · D3.js
                </p>
              </div>

              {/* Other projects in a 2-col grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(0,1fr))", gap: "1rem" }}>
                {[
                  {
                    name: "ASL Live Translator",
                    event: "TreeHacks 2025",
                    desc: "Real-time ASL letter recognition converting sign language to speech and live captions for nonverbal users.",
                    stack: "Python · React · OpenCV · MediaPipe · TensorFlow.js",
                  },
                  {
                    name: "Insurmate",
                    event: "Bolt Hacks 2025",
                    desc: "AI insurance agent — document parsing, policy comparison, and natural language Q&A over coverage details.",
                    stack: "React · TensorFlow.js · LangChain",
                  },
                ].map((p, i) => (
                  <div key={i} className="fun-card fade-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                    <p style={{ fontFamily: "var(--serif)", fontSize: "1rem", fontWeight: 600 }}>{p.name}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--accent)", marginTop: "0.1rem" }}>{p.event}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "0.66rem", color: "#5e5c54", lineHeight: 1.65, marginTop: "0.5rem" }}>{p.desc}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", marginTop: "0.5rem" }}>{p.stack}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>


          <hr className="hairline" style={{ marginBottom: "3rem" }} />

          {/* ── EDUCATION + SKILLS ── */}
          <section className={`fade-section delay-4`} style={{ marginBottom: "3.5rem" }}>
            <div
              style={{ display: "flex", gap: "3rem", flexWrap: "wrap", alignItems: "flex-start" }}
            >
              {/* Education */}
              <div style={{ flex: "1 1 260px" }}>
                <p className="label fade-up d1" style={{ marginBottom: "2rem" }}>Education</p>
                <div className="edu-degree">UC Berkeley</div>
                <div className="edu-meta">
                  B.S. EECS + B.S. Bioengineering<br />
                  Expected May 2027
                </div>
                <div className="edu-meta" style={{ marginTop: "0.75rem", color: "#6b7fa3" }}>
                  Hong Kong Scholarship for Excellence Scheme Scholar<br />
                  <span style={{ color: "#9a9589" }}>USD$154,000 award</span>
                </div>
              </div>
 
              {/* Skills */}
              <div style={{ flex: "1 1 260px" }}>
                <p className="label fade-up d1" style={{ marginBottom: "2rem" }}>Skills</p>
                <div className="skills-line">
                  Java · Python · Go · C/C++ · TypeScript · SQL
                  <br />
                  React · Next.js · Node · Express · FastAPI · PostgreSQL · Docker
                  <br />
                  AWS · Docker · PyTorch · TensorFlow · OpenCV
                </div>
              </div>
            </div>
          </section>
 
          <hr className="hairline" style={{ marginBottom: "3rem" }} />

          {/* ── A BIT ABOUT ME ──
          <section style={{ padding: "3.5rem 0" }}>
            <p className="label fade-up d1" style={{ marginBottom: "2rem" }}>A bit about me</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
              {[
                { emoji: "🧬", title: "Why bioe + cs?", body: "I want to build software that actually heals people — the intersection of computation and biology is where I think the most interesting problems live." },
                { emoji: "🏆", title: "Cal hacks", body: "Organizing the world's biggest collegiate hackathon is equal parts exhilarating and chaos. 4,000 hackers, 36 hours, zero sleep." },
                { emoji: "🌏", title: "Hong Kong", body: "Spent a year researching at HKU on a full scholarship. Best decision I ever made — shaped how I think about global health + data." },
                { emoji: "🎓", title: "Teaching", body: "I TA full-stack development and genuinely love it. There's something special about watching a student's first deploy go live." },
              ].map((card, i) => (
                <div key={i} className="fun-card fade-up" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                  <p style={{ fontSize: "1.2rem", marginBottom: "0.4rem" }}>{card.emoji}</p>
                  <p style={{ fontFamily: "var(--serif)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.4rem" }}>{card.title}</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "0.66rem", color: "#5e5c54", lineHeight: 1.65 }}>{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="rule" /> */}

          {/* ── FOOTER ── */}
          <footer className="fade-up d6">
            <p className="footer-txt">
              Built with ♥ by Nicole Lee · {new Date().getFullYear()} ·{" "}
              <a href="https://github.com/nicoleleehy1" target="_blank" rel="noreferrer"
                className="soft-link" style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.14em" }}>
                github
              </a>
              {" · "}
              <a href="https://linkedin.com/in/nicolehylee/" target="_blank" rel="noreferrer"
                className="soft-link" style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", letterSpacing: "0.14em" }}>
                linkedin
              </a>
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
