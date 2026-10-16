"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

// the theme lives on <html data-theme>, set before paint by the inline script in the root layout
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

function setTheme(theme: Theme) {
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {}
  listeners.forEach(fn => fn());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as Theme);
  const next = theme === "light" ? "dark" : "light";
  return (
    <button type="button" className="nav-link theme-toggle" data-id="NAV-2227" onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`}>
      {next === "light" ? "Light" : "Dark"}
    </button>
  );
}
