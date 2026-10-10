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
    <section style={{ padding: "2rem 0 3rem" }}>
      <ListView title="Awards" items={items} />
    </section>
  );
}
