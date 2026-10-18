"use client";
import { useEffect, useState } from "react";
import { PixelBuffer, css, fit2d, mix, ramp, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, useSim } from "../controls";

const GW = 200;
const GH = 125;
const SPEED = 0.22; // wave speed, in canvas widths per second
const MAX_SOURCES = 8;

type View = "ripples" | "intensity";
type Source = { x: number; y: number; freq: number; dist: Float32Array };
type Selection = { index: number; freq: number; count: number };

// Each source emits circular waves; the canvas shows their sum at every point.
// Where crests meet crests they add up, where crests meet troughs they cancel.
class WaveTank implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private p!: Palette;
  private buf = new PixelBuffer(GW, GH);
  private sources: Source[] = [];
  private selected = 0;
  private dragging = false;
  private t = 0;
  private diverging: Uint8ClampedArray = new Uint8ClampedArray(768);
  private energy: Uint8ClampedArray = new Uint8ClampedArray(768);
  view: View = "ripples";
  onSelect?: (s: Selection) => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.preset("pair");
  }

  private make(x: number, y: number, freq: number): Source {
    const s = { x, y, freq, dist: new Float32Array(GW * GH) };
    this.measure(s);
    return s;
  }

  // cache each pixel's distance to the source (in canvas widths); recomputed only when the source moves
  private measure(s: Source) {
    const aspect = GH / GW;
    for (let j = 0; j < GH; j++)
      for (let i = 0; i < GW; i++) s.dist[j * GW + i] = Math.hypot((i + 0.5) / GW - s.x, ((j + 0.5) / GH - s.y) * aspect);
  }

  preset(kind: "pair" | "ring" | "line") {
    const f = 1.2;
    if (kind === "pair") this.sources = [this.make(0.42, 0.5, f), this.make(0.58, 0.5, f)];
    else if (kind === "ring")
      this.sources = Array.from({ length: 6 }, (_, k) => this.make(0.5 + 0.12 * Math.cos((k / 6) * Math.PI * 2), 0.5 + 0.19 * Math.sin((k / 6) * Math.PI * 2), f));
    else this.sources = Array.from({ length: 6 }, (_, k) => this.make(0.06, 0.3 + k * 0.08, f));
    this.selected = 0;
    this.notify();
  }

  setFreq(freq: number, all = false) {
    for (const [k, s] of this.sources.entries()) if (all || k === this.selected) s.freq = freq;
  }

  removeSelected() {
    if (this.sources.length <= 1) return;
    this.sources.splice(this.selected, 1);
    this.selected = Math.min(this.selected, this.sources.length - 1);
    this.notify();
  }

  private notify() {
    const s = this.sources[this.selected];
    this.onSelect?.({ index: this.selected, freq: s?.freq ?? 1, count: this.sources.length });
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
  }

  setPalette(p: Palette) {
    this.p = p;
    this.diverging = ramp([p.a, mix(p.a, p.bg, 0.6), p.bg, mix(p.b, p.bg, 0.6), p.b]);
    this.energy = ramp([p.bg, mix(p.bg, p.c, 0.6), p.c, p.e, p.light ? p.b : p.ink]);
  }

  frame(dt: number) {
    this.t += dt;
    const { sources, buf, t } = this;
    const n = sources.length;
    const ks = sources.map(s => (2 * Math.PI * s.freq) / SPEED);
    const ws = sources.map(s => 2 * Math.PI * s.freq * t);
    const norm = 1 / Math.sqrt(n);
    for (let i = 0; i < GW * GH; i++) {
      let re = 0;
      let im = 0;
      for (let k = 0; k < n; k++) {
        const r = sources[k].dist[i];
        // amplitude falls off with distance, as the ring of energy spreads out
        const a = 1 / Math.sqrt(1 + r * 30);
        const phase = ks[k] * r - ws[k];
        re += a * Math.cos(phase);
        if (this.view === "intensity") im += a * Math.sin(phase);
      }
      let idx: number;
      if (this.view === "ripples") idx = Math.max(0, Math.min(255, Math.round(128 + re * norm * 160))) * 3;
      else idx = Math.min(255, Math.round((re * re + im * im) * norm * norm * 230)) * 3;
      const lut = this.view === "ripples" ? this.diverging : this.energy;
      buf.set(i, lut[idx], lut[idx + 1], lut[idx + 2]);
    }
    buf.draw(this.ctx, this.w, this.h, true);

    const { ctx, p } = this;
    sources.forEach((s, k) => {
      const x = s.x * this.w;
      const y = s.y * this.h;
      ctx.beginPath();
      ctx.arc(x, y, k === this.selected ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = css(k === this.selected ? p.e : p.ink);
      ctx.fill();
      ctx.strokeStyle = css(p.bg);
      ctx.lineWidth = 2;
      ctx.stroke();
      if (k === this.selected) {
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.strokeStyle = css(p.e, 0.8);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  pointer(kind: string, x: number, y: number) {
    const nx = Math.max(0, Math.min(1, x / this.w));
    const ny = Math.max(0, Math.min(1, y / this.h));
    if (kind === "up") {
      this.dragging = false;
      return;
    }
    if (kind === "down") {
      const hit = this.sources.findIndex(s => Math.hypot(s.x * this.w - x, s.y * this.h - y) < 16);
      if (hit >= 0) this.selected = hit;
      else if (this.sources.length < MAX_SOURCES) {
        this.sources.push(this.make(nx, ny, this.sources[this.selected]?.freq ?? 1.2));
        this.selected = this.sources.length - 1;
      } else return;
      this.dragging = true;
      this.notify();
      return;
    }
    if (!this.dragging) return;
    const s = this.sources[this.selected];
    s.x = nx;
    s.y = ny;
    this.measure(s);
  }
}

const create = (canvas: HTMLCanvasElement) => new WaveTank(canvas);

export default function Waves() {
  const { canvasRef, simRef } = useSim(create);
  const [view, setView] = useState<View>("ripples");
  const [sel, setSel] = useState<Selection>({ index: 0, freq: 1.2, count: 2 });

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.onSelect = setSel;
  }, [simRef]);
  useEffect(() => {
    if (simRef.current) simRef.current.view = view;
  }, [view, simRef]);

  const setFreq = (freq: number) => {
    simRef.current?.setFreq(freq);
    setSel(s => ({ ...s, freq }));
  };

  return (
    <Stage
      canvasRef={canvasRef}
      hint={`Click to add a source (up to ${MAX_SOURCES}), click one to select it, drag to move it.`}
      readout={`${sel.count} source${sel.count === 1 ? "" : "s"}`}
    >
      <Choice
        label="Show"
        value={view}
        options={[
          { value: "ripples", label: "Ripples" },
          { value: "intensity", label: "Loudness" },
        ]}
        onChange={setView}
      />
      <Slider label={`Source ${sel.index + 1} frequency`} value={sel.freq} min={0.3} max={3} step={0.05} onChange={setFreq} format={v => `${v.toFixed(2)} Hz`} />
      <Buttons>
        <Btn onClick={() => simRef.current?.setFreq(sel.freq, true)}>Match all to this</Btn>
        <Btn onClick={() => simRef.current?.removeSelected()}>Remove source</Btn>
      </Buttons>
      <Buttons>
        <Btn onClick={() => simRef.current?.preset("pair")}>Two sources</Btn>
        <Btn onClick={() => simRef.current?.preset("ring")}>Ring of six</Btn>
        <Btn onClick={() => simRef.current?.preset("line")}>A line (beam)</Btn>
      </Buttons>
    </Stage>
  );
}
