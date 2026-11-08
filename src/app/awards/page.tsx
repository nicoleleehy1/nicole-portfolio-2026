import type { Metadata } from "next";
import { awards } from "../metadata";
import { ListView, type ListItem } from "../../components/list-view";

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
      <ListView title="Awards" items={items} />
    </section>
  );
}
