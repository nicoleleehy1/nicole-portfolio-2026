"use client";
import { useEffect, useState } from "react";
import { css, fit2d, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Slider, Stage, Toggle, useSim } from "../controls";

type Params = { separation: number; alignment: number; cohesion: number; count: number; radius: number; trails: boolean };

const MAX_SPEED = 130; // px/s
const MAX_FORCE = 260;

// Reynolds' boids: each bird only sees neighbors within a radius, and steers by three weighted rules.
class Flock implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private p!: Palette;
  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private hue = new Uint8Array(0);
  private n = 0;
  private grid = new Map<number, number[]>();
  private px = -1e9;
  private py = -1e9;
  private scare = false;
  params: Params = { separation: 1.5, alignment: 1, cohesion: 1, count: 220, radius: 46, trails: true };

  constructor(private canvas: HTMLCanvasElement) {}

  private populate(count: number) {
    const keep = Math.min(this.n, count);
    const grow = (a: Float32Array) => {
      const b = new Float32Array(count);
      b.set(a.subarray(0, keep));
      return b;
    };
    this.x = grow(this.x);
    this.y = grow(this.y);
    this.vx = grow(this.vx);
    this.vy = grow(this.vy);
    const hue = new Uint8Array(count);
    hue.set(this.hue.subarray(0, keep));
    this.hue = hue;
    for (let i = keep; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      this.x[i] = Math.random() * this.w;
      this.y[i] = Math.random() * this.h;
      this.vx[i] = Math.cos(a) * MAX_SPEED * 0.6;
      this.vy[i] = Math.sin(a) * MAX_SPEED * 0.6;
      this.hue[i] = Math.floor(Math.random() * 3);
    }
    this.n = count;
  }

  scatter() {
    this.n = 0;
    this.populate(this.params.count);
  }

  set(params: Params) {
    this.params = params;
    if (this.w > 1 && params.count !== this.n) this.populate(params.count);
  }

  resize(w: number, h: number, dpr: number) {
    const first = this.w === 1;
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
    if (first) this.populate(this.params.count);
    this.clear();
  }

  setPalette(p: Palette) {
    this.p = p;
    if (this.ctx) this.clear();
  }

  private clear() {
    this.ctx.fillStyle = css(this.p?.bg ?? [0, 0, 0]);
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  frame(dt: number) {
    const { separation, alignment, cohesion, radius } = this.params;
    const { x, y, vx, vy, n, w, h } = this;
    const cell = radius;
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);

    // bucket birds into a grid one radius wide, so each only checks the nine cells around it
    this.grid.clear();
    for (let i = 0; i < n; i++) {
      const k = Math.floor(x[i] / cell) + Math.floor(y[i] / cell) * cols;
      const list = this.grid.get(k);
      if (list) list.push(i);
      else this.grid.set(k, [i]);
    }

    const r2 = radius * radius;
    const sep2 = (radius * 0.45) ** 2;
    const ax = new Float32Array(n);
    const ay = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(x[i] / cell);
      const cy = Math.floor(y[i] / cell);
      let count = 0, avx = 0, avy = 0, mx = 0, my = 0, sx = 0, sy = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const gx = (cx + ox + cols) % cols;
          const gy = (cy + oy + rows) % rows;
          const list = this.grid.get(gx + gy * cols);
          if (!list) continue;
          for (const j of list) {
            if (j === i) continue;
            // shortest offset on the wrapped world
            let dx = x[j] - x[i];
            let dy = y[j] - y[i];
            if (dx > w / 2) dx -= w;
            else if (dx < -w / 2) dx += w;
            if (dy > h / 2) dy -= h;
            else if (dy < -h / 2) dy += h;
            const d2 = dx * dx + dy * dy;
            if (d2 > r2 || d2 === 0) continue;
            count++;
            avx += vx[j];
            avy += vy[j];
            mx += dx;
            my += dy;
            if (d2 < sep2) {
              sx -= dx / d2;
              sy -= dy / d2;
            }
          }
        }
      }
      let fx = 0, fy = 0;
      if (count) {
        const steer = (tx: number, ty: number, weight: number) => {
          const len = Math.hypot(tx, ty);
          if (!len) return;
          let sx2 = (tx / len) * MAX_SPEED - vx[i];
          let sy2 = (ty / len) * MAX_SPEED - vy[i];
          const sl = Math.hypot(sx2, sy2);
          if (sl > MAX_FORCE) {
            sx2 = (sx2 / sl) * MAX_FORCE;
            sy2 = (sy2 / sl) * MAX_FORCE;
          }
          fx += sx2 * weight;
          fy += sy2 * weight;
        };
        steer(avx, avy, alignment);
        steer(mx, my, cohesion);
        steer(sx, sy, separation);
      }
      // the pointer is a hawk: birds near it flee
      let dx = x[i] - this.px;
      let dy = y[i] - this.py;
      const d = Math.hypot(dx, dy);
      const fear = this.scare ? 140 : 70;
      if (d < fear && d > 0) {
        dx /= d;
        dy /= d;
        fx += dx * MAX_FORCE * 3 * (1 - d / fear);
        fy += dy * MAX_FORCE * 3 * (1 - d / fear);
      }
      ax[i] = fx;
      ay[i] = fy;
    }

    for (let i = 0; i < n; i++) {
      vx[i] += ax[i] * dt;
      vy[i] += ay[i] * dt;
      const s = Math.hypot(vx[i], vy[i]);
      const min = MAX_SPEED * 0.45;
      const k = s > MAX_SPEED ? MAX_SPEED / s : s < min && s > 0 ? min / s : 1;
      vx[i] *= k;
      vy[i] *= k;
      x[i] = (x[i] + vx[i] * dt + w) % w;
      y[i] = (y[i] + vy[i] * dt + h) % h;
    }

    this.draw();
  }

  private draw() {
    const { ctx, p, n, x, y, vx, vy } = this;
    ctx.fillStyle = css(p.bg, this.params.trails ? 0.22 : 1);
    ctx.fillRect(0, 0, this.w, this.h);
    const colors = [css(p.a), css(p.b), css(p.c)];
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = colors[c];
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        if (this.hue[i] !== c) continue;
        const s = Math.hypot(vx[i], vy[i]) || 1;
        const ux = vx[i] / s;
        const uy = vy[i] / s;
        ctx.moveTo(x[i] + ux * 6, y[i] + uy * 6);
        ctx.lineTo(x[i] - ux * 4 - uy * 3, y[i] - uy * 4 + ux * 3);
        ctx.lineTo(x[i] - ux * 2, y[i] - uy * 2);
        ctx.lineTo(x[i] - ux * 4 + uy * 3, y[i] - uy * 4 - ux * 3);
        ctx.closePath();
      }
      ctx.fill();
    }
  }

  pointer(kind: string, x: number, y: number, e: PointerEvent) {
    this.px = x;
    this.py = y;
    this.scare = kind !== "up" && e.buttons > 0;
    if (kind === "up" && e.pointerType !== "mouse") this.px = this.py = -1e9;
  }
}

