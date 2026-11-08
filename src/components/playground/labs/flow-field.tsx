"use client";
import { useEffect, useState } from "react";
import { css, fit2d, type Engine, type Palette } from "@/lib/playground/runtime";
import { perlin3 } from "@/lib/playground/noise";
import { Buttons, Choice, Slider, Stage, Toggle, useSim } from "../controls";

type Field = "noise" | "curl" | "swirls";
type Params = { field: Field; scale: number; count: number; trail: number; speed: number; evolve: number; arrows: boolean };

// Particles drift through a vector field; each frame they take a short step in the direction the field points where they stand.
class FlowField implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private p!: Palette;
  private noise = perlin3();
  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private life = new Float32Array(0);
  private z = 0;
  private t = 0;
  private stir: { x: number; y: number } | null = null;
  params: Params = { field: "noise", scale: 1, count: 2500, trail: 0.92, speed: 1, evolve: 0.3, arrows: false };

  constructor(private canvas: HTMLCanvasElement) {}

  set(params: Params) {
    const fieldChanged = params.field !== this.params.field;
    this.params = params;
    if (this.w && params.count !== this.x.length) this.spawnAll();
    if (fieldChanged && this.ctx) this.wipe();
  }

  reset() {
    this.reseed();
  }

  reseed() {
    this.noise = perlin3();
    this.spawnAll();
    this.wipe();
  }

  private spawnAll() {
    const n = this.params.count;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.life = new Float32Array(n);
    for (let i = 0; i < n; i++) this.spawn(i);
  }

  private spawn(i: number) {
    this.x[i] = Math.random() * this.w;
    this.y[i] = Math.random() * this.h;
    this.life[i] = 2 + Math.random() * 6;
  }

  private wipe() {
    this.ctx.fillStyle = css(this.p.bg);
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  // field direction at a point, as an angle
  private angle(x: number, y: number) {
    const { field, scale } = this.params;
    const k = 0.0035 / scale;
    let a: number;
    if (field === "noise") a = this.noise(x * k, y * k, this.z) * Math.PI * 2.5;
    else if (field === "curl") {
      // rotate the noise gradient by 90°: a divergence-free flow that circulates instead of pooling
      const e = 0.5;
      const dx = this.noise((x + e / k) * k, y * k, this.z) - this.noise((x - e / k) * k, y * k, this.z);
      const dy = this.noise(x * k, (y + e / k) * k, this.z) - this.noise(x * k, (y - e / k) * k, this.z);
      a = Math.atan2(-dx, dy);
    } else {
      // three slowly orbiting vortices, alternating in direction, with a little noise on top
      let vx = 0;
      let vy = 0;
      for (let c = 0; c < 3; c++) {
        const cx = this.w * (0.5 + 0.32 * Math.cos(this.t * 0.07 * (c + 1) + c * 2.1));
        const cy = this.h * (0.5 + 0.3 * Math.sin(this.t * 0.05 * (c + 1) + c * 1.3));
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy + 400;
        const spin = c % 2 ? -1 : 1;
        vx += (-dy * spin) / d2;
        vy += (dx * spin) / d2;
      }
      a = Math.atan2(vy, vx) + this.noise(x * k, y * k, this.z) * 1.2;
    }
    if (this.stir) {
      const dx = x - this.stir.x;
      const dy = y - this.stir.y;
      const d = Math.hypot(dx, dy);
      if (d < 160) {
        const around = Math.atan2(dy, dx) + Math.PI / 2;
        const t = 1 - d / 160;
        a = Math.atan2(Math.sin(a) * (1 - t) + Math.sin(around) * t, Math.cos(a) * (1 - t) + Math.cos(around) * t);
      }
    }
    return a;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
    this.spawnAll();
    if (this.p) this.wipe();
  }

  setPalette(p: Palette) {
    this.p = p;
    if (this.ctx) this.wipe();
  }

  frame(dt: number) {
    // paused: keep the last frame, since fading it would erase the trails
    if (!dt) return;
    const { ctx, p, x, y, life } = this;
    const { trail, speed, evolve, arrows } = this.params;
    this.t += dt;
    this.z += dt * evolve * 0.25;
    // fade the previous frame instead of clearing, so particles leave trails
    ctx.fillStyle = css(p.bg, Math.max(0.03, 1 - trail));
    ctx.fillRect(0, 0, this.w, this.h);

    const colors = [p.a, p.c, p.d, p.e];
    const step = 60 * speed * dt;
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    for (let c = 0; c < colors.length; c++) {
      ctx.strokeStyle = css(colors[c], p.light ? 0.55 : 0.5);
      ctx.beginPath();
      for (let i = c; i < x.length; i += colors.length) {
        const a = this.angle(x[i], y[i]);
        const nx = x[i] + Math.cos(a) * step;
        const ny = y[i] + Math.sin(a) * step;
        life[i] -= dt;
        if (life[i] <= 0 || nx < 0 || ny < 0 || nx > this.w || ny > this.h) {
          this.spawn(i);
          continue;
        }
        ctx.moveTo(x[i], y[i]);
        ctx.lineTo(nx, ny);
        x[i] = nx;
        y[i] = ny;
      }
      ctx.stroke();
    }

    if (arrows) {
      ctx.strokeStyle = css(p.ink, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      const g = 28;
      for (let gy = g / 2; gy < this.h; gy += g) {
        for (let gx = g / 2; gx < this.w; gx += g) {
          const a = this.angle(gx, gy);
          const ux = Math.cos(a) * 9;
          const uy = Math.sin(a) * 9;
          ctx.moveTo(gx - ux, gy - uy);
          ctx.lineTo(gx + ux, gy + uy);
          ctx.lineTo(gx + ux - Math.cos(a - 0.5) * 4, gy + uy - Math.sin(a - 0.5) * 4);
        }
      }
      ctx.stroke();
    }
  }

  pointer(kind: string, x: number, y: number) {
    if (kind === "up") this.stir = null;
    else if (kind === "down" || this.stir) this.stir = { x, y };
  }
}

const create = (canvas: HTMLCanvasElement) => new FlowField(canvas);

export default function FlowFields() {
  const { canvasRef, stage, simRef } = useSim(create);
  const [field, setField] = useState<Field>("noise");
  const [scale, setScale] = useState(1);
  const [count, setCount] = useState(2500);
  const [trail, setTrail] = useState(0.92);
  const [speed, setSpeed] = useState(1);
  const [evolve, setEvolve] = useState(0.3);
  const [arrows, setArrows] = useState(false);

  useEffect(() => {
    simRef.current?.set({ field, scale, count, trail, speed, evolve, arrows });
  }, [field, scale, count, trail, speed, evolve, arrows, simRef]);

  return (
    <Stage canvasRef={canvasRef} sim={stage} hint="Press and drag to stir the field.">
      <Choice
        label="Field"
        value={field}
        options={[
          { value: "noise", label: "Perlin noise" },
          { value: "curl", label: "Curl noise" },
          { value: "swirls", label: "Vortices" },
        ]}
        onChange={setField}
      />
      <Slider label="Zoom" value={scale} min={0.3} max={3} step={0.1} onChange={setScale} format={v => `${v.toFixed(1)}×`} />
      <Slider label="Particles" value={count} min={200} max={8000} step={100} onChange={setCount} />
      <Slider label="Trails" value={trail} min={0} max={0.99} step={0.01} onChange={setTrail} format={v => `${Math.round(v * 100)}%`} />
      <Slider label="Speed" value={speed} min={0.2} max={3} step={0.1} onChange={setSpeed} format={v => `${v.toFixed(1)}×`} />
      <Slider label="Drift" value={evolve} min={0} max={2} step={0.05} onChange={setEvolve} format={v => v.toFixed(2)} />
      <Buttons>
        <Toggle label="Show field" value={arrows} onChange={setArrows} />
      </Buttons>
    </Stage>
  );
}
