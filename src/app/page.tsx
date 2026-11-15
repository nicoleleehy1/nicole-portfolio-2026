import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "../components/social-links";
import { Footer } from "../components/footer";
import { ViewCount } from "../components/view-count";

export default function HomePage() {
  return (
    <>
    <ViewCount />
    <section className="hero">
      {/* No backing box: the text sits in the field, and cells are pushed around it (data-exclude). */}
      <div className="hero-text" data-content data-exclude>
        <Image src="/headshot-wide.png" alt="nicole shading her eyes and smiling by the bay bridge" width={480} height={480} priority className="hero-photo" />
        <h1 className="hero-name">hi! i&apos;m nicole˙ᵕ˙</h1>
        <p>
          i&apos;m a junior at{" "}
          <a href="https://hkses.edb.gov.hk/en/index.html" target="_blank" rel="noreferrer" className="link">uc berkeley</a>{" "}
          studying electrical engineering &amp; computer science +
          bioengineering, supported as a {" "}
          <a href="https://hkses.edb.gov.hk/en/index.html" target="_blank" rel="noreferrer" className="link">
            hkses scholar
          </a>
          {/* . i&apos;m broadly interested in applying computation to understand complex systems, and recently
          exploring mechanistic interpretability and compbio! */}
        </p>

        <p>
          previously, i optimized mcp/agent eval tools @ {" "}
          <a href="https://www.apple.com/" target="_blank" rel="noreferrer" className="link">apple </a> and ran ml
          research @ {" "}
          <a href="https://albalab.ucsf.edu/" target="_blank" rel="noreferrer" className="link">
            ucsf&apos;s memory and aging center
          </a>
          . i&apos;ve also built cv pipelines for als patients and ai cell segmentation tools for
          pathology images. recently, i built <a href="https://aster-ruby.vercel.app" target="_blank" rel="noreferrer" className="link">
            aster
          </a>, an ai decision engine predicting compounds drug discovery labs should text next.
        </p>

        <p>
          i build tech infrastructure for the world&apos;s{" "}
          <a href="https://www.calhacks.io/" target="_blank" rel="noreferrer" className="link">
            largest collegiate hackathon
          </a>{" "}
          and lead berkeley&apos;s{" "}
          <a href="https://www.notion.com/" target="_blank" rel="noreferrer" className="link">notion</a> community.
          before that, i brought the{" "}
          <a
            href="https://www.scmp.com/news/hong-kong/society/article/3124432/fourteen-year-old-girl-takes-lead-organising-hong-kongs"
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            first global hackathon
          </a>{" "}
          to hong kong.
        </p>

        <p>
          <Link href="/blog/what-ive-been-up-to" className="hero-button">see what i&apos;ve been up to!</Link>
        </p>

        <SocialLinks />
        <Footer className="hero-footer" />
      </div>
    </section>
    </>
  );
}
