import { skills } from "./metadata";
import { Portrait } from "../components/portrait";
import { SocialLinks } from "../components/social-links";

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section style={{ padding: "2rem 0 3rem" }}>
        {/* <p className="eyebrow">Berkeley, California</p> */}
        <h1 className="hero-name">Hi! I'm Nicole☺︎</h1>

        <div className="hero-grid">
          <div className="hero-text">
            <p>
              I&apos;m a junior at UC Berkeley
              studying Electrical Engineering & Computer Science and
              Bioengineering, supported by $155K merit scholarship as a{" "}
              <a href="https://hkses.edb.gov.hk/en/index.html" target="_blank" rel="noreferrer" className="link">
                HKSES Scholar
              </a>. 
              I'm broadly interested in AI mechanistic interpretability,
              and recently exploring how models represent biological systems.
            </p>

            {/* <p className="muted"> 
              Previously, I optimized MCP eval tools at <a href="https://www.apple.com/" target="_blank" rel="noreferrer" className="link">Apple</a>, 
              advanced clinical analytics at <a href="https://www.wedge.ai/" target="_blank" rel="noreferrer" className="link">Wedge</a>,
              built CV pipelines for ALS patients at <a href="https://anchorlogics.com/" target="_blank" rel="noreferrer" className="link">Anchor Logics</a>, 
              and cell segmentation for pathology images at <a href="https://www.digpath.ai/" target="_blank" rel="noreferrer" className="link">DigPath</a>. 
              I also conducted ML research at <a href="https://albalab.ucsf.edu/" target="_blank" rel="noreferrer" className="link">UCSF’s Memory and Aging Center</a>.              
            </p> */}

            <p className="muted"> 


              Previously, I optimized MCP eval tools at{" "}
              <a href="https://www.apple.com/" target="_blank" rel="noreferrer" className="link">Apple</a>{" "} 
              and conducted ML research at <a href="https://albalab.ucsf.edu/" target="_blank" rel="noreferrer" className="link">UCSF’s Memory and Aging Center</a>.
              I was also involved in building CV pipelines for ALS patients and AI cell segmentation for pathology images.
            </p>
            
            <p className="muted"> 
              Currently, I help organize the world&apos;s <a href="https://www.calhacks.io/" target="_blank" rel="noreferrer" className="link">largest collegiate hackathon</a>{" "} 
              and lead Berkeley&apos;s <a href="https://www.notion.com/" target="_blank" rel="noreferrer" className="link">Notion</a> community. 
              Before that, I introduced the <a href="https://www.scmp.com/news/hong-kong/society/article/3124432/fourteen-year-old-girl-takes-lead-organising-hong-kongs" target="_blank" rel="noreferrer" className="link">first global hackathon</a> to Hong Kong.
            </p>

            <SocialLinks />
          </div>

          <Portrait />
        </div>
      </section>

      {/* <hr className="rule" /> */}

      {/* ── EDUCATION + SKILLS ──
      <section style={{ padding: "3rem 0" }}>
        <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 260px" }}>
            <p className="label">Education</p>
            <div className="edu-degree">UC Berkeley</div>
            <p className="edu-meta">
              B.S. EECS + B.S. Bioengineering<br />
              Expected May 2027
            </p>
            <p className="edu-meta">
              Hong Kong Scholarship for Excellence Scheme Scholar<br />
              USD$154,000 award
            </p>
          </div>

          <div style={{ flex: "1 1 260px" }}>
            <p className="label">Skills</p>
            <p className="edu-meta">{skills.join(" · ")}</p>
          </div>
        </div>
      </section> */}
    </>
  );
}
