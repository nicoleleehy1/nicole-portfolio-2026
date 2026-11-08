import type { Metadata } from "next";
import { experience } from "../metadata";
import { XpList } from "../../components/xp-list";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return (
    <section className="section scrim" data-content data-exclude>
      <h1 className="page-title">experience ⋆.ೃ࿔ ˖*</h1>
      <XpList entries={experience} />
    </section>
  );
}
