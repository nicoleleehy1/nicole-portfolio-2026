"use client";
import { useEffect, useState } from "react";
import { css, fit2d, mix, rng, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, useSim } from "../controls";

const COLS = 40;
const ROWS = 25;
const OPEN = 0;
const WALL = 1;
const MUD = 2;
const MUD_COST = 5;

type Algorithm = "bfs" | "dijkstra" | "astar" | "greedy";
type Result = { explored: number; cost: number | null; length: number };
const NAMES: Record<Algorithm, string> = { bfs: "Breadth-first", dijkstra: "Dijkstra", astar: "A*", greedy: "Greedy" };

// Minimal binary heap keyed by priority, with insertion order breaking ties.
class Heap {
  private items: [number, number, number][] = [];
  private n = 0;
  get size() {
    return this.items.length;
  }
  push(priority: number, value: number) {
    const a = this.items;
    a.push([priority, this.n++, value]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.less(a[p], a[i])) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top[2];
  }
  private less(x: [number, number, number], y: [number, number, number]) {
    return x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]);
  }
}

type Search = {
  explored: Uint8Array;
  frontier: Uint8Array;
  order: Int32Array;
  path: number[];
  count: number;
  done: boolean;
  cost: number | null;
};

const neighbors = (i: number) => {
  const x = i % COLS;
  const y = (i / COLS) | 0;
  const out: number[] = [];
  if (y > 0) out.push(i - COLS);
  if (x < COLS - 1) out.push(i + 1);
  if (y < ROWS - 1) out.push(i + COLS);
  if (x > 0) out.push(i - 1);
  return out;
};
const manhattan = (a: number, b: number) => Math.abs((a % COLS) - (b % COLS)) + Math.abs(((a / COLS) | 0) - ((b / COLS) | 0));

// One generator covers all four: they differ only in how they rank the frontier.
//   BFS: by steps taken (ignores mud) · Dijkstra: by true cost so far · A*: cost so far + distance left · Greedy: distance left only
function* search(cells: Uint8Array, start: number, goal: number, algorithm: Algorithm, s: Search) {
  const cost = new Float64Array(COLS * ROWS).fill(Infinity);
  const steps = new Int32Array(COLS * ROWS);
  const from = new Int32Array(COLS * ROWS).fill(-1);
  const heap = new Heap();
  const rank = (i: number) =>
    algorithm === "bfs" ? steps[i] : algorithm === "dijkstra" ? cost[i] : algorithm === "astar" ? cost[i] + manhattan(i, goal) : manhattan(i, goal);
  cost[start] = 0;
  heap.push(0, start);
  s.frontier[start] = 1;
  while (heap.size) {
    const i = heap.pop();
    if (s.explored[i]) continue;
    s.explored[i] = 1;
    s.frontier[i] = 0;
    s.order[i] = s.count++;
    if (i === goal) break;
    for (const j of neighbors(i)) {
      if (cells[j] === WALL || s.explored[j]) continue;
      const c = cost[i] + (cells[j] === MUD ? MUD_COST : 1);
      // BFS and Greedy keep the first route they find to a cell; the cost-aware searches keep the cheapest
      const better = algorithm === "bfs" || algorithm === "greedy" ? from[j] === -1 && j !== start : c < cost[j];
      if (!better) continue;
      cost[j] = c;
      steps[j] = steps[i] + 1;
      from[j] = i;
      heap.push(rank(j), j);
      s.frontier[j] = 1;
    }
    yield;
  }
  s.done = true;
  if (!s.explored[goal]) return;
  for (let i = goal; i !== -1; i = from[i]) s.path.unshift(i);
  s.cost = cost[goal];
}

function newSearch(): Search {
  return {
    explored: new Uint8Array(COLS * ROWS),
    frontier: new Uint8Array(COLS * ROWS),
    order: new Int32Array(COLS * ROWS),
    path: [],
    count: 0,
    done: false,
    cost: null,
  };
}

