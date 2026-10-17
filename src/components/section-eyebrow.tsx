import { sections } from "../app/metadata";

// Mono HUD line above a section's title, e.g. "SECTION 02 · LEADERSHIP · 18 RECORDS".
export function SectionEyebrow({ href, count }: { href: string; count: number }) {
  const i = sections.findIndex(s => s.href === href);
  return (
    <p className="eyebrow">
      SECTION {String(i + 1).padStart(2, "0")} · {sections[i].label} · {count} {count === 1 ? "record" : "records"}
    </p>
  );
}
