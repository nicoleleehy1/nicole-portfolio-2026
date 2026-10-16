import type { Metadata } from "next";
import { awards } from "../metadata";
import { ListView, type ListItem } from "../../components/list-view";
import { SectionEyebrow } from "../../components/section-eyebrow";

export const metadata: Metadata = { title: "Awards" };

const items: ListItem[] = awards.map(a => ({
  title: a.title,
  subtitle: a.issuer,
  note: a.note,
  category: a.category,
  date: a.date,
}));

export default function AwardsPage() {
  return (
    <section className="section scrim" data-content data-exclude>
      <SectionEyebrow href="/awards" count={awards.length} />
      <ListView title="Awards" items={items} />
    </section>
  );
}
