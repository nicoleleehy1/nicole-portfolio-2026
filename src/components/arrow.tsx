// The site's one arrow: a thick, round-capped stroke in the accent teal (the style of the experience link
// arrow). `dir` picks the direction; it sizes with the surrounding text.
export type ArrowDir = "up-right" | "right" | "left" | "up" | "down";

// up-right is drawn on its own; the straight arrows are one right-pointing path rotated about the center
const UP_RIGHT = "M4 12 L12 4 M5.5 4 H12 V10.5";
const RIGHT = "M2.4 8 H13.6 M9 3.4 L13.6 8 L9 12.6";
const ROTATE: Record<Exclude<ArrowDir, "up-right">, number> = { right: 0, down: 90, left: 180, up: 270 };

export function Arrow({
  dir = "right",
  size = "0.75em",
  className,
}: {
  dir?: ArrowDir;
  size?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      className={className ? `arrow ${className}` : "arrow"}
    >
      <path
        d={dir === "up-right" ? UP_RIGHT : RIGHT}
        transform={dir === "up-right" ? undefined : `rotate(${ROTATE[dir]} 8 8)`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