const create = (canvas: HTMLCanvasElement) => {
  const flock = new Flock(canvas);
  canvas.addEventListener("pointerleave", () => flock.pointer("up", -1e9, -1e9, new PointerEvent("pointerup")));
  return flock;
};

export default function Boids() {
  const { canvasRef, simRef } = useSim(create);
  const [separation, setSeparation] = useState(1.5);
  const [alignment, setAlignment] = useState(1);
  const [cohesion, setCohesion] = useState(1);
  const [count, setCount] = useState(220);
  const [radius, setRadius] = useState(46);
  const [trails, setTrails] = useState(true);

  useEffect(() => {
    simRef.current?.set({ separation, alignment, cohesion, count, radius, trails });
  }, [separation, alignment, cohesion, count, radius, trails, simRef]);

  const fmt = (v: number) => v.toFixed(1);
  return (
    <Stage canvasRef={canvasRef} hint="Move the pointer through the flock to startle it; hold to scare them harder.">
      <Slider label="Separation" value={separation} min={0} max={4} step={0.1} onChange={setSeparation} format={fmt} />
      <Slider label="Alignment" value={alignment} min={0} max={4} step={0.1} onChange={setAlignment} format={fmt} />
      <Slider label="Cohesion" value={cohesion} min={0} max={4} step={0.1} onChange={setCohesion} format={fmt} />
      <Slider label="Vision" value={radius} min={15} max={100} onChange={setRadius} format={v => `${v}px`} />
      <Slider label="Birds" value={count} min={20} max={600} step={10} onChange={setCount} />
      <Buttons>
        <Toggle label="Trails" value={trails} onChange={setTrails} />
        <Btn onClick={() => simRef.current?.scatter()}>Scatter</Btn>
      </Buttons>
    </Stage>
  );
}
