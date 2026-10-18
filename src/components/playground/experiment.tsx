"use client";
import dynamic from "next/dynamic";

// Canvas and WebGL code only runs in the browser, and each experiment ships as its own chunk.
const loading = () => <div className="pg-loading" aria-hidden="true" />;
const EXPERIMENTS = {
  "cellular-automata": dynamic(() => import("./experiments/automata"), { ssr: false, loading }),
  boids: dynamic(() => import("./experiments/boids"), { ssr: false, loading }),
  "reaction-diffusion": dynamic(() => import("./experiments/reaction-diffusion"), { ssr: false, loading }),
  "falling-sand": dynamic(() => import("./experiments/sand"), { ssr: false, loading }),
  "maze-generation": dynamic(() => import("./experiments/maze"), { ssr: false, loading }),
  pathfinding: dynamic(() => import("./experiments/pathfinding"), { ssr: false, loading }),
  "flow-fields": dynamic(() => import("./experiments/flow-field"), { ssr: false, loading }),
  "spring-systems": dynamic(() => import("./experiments/springs"), { ssr: false, loading }),
  fractals: dynamic(() => import("./experiments/fractals"), { ssr: false, loading }),
  "wave-interference": dynamic(() => import("./experiments/waves"), { ssr: false, loading }),
};

export function ExperimentView({ slug }: { slug: string }) {
  const Component = EXPERIMENTS[slug as keyof typeof EXPERIMENTS];
  return Component ? <Component /> : null;
}
