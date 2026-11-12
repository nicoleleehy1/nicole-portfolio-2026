import { WAVE_ART } from "./ascii-wave";
import { ALPHAFOLD_ART, ALPHAFOLD_SHADE } from "./ascii-alphafold";
import { SPROUT_ART } from "./ascii-sprout";

// Procedural ASCII-art cover images for blog posts. Each post gets a motif picked from its topic
// (or named with `cover:` in its front matter), drawn deterministically from its slug so it never
// changes between builds.

export const COVER_KINDS = ["helix", "alignment", "molecule", "bits", "scatter", "pulse", "automaton", "wave", "alphafold", "sprout", "field"] as const;
export type CoverKind = (typeof COVER_KINDS)[number];

type Grid = string[][];
type Rand = () => number;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32: tiny seeded PRNG
function rng(seed: number): Rand {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const blank = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<string>(w).fill(" "));
const put = (g: Grid, x: number, y: number, c: string) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c;
};
const text = (g: Grid, x: number, y: number, s: string) => [...s].forEach((c, i) => put(g, x + i, y, c));
// true if a run of cells is on the canvas and holds nothing but background
const free = (g: Grid, x: number, y: number, len: number) =>
  x >= 0 && Array.from({ length: len }, (_, n) => g[y]?.[x + n]).every(c => c === " " || c === ".");
const dust = (g: Grid, r: Rand, p: number, c = ".") =>
  g.forEach((row, y) => row.forEach((_, x) => { if (r() < p) put(g, x, y, c); }));

// a double helix running across the frame, with base-pair rungs
function helix(g: Grid, r: Rand) {
  const w = g[0].length, h = g.length;
  const mid = (h - 1) / 2, amp = mid - 1.5;
  const k = (2 * Math.PI) / (w * (0.4 + r() * 0.15)), ph = r() * Math.PI * 2;
  const pairs = ["A=T", "T=A", "G#C", "C#G"];
  dust(g, r, 0.012);
  for (let x = 0; x < w; x++) {
    const t = x * k + ph;
    const y1 = Math.round(mid + amp * Math.sin(t)), y2 = Math.round(mid - amp * Math.sin(t));
    if (x % 4 === 1 && Math.abs(y1 - y2) > 3) {
      const [a, b] = y1 < y2 ? [y1, y2] : [y2, y1];
      const pair = pairs[Math.floor(r() * 4)];
      for (let y = a + 1; y < b; y++) put(g, x, y, y === a + 1 ? pair[0] : y === b - 1 ? pair[2] : "|");
    }
    const d = amp * k * Math.cos(t);
    const slope = (s: number) => (Math.abs(s) < 0.45 ? (s === 0 ? "-" : "~") : s > 0 ? "\\" : "/");
    // the strand in front is drawn last so it crosses over the other
    const strands: [number, string][] = [[y1, slope(d)], [y2, slope(-d)]];
    if (Math.cos(t) > 0) strands.reverse();
    for (const [y, c] of strands) put(g, x, y, c);
    // steep stretches skip rows, so bridge them to keep each strand continuous
    for (const [y, sgn] of [[y1, 1], [y2, -1]] as const) {
      const yNext = Math.round(mid + sgn * amp * Math.sin(t + k));
      if (Math.abs(yNext - y) > 1) put(g, x, y + Math.sign(yNext - y), sgn * Math.cos(t) > 0 ? "\\" : "/");
    }
  }
}

// a multiple sequence alignment with one mutated column flagged
function alignment(g: Grid, r: Rand) {
  const w = g[0].length, h = g.length;
  const aa = "ACDEFGHIKLMNPQRSTVWY";
  const consensus = Array.from({ length: w }, () => aa[Math.floor(r() * aa.length)]);
  const col = 8 + Math.floor(r() * (w - 16));
  for (let x = 0; x < w; x++) put(g, x, 0, x % 10 === 0 ? "|" : x % 5 === 0 ? ":" : ".");
  const mutant = 2 + Math.floor(r() * (h - 4));
  for (let y = 1; y < h - 1; y++) {
    for (let x = 0; x < w; x++) {
      let c = consensus[x];
      const roll = r();
      if (roll < 0.06) c = "-";
      else if (roll < 0.2 && x !== col) c = aa[Math.floor(r() * aa.length)];
      put(g, x, y, c);
    }
    if (y === mutant) put(g, col, y, aa[(aa.indexOf(consensus[col]) + 7) % aa.length]);
  }
  put(g, col, h - 1, "^");
  text(g, col + 2, h - 1, `${consensus[col]}${col + 1}${g[mutant][col]}`);
}

