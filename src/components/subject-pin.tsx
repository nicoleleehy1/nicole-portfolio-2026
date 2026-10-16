"use client";
import { useEffect, useRef } from "react";
import { useCellField } from "./cell-field";

// An empty slot in the page that the field holds a cell over, with a permanent labeled tracker on it.
export function SubjectPin({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const field = useCellField();

  useEffect(() => {
    const el = ref.current;
    if (!field || !el) return;
    const center = () => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2] as const;
    };
    const pin = field.pinNear(...center(), label);

    // The field is fixed and the page scrolls, so keep the cell on the slot.
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => pin.move(...center()));
    };
    const observer = new ResizeObserver(follow);
    observer.observe(el);
    window.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", follow);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", follow);
      window.removeEventListener("resize", follow);
      pin.release();
    };
  }, [field, label]);

  return <div ref={ref} className="subject-slot" aria-hidden="true" />;
}
