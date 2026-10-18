"use client";
import { useEffect, useState } from "react";
import { PixelBuffer, fit2d, mix, ramp, rng, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, useSim } from "../controls";

const W = 224;
const H = 140;

// Gray-Scott parameters (feed, kill) for a few well-known pattern families.
const PRESETS = {
  spots: { f: 0.0367, k: 0.0649, label: "Spots" },
  stripes: { f: 0.029, k: 0.057, label: "Stripes" },
  coral: { f: 0.0545, k: 0.062, label: "Coral" },
  worms: { f: 0.078, k: 0.061, label: "Worms" },
  bubbles: { f: 0.012, k: 0.05, label: "Bubbles" },
} as const;
type Preset = keyof typeof PRESETS;

// Two chemicals: U is fed in everywhere, V eats U to make more of itself, and V decays. Both diffuse, U twice as fast.
class GrayScott implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private buf = new PixelBuffer(W, H);
  private u = new Float32Array(W * H);
  private v = new Float32Array(W * H);
  private u2 = new Float32Array(W * H);
  private v2 = new Float32Array(W * H);
  private lut: Uint8ClampedArray = new Uint8ClampedArray(768);
  private drawing = false;
  private lastX = -1;
  private lastY = -1;
  f = 0.0367;
  k = 0.0649;
  speed = 10;
  brush = 4;
  erase = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.reset();
  }

  clear() {
    this.u.fill(1);
    this.v.fill(0);
  }

  reset() {
    this.clear();
    const r = rng();
    for (let n = 0; n < 14; n++) this.dab(r() * W, r() * H, 3 + r() * 4, false);
  }

  private dab(cx: number, cy: number, rad: number, erase: boolean) {
    const r2 = rad * rad;
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r2) continue;
        const i = ((y + H) % H) * W + ((x + W) % W);
        this.u[i] = erase ? 1 : 0.5;
        this.v[i] = erase ? 0 : 0.25 + Math.random() * 0.1;
      }
    }
  }

  private step() {
    const { u, v, u2, v2, f, k } = this;
    for (let y = 0; y < H; y++) {
      const up = ((y + H - 1) % H) * W;
      const row = y * W;
      const dn = ((y + 1) % H) * W;
      for (let x = 0; x < W; x++) {
        const l = (x + W - 1) % W;
        const r = (x + 1) % W;
        const i = row + x;
        // 3x3 Laplacian: 0.2 for edge neighbors, 0.05 for corners
        const lu =
          0.2 * (u[row + l] + u[row + r] + u[up + x] + u[dn + x]) +
          0.05 * (u[up + l] + u[up + r] + u[dn + l] + u[dn + r]) -
          u[i];
        const lv =
          0.2 * (v[row + l] + v[row + r] + v[up + x] + v[dn + x]) +
          0.05 * (v[up + l] + v[up + r] + v[dn + l] + v[dn + r]) -
          v[i];
        const uvv = u[i] * v[i] * v[i];
        u2[i] = u[i] + (lu - uvv + f * (1 - u[i]));
        v2[i] = v[i] + (0.5 * lv + uvv - (k + f) * v[i]);
      }
    }
    this.u = u2;
    this.v = v2;
    this.u2 = u;
    this.v2 = v;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
  }

  setPalette(p: Palette) {
    this.lut = ramp([p.bg, mix(p.bg, p.c, 0.6), p.a, p.e, p.light ? p.b : p.ink]);
  }

  frame(dt: number) {
    if (dt) for (let s = 0; s < this.speed; s++) this.step();
    const { v, lut, buf } = this;
    for (let i = 0; i < W * H; i++) {
      const t = Math.min(255, Math.max(0, Math.floor(v[i] * 3.2 * 255))) * 3;
      buf.set(i, lut[t], lut[t + 1], lut[t + 2]);
    }
    buf.draw(this.ctx, this.w, this.h, true);
  }

  pointer(kind: string, x: number, y: number) {
    if (kind === "up") {
      this.drawing = false;
      return;
    }
    if (kind === "down") this.drawing = true;
    if (!this.drawing) return;
    const gx = (x / this.w) * W;
    const gy = (y / this.h) * H;
    // fill in between pointer events so fast strokes stay continuous
    const steps = this.lastX < 0 || kind === "down" ? 1 : Math.ceil(Math.hypot(gx - this.lastX, gy - this.lastY) / 1.5) || 1;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const sx = kind === "down" ? gx : this.lastX + (gx - this.lastX) * t;
      const sy = kind === "down" ? gy : this.lastY + (gy - this.lastY) * t;
      this.dab(sx, sy, this.brush, this.erase);
    }
    this.lastX = gx;
    this.lastY = gy;
  }
}

const create = (canvas: HTMLCanvasElement) => new GrayScott(canvas);

export default function ReactionDiffusion() {
  const { canvasRef, stage, simRef } = useSim(create);
  const [preset, setPreset] = useState<Preset | "custom">("spots");
  const [f, setF] = useState<number>(PRESETS.spots.f);
  const [k, setK] = useState<number>(PRESETS.spots.k);
  const [speed, setSpeed] = useState(10);
  const [brush, setBrush] = useState(4);
  const [tool, setTool] = useState<"paint" | "erase">("paint");

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    Object.assign(sim, { f, k, speed, brush, erase: tool === "erase" });
  }, [f, k, speed, brush, tool, simRef]);

  const choose = (p: Preset | "custom") => {
    setPreset(p);
    if (p === "custom") return;
    setF(PRESETS[p].f);
    setK(PRESETS[p].k);
  };

  return (
    <Stage canvasRef={canvasRef} sim={stage} hint="Paint on the canvas to drop in chemical V and watch it grow." readout={`f ${f.toFixed(4)} · k ${k.toFixed(4)}`}>
      <Choice
        label="Pattern"
        value={preset}
        options={[...Object.entries(PRESETS).map(([value, p]) => ({ value: value as Preset, label: p.label })), { value: "custom" as const, label: "Custom" }]}
        onChange={choose}
      />
      <Slider label="Feed" value={f} min={0.01} max={0.09} step={0.0005} onChange={v => (setF(v), setPreset("custom"))} format={v => v.toFixed(4)} />
      <Slider label="Kill" value={k} min={0.045} max={0.07} step={0.0005} onChange={v => (setK(v), setPreset("custom"))} format={v => v.toFixed(4)} />
      <Slider label="Speed" value={speed} min={1} max={24} onChange={setSpeed} format={v => `${v}×`} />
      <Slider label="Brush" value={brush} min={1} max={12} onChange={setBrush} />
      <Choice
        label="Tool"
        value={tool}
        options={[
          { value: "paint", label: "Paint" },
          { value: "erase", label: "Erase" },
        ]}
        onChange={setTool}
      />
      <Buttons>
        <Btn onClick={() => simRef.current?.clear()}>Clear</Btn>
      </Buttons>
    </Stage>
  );
}
