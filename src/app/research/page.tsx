import type { Metadata } from "next";
import { research } from "../metadata";
import { XpList } from "../../components/xp-list";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Research</h1>
      <XpList entries={research} />
    </section>
  );
}
