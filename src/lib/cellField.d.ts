export type ExclusionRect =
  | { left: number; top: number; right: number; bottom: number }
  | { x: number; y: number; width: number; height: number };

export type CellFieldOptions = {
  cell?: number;
  speed?: number;
  glow?: number;
  glitch?: number;
  boxMax?: number;
  track?: boolean;
  hover?: boolean;
  ascii?: boolean;
  plexus?: boolean;
  burst?: boolean;
  coral?: boolean;
  protein?: boolean;
  half?: boolean;
  paused?: boolean;
  // Most auto trackers at once.
  maxTrackers?: number;
  // Size multiplier for every structure (1 = the standalone piece).
  scale?: number;
  // Keep random glitch boxes in the outer bands of the page.
  edgeBoxes?: boolean;
  // Viewport rects (e.g. the content column) that structures are pushed out of.
  exclusionRects?: ExclusionRect[];
  // Element the one-line HUD readout is written into.
  readout?: HTMLElement | null;
  readoutLabel?: string;
  // font-family list for canvas labels; next/font renames families.
  fontFamily?: string;
  // false hides the collapsed Tune box (T toggles it either way).
  tune?: boolean;
};

export type CellFieldPin = {
  move(x: number, y: number): void;
  release(): void;
};

export type CellField = {
  destroy(): void;
  setOptions(options: CellFieldOptions): void;
  // Hold a cell near viewport point (x, y) with a permanent labeled tracker.
  pinNear(x: number, y: number, label?: string): CellFieldPin;
};

export function initCellField(container: HTMLElement, options?: CellFieldOptions): CellField;
