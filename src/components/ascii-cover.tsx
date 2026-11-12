import type { CSSProperties, ReactNode } from "react";
import { asciiCover, fixedCover, SHADED, type CoverKind } from "@/lib/ascii-covers";

// Splits shaded art into runs of equal brightness, each a span faded to its level.
function shadedRuns(art: string, shade: string) {
  const out: ReactNode[] = [];
  let run = "", level = "";
  const flush = () => {
    if (!run) return;
    const l = Number(level);
    out.push(l >= 0 ? <span key={out.length} style={{ opacity: 0.12 + 0.88 * (l / 9) ** 1.4 }}>{run}</span> : run);
    run = "";
  };
  for (let i = 0; i < art.length; i++) {
    const lv = art[i] === "\n" ? "-1" : shade[i];
    if (lv !== level) { flush(); level = lv; }
    run += art[i];
  }
  flush();
  return out;
}

// A post's ASCII-art cover. The type scales so `cols` characters exactly span the box's width.
// Fixed art (see fixedCover) ignores the slot's size and is shown whole at its own width, on character
// cells shaped like the image it was transcribed from (--cell), with per-character brightness if it has it.
// Shaded motifs also get a light-mode rendering with the density ramp flipped, swapped in by CSS.
export function AsciiCover({ slug, kind, cols, rows, className }: { slug: string; kind: CoverKind; cols: number; rows: number; className?: string }) {
  const shaded = SHADED.includes(kind);
  const fixed = fixedCover(kind);
  const width = fixed ? fixed.art.indexOf("\n") : cols;
  return (
    <figure className={["ascii-cover", `ascii-cover-${kind}`, className].filter(Boolean).join(" ")} style={{ "--cols": width, ...(fixed && { "--cell": fixed.cell }) } as CSSProperties} aria-hidden>
      <pre className={shaded ? "ascii-dark" : undefined}>
        {fixed?.shade ? shadedRuns(fixed.art, fixed.shade) : asciiCover(slug, kind, cols, rows)}
      </pre>
      {shaded && <pre className="ascii-light">{asciiCover(slug, kind, cols, rows, true)}</pre>}
    </figure>
  );
}
