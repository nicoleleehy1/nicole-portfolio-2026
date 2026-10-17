import { SocialLinks } from "../components/social-links";
import { Footer } from "../components/footer";

export default function HomePage() {
  return (
    <section className="hero">
      {/* No backing box: the text sits in the field, and cells are pushed around it (data-exclude). */}
      <div className="hero-text" data-content data-exclude>
        <h1 className="hero-name">hi, i&apos;m nicole! ˙ᵕ˙</h1>
        <p>
          I&apos;m a junior at UC Berkeley studying Electrical Engineering &amp; Computer Science and
          Bioengineering, supported by a $155K merit scholarship as an{" "}
          <a href="https://hkses.edb.gov.hk/en/index.html" target="_blank" rel="noreferrer" className="link">
            HKSES Scholar
          </a>
          . I work on AI mechanistic interpretability, and lately on how models represent biological systems.
        </p>

        <p>
          Previously, I optimized MCP eval tools at{" "}
          <a href="https://www.apple.com/" target="_blank" rel="noreferrer" className="link">Apple</a> and ran ML
          research at{" "}
          <a href="https://albalab.ucsf.edu/" target="_blank" rel="noreferrer" className="link">
            UCSF&apos;s Memory and Aging Center
          </a>
          . I&apos;ve also built computer vision pipelines for ALS patients and AI cell segmentation tools for
          pathology images. Recently, I built <a href="https://aster-ruby.vercel.app" target="_blank" rel="noreferrer" className="link">
            Aster
          </a>, an AI decision engine predicting compounds drug discovery labs should text next.
        </p>

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
        <Footer className="hero-footer" />
      </div>
    </section>
  );
}
