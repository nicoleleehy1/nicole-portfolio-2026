import type { Metadata } from "next";
import { experience } from "../metadata";
import { XpList } from "../../components/xp-list";
import { SectionEyebrow } from "../../components/section-eyebrow";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return (
    <section className="section scrim" data-content data-exclude>
      <SectionEyebrow href="/experience" count={experience.length} />
      <h1 className="page-title">Experience</h1>
      <XpList entries={experience} />
    </section>
  );
}
