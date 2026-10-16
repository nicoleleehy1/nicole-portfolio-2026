"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { CellField, CellFieldOptions } from "@/lib/cellField";

// Full strength on the home page; calmer behind long-form section pages.
const FULL: CellFieldOptions = { glitch: 1, speed: 1, maxTrackers: 7, edgeBoxes: false };
const CALM: CellFieldOptions = { glitch: 0.5, speed: 0.6, maxTrackers: 3, edgeBoxes: true };
const intensity = (pathname: string) => (pathname === "/" ? FULL : CALM);

// The content column, as a full-height band: structures spawn and wander outside it.
function readingRects() {
  const column = document.querySelector("[data-reading-column]");
  if (!column) return [];
  const r = column.getBoundingClientRect();
  return [{ left: r.left, right: r.right, top: 0, bottom: window.innerHeight }];
}

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
          readout: document.querySelector<HTMLElement>("[data-cell-readout]"),
          readoutLabel: "NICOLE LEE",
          fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").trim(),
        });
        fieldRef.current = field;
        onReady(field);
      },
      { timeout: 1500 },
    );

    const relayout = () => fieldRef.current?.setOptions({ exclusionRects: readingRects() });
    const observer = new ResizeObserver(relayout);
    const column = document.querySelector("[data-reading-column]");
    if (column) observer.observe(column);
    window.addEventListener("resize", relayout);

    return () => {
      cancelled = true;
      cancelIdle(task);
      observer.disconnect();
      window.removeEventListener("resize", relayout);
      fieldRef.current?.destroy();
      fieldRef.current = null;
      onReady(null);
    };
  }, [onReady]);

  useEffect(() => {
    fieldRef.current?.setOptions(intensity(pathname));
  }, [pathname]);

  return <div ref={ref} className="cell-field" aria-hidden="true" />;
}