class Pathfinder implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private p!: Palette;
  private cells = new Uint8Array(COLS * ROWS);
  private start = 12 * COLS + 5;
  private goal = 12 * COLS + 34;
  private s: Search | null = null;
  private run: Generator<void> | null = null;
  private drag: "start" | "goal" | "paint" | null = null;
  private paintValue = WALL;
  algorithm: Algorithm = "astar";
  brush: typeof WALL | typeof MUD = WALL;
  speed = 3;
  onResult?: (algorithm: Algorithm, r: Result) => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.scatter();
  }

  clear() {
    this.cells.fill(OPEN);
    this.refresh();
  }

  // a few wall segments and mud patches, so the routes have something to argue about
  scatter() {
    this.cells.fill(OPEN);
    const r = rng();
    for (let n = 0; n < 9; n++) {
      const vertical = r() < 0.6;
      const len = 5 + Math.floor(r() * 12);
      let x = 8 + Math.floor(r() * (COLS - 16));
      let y = Math.floor(r() * ROWS);
      for (let k = 0; k < len; k++) {
        if (x >= 0 && y >= 0 && x < COLS && y < ROWS) this.cells[y * COLS + x] = WALL;
        if (vertical) y++;
        else x++;
      }
    }
    for (let n = 0; n < 4; n++) {
      const cx = 6 + r() * (COLS - 12);
      const cy = r() * ROWS;
      const rad = 2 + r() * 3;
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) if ((x - cx) ** 2 + (y - cy) ** 2 < rad * rad && !this.cells[y * COLS + x]) this.cells[y * COLS + x] = MUD;
    }
    this.cells[this.start] = this.cells[this.goal] = OPEN;
    this.refresh();
  }

  play() {
    this.s = newSearch();
    this.run = search(this.cells, this.start, this.goal, this.algorithm, this.s);
  }

  // after an edit, show the new answer straight away rather than replaying the search
  private refresh() {
    if (!this.s) return;
    this.compareAll();
    this.play();
    this.finish();
  }

  private finish() {
    if (!this.run || !this.s) return;
    while (!this.s.done) this.run.next();
    this.report(this.algorithm, this.s);
  }

  private report(algorithm: Algorithm, s: Search) {
    this.onResult?.(algorithm, { explored: s.count, cost: s.cost, length: s.path.length ? s.path.length - 1 : 0 });
  }

  compareAll() {
    for (const a of Object.keys(NAMES) as Algorithm[]) {
      const s = newSearch();
      const run = search(this.cells, this.start, this.goal, a, s);
      while (!s.done) run.next();
      this.report(a, s);
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
  }

  setPalette(p: Palette) {
    this.p = p;
  }

  frame() {
    if (this.run && this.s && !this.s.done) {
      for (let k = 0; k < this.speed && !this.s.done; k++) this.run.next();
      if (this.s.done) this.report(this.algorithm, this.s);
    }
    this.draw();
  }

  private draw() {
    const { ctx, p, s } = this;
    const cw = this.w / COLS;
    const ch = this.h / ROWS;
    ctx.fillStyle = css(p.bg);
    ctx.fillRect(0, 0, this.w, this.h);

    const mud = css(mix(mix(p.b, p.muted, 0.5), p.bg, p.light ? 0.45 : 0.55));
    const wall = css(mix(p.ink, p.bg, p.light ? 0.15 : 0.3));
    const total = Math.max(1, s?.count ?? 1);
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = (i % COLS) * cw;
      const y = ((i / COLS) | 0) * ch;
      const c = this.cells[i];
      if (c === WALL) {
        ctx.fillStyle = wall;
        ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
        continue;
      }
      if (c === MUD) {
        ctx.fillStyle = mud;
        ctx.fillRect(x, y, cw, ch);
      }
      if (s?.explored[i]) {
        // explored cells shade from the start color to the frontier color in the order they were visited
        ctx.fillStyle = css(mix(p.a, p.c, s.order[i] / total), p.light ? 0.4 : 0.32);
        ctx.fillRect(x, y, cw, ch);
      } else if (s?.frontier[i]) {
        ctx.fillStyle = css(p.c, 0.55);
        ctx.fillRect(x + cw * 0.2, y + ch * 0.2, cw * 0.6, ch * 0.6);
      }
    }

    ctx.strokeStyle = css(p.ink, 0.06);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * cw, 0);
      ctx.lineTo(x * cw, this.h);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, y * ch);
      ctx.lineTo(this.w, y * ch);
    }
    ctx.stroke();

    const centre = (i: number) => [(i % COLS + 0.5) * cw, (((i / COLS) | 0) + 0.5) * ch] as const;
    if (s?.path.length) {
      ctx.strokeStyle = css(p.b);
      ctx.lineWidth = Math.max(2.5, cw * 0.28);
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.beginPath();
      s.path.forEach((i, k) => (k ? ctx.lineTo(...centre(i)) : ctx.moveTo(...centre(i))));
      ctx.stroke();
    }
    for (const [i, color] of [
      [this.start, p.e],
      [this.goal, p.d],
    ] as const) {
      const [x, y] = centre(i);
      ctx.fillStyle = css(color);
      ctx.beginPath();
      ctx.arc(x, y, Math.min(cw, ch) * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(p.bg);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  pointer(kind: string, x: number, y: number) {
    const gx = Math.floor((x / this.w) * COLS);
    const gy = Math.floor((y / this.h) * ROWS);
    if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return;
    const i = gy * COLS + gx;
    if (kind === "up") {
      this.drag = null;
      return;
    }
    if (kind === "down") {
      if (i === this.start) this.drag = "start";
      else if (i === this.goal) this.drag = "goal";
      else {
        this.drag = "paint";
        this.paintValue = this.cells[i] === this.brush ? OPEN : this.brush;
      }
    }
    if (!this.drag) return;
    if (this.drag === "start" || this.drag === "goal") {
      if (this.cells[i] === WALL || i === this.start || i === this.goal) return;
      this[this.drag] = i;
    } else {
      if (i === this.start || i === this.goal || this.cells[i] === this.paintValue) return;
      this.cells[i] = this.paintValue;
    }
    this.refresh();
  }
}

const create = (canvas: HTMLCanvasElement) => new Pathfinder(canvas);

export default function Pathfinding() {
  const { canvasRef, simRef } = useSim(create);
  const [algorithm, setAlgorithm] = useState<Algorithm>("astar");
  const [brush, setBrush] = useState<typeof WALL | typeof MUD>(WALL);
  const [speed, setSpeed] = useState(3);
  const [results, setResults] = useState<Partial<Record<Algorithm, Result>>>({});

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.onResult = (a, r) => setResults(prev => ({ ...prev, [a]: r }));
    sim.algorithm = algorithm;
    sim.play();
  }, [algorithm, simRef]);
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.brush = brush;
    sim.speed = speed;
  }, [brush, speed, simRef]);

  return (
    <Stage canvasRef={canvasRef} hint="Draw on the grid to add walls or mud, and drag the two dots to move the start and goal.">
      <Choice
        label="Algorithm"
        value={algorithm}
        options={(Object.keys(NAMES) as Algorithm[]).map(a => ({ value: a, label: NAMES[a] }))}
        onChange={setAlgorithm}
      />
      <Choice
        label="Draw"
        value={brush}
        options={[
          { value: WALL, label: "Walls" },
          { value: MUD, label: `Mud (costs ${MUD_COST})` },
        ]}
        onChange={setBrush}
      />
      <Slider label="Speed" value={speed} min={1} max={30} onChange={setSpeed} format={v => `${v} cells/frame`} />
      <Buttons>
        <Btn onClick={() => simRef.current?.play()}>Replay</Btn>
        <Btn onClick={() => simRef.current?.compareAll()}>Compare all</Btn>
        <Btn onClick={() => simRef.current?.scatter()}>New obstacles</Btn>
        <Btn onClick={() => simRef.current?.clear()}>Clear</Btn>
      </Buttons>
      <table className="lab-table">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Cells explored</th>
            <th>Steps</th>
            <th>Route cost</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(NAMES) as Algorithm[]).map(a => {
            const r = results[a];
            return (
              <tr key={a} className={a === algorithm ? "is-on" : ""}>
                <td>{NAMES[a]}</td>
                <td>{r ? r.explored : "–"}</td>
                <td>{r ? (r.cost === null ? "no route" : r.length) : "–"}</td>
                <td>{r ? (r.cost === null ? "–" : r.cost) : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Stage>
  );
}
