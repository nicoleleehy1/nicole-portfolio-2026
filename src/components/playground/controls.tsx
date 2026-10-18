"use client";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { mount, type Engine } from "@/lib/playground/runtime";

// Create an engine for a canvas once, and keep a handle to it for the controls to talk to.
export function useSim<S extends Engine>(create: (canvas: HTMLCanvasElement) => S) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<S | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sim = create(canvas);
    simRef.current = sim;
    const unmount = mount(canvas, sim);
    return () => {
      unmount();
      simRef.current = null;
    };
  }, [create]);
  return { canvasRef, simRef };
}

// The canvas, a one-line hint about how to interact, and the control panel beneath.
export function Stage({
  canvasRef,
  hint,
  readout,
  children,
  cursor = "crosshair",
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hint: string;
  readout?: ReactNode;
  children: ReactNode;
  cursor?: string;
}) {
  return (
    <div className="pg-stage">
      <div className="pg-frame">
        <canvas ref={canvasRef} className="pg-canvas" style={{ cursor }} />
      </div>
      <div className="pg-meta">
        <span>{hint}</span>
        {readout && <span className="pg-readout">{readout}</span>}
      </div>
      <div className="pg-controls">{children}</div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = v => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="pg-slider">
      <span className="pg-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <output>{format(value)}</output>
    </label>
  );
}

export function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="pg-choice" role="radiogroup" aria-label={label}>
      <span className="pg-label">{label}</span>
      <div className="pg-segments">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={`pg-btn${o.value === value ? " is-on" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="pg-toggle">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
      <span className="pg-label">{label}</span>
    </label>
  );
}

export function Buttons({ children }: { children: ReactNode }) {
  return <div className="pg-buttons">{children}</div>;
}

export function Btn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="pg-btn" onClick={onClick}>
      {children}
    </button>
  );
}