// fused six-membered rings: a few loose molecules with side groups
function molecule(g: Grid, r: Rand) {
  const w = g[0].length, h = g.length;
  dust(g, r, 0.012);
  const cols = Math.floor((w - 9) / 4), rows = Math.floor((h - 4) / 2);
  const ring = (i: number, j: number) => {
    const x = i * 4, y = j * 2 + (i & 1);
    text(g, x + 1, y, "___");
    put(g, x, y + 1, "/"); put(g, x + 4, y + 1, "\\");
    put(g, x, y + 2, "\\"); text(g, x + 1, y + 2, "___"); put(g, x + 4, y + 2, "/");
  };
  const neighbors = (i: number, j: number) => {
    const dj = i & 1 ? 1 : -1;
    return [[i, j - 1], [i, j + 1], [i - 1, j], [i + 1, j], [i - 1, j + dj], [i + 1, j + dj]]
      .filter(([a, b]) => a >= 0 && a < cols && b >= 0 && b < rows);
  };
  const groups = ["OH", "NH2", "Cl", "F", "CH3", "O", "N", "Br"];
  const taken = new Set<string>();
  const count = 2 + Math.floor(r() * 2);
  for (let m = 0; m < count; m++) {
    const lo = Math.floor((m / count) * cols), hi = Math.max(lo + 1, Math.floor(((m + 1) / count) * cols) - 2);
    const start: [number, number] = [lo + Math.floor(r() * (hi - lo)), Math.floor(r() * rows)];
    const cells: [number, number][] = [start];
    taken.add(start.join());
    const size = 3 + Math.floor(r() * 4);
    for (let tries = 0; cells.length < size && tries < 60; tries++) {
      const [ci, cj] = cells[Math.floor(r() * cells.length)];
      const options = neighbors(ci, cj).filter(([a, b]) => a >= lo && a < hi + 1 && !taken.has(`${a},${b}`));
      if (!options.length) continue;
      const next = options[Math.floor(r() * options.length)] as [number, number];
      taken.add(next.join());
      cells.push(next);
    }
    cells.forEach(([i, j]) => ring(i, j));
    // side groups off the rightmost and leftmost rings
    const right = cells.reduce((a, b) => (b[0] > a[0] ? b : a));
    const left = cells.reduce((a, b) => (b[0] < a[0] ? b : a));
    const rx = right[0] * 4, ry = right[1] * 2 + (right[0] & 1);
    const rg = `--${groups[Math.floor(r() * groups.length)]}`;
    if (free(g, rx + 5, ry + 1, rg.length)) text(g, rx + 5, ry + 1, rg);
    const lg = groups[Math.floor(r() * groups.length)];
    const lx = left[0] * 4, ly = left[1] * 2 + (left[0] & 1) + 2;
    if (free(g, lx - lg.length - 2, ly, lg.length + 2)) text(g, lx - lg.length - 2, ly, `${lg}--`);
  }
}

// sparse molecular fingerprints: rows of bits, some columns lighting up often
function bits(g: Grid, r: Rand) {
  const w = g[0].length;
  const hot = Array.from({ length: w }, () => (r() < 0.18 ? 0.55 : 0.06));
  g.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      if (x % 9 === 8) continue;
      put(g, x, y, r() < hot[x] ? "1" : ".");
    }
  });
}

// points on axes with a fitted line through them
function scatter(g: Grid, r: Rand) {
  const w = g[0].length, h = g.length;
  const ox = 2, oy = h - 2;
  for (let y = 0; y < oy; y++) put(g, ox, y, "|");
  for (let x = ox; x < w; x++) put(g, x, oy, "-");
  put(g, ox, oy, "+");
  for (let x = ox + 6; x < w; x += 8) put(g, x, oy + 1, "'");
  const slope = (r() - 0.35) * 0.5, b = oy * (0.35 + r() * 0.3);
  const fit = (x: number) => b + slope * (x - ox) * (oy / (w - ox));
  for (let x = ox + 1; x < w; x += 2) put(g, x, Math.round(oy - fit(x)), ".");
  const n = Math.floor(w * 0.7);
  for (let p = 0; p < n; p++) {
    const x = ox + 1 + Math.floor(r() * (w - ox - 1));
    const y = Math.round(oy - fit(x) + (r() + r() + r() - 1.5) * oy * 0.35);
    if (y > 0 && y < oy) put(g, x, y, r() < 0.7 ? "o" : "*");
  }
}

