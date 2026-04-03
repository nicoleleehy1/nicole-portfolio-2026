"use client"
import { useState, useEffect, useRef } from "react";
import "./portfolio.css"
import { experience, research, skills } from "./metadata";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');
 
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
:root {
  --bg: #f7f4f0;
  --ink: #1a1a18;
  --muted: #9a9589;
  --rule: #ddd8d0;
  --accent: #6b7fa3;
  --accent-warm: #c17f5a;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --mono: 'DM Mono', 'Courier New', monospace;
}
 
body { background: var(--bg); color: var(--ink); }
 
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes underlineIn {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
 
.fade-up { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }
.d1 { animation-delay: 0.05s; }
.d2 { animation-delay: 0.2s; }
.d3 { animation-delay: 0.35s; }
.d4 { animation-delay: 0.5s; }
.d5 { animation-delay: 0.65s; }
.d6 { animation-delay: 0.8s; }
.d7 { animation-delay: 0.95s; }
 
/* Typography */
.serif { font-family: var(--serif); }
.mono  { font-family: var(--mono); }
 
/* Nav */
.nav-link {
  font-family: var(--mono);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
  padding: 0.15rem 0;
  position: relative;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}
.nav-link:hover { color: var(--ink); }
.nav-link:hover::after { transform: scaleX(1); }
 
/* Soft link */
.soft-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--rule);
  transition: border-color 0.2s, color 0.2s;
}
.soft-link:hover { border-color: var(--accent); color: var(--accent); }
 
/* Hairline */
.rule { border: none; border-top: 1px solid var(--rule); }
 
/* Section label */
.label {
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}
 
/* Ticker tape */
.ticker-wrap {
  overflow: hidden;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  padding: 0.5rem 0;
}
.ticker-inner {
  display: flex;
  width: max-content;
  animation: marquee 28s linear infinite;
}
.ticker-inner:hover { animation-play-state: paused; }
.ticker-item {
  font-family: var(--mono);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: var(--muted);
  white-space: nowrap;
  padding: 0 1.5rem;
}
.ticker-dot {
  color: var(--accent);
  margin: 0 0.25rem;
}
 
/* Entry row */
.entry {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--rule);
}
.entry:last-child { border-bottom: none; }
.entry-date {
  font-family: var(--mono);
  font-size: 0.65rem;
  color: var(--muted);
  padding-top: 3px;
  line-height: 1.5;
}
.entry-role {
  font-family: var(--serif);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.2;
}
.entry-co {
  font-family: var(--mono);
  font-size: 0.65rem;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-top: 0.15rem;
}
.entry-co-link {
  font-family: var(--mono);
  font-size: 0.65rem;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-top: 0.15rem;
  text-decoration: underline;
}
.entry-desc {
  font-family: var(--mono);
  font-size: 0.68rem;
  color: #5e5c54;
  line-height: 1.7;
  margin-top: 0.3rem;
}
 
/* Fun hover card */
.fun-card {
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 1.25rem 1.5rem;
  transition: border-color 0.25s, background 0.25s;
  cursor: default;
}
.fun-card:hover {
  border-color: var(--accent);
  background: rgba(107,127,163,0.04);
}
 
/* Cursor blink */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent);
  margin-left: 3px;
  vertical-align: text-bottom;
  animation: blink 1.1s step-end infinite;
}
 
/* Skills flowing */
.skill-pill {
  font-family: var(--mono);
  font-size: 0.62rem;
  color: var(--muted);
  letter-spacing: 0.04em;
  display: inline-block;
}
.skill-dot { color: var(--rule); margin: 0 0.4rem; }

.stack-tags {
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  color: #9a9589;
  margin-top: 0.5rem;
  letter-spacing: 0.03em;
}

.skills-line {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: #5a5850;
  line-height: 1.9;
  letter-spacing: 0.03em;
}

.edu-degree {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 600;
}

.edu-meta {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: #9a9589;
  margin-top: 0.25rem;
  line-height: 1.6;
 
/* Footer */
.footer-txt {
  font-family: var(--mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  color: var(--muted);
  text-align: center;
  padding: 2rem 0 1.5rem;
}
 
/* Currently block */
.now-line {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}
.now-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7ec8a0;
  flex-shrink: 0;
  position: relative;
  top: -1px;
}
 
/* Mobile */
@media (max-width: 520px) {
  .entry { grid-template-columns: 1fr; gap: 0.35rem; }
  .entry-date { font-size: 0.6rem; }
  .edu-skills-row { flex-direction: column !important; }
}`


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
      <style>{CSS}</style>
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>

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

        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 clamp(1.25rem,6vw,3rem)" }}>

          {/* ── HERO ── */}
          <section style={{ padding: "5rem 0 4rem" }}>
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
                Electrical Engineering and Computer Science + Bioengineering @ UC Berkeley — currently{" "}
                <span style={{ color: "var(--ink)" }}>{typed}</span>
                <span className="cursor" />
              </p>
            </div>

            <div className={`fade-up d3`} style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.3rem 1.5rem" }}>
              {[
                { label: "email", href: "mailto:nicole.lee@berkeley.edu" },
                { label: "linkedin", href: "https://linkedin.com/in/nicolehylee/" },
                { label: "github", href: "https://github.com/nicoleleehy1" },
                { label: "resume", href: "/Nicole-Lee_Resume_April_2026.pdf"},
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

            {/* Currently block */}
            <div className={`fade-up d4`} style={{
              marginTop: "3rem",
              padding: "1.25rem 1.5rem",
              borderLeft: "2px solid var(--accent)",
              background: "rgba(107,127,163,0.04)",
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
                    <div className="entry-desc">{e.desc}</div>
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
                  NLP pipeline parsing PDFs into Neo4j knowledge graphs — 200+ nodes/doc, &lt;2s query latency. React + D3.js with 8 synchronized visualization modes. SM-2 spaced repetition with LLM flashcard generation.
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
                  Java · Python · Go · C/C++ · TypeScript · Rust · SQL
                  <br />
                  React · Next.js · Node · FastAPI · PostgreSQL · Redis
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
