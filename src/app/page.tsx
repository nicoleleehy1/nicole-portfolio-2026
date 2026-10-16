import { SocialLinks } from "../components/social-links";
import { SubjectPin } from "../components/subject-pin";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-text scrim" data-content>
          <p className="eyebrow">PRT-2201 · Lock acquired · UC Berkeley · EECS × Bioengineering</p>
          <h1 className="hero-name">Hi, I&apos;m Nicole.</h1>
          <p className="hero-sub">I study how models represent living systems.</p>

          <p>
            I&apos;m a junior at UC Berkeley studying Electrical Engineering &amp; Computer Science and
            Bioengineering, supported by a $155K merit scholarship as an{" "}
            <a href="https://hkses.edb.gov.hk/en/index.html" target="_blank" rel="noreferrer" className="link">
              HKSES Scholar
            </a>
            . I work on AI mechanistic interpretability, and lately on how models represent biological systems.
          </p>

          <p className="block-label">Previous states</p>
          <p>
            I optimized MCP eval tools at{" "}
            <a href="https://www.apple.com/" target="_blank" rel="noreferrer" className="link">Apple</a> and ran ML
            research at{" "}
            <a href="https://albalab.ucsf.edu/" target="_blank" rel="noreferrer" className="link">
              UCSF&apos;s Memory and Aging Center
            </a>
            . I&apos;ve also built computer vision pipelines for ALS patients and AI cell segmentation tools for
            pathology images, which is exactly what this background is doing to itself right now.
          </p>

          <p className="block-label">Current state</p>
          <p>
            I help organize the world&apos;s{" "}
            <a href="https://www.calhacks.io/" target="_blank" rel="noreferrer" className="link">
              largest collegiate hackathon
            </a>{" "}
            and lead Berkeley&apos;s{" "}
            <a href="https://www.notion.com/" target="_blank" rel="noreferrer" className="link">Notion</a> community.
            Before that, I brought the{" "}
            <a
              href="https://www.scmp.com/news/hong-kong/society/article/3124432/fourteen-year-old-girl-takes-lead-organising-hong-kongs"
              target="_blank"
              rel="noreferrer"
              className="link"
            >
              first global hackathon
            </a>{" "}
            to Hong Kong.
          </p>

          <SocialLinks />
        </div>

        {/* Where the portrait used to be: the field keeps a cell locked here. */}
        <SubjectPin label="PRT-2201 · SUBJECT: NICOLE LEE · CONF .97" />
      </div>
    </section>
  );
}