// a heartbeat trace over a monitor grid
function pulse(g: Grid, r: Rand) {
  const w = g[0].length, h = g.length;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (y % 4 === 0 && x % 6 === 0) put(g, x, y, "+");
    else if (y % 4 === 0 && x % 2 === 0) put(g, x, y, ".");
  }
  const base = Math.round(h * 0.6), period = Math.floor(w / (2.4 + r())), off = Math.floor(r() * period);
  const shape = (p: number) => {
    if (p === 3 || p === 5) return -1; // P wave
    if (p === 4) return -2;
    if (p === 9) return 1; // Q
    if (p === 10) return -(base - 1); // R
    if (p === 11) return h - 2 - base; // S
    if (p >= 15 && p <= 18) return p === 16 || p === 17 ? -2 : -1; // T wave
    return 0;
  };
  let prev = base;
  for (let x = 0; x < w; x++) {
    const y = base + shape((x + off) % period);
    if (Math.abs(y - prev) > 1) {
      for (let yy = Math.min(y, prev) + 1; yy < Math.max(y, prev); yy++) put(g, x, yy, "|");
    }
    put(g, x, y, y === base ? "_" : y < prev ? "/" : y > prev ? "\\" : "-");
    prev = y;
  }
}

// an elementary cellular automaton unrolling down the frame
function automaton(g: Grid, r: Rand) {
  const w = g[0].length, h = g.length;
  const rule = [30, 90, 110, 45, 150][Math.floor(r() * 5)];
  let row = Array.from({ length: w }, (_, x) => (rule === 110 ? r() < 0.5 : x === Math.floor(w / 2)));
  for (let y = 0; y < h; y++) {
    row.forEach((on, x) => put(g, x, y, on ? "#" : " "));
    row = row.map((_, x) => {
      const n = (+row[(x - 1 + w) % w] << 2) | (+row[x] << 1) | +row[(x + 1) % w];
      return ((rule >> n) & 1) === 1;
    });
  }
}

// interference of a few waves, shaded with a density ramp
function field(g: Grid, r: Rand, invert: boolean) {
  const ramp = invert ? "@%#*+=-:. " : " .:-=+*#%@";
  const p = Array.from({ length: 6 }, () => r());
  const cx = p[4] * g[0].length, cy = p[5] * g.length;
  g.forEach((row, y) => row.forEach((_, x) => {
    const v =
      Math.sin(x * (0.08 + p[0] * 0.1) + y * 0.3 + p[1] * 6) +
      Math.sin(x * 0.05 - y * (0.2 + p[2] * 0.3) + p[3] * 6) +
      Math.sin(Math.hypot((x - cx) * 0.6, y - cy) * 0.45);
    put(g, x, y, ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(((v + 3) / 6) * ramp.length)))]);
  }));
}

const DRAW: Record<Exclude<CoverKind, keyof typeof FIXED>, (g: Grid, r: Rand, invert: boolean) => void> = { helix, alignment, molecule, bits, scatter, pulse, automaton, field };

// first match wins; checked against the slug, title and kind
const TOPICS: [RegExp, CoverKind][] = [
  [/alphafold/i, "alphafold"],
  [/been up to/i, "sprout"],
  [/helix|epigen|genes?\b/i, "helix"],
  [/mutation|sequence|alignment/i, "alignment"],
  [/fingerprint|ridge|encoder/i, "bits"],
  [/null result|did-not-help/i, "scatter"],
  [/compound|molecul|drug|chem/i, "molecule"],
  [/health|medic|clinic|hospital/i, "pulse"],
  [/playground|wave|ocean/i, "wave"],
  [/automat|cellular|game of life/i, "automaton"],
];

export function coverKind(topic: string, override?: string): CoverKind {
  if (override && (COVER_KINDS as readonly string[]).includes(override)) return override as CoverKind;
  return TOPICS.find(([re]) => re.test(topic))?.[1] ?? "field";
}

// motifs that are a fixed piece of art rather than drawn to size; shown whole at their own dimensions
// `cell` is the width of one character cell in em, matching the source image's character grid;
// `shade`, if present, gives each character a brightness digit 0-9 in the same layout as `art`
type Fixed = { art: string; cell: number; shade?: string };
const FIXED: Record<"wave" | "alphafold" | "sprout", Fixed> = {
  sprout: { art: SPROUT_ART, cell: 2 / 3 },
  wave: { art: WAVE_ART, cell: 1 },
  alphafold: { art: ALPHAFOLD_ART, cell: 0.6, shade: ALPHAFOLD_SHADE },
};
export function fixedCover(kind: CoverKind): Fixed | undefined {
  return kind in FIXED ? FIXED[kind as keyof typeof FIXED] : undefined;
}

// motifs that come out differently for light mode (field flips its ramp); the rest ignore `invert`
export const SHADED: readonly CoverKind[] = ["field"];

export function asciiCover(slug: string, kind: CoverKind, w: number, h: number, invert = false) {
  const g = blank(w, h);
  const fixed = fixedCover(kind);
  if (fixed) return fixed.art;
  DRAW[kind as Exclude<CoverKind, keyof typeof FIXED>](g, rng(hash(`${slug}:${w}x${h}`)), invert);
  return g.map(row => row.join("").replace(/\s+$/, "")).join("\n");
}
