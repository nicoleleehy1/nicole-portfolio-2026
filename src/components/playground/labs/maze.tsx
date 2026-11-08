"use client";
import { useEffect, useState } from "react";
import { css, fit2d, mix, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, useSim } from "../controls";

const COLS = 32;
const ROWS = 20;
const N = 1, E = 2, S = 4, Wd = 8;
const DIRS = [
  { bit: N, opp: S, dx: 0, dy: -1 },
  { bit: E, opp: Wd, dx: 1, dy: 0 },
  { bit: S, opp: N, dx: 0, dy: 1 },
  { bit: Wd, opp: E, dx: -1, dy: 0 },
];

type Algorithm = "backtracker" | "prim" | "kruskal" | "wilson" | "binary";
type Stats = { steps: number; done: boolean; deadEnds: number };

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// Maze state plus what the current algorithm wants highlighted.
class Grid {
  walls = new Uint8Array(COLS * ROWS).fill(15);
  inMaze = new Uint8Array(COLS * ROWS);
  current: number[] = [];
  frontier = new Set<number>();
  path: number[] = [];
  // Kruskal's colors each cell by the region it currently belongs to
  region: ((i: number) => number) | null = null;

  neighbors(i: number) {
    const x = i % COLS;
    const y = (i / COLS) | 0;
    const out: { j: number; bit: number; opp: number }[] = [];
    for (const d of DIRS) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) out.push({ j: ny * COLS + nx, bit: d.bit, opp: d.opp });
    }
    return out;
  }

  carve(i: number, j: number) {
    const n = this.neighbors(i).find(n => n.j === j)!;
    this.walls[i] &= ~n.bit;
    this.walls[j] &= ~n.opp;
    this.inMaze[i] = this.inMaze[j] = 1;
  }

  deadEnds() {
    let n = 0;
    for (let i = 0; i < this.walls.length; i++) {
      const w = this.walls[i];
      const open = 4 - (((w & 1) + ((w >> 1) & 1) + ((w >> 2) & 1) + ((w >> 3) & 1)));
      if (open === 1) n++;
    }
    return n;
  }
}

// Depth-first: walk forward until stuck, then back up. Long, winding corridors and few branches.
function* backtracker(g: Grid) {
  const start = Math.floor(Math.random() * COLS * ROWS);
  const stack = [start];
  g.inMaze[start] = 1;
  while (stack.length) {
    const i = stack[stack.length - 1];
    g.current = [i];
    g.path = stack;
    const open = g.neighbors(i).filter(n => !g.inMaze[n.j]);
    if (open.length) {
      const n = pick(open);
      g.carve(i, n.j);
      stack.push(n.j);
    } else stack.pop();
    yield;
  }
}

// Prim's: grow outward from one cell, attaching a random cell from the whole frontier each step. Short dead ends, radial.
function* prim(g: Grid) {
  const add = (i: number) => {
    g.inMaze[i] = 1;
    g.frontier.delete(i);
    for (const n of g.neighbors(i)) if (!g.inMaze[n.j]) g.frontier.add(n.j);
  };
  add(Math.floor(Math.random() * COLS * ROWS));
  while (g.frontier.size) {
    const i = pick([...g.frontier]);
    const into = pick(g.neighbors(i).filter(n => g.inMaze[n.j]));
    g.carve(i, into.j);
    add(i);
    g.current = [i];
    yield;
  }
}

// Kruskal's: knock down random walls anywhere, as long as they join two separate regions. Many small pieces merge at once.
function* kruskal(g: Grid) {
  const parent = new Int32Array(COLS * ROWS).map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  g.region = find;
  const edges: [number, number][] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    if (i % COLS < COLS - 1) edges.push([i, i + 1]);
    if (i < COLS * (ROWS - 1)) edges.push([i, i + COLS]);
  }
  for (let k = edges.length - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1));
    [edges[k], edges[r]] = [edges[r], edges[k]];
  }
  for (const [a, b] of edges) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) continue;
    parent[ra] = rb;
    g.carve(a, b);
    g.current = [a, b];
    yield;
  }
}

// Wilson's: random walks that erase their own loops until they hit the maze. Unbiased, but slow to get started.
function* wilson(g: Grid) {
  g.inMaze[Math.floor(Math.random() * COLS * ROWS)] = 1;
  let remaining = COLS * ROWS - 1;
  while (remaining > 0) {
    const outside: number[] = [];
    for (let i = 0; i < COLS * ROWS; i++) if (!g.inMaze[i]) outside.push(i);
    let cell = pick(outside);
    const walk = [cell];
    const at = new Map([[cell, 0]]);
    while (!g.inMaze[cell]) {
      cell = pick(g.neighbors(cell)).j;
      const seen = at.get(cell);
      if (seen !== undefined) {
        // erase the loop just made
        for (const c of walk.splice(seen + 1)) at.delete(c);
      } else {
        at.set(cell, walk.length);
        walk.push(cell);
      }
      g.path = walk;
      g.current = [cell];
      yield;
    }
    for (let k = 0; k < walk.length - 1; k++) {
      g.carve(walk[k], walk[k + 1]);
      remaining--;
    }
    g.path = [];
  }
}

