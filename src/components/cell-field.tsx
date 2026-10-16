"use client";
import dynamic from "next/dynamic";
import { createContext, useContext, useState } from "react";
import type { CellField } from "@/lib/cellField";

const CellFieldContext = createContext<CellField | null>(null);

// The live field, once it has started; null on the server, before lazy init, and without WebGL 2.
export function useCellField() {
  return useContext(CellFieldContext);
}

// WebGL, canvases and window listeners are browser-only, so the host never renders on the server.
const FieldHost = dynamic(() => import("./cell-field-host"), { ssr: false });

// Mounted once in the root layout, so the field keeps running (and keeps its cells) across route changes.
export function CellFieldProvider({ children }: { children: React.ReactNode }) {
  const [field, setField] = useState<CellField | null>(null);
  return (
    <CellFieldContext value={field}>
      <FieldHost onReady={setField} />
      {children}
    </CellFieldContext>
  );
}
