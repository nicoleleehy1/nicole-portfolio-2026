"use client";
import { useEffect, useState, type ReactNode } from "react";
import { css, fit2d, mix, type Engine, type Palette, type RGB } from "@/lib/playground/runtime";
import { Btn, Buttons, Choice, Slider, Stage, Toggle, useSim } from "../controls";

type Mode = "mandelbrot" | "tree";

// ── Mandelbrot: one fragment shader iterates z → z² + c for every pixel ──

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uScale;
uniform int uIter;
uniform vec3 uBg;
uniform vec3 uStops[4];

vec3 cycle(float t) {
  t = fract(t) * 4.0;
  if (t < 1.0) return mix(uStops[0], uStops[1], t);
  if (t < 2.0) return mix(uStops[1], uStops[2], t - 1.0);
  if (t < 3.0) return mix(uStops[2], uStops[3], t - 2.0);
  return mix(uStops[3], uStops[0], t - 3.0);
}

void main() {
  vec2 c = uCenter + (gl_FragCoord.xy - 0.5 * uRes) * (2.0 * uScale / uRes.y);
  vec2 z = vec2(0.0);
  float n = 0.0;
  bool escaped = false;
  for (int i = 0; i < 2000; i++) {
    if (i >= uIter) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 256.0) { escaped = true; break; }
    n += 1.0;
  }
  if (!escaped) { gl_FragColor = vec4(uBg, 1.0); return; }
  // continuous escape count, so color bands blend instead of stepping
  float nu = n + 1.0 - log2(log2(dot(z, z)) * 0.5);
  vec3 col = cycle(nu / 36.0);
  // points that escape almost immediately fade into the background
  float fade = smoothstep(0.0, 14.0, nu);
  gl_FragColor = vec4(mix(uBg, col, fade), 1.0);
}`;

const HOME = { x: -0.6, y: 0, scale: 1.25 };
const SPOTS = {
  seahorse: { x: -0.7453, y: 0.1127, scale: 0.006, label: "Seahorse valley" },
  elephant: { x: 0.2925, y: 0.0149, scale: 0.012, label: "Elephant valley" },
  spiral: { x: -0.761574, y: -0.0847596, scale: 0.0012, label: "Spiral" },
} as const;
type Spot = keyof typeof SPOTS;
const MIN_SCALE = 2e-5; // single-precision floats run out of detail past this

class Mandelbrot implements Engine {
  private gl: WebGLRenderingContext | null;
  private prog: WebGLProgram | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private view = { ...HOME };
  private target = { ...HOME };
  private p!: Palette;
  private dirty = true;
  private w = 1;
  private h = 1;
  private drag: { x: number; y: number; moved: boolean } | null = null;
  iterations = 300;
  onZoom?: (zoom: number, limit: boolean) => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
    if (this.gl) this.setup(this.gl);
  }

  get supported() {
    return !!this.prog;
  }

  private setup(gl: WebGLRenderingContext) {
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const name of ["uRes", "uCenter", "uScale", "uIter", "uBg", "uStops"]) this.u[name] = gl.getUniformLocation(prog, name);
    this.prog = prog;
  }

  goTo(spot: Spot | "home") {
    const s = spot === "home" ? HOME : SPOTS[spot];
    this.target = { x: s.x, y: s.y, scale: s.scale };
  }

  zoomBy(factor: number, sx = this.w / 2, sy = this.h / 2) {
    // keep the complex point under (sx, sy) fixed while zooming
    const t = this.target;
    const k = (2 * t.scale) / this.h;
    const cx = t.x + (sx - this.w / 2) * k;
    const cy = t.y - (sy - this.h / 2) * k;
    const scale = Math.min(2, Math.max(MIN_SCALE, t.scale * factor));
    const f = scale / t.scale;
    this.target = { x: cx + (t.x - cx) * f, y: cy + (t.y - cy) * f, scale };
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.dirty = true;
  }

  setPalette(p: Palette) {
    this.p = p;
    this.dirty = true;
  }

  frame() {
    const gl = this.gl;
    if (!gl || !this.prog) return;
    const v = this.view;
    const t = this.target;
    const moving = Math.abs(Math.log(v.scale / t.scale)) > 1e-3 || Math.hypot(v.x - t.x, v.y - t.y) > v.scale * 1e-3;
    if (moving) {
      // ease toward the target, zooming in log space so it feels even at every depth
      const ls = Math.log(v.scale) + (Math.log(t.scale) - Math.log(v.scale)) * 0.15;
      v.scale = Math.exp(ls);
      v.x += (t.x - v.x) * 0.15;
      v.y += (t.y - v.y) * 0.15;
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.onZoom?.(HOME.scale / v.scale, t.scale <= MIN_SCALE * 1.01);

    const { p } = this;
    const unit = (c: RGB) => c.map(n => n / 255);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.uCenter, v.x, v.y);
    gl.uniform1f(this.u.uScale, v.scale);
    gl.uniform1i(this.u.uIter, this.iterations);
    gl.uniform3fv(this.u.uBg, unit(p.bg));
    gl.uniform3fv(this.u.uStops, [...unit(p.a), ...unit(p.c), ...unit(p.d), ...unit(p.e)]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  redraw() {
    this.dirty = true;
  }

  pointer(kind: string, x: number, y: number, e: PointerEvent) {
    if (kind === "down") {
      this.drag = { x, y, moved: false };
      return;
    }
    if (!this.drag) return;
    const dx = x - this.drag.x;
    const dy = y - this.drag.y;
    if (kind === "move") {
      if (!this.drag.moved && Math.hypot(dx, dy) < 4) return;
      this.drag.moved = true;
      const k = (2 * this.target.scale) / this.h;
      this.target.x -= dx * k;
      this.target.y += dy * k;
      this.view.x = this.target.x;
      this.view.y = this.target.y;
      this.drag.x = x;
      this.drag.y = y;
      this.dirty = true;
    } else {
      // a click without a drag zooms in on that spot; shift-click zooms out
      if (!this.drag.moved) this.zoomBy(e.shiftKey ? 2.5 : 0.4, x, y);
      this.drag = null;
    }
  }

  wheel(dy: number, x: number, y: number) {
    this.zoomBy(Math.exp(Math.max(-1, Math.min(1, dy * 0.0025))), x, y);
  }
}

const createMandelbrot = (canvas: HTMLCanvasElement) => new Mandelbrot(canvas);

function MandelbrotView({ modes }: { modes: ReactNode }) {
  const { canvasRef, simRef } = useSim(createMandelbrot);
  const [iterations, setIterations] = useState(300);
  const [zoom, setZoom] = useState({ zoom: 1, limit: false });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.onZoom = (z, limit) => setZoom({ zoom: z, limit });
    if (!sim.supported) queueMicrotask(() => setSupported(false));
  }, [simRef]);
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.iterations = iterations;
    sim.redraw();
  }, [iterations, simRef]);

  const label = zoom.zoom < 1000 ? zoom.zoom.toFixed(1) : zoom.zoom.toExponential(1);
  return (
    <Stage
      canvasRef={canvasRef}
      hint={supported ? "Click to zoom in, shift-click to zoom out, drag to pan, or scroll." : "This view needs WebGL, which this browser has turned off."}
      readout={`${label}× ${zoom.limit ? "· precision limit" : ""}`}
      cursor="zoom-in"
    >
      {modes}
      <Slider label="Detail" value={iterations} min={50} max={2000} step={50} onChange={setIterations} format={v => `${v} iterations`} />
      <Buttons>
        {(Object.keys(SPOTS) as Spot[]).map(s => (
          <Btn key={s} onClick={() => simRef.current?.goTo(s)}>
            {SPOTS[s].label}
          </Btn>
        ))}
        <Btn onClick={() => simRef.current?.zoomBy(3)}>Zoom out</Btn>
        <Btn onClick={() => simRef.current?.goTo("home")}>Whole set</Btn>
      </Buttons>
    </Stage>
  );
}

// ── Branching tree: one rule (a branch splits into two smaller branches) applied recursively ──

type TreeParams = { angle: number; ratio: number; depth: number; wander: number; sway: boolean };

class Tree implements Engine {
  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private p!: Palette;
  private t = 0;
  private growth = 0;
  private seed = Math.random() * 1000;
  params: TreeParams = { angle: 24, ratio: 0.72, depth: 11, wander: 0.25, sway: true };

  constructor(private canvas: HTMLCanvasElement) {}

  grow() {
    this.growth = 0;
    this.seed = Math.random() * 1000;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.ctx = fit2d(this.canvas, w, h, dpr);
  }

  setPalette(p: Palette) {
    this.p = p;
  }

  // a stable pseudo-random number per branch, so the tree keeps its shape between frames
  private jitter(id: number) {
    const s = Math.sin(id * 12.9898 + this.seed * 78.233) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  }

  frame(dt: number) {
    const { ctx, p } = this;
    const { angle, ratio, depth, wander, sway } = this.params;
    this.t += dt;
    this.growth = Math.min(depth, this.growth + dt * 4);
    ctx.fillStyle = css(p.bg);
    ctx.fillRect(0, 0, this.w, this.h);

    const levels = Array.from({ length: depth }, () => new Path2D());
    const blossoms = new Path2D();
    const spread = (angle * Math.PI) / 180;
    const trunk = this.h * 0.26;
    const grown = this.growth;

    const branch = (x: number, y: number, len: number, dir: number, level: number, id: number) => {
      // the newest level is still growing, so draw it partially
      const amount = Math.min(1, grown - level);
      if (amount <= 0) return;
      const bend = sway ? Math.sin(this.t * 1.3 + level * 0.7) * 0.012 * level : 0;
      const d = dir + bend + this.jitter(id) * wander * 0.5;
      const l = len * amount * (1 + this.jitter(id + 7) * wander * 0.3);
      const nx = x + Math.cos(d) * l;
      const ny = y + Math.sin(d) * l;
      levels[level].moveTo(x, y);
      levels[level].lineTo(nx, ny);
      if (level === depth - 1) {
        if (amount === 1) {
          blossoms.moveTo(nx + 2.2, ny);
          blossoms.arc(nx, ny, 2.2, 0, Math.PI * 2);
        }
        return;
      }
      if (amount < 1) return;
      branch(nx, ny, len * ratio, d - spread, level + 1, id * 2);
      branch(nx, ny, len * ratio, d + spread, level + 1, id * 2 + 1);
    };
    branch(this.w / 2, this.h, trunk, -Math.PI / 2, 0, 1);

    ctx.lineCap = "round";
    levels.forEach((path, level) => {
      const t = level / Math.max(1, depth - 1);
      ctx.strokeStyle = css(t < 0.5 ? mix(p.muted, p.a, t * 2) : mix(p.a, p.c, (t - 0.5) * 2), 0.9);
      ctx.lineWidth = Math.max(0.6, (depth - level) * 0.75);
      ctx.stroke(path);
    });
    ctx.fillStyle = css(p.d, 0.8);
    ctx.fill(blossoms);
  }
}

const createTree = (canvas: HTMLCanvasElement) => new Tree(canvas);

function TreeView({ modes }: { modes: ReactNode }) {
  const { canvasRef, simRef } = useSim(createTree);
  const [angle, setAngle] = useState(24);
  const [ratio, setRatio] = useState(0.72);
  const [depth, setDepth] = useState(11);
  const [wander, setWander] = useState(0.25);
  const [sway, setSway] = useState(true);

  useEffect(() => {
    if (simRef.current) simRef.current.params = { angle, ratio, depth, wander, sway };
  }, [angle, ratio, depth, wander, sway, simRef]);

  return (
    <Stage canvasRef={canvasRef} hint="Every branch is a smaller copy of the tree. Change the one rule and the whole tree follows." readout={`${2 ** depth - 1} branches`} cursor="default">
      {modes}
      <Slider label="Angle" value={angle} min={0} max={90} onChange={setAngle} format={v => `${v}°`} />
      <Slider label="Shrink" value={ratio} min={0.5} max={0.85} step={0.01} onChange={setRatio} format={v => `${Math.round(v * 100)}%`} />
      <Slider label="Depth" value={depth} min={1} max={13} onChange={setDepth} />
      <Slider label="Wander" value={wander} min={0} max={1} step={0.05} onChange={setWander} format={v => `${Math.round(v * 100)}%`} />
      <Buttons>
        <Toggle label="Wind" value={sway} onChange={setSway} />
        <Btn onClick={() => simRef.current?.grow()}>Grow a new tree</Btn>
      </Buttons>
    </Stage>
  );
}

export default function Fractals() {
  const [mode, setMode] = useState<Mode>("mandelbrot");
  const modes = (
    <Choice
      label="Fractal"
      value={mode}
      options={[
        { value: "mandelbrot", label: "Mandelbrot set" },
        { value: "tree", label: "Branching tree" },
      ]}
      onChange={setMode}
    />
  );
  // each view owns its own canvas: a canvas can't switch between WebGL and 2D once it has a context
  return mode === "mandelbrot" ? <MandelbrotView key="m" modes={modes} /> : <TreeView key="t" modes={modes} />;
}