// Binary tree: every cell independently opens north or east. Fast and simple, with a telltale diagonal bias.
function* binary(g: Grid) {
  for (let i = 0; i < COLS * ROWS; i++) {
    const options = g.neighbors(i).filter(n => n.bit === N || n.bit === E);
    if (options.length) g.carve(i, pick(options).j);
    else g.inMaze[i] = 1;
    g.current = [i];
    yield;
  }
}

const ALGORITHMS = { backtracker, prim, kruskal, wilson, binary };

class MazeView implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private p!: Palette;
  private grid = new Grid();
  private run: Generator<void> = backtracker(this.grid);
  private steps = 0;
  private done = false;
  private frames = 0;
  private algorithm: Algorithm = "backtracker";
  speed = 4;
  onStats?: (s: Stats) => void;

  constructor(private canvas: HTMLCanvasElement) {}

  reset() {
    this.start(this.algorithm);
  }

  start(algorithm: Algorithm) {
    this.algorithm = algorithm;
    this.grid = new Grid();
    this.run = ALGORITHMS[algorithm](this.grid);
    this.steps = 0;
    this.done = false;
  }

  finish() {
    while (!this.done) this.advance();
  }

  private advance() {
    if (this.run.next().done) {
      this.done = true;
      this.grid.current = [];
      this.grid.path = [];
      this.grid.frontier.clear();
      this.report();
    } else this.steps++;
  }

  private report() {
    this.onStats?.({ steps: this.steps, done: this.done, deadEnds: this.done ? this.grid.deadEnds() : 0 });
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
  }

  setPalette(p: Palette) {
    this.p = p;
  }

  frame(dt: number) {
    if (dt && !this.done) {
      for (let s = 0; s < this.speed && !this.done; s++) this.advance();
      if (++this.frames % 6 === 0) this.report();
    }
    this.draw();
  }

  private draw() {
    const { ctx, p, grid } = this;
    const cw = this.w / COLS;
    const ch = this.h / ROWS;
    const regionColors = [p.a, p.b, p.c, p.d, p.e].map(c => css(mix(p.bg, c, 0.32)));
    ctx.fillStyle = css(p.bg);
    ctx.fillRect(0, 0, this.w, this.h);
    const fillCell = (i: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect((i % COLS) * cw, ((i / COLS) | 0) * ch, cw + 0.5, ch + 0.5);
    };
    const settled = css(mix(p.bg, p.a, p.light ? 0.16 : 0.12));
    for (let i = 0; i < COLS * ROWS; i++) {
      if (grid.region && !this.done) fillCell(i, regionColors[(Math.imul(grid.region(i), 2654435761) >>> 0) % 5]);
      else if (grid.inMaze[i]) fillCell(i, settled);
    }
    for (const i of grid.frontier) fillCell(i, css(p.c, 0.35));
    for (const i of grid.path) fillCell(i, css(p.d, 0.45));
    for (const i of grid.current) fillCell(i, css(p.b, 0.9));

    ctx.strokeStyle = css(p.ink, p.light ? 0.75 : 0.7);
    ctx.lineWidth = Math.max(1.5, cw * 0.1);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = (i % COLS) * cw;
      const y = ((i / COLS) | 0) * ch;
      const w = grid.walls[i];
      if (w & N) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + cw, y);
      }
      if (w & Wd) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + ch);
      }
      if (i % COLS === COLS - 1 && w & E) {
        ctx.moveTo(x + cw, y);
        ctx.lineTo(x + cw, y + ch);
      }
      if (i >= COLS * (ROWS - 1) && w & S) {
        ctx.moveTo(x, y + ch);
        ctx.lineTo(x + cw, y + ch);
      }
    }
    ctx.stroke();
  }
}

const create = (canvas: HTMLCanvasElement) => new MazeView(canvas);

export default function Maze() {
  const { canvasRef, stage, simRef } = useSim(create);
  const [algorithm, setAlgorithm] = useState<Algorithm>("backtracker");
  const [speed, setSpeed] = useState(4);
  const [stats, setStats] = useState<Stats>({ steps: 0, done: false, deadEnds: 0 });

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.onStats = setStats;
    sim.start(algorithm);
  }, [algorithm, simRef]);
  useEffect(() => {
    if (simRef.current) simRef.current.speed = speed;
  }, [speed, simRef]);

  return (
    <Stage
      canvasRef={canvasRef}
      sim={stage}
      hint="Pick an algorithm and watch it carve. Every one makes a perfect maze: exactly one route between any two cells."
      readout={stats.done ? `${stats.steps} steps · ${stats.deadEnds} dead ends` : `${stats.steps} steps`}
    >
      <Choice
        label="Algorithm"
        value={algorithm}
        options={[
          { value: "backtracker", label: "Backtracker" },
          { value: "prim", label: "Prim" },
          { value: "kruskal", label: "Kruskal" },
          { value: "wilson", label: "Wilson" },
          { value: "binary", label: "Binary tree" },
        ]}
        onChange={setAlgorithm}
      />
      <Slider label="Speed" value={speed} min={1} max={40} onChange={setSpeed} format={v => `${v} steps/frame`} />
      <Buttons>
        <Btn onClick={() => simRef.current?.finish()}>Finish now</Btn>
      </Buttons>
    </Stage>
  );
}
