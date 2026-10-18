"use client";
import { useEffect, useState } from "react";
import { NeuralCA, type Layer } from "@/lib/playground/nca";
import type { Engine, Palette } from "@/lib/playground/runtime";
import { Choice, Slider, Stage, useSim } from "../controls";

// The ten targets and three training regimes from the Distill article; models live in /public/nca as ex{1,2,3}_{index}.json
const EMOJI = ["🦎", "😀", "💥", "👁", "🐠", "🦋", "🐞", "🕸", "🥨", "🎄"];
type Model = "ex1" | "ex2" | "ex3";
const ROWS = 96; // the grid is 96 cells tall, as in the article; its width follows the canvas shape

// A grid of cells, each holding 16 numbers; every step, each cell runs the same small trained network on what it
// sees of its neighbours and adds the result to its own state. The first four numbers are its colour.
class GrowingCA implements Engine {
  private gl: WebGLRenderingContext | null;
  private ca: NeuralCA | null = null;
  private w = 1;
  private h = 1;
  private bg = [0, 0, 0];
  private highlight = [1, 1, 0];
  private lastDown = 0;
  private justSeeded = false;
  private request = 0;
  speed = 2;
  onSteps?: (n: number) => void;
  onError?: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl", { antialias: false });
    try {
      if (this.gl) this.ca = new NeuralCA(this.gl);
    } catch {
      this.ca = null;
    }
  }

  get supported() {
    return !!this.ca;
  }

  // fetch a model; a newer request wins if the user clicks through quickly
  async load(model: Model, emoji: number) {
    const id = ++this.request;
    const res = await fetch(`/nca/${model}_${emoji}.json`);
    const layers = (await res.json()) as Layer[];
    if (id !== this.request || !this.ca) return;
    this.ca.setWeights(layers);
    this.ca.reset();
  }

  set angle(degrees: number) {
    if (this.ca) this.ca.angle = (degrees / 180) * Math.PI;
  }

  reset() {
    this.ca?.reset();
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ca?.setSize(Math.max(ROWS, Math.round((ROWS * w) / h)), ROWS);
  }

  setPalette(p: Palette) {
    this.bg = p.bg.map(v => v / 255);
    this.highlight = p.e.map(v => v / 255);
  }

  frame(dt: number) {
    const { ca } = this;
    if (!ca) return;
    if (dt && ca.ready) {
      for (let i = 0; i < this.speed; i++) ca.step();
      this.onSteps?.(ca.steps);
    }
    ca.draw(this.canvas.width, this.canvas.height, this.bg, this.highlight);
  }

  // click or drag to cut away cells; double-click to plant a new seed
  pointer(kind: string, x: number, y: number, e: PointerEvent) {
    const { ca } = this;
    if (!ca || kind === "up") return;
    const gx = Math.floor((x / this.w) * ca.w);
    const gy = Math.floor((y / this.h) * ca.h);
    if (kind === "down") {
      const now = performance.now();
      if (now - this.lastDown < 300) {
        ca.paint(gx, gy, 1, "seed");
        this.justSeeded = true;
        setTimeout(() => (this.justSeeded = false), 100);
      } else ca.paint(gx, gy, 8, "clear");
      this.lastDown = now;
    } else if (e.buttons && !this.justSeeded) ca.paint(gx, gy, 8, "clear");
  }
}

const create = (canvas: HTMLCanvasElement) => new GrowingCA(canvas);

export default function NeuralCellularAutomata() {
  const { canvasRef, stage, simRef } = useSim(create);
  const [emoji, setEmoji] = useState(0);
  const [model, setModel] = useState<Model>("ex3");
  const [speed, setSpeed] = useState(2);
  const [angle, setAngle] = useState(0);
  const [steps, setSteps] = useState(0);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.onSteps = setSteps;
    if (!sim.supported) queueMicrotask(() => setSupported(false));
  }, [simRef]);
  useEffect(() => {
    simRef.current?.load(model, emoji);
  }, [model, emoji, simRef]);
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.speed = speed;
    sim.angle = angle;
  }, [speed, angle, simRef]);

  return (
    <Stage
      canvasRef={canvasRef}
      sim={stage}
      hint={supported ? "Click or drag to cut away part of the creature and watch it grow back. Double-click to plant a new seed." : "This experiment needs WebGL, which this browser has turned off."}
      readout={`step ${steps}`}
    >
      <Choice label="Creature" value={emoji} options={EMOJI.map((e, i) => ({ value: i, label: e }))} onChange={setEmoji} />
      <Choice
        label="Model"
        value={model}
        options={[
          { value: "ex1", label: "Growing" },
          { value: "ex2", label: "Persistent" },
          { value: "ex3", label: "Regenerating" },
        ]}
        onChange={setModel}
      />
      <Slider label="Speed" value={speed} min={1} max={8} onChange={setSpeed} format={v => `${v} steps/frame`} />
      <Slider label="Rotation" value={angle} min={0} max={360} onChange={setAngle} format={v => `${v}°`} />
    </Stage>
  );
}
