import type { CSSProperties } from "react";

// A project as the collage needs it. Each one has a 1-bit dithered illustration in /public/projects/showcase:
// <art>-lightp.png (lit dots, used on the dark theme), <art>-darkp.png (shadow dots, used on the light theme)
// and <art>-cut.png (the outline of the backing).
export type ShowcaseItem = {
  slug: string;
  title: string;
  event: string;
  line: string;
  art: string;
  // width / height of the illustration
  ratio: number;
};

// width / height of the padded masks used for the collage cut-outs
const CUT_RATIO: Record<string, number> = {
  aster2: 928 / 898,
  synapse: 852 / 675,
  codemri: 928 / 709,
  teddy2: 928 / 1393,
  "after-you": 928 / 625,
  pokerlab: 928 / 721,
  flusk: 928 / 676,
  stoich: 928 / 787,
};

// The illustration on a backing in the page colour that is a little bigger than the object,
// so each piece gets a thin cut-out edge and stands apart from whatever is behind it.
function Art({ item }: { item: ShowcaseItem }) {
  return (
    <span
      className="dith-wrap"
      style={
        {
          "--light": `url(/projects/showcase/${item.art}-lightp.png)`,
          "--dark": `url(/projects/showcase/${item.art}-darkp.png)`,
          "--shape": `url(/projects/showcase/${item.art}-cut.png)`,
          aspectRatio: CUT_RATIO[item.art] ?? item.ratio,
        } as CSSProperties
      }
    >
      <span className="dith" role="img" aria-label={item.title} />
    </span>
  );
}

// Projects as a collage of overlapping 1-bit illustrations (Nicole's own arrangement on a 1080 x 652 stage).
// Hovering a piece lifts it; clicking opens that project's full-screen page via #slug.
const COLLAGE: Record<string, { x: number; y: number; w: number; r: number; z: number }> = {
  "synapse-ai": { x: 68, y: 60, w: 390, r: 0, z: 1 },
  "hackathons-berkeley": { x: 411, y: 39, w: 219, r: 0, z: 2 },
  "after-you": { x: 222, y: 242, w: 295, r: 0, z: 3 },
  flusk: { x: 594, y: 88, w: 317, r: 0, z: 4 },
  aster: { x: 609, y: 192, w: 386, r: 0, z: 5 },
  codemri: { x: 62, y: 324, w: 393, r: 0, z: 6 },
  pokerlab: { x: 355, y: 359, w: 276, r: 0, z: 7 },
  stoich: { x: 531, y: 446, w: 222, r: 0, z: 8 },
};
export function ProjectShowcase({ items }: { items: ShowcaseItem[] }) {
  return (
    <div className="sc-collage" aria-label="Projects">
      {items.map(item => {
        const c = COLLAGE[item.slug];
        if (!c) return null;
        return (
          <a
            key={item.slug}
            href={`#${item.slug}`}
            className="sc-collage-piece"
            style={
              {
                left: `${(c.x / 1080) * 100}%`,
                top: `${(c.y / 652) * 100}%`,
                width: `${(c.w / 1080) * 100}%`,
                zIndex: c.z,
                "--r": `${c.r}deg`,
              } as CSSProperties
            }
          >
            <Art item={item} />
            <span className="sc-collage-tag">
              {item.title.toLowerCase()} · {item.event.toLowerCase()}
            </span>
          </a>
        );
      })}
    </div>
  );
}
