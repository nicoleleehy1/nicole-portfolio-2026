// Shared plumbing for the Playground experiments: theme palettes, canvas sizing, the animation loop and pointer input.
// Each experiment is a plain class implementing Engine; mount() wires it to a <canvas> and returns a cleanup.

export type RGB = [number, number, number];

export type Palette = {
  light: boolean;
  bg: RGB;
  ink: RGB;
  muted: RGB;
  // five accents, used as categorical colors and gradient stops
  a: RGB;
  b: RGB;
  c: RGB;
  d: RGB;
  e: RGB;
};

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Dark: the site's neon teal and orange on near-black, with violet, pink and gold to round it out.
const DARK: Palette = {
  light: false,
  bg: hex("#02080a"),
  ink: hex("#dffcff"),
  muted: hex("#6b9aa0"),
  a: hex("#7ff3ea"),
  b: hex("#ff9b5e"),
  c: hex("#a98bff"),
  d: hex("#ff7aa8"),
  e: hex("#ffd36e"),
};

// Light: warm pastels on cream paper (sage, peach, lavender, rose, honey), deep enough to read as thin lines.
const LIGHT: Palette = {
  light: true,
  bg: hex("#fbf4ea"),
  ink: hex("#3b2c25"),
  muted: hex("#a08b7b"),
  a: hex("#62a897"),
  b: hex("#e8956a"),
  c: hex("#9c86c9"),
  d: hex("#de7f99"),
  e: hex("#d9a63f"),
};

export const currentPalette = (): Palette => (document.documentElement.dataset.theme === "light" ? LIGHT : DARK);

export const css = ([r, g, b]: RGB, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;
export const mix = (p: RGB, q: RGB, t: number): RGB => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];

// Piecewise-linear gradient through a list of stops, baked into a 256-entry lookup table.
export function ramp(stops: RGB[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = (i / 255) * (stops.length - 1);
    const j = Math.min(stops.length - 2, Math.floor(t));
    const c = mix(stops[j], stops[j + 1], t - j);
    lut.set(c, i * 3);
  }
  return lut;
}

export type PointerKind = "down" | "move" | "up";

export interface Engine {
  // css pixel size of the canvas and the device pixel ratio
  resize(w: number, h: number, dpr: number): void;
  // dt in seconds (clamped), now in ms; dt is 0 while paused, and the engine should draw without advancing
  frame(dt: number, now: number): void;
  // back to the starting state
  reset(): void;
  setPalette(p: Palette): void;
  pointer?(kind: PointerKind, x: number, y: number, e: PointerEvent): void;
  wheel?(dy: number, x: number, y: number): void;
  destroy?(): void;
}

// Size a 2D canvas to its css box at device resolution, with a transform so drawing happens in css pixels.
export function fit2d(canvas: HTMLCanvasElement, w: number, h: number, dpr: number) {
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// A low-resolution RGBA buffer for grid simulations, drawn scaled up onto the visible canvas.
export class PixelBuffer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly image: ImageData;
  readonly data: Uint8ClampedArray;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext("2d")!;
    this.image = this.ctx.createImageData(w, h);
    this.data = this.image.data;
  }
  set(i: number, r: number, g: number, b: number) {
    const o = i * 4;
    this.data[o] = r;
    this.data[o + 1] = g;
    this.data[o + 2] = b;
    this.data[o + 3] = 255;
  }
  // smooth: bilinear upscaling for fields (reaction-diffusion, waves); off for crisp cells
  draw(target: CanvasRenderingContext2D, w: number, h: number, smooth: boolean) {
    this.ctx.putImageData(this.image, 0, 0);
    target.imageSmoothingEnabled = smooth;
    target.imageSmoothingQuality = "high";
    target.drawImage(this.canvas, 0, 0, w, h);
  }
}

// Wire an engine to a canvas: resize with its box, follow the theme, run only while on screen, forward pointer input.
export type Mounted = { destroy: () => void; setPaused: (paused: boolean) => void };

export function mount(canvas: HTMLCanvasElement, engine: Engine): Mounted {
  let w = 0;
  let h = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || (r.width === w && r.height === h)) return;
    w = r.width;
    h = r.height;
    engine.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
  };
  resize();
  engine.setPalette(currentPalette());

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const mo = new MutationObserver(() => engine.setPalette(currentPalette()));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let visible = true;
  let paused = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  });
  io.observe(canvas);

  let raf = 0;
  let last = 0;
  const tick = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    // engines size their buffers in resize(), so wait until the canvas has been laid out
    if (w) engine.frame(paused ? 0 : dt, now);
    raf = requestAnimationFrame(tick);
  };
  function start() {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }
  const onVisibility = () => !document.hidden && start();
  document.addEventListener("visibilitychange", onVisibility);
  start();

  const local = (e: PointerEvent | WheelEvent) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const down = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    canvas.setPointerCapture(e.pointerId);
    engine.pointer?.("down", ...local(e), e);
  };
  const move = (e: PointerEvent) => engine.pointer?.("move", ...local(e), e);
  const up = (e: PointerEvent) => engine.pointer?.("up", ...local(e), e);
  const wheel = (e: WheelEvent) => {
    if (!engine.wheel) return;
    e.preventDefault();
    engine.wheel(e.deltaY, ...local(e));
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", wheel, { passive: false });

  const destroy = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    mo.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("wheel", wheel);
    engine.destroy?.();
  };
  return {
    destroy,
    setPaused: p => {
      paused = p;
    },
  };
}

// Seeded random, so "reset" layouts can be reproduced
export function rng(seed = Math.random() * 2 ** 32) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
