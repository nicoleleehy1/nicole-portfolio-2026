import type { Metadata } from "next";
import { leadership } from "../metadata";
import { Gallery, type GalleryItem } from "../../components/gallery";
import { SectionEyebrow } from "../../components/section-eyebrow";

export const metadata: Metadata = { title: "Leadership" };

const items: GalleryItem[] = leadership.map(l => ({
  title: l.co,
  subtitle: l.role,
  category: l.category,
  date: l.date,
  image: l.image,
  props: [
    l.roles
      ? { label: "Roles", value: l.roles.map(r => `${r.title} (${r.date})`).join("\n") }
      : { label: "Role", value: l.role },
    { label: "Dates", value: l.date },
    { label: "Category", value: l.category },
    { label: "Summary", value: l.summary },
    { label: "Link", value: l.link ? "Website" : "", href: l.link },
  ].filter(p => p.value),
  bullets: l.desc,
}));

export default function LeadershipPage() {
  return (
    <section className="section scrim" data-content>
      <SectionEyebrow href="/leadership" count={leadership.length} />
      <Gallery title="Leadership" items={items} />
    </section>
  );
}
