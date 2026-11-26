import type { Metadata } from "next";
import { projects } from "../metadata";
import { Gallery, type GalleryItem } from "../../components/gallery";
import { AsterCaseStudy } from "../../components/case-studies/aster";
import { CodeMRICaseStudy } from "../../components/case-studies/codemri";
import { PokerLabCaseStudy } from "../../components/case-studies/pokerlab";
import { ProjectShowcase, type ShowcaseItem } from "../../components/project-showcase";
import "./showcase.css";
import "./project-page.css";

// Case studies shown in the popup in place of "What I did", keyed by Project.caseStudy.
const caseStudies = {
  aster: <AsterCaseStudy />,
  codemri: <CodeMRICaseStudy />,
  pokerlab: <PokerLabCaseStudy />,
};

export const metadata: Metadata = { title: "Projects" };

const items: GalleryItem[] = projects.map(p => ({
  title: p.name,
  subtitle: p.event,
  category: p.event === "Personal Project" ? "Personal" : "Hackathons & Competitions",
  image: p.image,
  ascii: p.ascii,
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

// Dithered illustration for each project in the showcase: mask file prefix and width / height.
const art: Record<string, [string, number]> = {
  "Hackathons @ Berkeley": ["teddy2", 900 / 1365],
  PokerLab: ["pokerlab", 900 / 693],
  Aster: ["aster2", 900 / 870],
  CodeMRI: ["codemri", 900 / 681],
  "After You": ["after-you", 900 / 597],
  Flusk: ["flusk", 900 / 648],
  Stoich: ["stoich", 900 / 759],
  "Synapse AI": ["synapse", 824 / 647],
};

// Same rule as gallerySlug in gallery.tsx (a client module, so it can't be called here).
const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const showcase: ShowcaseItem[] = projects
  .filter(p => art[p.name])
  .map(p => ({
    slug: slug(p.name),
    title: p.name,
    event: p.event,
    line: p.summary?.[0] ?? "",
    art: art[p.name][0],
    ratio: art[p.name][1],
  }));

export default function ProjectsPage() {
  return (
    <section className="section scrim" data-content data-exclude>
      <Gallery title="selected projects" items={items} filterLabel="Type" wide hideGrid intro={<ProjectShowcase items={showcase} />} />
    </section>
  );
}
