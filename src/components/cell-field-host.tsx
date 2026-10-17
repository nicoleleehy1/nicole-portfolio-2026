"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { CellField, CellFieldOptions } from "@/lib/cellField";

// Full strength on the home page; calmer behind long-form section pages.
const FULL: CellFieldOptions = { glitch: 0.45, speed: 0.25, maxTrackers: 6, edgeBoxes: true };
const CALM: CellFieldOptions = { glitch: 0.25, speed: 0.2, maxTrackers: 4, edgeBoxes: true };
const intensity = (pathname: string) => (pathname === "/" ? FULL : CALM);

// Text blocks marked data-exclude, clipped to the viewport: cells spawn and wander around them, not under them.
function readingRects() {
  return [...document.querySelectorAll("[data-exclude]")]
    .map(el => el.getBoundingClientRect())
    .filter(r => r.bottom > 0 && r.top < window.innerHeight)
    .map(r => ({ left: r.left, right: r.right, top: Math.max(0, r.top), bottom: Math.min(window.innerHeight, r.bottom) }));
}

const isLight = () => document.documentElement.dataset.theme === "light";

export default function FieldHost({ onReady }: { onReady: (field: CellField | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<CellField | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    // Start after first paint, once the main thread is idle, so the field stays off the critical path.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const task = idle(
      async () => {
        const { initCellField } = await import("@/lib/cellField");
        if (cancelled) return;
        const field = initCellField(el, {
          ...intensity(window.location.pathname),
          exclusionRects: readingRects(),
          // smaller structures than the standalone piece, so they frame the text instead of crowding it
          scale: 0.6,
          // fewer pieces than the standalone piece so the frame stays airy, with a brighter neon glow
          density: 0.65,
          glow: 1.25,
          light: isLight(),
          fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").trim(),
        });
        fieldRef.current = field;
        onReady(field);
      },
      { timeout: 1500 },
    );

    // The page scrolls over a fixed field, so the rects move on scroll as well as on layout changes.
    let frame = 0;
    const relayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fieldRef.current?.setOptions({ exclusionRects: readingRects() }));
    };
    const observer = new ResizeObserver(relayout);
    observer.observe(document.body);
    window.addEventListener("resize", relayout);
    window.addEventListener("scroll", relayout, { passive: true });
    // follow the light/dark switch, which flips data-theme on <html>
    const themeObserver = new MutationObserver(() => fieldRef.current?.setOptions({ light: isLight() }));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      themeObserver.disconnect();
      cancelled = true;
      cancelIdle(task);
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", relayout);
      window.removeEventListener("scroll", relayout);
      fieldRef.current?.destroy();
      fieldRef.current = null;
      onReady(null);
    };
  }, [onReady]);

  useEffect(() => {
    // a new route brings new text blocks; measure once it has rendered
    const frame = requestAnimationFrame(() =>
      fieldRef.current?.setOptions({ ...intensity(pathname), exclusionRects: readingRects() }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <div ref={ref} className="cell-field" aria-hidden="true" />
      {/* light mode: fades the sketch layer's dark fills out by brightness, so only its pastel lines show on white */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id="cf-pastel" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0.9 0.9 0 -0.5" result="lum" />
          <feComposite in="SourceGraphic" in2="lum" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>
      </svg>
    </>
  );
}
