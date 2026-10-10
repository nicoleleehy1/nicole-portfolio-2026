import type { Metadata } from "next";
import { experience } from "../metadata";
import { XpList } from "../../components/xp-list";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return (
    <section style={{ padding: "2rem 0 3rem" }}>
      <h1 className="page-title">Experience</h1>
      <XpList entries={experience} />
    </section>
  );
}
