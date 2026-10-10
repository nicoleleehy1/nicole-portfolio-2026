import type { Metadata } from "next";
import { leadership } from "../metadata";
import { Gallery, type GalleryItem } from "../../components/gallery";

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
    <section style={{ padding: "2rem 0 3rem" }}>
      <Gallery title="Leadership" items={items} />
    </section>
  );
}
