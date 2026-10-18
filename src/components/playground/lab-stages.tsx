"use client";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";

// Canvas and WebGL code only runs in the browser, and each experiment ships as its own chunk.
const loading = () => <div className="lab-loading" aria-hidden="true" />;
export const LABS: Record<string, ComponentType> = {
  "cellular-automata": dynamic(() => import("./labs/automata"), { ssr: false, loading }),
  boids: dynamic(() => import("./labs/boids"), { ssr: false, loading }),
  "reaction-diffusion": dynamic(() => import("./labs/reaction-diffusion"), { ssr: false, loading }),
  "falling-sand": dynamic(() => import("./labs/sand"), { ssr: false, loading }),
  "maze-generation": dynamic(() => import("./labs/maze"), { ssr: false, loading }),
  pathfinding: dynamic(() => import("./labs/pathfinding"), { ssr: false, loading }),
  "flow-fields": dynamic(() => import("./labs/flow-field"), { ssr: false, loading }),
  "spring-systems": dynamic(() => import("./labs/springs"), { ssr: false, loading }),
  fractals: dynamic(() => import("./labs/fractals"), { ssr: false, loading }),
  "wave-interference": dynamic(() => import("./labs/waves"), { ssr: false, loading }),
};

