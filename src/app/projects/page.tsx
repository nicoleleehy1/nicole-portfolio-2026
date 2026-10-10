import type { Metadata } from "next";
import { projects } from "../metadata";
import { Gallery, type GalleryItem } from "../../components/gallery";

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
  bullets: p.desc,
}));

export default function ProjectsPage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <Gallery title="Selected Projects" items={items} filterLabel="Type" />
    </section>
  );
}
