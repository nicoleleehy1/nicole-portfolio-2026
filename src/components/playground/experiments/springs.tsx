"use client";
import { useEffect, useState } from "react";
import { css, fit2d, mix, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, Toggle, useSim } from "../controls";

type Scene = "cloth" | "rope" | "soft";
type Stick = { a: number; b: number; len: number; stiff: number; alive: boolean };
type Params = { scene: Scene; gravity: number; stiffness: number; tear: boolean };

// Verlet integration: each point remembers where it was last frame, and its velocity is just the difference.
// Sticks are distance constraints, relaxed a few times per frame; more passes means stiffer material.
class SpringWorld implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private p!: Palette;
  private x: number[] = [];
  private y: number[] = [];
  private px: number[] = [];
  private py: number[] = [];
  private pinned: boolean[] = [];
  private sticks: Stick[] = [];
  // soft bodies: a ring of point indices around a centre, drawn as a filled blob
  private blobs: { ring: number[]; centre: number }[] = [];
  private grab = -1;
  private gx = 0;
  private gy = 0;
  params: Params = { scene: "cloth", gravity: 1, stiffness: 0.5, tear: false };

  constructor(private canvas: HTMLCanvasElement) {}

  set(params: Params) {
    const rebuild = params.scene !== this.params.scene;
    this.params = params;
    if (rebuild && this.w) this.build();
  }

  private point(x: number, y: number, pinned = false) {
    this.x.push(x);
    this.y.push(y);
    this.px.push(x);
    this.py.push(y);
    this.pinned.push(pinned);
    return this.x.length - 1;
  }

  private stick(a: number, b: number, stiff = 1) {
    this.sticks.push({ a, b, len: Math.hypot(this.x[a] - this.x[b], this.y[a] - this.y[b]), stiff, alive: true });
  }

  build() {
    this.x = [];
    this.y = [];
    this.px = [];
    this.py = [];
    this.pinned = [];
    this.sticks = [];
    this.blobs = [];
    this.grab = -1;
    const { w, h } = this;
    if (this.params.scene === "cloth") {
      const cols = 34;
      const rows = 20;
      const s = Math.min((w * 0.7) / (cols - 1), (h * 0.75) / (rows - 1));
      const ox = (w - s * (cols - 1)) / 2;
      const oy = h * 0.08;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) this.point(ox + c * s, oy + r * s, r === 0 && (c % 4 === 0 || c === cols - 1));
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c < cols - 1) this.stick(i, i + 1);
          if (r < rows - 1) this.stick(i, i + cols);
        }
    } else if (this.params.scene === "rope") {
      const segs = 28;
      // two hanging ropes and a slack bridge strung between two posts
      for (const fx of [0.18, 0.82]) {
        const len = h * 0.62;
        let prev = this.point(w * fx, h * 0.06, true);
        for (let k = 1; k <= segs; k++) {
          const i = this.point(w * fx + k * 0.5, h * 0.06 + (len * k) / segs);
          this.stick(prev, i);
          prev = i;
        }
      }
      const y0 = h * 0.3;
      const x0 = w * 0.3;
      const x1 = w * 0.7;
      let prev = this.point(x0, y0, true);
      for (let k = 1; k <= segs; k++) {
        const t = k / segs;
        const i = this.point(x0 + (x1 - x0) * t, y0 + Math.sin(t * Math.PI) * h * 0.15, k === segs);
        this.stick(prev, i);
        prev = i;
      }
    } else {
      const n = 22;
      for (const [fx, fy, r] of [
        [0.25, 0.3, 0.13],
        [0.55, 0.2, 0.16],
        [0.8, 0.35, 0.1],
      ]) {
        const R = r * Math.min(w, h * 1.6);
        const cx = w * fx;
        const cy = h * fy;
        const centre = this.point(cx, cy);
        const ring: number[] = [];
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          ring.push(this.point(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
        }
        for (let k = 0; k < n; k++) {
          this.stick(ring[k], ring[(k + 1) % n]);
          // a weaker skip-one link stops the skin from folding over itself
          this.stick(ring[k], ring[(k + 2) % n], 0.4);
          // soft spokes to the centre: the springiness of the jelly
          this.stick(ring[k], centre, 0.06);
        }
        this.blobs.push({ ring, centre });
      }
    }
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
    this.build();
  }

  setPalette(p: Palette) {
    this.p = p;
  }

  frame() {
    const { x, y, px, py, pinned } = this;
    const { gravity, stiffness, tear, scene } = this.params;
    const g = 0.35 * gravity;
    for (let i = 0; i < x.length; i++) {
      if (pinned[i]) continue;
      const vx = (x[i] - px[i]) * 0.99;
      const vy = (y[i] - py[i]) * 0.99;
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx;
      y[i] += vy + g;
    }
    if (this.grab >= 0) {
      x[this.grab] = this.gx;
      y[this.grab] = this.gy;
    }

    const passes = Math.round(2 + stiffness * 22);
    const spoke = 0.02 + stiffness * 0.25;
    for (let pass = 0; pass < passes; pass++) {
      for (const s of this.sticks) {
        if (!s.alive) continue;
        const dx = x[s.b] - x[s.a];
        const dy = y[s.b] - y[s.a];
        const d = Math.hypot(dx, dy) || 1e-6;
        if (tear && scene === "cloth" && d > s.len * 3.2) {
          s.alive = false;
          continue;
        }
        const k = s.stiff < 0.1 ? spoke : s.stiff;
        const diff = ((d - s.len) / d) * 0.5 * k;
        const ox = dx * diff;
        const oy = dy * diff;
        const fa = pinned[s.a] || s.a === this.grab;
        const fb = pinned[s.b] || s.b === this.grab;
        if (!fa) {
          x[s.a] += fb ? ox * 2 : ox;
          y[s.a] += fb ? oy * 2 : oy;
        }
        if (!fb) {
          x[s.b] -= fa ? ox * 2 : ox;
          y[s.b] -= fa ? oy * 2 : oy;
        }
      }
      // walls and floor, with a little friction on contact
      for (let i = 0; i < x.length; i++) {
        if (x[i] < 2) x[i] = 2;
        if (x[i] > this.w - 2) x[i] = this.w - 2;
        if (y[i] < 2) y[i] = 2;
        if (y[i] > this.h - 2) {
          y[i] = this.h - 2;
          px[i] = x[i] - (x[i] - px[i]) * 0.8;
        }
      }
    }
    this.draw();
  }

  private draw() {
    const { ctx, p, x, y } = this;
    ctx.fillStyle = css(p.bg);
    ctx.fillRect(0, 0, this.w, this.h);
    const { scene } = this.params;

    if (scene === "soft") {
      const fills = [p.a, p.d, p.e];
      this.blobs.forEach((b, k) => {
        ctx.beginPath();
        b.ring.forEach((i, n) => (n ? ctx.lineTo(x[i], y[i]) : ctx.moveTo(x[i], y[i])));
        ctx.closePath();
        ctx.fillStyle = css(fills[k % 3], p.light ? 0.4 : 0.22);
        ctx.fill();
        ctx.strokeStyle = css(fills[k % 3], 0.95);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = css(fills[k % 3], 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const i of b.ring) {
          ctx.moveTo(x[b.centre], y[b.centre]);
          ctx.lineTo(x[i], y[i]);
        }
        ctx.stroke();
      });
    } else {
      // color each link by how stretched it is: relaxed in the first accent, strained toward the second
      ctx.lineWidth = scene === "rope" ? 3 : 1.2;
      ctx.lineCap = "round";
      const buckets = 6;
      const paths = Array.from({ length: buckets }, () => new Path2D());
      for (const s of this.sticks) {
        if (!s.alive) continue;
        const strain = Math.hypot(x[s.b] - x[s.a], y[s.b] - y[s.a]) / s.len - 1;
        const k = Math.max(0, Math.min(buckets - 1, Math.floor(strain * 25)));
        paths[k].moveTo(x[s.a], y[s.a]);
        paths[k].lineTo(x[s.b], y[s.b]);
      }
      paths.forEach((path, k) => {
        ctx.strokeStyle = css(mix(p.a, p.b, k / (buckets - 1)), p.light ? 0.9 : 0.8);
        ctx.stroke(path);
      });
    }

    ctx.fillStyle = css(p.ink);
    for (let i = 0; i < x.length; i++) {
      if (!this.pinned[i]) continue;
      ctx.beginPath();
      ctx.arc(x[i], y[i], 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.grab >= 0) {
      ctx.strokeStyle = css(p.e);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x[this.grab], y[this.grab], 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  pointer(kind: string, px: number, py: number) {
    this.gx = px;
    this.gy = py;
    if (kind === "up") {
      this.grab = -1;
      return;
    }
    if (kind !== "down") return;
    let best = -1;
    let bestD = 40 * 40;
    for (let i = 0; i < this.x.length; i++) {
      if (this.pinned[i]) continue;
      const d = (this.x[i] - px) ** 2 + (this.y[i] - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    this.grab = best;
  }
}

const create = (canvas: HTMLCanvasElement) => new SpringWorld(canvas);

export default function Springs() {
  const { canvasRef, simRef } = useSim(create);
  const [scene, setScene] = useState<Scene>("cloth");
  const [gravity, setGravity] = useState(1);
  const [stiffness, setStiffness] = useState(0.5);
  const [tear, setTear] = useState(false);

  useEffect(() => {
    simRef.current?.set({ scene, gravity, stiffness, tear });
  }, [scene, gravity, stiffness, tear, simRef]);

  return (
    <Stage canvasRef={canvasRef} hint="Grab anything and drag it around. Links turn warmer as they stretch." cursor="grab">
      <Choice
        label="Scene"
        value={scene}
        options={[
          { value: "cloth", label: "Cloth" },
          { value: "rope", label: "Rope" },
          { value: "soft", label: "Soft bodies" },
        ]}
        onChange={setScene}
      />
      <Slider label="Gravity" value={gravity} min={0} max={3} step={0.1} onChange={setGravity} format={v => `${v.toFixed(1)}g`} />
      <Slider label="Stiffness" value={stiffness} min={0} max={1} step={0.05} onChange={setStiffness} format={v => `${Math.round(v * 100)}%`} />
      <Buttons>
        {scene === "cloth" && <Toggle label="Tearable" value={tear} onChange={setTear} />}
        <Btn onClick={() => simRef.current?.build()}>Reset</Btn>
      </Buttons>
    </Stage>
  );
}
