"use client"
import { useEffect, useRef } from "react";

// Native size of /public/portfolio-image.jpg.
const WIDTH = 641;
const HEIGHT = 1200;

export function Portrait() {
  const ref = useRef<HTMLDivElement>(null);

  // Match the portrait's height to the intro text sitting beside it.
  useEffect(() => {
    const portrait = ref.current;
    const text = portrait?.previousElementSibling;
    if (!portrait || !text) return;
    const sync = () => {
      portrait.style.setProperty("--portrait-h", `${text.getBoundingClientRect().height}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(text);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="portrait">
      <img src="/portfolio-image.jpg" alt="Nicole Lee" width={WIDTH} height={HEIGHT} />
    </div>
  );
}
