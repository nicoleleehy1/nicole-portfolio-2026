"use client";
import { useEffect, useState } from "react";
import { PixelBuffer, fit2d, mix, rng, type Engine, type Palette, type RGB } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, useSim } from "../controls";

const W = 200;
const H = 125;
const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const STONE = 3;
type Material = typeof SAND | typeof WATER | typeof STONE | typeof EMPTY;

// A falling-sand world: every cell holds one material, and each frame applies a couple of local rules bottom-up.
class SandWorld implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private buf = new PixelBuffer(W, H);
  private cell = new Uint8Array(W * H);
  // per-grain tint, carried with the grain so piles look granular
  private shade = new Float32Array(W * H);
  private stamp = new Uint8Array(W * H);
  private tick = 0;
  private colors: RGB[][] = [];
  private down = false;
  private gx = 0;
  private gy = 0;
  material: Material = SAND;
  brush = 4;

  constructor(private canvas: HTMLCanvasElement) {
    this.landscape();
  }

  clear() {
    this.cell.fill(EMPTY);
  }

  // a few stone ledges and a basin to pour things onto
  landscape() {
    this.clear();
    const r = rng();
    for (let n = 0; n < 4; n++) {
      const x0 = Math.floor(r() * (W - 60)) + 10;
      const y0 = Math.floor(30 + r() * 60);
      const len = 30 + Math.floor(r() * 30);
      const tilt = (r() - 0.5) * 0.5;
      for (let x = 0; x < len; x++) for (let t = 0; t < 3; t++) this.put(x0 + x, Math.round(y0 + x * tilt) + t, STONE);
    }
    for (let x = 0; x < W; x++) for (let y = H - 4; y < H; y++) this.put(x, y, STONE);
    for (let y = H - 30; y < H; y++) {
      this.put(30, y, STONE);
      this.put(31, y, STONE);
      this.put(W - 31, y, STONE);
      this.put(W - 32, y, STONE);
    }
  }

  private put(x: number, y: number, m: Material) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    this.cell[i] = m;
    this.shade[i] = Math.random();
  }

  private swap(i: number, j: number) {
    const c = this.cell[i];
    this.cell[i] = this.cell[j];
    this.cell[j] = c;
    const s = this.shade[i];
    this.shade[i] = this.shade[j];
    this.shade[j] = s;
    this.stamp[j] = this.tick;
    this.stamp[i] = this.tick;
  }

  private step() {
    const { cell } = this;
    this.tick = (this.tick % 255) + 1;
    const flip = this.tick & 1;
    for (let y = H - 2; y >= 0; y--) {
      for (let n = 0; n < W; n++) {
        const x = flip ? n : W - 1 - n;
        const i = y * W + x;
        const m = cell[i];
        if (m === EMPTY || m === STONE || this.stamp[i] === this.tick) continue;
        const below = i + W;
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (m === SAND) {
          // falls, sinking through water, else slides off a diagonal
          if (cell[below] === EMPTY || cell[below] === WATER) this.swap(i, below);
          else {
            for (const d of [dir, -dir]) {
              const nx = x + d;
              if (nx < 0 || nx >= W) continue;
              const j = below + d;
              if (cell[j] === EMPTY || cell[j] === WATER) {
                this.swap(i, j);
                break;
              }
            }
          }
        } else {
          // water falls, then slides diagonally, then spreads sideways to find its level
          if (cell[below] === EMPTY) {
            this.swap(i, below);
            continue;
          }
          let moved = false;
          for (const d of [dir, -dir]) {
            const nx = x + d;
            if (nx >= 0 && nx < W && cell[below + d] === EMPTY) {
              this.swap(i, below + d);
              moved = true;
              break;
            }
          }
          if (moved) continue;
          let to = i;
          for (let s = 1; s <= 4; s++) {
            const nx = x + dir * s;
            if (nx < 0 || nx >= W || cell[y * W + nx] !== EMPTY) break;
            to = y * W + nx;
          }
          if (to !== i) this.swap(i, to);
        }
      }
    }
  }

  private pour() {
    const r = this.brush;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const cx = this.gx + x;
        const cy = this.gy + y;
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) continue;
        const i = cy * W + cx;
        const m = this.material;
        if (m === EMPTY) this.cell[i] = EMPTY;
        else if (m === STONE) this.put(cx, cy, STONE);
        // grains and drops come out sparse, like pouring, and never overwrite what's there
        else if (this.cell[i] === EMPTY && Math.random() < 0.35) this.put(cx, cy, m);
      }
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
  }

  setPalette(p: Palette) {
    const sand = mix(p.e, p.b, 0.25);
    const water = p.light ? mix(p.a, p.c, 0.45) : mix(p.a, p.c, 0.35);
    const stone = mix(p.muted, p.ink, p.light ? 0.25 : 0.05);
    this.colors = [
      [p.bg, p.bg],
      [mix(sand, p.bg, 0.25), sand],
      [mix(water, p.bg, 0.2), water],
      [mix(stone, p.bg, 0.35), stone],
    ];
  }

  frame() {
    if (this.down) this.pour();
    this.step();
    this.step();
    for (let i = 0; i < W * H; i++) {
      const m = this.cell[i];
      const [lo, hi] = this.colors[m];
      const t = m === WATER ? 0.6 + 0.4 * Math.sin(this.shade[i] * 6 + this.tick * 0.05) : this.shade[i];
      this.buf.set(i, lo[0] + (hi[0] - lo[0]) * t, lo[1] + (hi[1] - lo[1]) * t, lo[2] + (hi[2] - lo[2]) * t);
    }
    this.buf.draw(this.ctx, this.w, this.h, false);
  }

  pointer(kind: string, x: number, y: number) {
    this.gx = Math.floor((x / this.w) * W);
    this.gy = Math.floor((y / this.h) * H);
    if (kind === "down") this.down = true;
    if (kind === "up") this.down = false;
  }
}

const create = (canvas: HTMLCanvasElement) => new SandWorld(canvas);

export default function Sand() {
  const { canvasRef, simRef } = useSim(create);
  const [material, setMaterial] = useState<Material>(SAND);
  const [brush, setBrush] = useState(4);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.material = material;
    sim.brush = brush;
  }, [material, brush, simRef]);

  return (
    <Stage canvasRef={canvasRef} hint="Press and drag to pour. Sand piles up, water finds its level, stone stays put.">
      <Choice
        label="Material"
        value={material}
        options={[
          { value: SAND, label: "Sand" },
          { value: WATER, label: "Water" },
          { value: STONE, label: "Stone" },
          { value: EMPTY, label: "Eraser" },
        ]}
        onChange={setMaterial}
      />
      <Slider label="Brush" value={brush} min={1} max={10} onChange={setBrush} />
      <Buttons>
        <Btn onClick={() => simRef.current?.landscape()}>New landscape</Btn>
        <Btn onClick={() => simRef.current?.clear()}>Empty world</Btn>
      </Buttons>
    </Stage>
  );
}
