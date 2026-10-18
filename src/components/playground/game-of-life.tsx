"use client";
import { useEffect, useRef, useState } from "react";

// Conway's Game of Life on a wrapping (toroidal) grid. Click or drag to draw; presets stamp at the center.

const COLS = 96;
const ROWS = 64;

// Patterns as [row, col] offsets from their top-left corner.
const PRESETS: Record<string, [number, number][]> = {
  Glider: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  "R-pentomino": [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  Pulsar: (() => {
    const cells: [number, number][] = [];
    const arms = [2, 3, 4, 8, 9, 10];
    for (const a of arms) {
      for (const b of [0, 5, 7, 12]) {
        cells.push([b, a], [a, b]);
      }
    }
    return cells;
  })(),
  "Gosper gun": [
    [4, 0], [4, 1], [5, 0], [5, 1],
    [4, 10], [5, 10], [6, 10], [3, 11], [7, 11], [2, 12], [8, 12], [2, 13], [8, 13],
    [5, 14], [3, 15], [7, 15], [4, 16], [5, 16], [6, 16], [5, 17],
    [2, 20], [3, 20], [4, 20], [2, 21], [3, 21], [4, 21], [1, 22], [5, 22], [0, 24], [1, 24], [5, 24], [6, 24],
    [2, 34], [3, 34], [2, 35], [3, 35],
  ],
};

const idx = (r: number, c: number) => ((r + ROWS) % ROWS) * COLS + ((c + COLS) % COLS);

function step(cells: Uint8Array) {
  const next = new Uint8Array(cells.length);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr || dc) n += cells[idx(r + dr, c + dc)];
        }
      }
      const alive = cells[r * COLS + c];
      next[r * COLS + c] = n === 3 || (alive && n === 2) ? 1 : 0;
    }
  }
  return next;
}

function randomCells(density = 0.22) {
  const cells = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < cells.length; i++) cells[i] = Math.random() < density ? 1 : 0;
  return cells;
}

function count(cells: Uint8Array) {
  let n = 0;
  for (const v of cells) n += v;
  return n;
}

export function GameOfLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<Uint8Array>(new Uint8Array(COLS * ROWS));
  // Per-cell glow that fades after a cell dies, so recent history shows as a trail.
  const trailRef = useRef<Float32Array>(new Float32Array(COLS * ROWS));
  const paintRef = useRef<0 | 1 | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(12);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const styles = getComputedStyle(canvas);
    const glow = styles.getPropertyValue("--glow").trim();
    const cw = canvas.width / COLS;
    const ch = canvas.height / ROWS;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Faint lattice
    ctx.fillStyle = `rgba(${glow}, 0.07)`;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) ctx.fillRect(c * cw + cw / 2 - 0.5, r * ch + ch / 2 - 0.5, 1, 1);
    }

    const cells = cellsRef.current;
    const trail = trailRef.current;
    for (let i = 0; i < cells.length; i++) {
      const a = cells[i] ? 1 : trail[i];
      if (a < 0.02) continue;
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      ctx.fillStyle = cells[i] ? `rgba(${glow}, 0.95)` : `rgba(${glow}, ${a * 0.35})`;
      ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
    }
  }

  function sync(nextGeneration: number | ((g: number) => number)) {
    setGeneration(nextGeneration);
    setPopulation(count(cellsRef.current));
    draw();
  }

  function advance() {
    const prev = cellsRef.current;
    const next = step(prev);
    const trail = trailRef.current;
    for (let i = 0; i < next.length; i++) trail[i] = prev[i] ? 1 : trail[i] * 0.82;
    cellsRef.current = next;
    sync(g => g + 1);
  }

  function reset(cells: Uint8Array) {
    cellsRef.current = cells;
    trailRef.current = new Float32Array(COLS * ROWS);
    sync(0);
  }

  function stamp(name: string) {
    const pattern = PRESETS[name];
    const h = Math.max(...pattern.map(p => p[0])) + 1;
    const w = Math.max(...pattern.map(p => p[1])) + 1;
    const top = Math.floor((ROWS - h) / 2);
    const left = Math.floor((COLS - w) / 2);
    const cells = new Uint8Array(COLS * ROWS);
    for (const [r, c] of pattern) cells[idx(top + r, left + c)] = 1;
    reset(cells);
  }

  // Seed with a random soup, and keep the canvas sharp at any size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    reset(randomCells());
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw();
    });
    ro.observe(canvas);
    // Redraw when the light/dark theme flips, since colors come from CSS variables.
    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setRunning(true);
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fixed-rate simulation loop, independent of the display's refresh rate.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      const interval = 1000 / speed;
      if (acc >= interval) {
        acc = Math.min(acc - interval, interval);
        advance();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed]);

  function cellAt(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
    return r >= 0 && r < ROWS && c >= 0 && c < COLS ? r * COLS + c : -1;
  }

  function paint(e: React.PointerEvent<HTMLCanvasElement>) {
    const i = cellAt(e);
    if (i < 0 || paintRef.current === null) return;
    cellsRef.current[i] = paintRef.current;
    setPopulation(count(cellsRef.current));
    draw();
  }

  return (
    <div className="pg-life">
      <canvas
        ref={canvasRef}
        className="pg-canvas"
        style={{ aspectRatio: `${COLS} / ${ROWS}` }}
        aria-label="Game of Life grid. Click or drag to toggle cells."
        onPointerDown={e => {
          const i = cellAt(e);
          if (i < 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          // Drawing on a live cell erases; on a dead one it draws.
          paintRef.current = cellsRef.current[i] ? 0 : 1;
          paint(e);
        }}
        onPointerMove={paint}
        onPointerUp={() => (paintRef.current = null)}
        onPointerCancel={() => (paintRef.current = null)}
      />

      <div className="pg-readout">
        <span>GEN {String(generation).padStart(5, "0")}</span>
        <span>POP {String(population).padStart(4, "0")}</span>
        <span>{COLS}×{ROWS} · WRAPPING</span>
      </div>

      <div className="pg-controls">
        <div className="pg-group">
          <button type="button" className="pg-btn pg-btn-primary" onClick={() => setRunning(r => !r)}>
            {running ? "Pause" : "Play"}
          </button>
          <button type="button" className="pg-btn" onClick={advance} disabled={running}>
            Step
          </button>
          <button type="button" className="pg-btn" onClick={() => reset(randomCells())}>
            Random
          </button>
          <button type="button" className="pg-btn" onClick={() => reset(new Uint8Array(COLS * ROWS))}>
            Clear
          </button>
        </div>
        <label className="pg-speed">
          <span>Speed</span>
          <input type="range" min={1} max={40} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
          <span className="pg-speed-value">{speed}/s</span>
        </label>
        <div className="pg-group">
          {Object.keys(PRESETS).map(name => (
            <button key={name} type="button" className="pg-btn pg-btn-ghost" onClick={() => stamp(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
