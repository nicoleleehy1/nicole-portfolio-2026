"use client";
import { useEffect, useState } from "react";
import { PixelBuffer, fit2d, mix, rng, type Engine, type Palette } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, useSim } from "../controls";

const W = 161;
const H = 100;

// One row per generation, drawn top to bottom; once the canvas is full it scrolls.
class Automaton implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private buf = new PixelBuffer(W, H);
  private cells = new Uint8Array(W * H);
  private seedRow = new Uint8Array(W);
  private rows = 0;
  private carry = 0;
  private p!: Palette;
  private paint = 1;
  rule = 30;
  speed = 40;

  constructor(private canvas: HTMLCanvasElement) {
    this.seed("single");
  }

  seed(kind: "single" | "random" | "clear") {
    this.seedRow.fill(0);
    if (kind === "single") this.seedRow[W >> 1] = 1;
    if (kind === "random") {
      const r = rng();
      for (let i = 0; i < W; i++) this.seedRow[i] = r() < 0.5 ? 1 : 0;
    }
    this.restart();
  }

  restart() {
    this.cells.fill(0);
    this.cells.set(this.seedRow);
    this.rows = 1;
  }

  private step() {
    if (this.rows === H) {
      this.cells.copyWithin(0, W);
      this.rows--;
    }
    const prev = (this.rows - 1) * W;
    const next = this.rows * W;
    for (let x = 0; x < W; x++) {
      const l = this.cells[prev + ((x + W - 1) % W)];
      const c = this.cells[prev + x];
      const r = this.cells[prev + ((x + 1) % W)];
      this.cells[next + x] = (this.rule >> ((l << 2) | (c << 1) | r)) & 1;
    }
    this.rows++;
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
    this.carry += dt * this.speed;
    for (; this.carry >= 1; this.carry--) this.step();

    const { bg, a, c } = this.p;
    for (let y = 0; y < H; y++) {
      // live cells shade from the first accent at the top to the third at the bottom
      const [r, g, b] = mix(a, c, y / H);
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (y < this.rows && this.cells[i]) this.buf.set(i, r, g, b);
        else this.buf.set(i, bg[0], bg[1], bg[2]);
      }
    }
    this.buf.draw(this.ctx, this.w, this.h, false);
  }

  // Clicking flips a cell in the starting row and replays from the top; dragging paints the same value.
  pointer(kind: string, x: number, _y: number, e: PointerEvent) {
    if (kind === "up") return;
    const col = Math.max(0, Math.min(W - 1, Math.floor((x / this.w) * W)));
    if (kind === "down") this.paint = this.seedRow[col] ? 0 : 1;
    else if (!e.buttons || this.seedRow[col] === this.paint) return;
    this.seedRow[col] = this.paint;
    this.restart();
  }
}

const create = (canvas: HTMLCanvasElement) => new Automaton(canvas);
const PATTERNS = [7, 6, 5, 4, 3, 2, 1, 0];

export default function Automata() {
  const { canvasRef, simRef } = useSim(create);
  const [rule, setRule] = useState(30);
  const [speed, setSpeed] = useState(40);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.rule = rule;
    sim.restart();
  }, [rule, simRef]);
  useEffect(() => {
    if (simRef.current) simRef.current.speed = speed;
  }, [speed, simRef]);

  return (
    <Stage canvasRef={canvasRef} hint="Click or drag along the canvas to flip cells in the starting row." readout={`Rule ${rule}`}>
      <Choice
        label="Rule"
        value={[30, 90, 110].includes(rule) ? rule : -1}
        options={[
          { value: 30, label: "30" },
          { value: 90, label: "90" },
          { value: 110, label: "110" },
        ]}
        onChange={setRule}
      />
      <div className="pg-choice">
        <span className="pg-label">Rule table · click an outcome to flip it</span>
        <div className="pg-rule-bits">
          {PATTERNS.map(p => {
            const on = (rule >> p) & 1;
            return (
              <button
                key={p}
                type="button"
                className="pg-rule-bit"
                aria-label={`Neighborhood ${p.toString(2).padStart(3, "0")} becomes ${on ? "alive" : "empty"}`}
                onClick={() => setRule(rule ^ (1 << p))}
              >
                <span className="pg-rule-in">
                  {[4, 2, 1].map(m => (
                    <i key={m} className={p & m ? "on" : ""} />
                  ))}
                </span>
                <span className="pg-rule-out">
                  <i className={on ? "on" : ""} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <Slider label="Speed" value={speed} min={5} max={120} onChange={setSpeed} format={v => `${v} rows/s`} />
      <Buttons>
        <Btn onClick={() => simRef.current?.seed("single")}>One cell</Btn>
        <Btn onClick={() => simRef.current?.seed("random")}>Random row</Btn>
        <Btn onClick={() => simRef.current?.seed("clear")}>Empty row</Btn>
      </Buttons>
    </Stage>
  );
}
