"use client";
import { useEffect, useRef, useState } from "react";

// Light → dark; denser glyphs stand in for darker pixels.
const RAMP = " .:-=+*#%@";
const COLS = 72;
// Monospace glyphs are ~0.6em wide on a 1.2em line, so each cell is twice as tall as wide.
const CELL_ASPECT = 2;
// Source canvas size for the generated texture (16:9).
const SRC_W = 320;
const SRC_H = 180;

function seededRandom(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Abstract grayscale blobs, deterministic per project, for covers without a photo.
function paintTexture(ctx: CanvasRenderingContext2D, seed: string) {
  const rand = seededRandom(seed);
  ctx.fillStyle = "#d8d8d4";
  ctx.fillRect(0, 0, SRC_W, SRC_H);
  for (let i = 0; i < 14; i++) {
    const x = rand() * SRC_W;
    const y = rand() * SRC_H;
    const r = 30 + rand() * 110;
    const shade = Math.floor(rand() * 200);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${shade},${shade},${shade},0.85)`);
    g.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SRC_W, SRC_H);
  }
}

function toAscii(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rows = Math.round((COLS * h) / (w * CELL_ASPECT));
  const cellW = w / COLS;
  const cellH = h / rows;
  const { data } = ctx.getImageData(0, 0, w, h);
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = Math.floor((c + 0.5) * cellW);
      const y = Math.floor((r + 0.5) * cellH);
      const i = (y * w + x) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      out += RAMP[Math.min(RAMP.length - 1, Math.floor((1 - lum) * RAMP.length))];
    }
    out += "\n";
  }
  return out;
}

export function ProjectCover({ seed, image, alt }: { seed: string; image?: string; alt: string }) {
  const textureRef = useRef<HTMLCanvasElement>(null);
  const [ascii, setAscii] = useState("");

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Crop to 16:9 to match the cover frame (object-fit: cover).
        const w = SRC_W, h = SRC_H;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        setAscii(toAscii(ctx, w, h));
      };
      img.src = image;
      return;
    }
    const canvas = textureRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    paintTexture(ctx, seed);
    setAscii(toAscii(ctx, SRC_W, SRC_H));
  }, [seed, image]);

  return (
    <div className="cover">
      {image ? (
        <img src={image} alt={alt} className="cover-media" />
      ) : (
        <canvas ref={textureRef} width={SRC_W} height={SRC_H} className="cover-media" aria-hidden="true" />
      )}
      <div className="cover-dots" aria-hidden="true" />
      <div className="cover-grain" aria-hidden="true" />
      <pre className="cover-ascii" aria-hidden="true">{ascii}</pre>
    </div>
  );
}
