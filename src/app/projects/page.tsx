import type { Metadata } from "next";
import { projects } from "../metadata";
import { Gallery, type GalleryItem } from "../../components/gallery";
import { AsterCaseStudy } from "../../components/case-studies/aster";

// Case studies shown in the popup in place of "What I did", keyed by Project.caseStudy.
const caseStudies = { aster: <AsterCaseStudy /> };

export const metadata: Metadata = { title: "Projects" };

const items: GalleryItem[] = projects.map(p => ({
  title: p.name,
  subtitle: p.event,
  category: p.event === "Personal Project" ? "Personal" : "Hackathons & Competitions",
  image: p.image,
  award: p.award,
  props: [
    { label: "Event", value: p.event },
    ...(p.award ? [{ label: "Award", value: p.award }] : []),
    { label: "Stack", value: p.stack },
    p.link
      ? { label: "Link", value: p.link.includes("github.com") ? "Code" : "Live", href: p.link }
      : { label: "Link", value: "Private" },
  ],
  summary: p.summary,
  bulletsLabel: "What I did",
  bullets: p.desc,
  body: p.caseStudy && caseStudies[p.caseStudy],
  images: p.images,
}));

export default function ProjectsPage() {
  return (
    <section className="section scrim" data-content data-exclude>
      <Gallery title="Selected Projects" items={items} filterLabel="Type" wide />
    </section>
  );
}
